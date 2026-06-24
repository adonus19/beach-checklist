import { computed, effect, Injectable, signal } from '@angular/core';
import { signInAnonymously } from 'firebase/auth';
import { doc, type DocumentReference, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { buildPlan } from './data';
import { Day, Group } from './models';

const STORAGE_KEY = 'beach-checklist:data:v1';
/** The single shared document everyone reads from and writes to. */
const DOC_PATH = { collection: 'lists', id: 'shared' };

function loadSaved(): Day[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Day[]) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

function uid(): string {
  return crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;
}

@Injectable({ providedIn: 'root' })
export class ListStore {
  /** The whole list. Seeded from cache (or data.ts), then kept in sync with Firestore. */
  readonly days = signal<Day[]>(loadSaved() ?? buildPlan());

  /** Connection state, surfaced in the UI. */
  readonly online = signal<boolean>(navigator.onLine);
  readonly synced = signal<boolean>(false);
  readonly syncError = signal<string | null>(null);

  private readonly docRef: DocumentReference = doc(db, DOC_PATH.collection, DOC_PATH.id);
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Always keep a local cache so a cold start has data instantly / offline.
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.days()));
      } catch {
        /* ignore */
      }
    });

    addEventListener('online', () => this.online.set(true));
    addEventListener('offline', () => this.online.set(false));

    void this.initSync();
  }

  // ----- Derived -----

  readonly totalItems = computed(() =>
    this.days().reduce((s, d) => s + d.groups.reduce((a, g) => a + g.items.length, 0), 0),
  );
  readonly doneItems = computed(() =>
    this.days().reduce(
      (s, d) => s + d.groups.reduce((a, g) => a + g.items.filter((i) => i.done).length, 0),
      0,
    ),
  );
  readonly progress = computed(() => {
    const total = this.totalItems();
    return total === 0 ? 0 : Math.round((this.doneItems() / total) * 100);
  });
  readonly allPacked = computed(() => this.totalItems() > 0 && this.doneItems() === this.totalItems());

  readonly ringCircumference = 2 * Math.PI * 34;
  readonly ringOffset = computed(() => this.ringCircumference * (1 - this.progress() / 100));

  dayTotal(day: Day): number {
    return day.groups.reduce((s, g) => s + g.items.length, 0);
  }
  dayDone(day: Day): number {
    return day.groups.reduce((s, g) => s + g.items.filter((i) => i.done).length, 0);
  }
  groupDone(group: Group): number {
    return group.items.filter((i) => i.done).length;
  }

  // ----- Mutations (each schedules a remote save) -----

  toggle(itemId: string): void {
    this.mutateItems((items) => items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)));
  }

  resetAll(): void {
    if (!confirm('Uncheck every item for everyone and start fresh?')) return;
    this.mutateItems((items) => items.map((i) => ({ ...i, done: false })));
  }

  updateItemLabel(itemId: string, event: Event): void {
    const label = (event.target as HTMLInputElement).value;
    this.mutateItems((items) => items.map((i) => (i.id === itemId ? { ...i, label } : i)));
  }

  removeItem(itemId: string): void {
    this.mutateItems((items) => items.filter((i) => i.id !== itemId));
  }

  addItem(groupId: string, input: HTMLInputElement): void {
    const label = input.value.trim();
    if (!label) return;
    this.mutateGroup(groupId, (g) => ({
      ...g,
      items: [...g.items, { id: uid(), label, done: false }],
    }));
    input.value = '';
    input.focus();
  }

  /** Reorder items within a single group (drag-and-drop). */
  reorderItem(groupId: string, from: number, to: number): void {
    if (from === to) return;
    this.mutateGroup(groupId, (g) => {
      const items = [...g.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { ...g, items };
    });
  }

  // ----- Sections (days/people) -----

  addSection(): string {
    const id = uid();
    this.days.update((days) => [
      ...days,
      { id, name: 'New section', theme: '', emoji: '📦', groups: [] },
    ]);
    this.scheduleSave();
    return id;
  }

  updateSection(id: string, patch: Partial<Pick<Day, 'name' | 'theme' | 'emoji' | 'note'>>): void {
    this.days.update((days) => days.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    this.scheduleSave();
  }

  removeSection(id: string): void {
    this.days.update((days) => days.filter((d) => d.id !== id));
    this.scheduleSave();
  }

  // ----- Cards (groups) -----

  addGroup(sectionId: string): string {
    const id = uid();
    this.days.update((days) =>
      days.map((d) =>
        d.id === sectionId
          ? { ...d, groups: [...d.groups, { id, name: 'New list', emoji: '📦', items: [] }] }
          : d,
      ),
    );
    this.scheduleSave();
    return id;
  }

  updateGroup(id: string, patch: Partial<Pick<Group, 'name' | 'emoji' | 'note'>>): void {
    this.days.update((days) =>
      days.map((d) => ({
        ...d,
        groups: d.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      })),
    );
    this.scheduleSave();
  }

  removeGroup(id: string): void {
    this.days.update((days) =>
      days.map((d) => ({ ...d, groups: d.groups.filter((g) => g.id !== id) })),
    );
    this.scheduleSave();
  }

  // ----- internals -----

  private mutateItems(fn: (items: Group['items']) => Group['items']): void {
    this.days.update((days) =>
      days.map((d) => ({ ...d, groups: d.groups.map((g) => ({ ...g, items: fn(g.items) })) })),
    );
    this.scheduleSave();
  }

  private mutateGroup(groupId: string, fn: (g: Group) => Group): void {
    this.days.update((days) =>
      days.map((d) => ({
        ...d,
        groups: d.groups.map((g) => (g.id === groupId ? fn(g) : g)),
      })),
    );
    this.scheduleSave();
  }

  private async initSync(): Promise<void> {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      console.warn('[beach] anonymous sign-in failed; running local-only', err);
      this.syncError.set(`Sign-in: ${e.code ?? e.message ?? 'failed'}`);
      return;
    }

    onSnapshot(
      this.docRef,
      (snap) => {
        this.synced.set(true);
        this.syncError.set(null);
        const data = snap.data() as { days?: Day[] } | undefined;
        if (snap.exists() && Array.isArray(data?.days)) {
          // Don't clobber what the user is mid-edit with our own pending echo:
          // only apply remote data when it isn't a local pending write.
          if (!snap.metadata.hasPendingWrites) {
            this.days.set(data.days);
          }
        } else if (!snap.metadata.hasPendingWrites) {
          // First run ever — create the shared doc from our seed/local data.
          this.scheduleSave(true);
        }
      },
      (err) => {
        const e = err as { code?: string; message?: string };
        console.warn('[beach] snapshot error', err);
        this.synced.set(false);
        this.syncError.set(`Firestore: ${e.code ?? e.message ?? 'connection blocked'}`);
      },
    );
  }

  /** Debounced write of the whole list to Firestore. */
  private scheduleSave(immediate = false): void {
    clearTimeout(this.saveTimer);
    const write = () => {
      void setDoc(this.docRef, { days: this.days(), updatedAt: serverTimestamp() }).catch((err) =>
        console.warn('[beach] save failed (will retry when online)', err),
      );
    };
    if (immediate) write();
    else this.saveTimer = setTimeout(write, 500);
  }
}
