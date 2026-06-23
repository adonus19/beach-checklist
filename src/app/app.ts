import { Component, computed, effect, signal } from '@angular/core';
import { buildPlan } from './data';
import { Day, Group } from './models';

const STORAGE_KEY = 'beach-checklist:data:v1';

/**
 * Load the saved list structure from localStorage. Returns null on first run
 * (or if anything is corrupt) so we fall back to the seed plan in data.ts.
 */
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

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly days = signal<Day[]>(loadSaved() ?? buildPlan());

  /** Which card (group id) is currently in edit mode — only one at a time. */
  readonly editingGroupId = signal<string | null>(null);

  constructor() {
    // Persist the full list structure whenever it changes.
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.days()));
      } catch {
        /* storage full or unavailable — ignore */
      }
    });
  }

  readonly totalItems = computed(() =>
    this.days().reduce(
      (sum, d) => sum + d.groups.reduce((s, g) => s + g.items.length, 0),
      0,
    ),
  );

  readonly doneItems = computed(() =>
    this.days().reduce(
      (sum, d) =>
        sum +
        d.groups.reduce((s, g) => s + g.items.filter((i) => i.done).length, 0),
      0,
    ),
  );

  readonly progress = computed(() => {
    const total = this.totalItems();
    return total === 0 ? 0 : Math.round((this.doneItems() / total) * 100);
  });

  readonly allPacked = computed(
    () => this.totalItems() > 0 && this.doneItems() === this.totalItems(),
  );

  /** Circumference for the SVG progress ring (r = 34). */
  readonly ringCircumference = 2 * Math.PI * 34;
  readonly ringOffset = computed(
    () => this.ringCircumference * (1 - this.progress() / 100),
  );

  dayTotal(day: Day): number {
    return day.groups.reduce((s, g) => s + g.items.length, 0);
  }

  dayDone(day: Day): number {
    return day.groups.reduce(
      (s, g) => s + g.items.filter((i) => i.done).length,
      0,
    );
  }

  groupDone(group: Group): number {
    return group.items.filter((i) => i.done).length;
  }

  // ----- Checking off -----

  toggle(itemId: string): void {
    this.mutateItems((items) =>
      items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
    );
  }

  resetAll(): void {
    if (!confirm('Uncheck every item and start fresh?')) return;
    this.mutateItems((items) => items.map((i) => ({ ...i, done: false })));
  }

  // ----- Editing -----

  isEditing(groupId: string): boolean {
    return this.editingGroupId() === groupId;
  }

  toggleEdit(groupId: string): void {
    this.editingGroupId.update((cur) => (cur === groupId ? null : groupId));
  }

  updateItemLabel(itemId: string, event: Event): void {
    const label = (event.target as HTMLInputElement).value;
    this.mutateItems((items) =>
      items.map((i) => (i.id === itemId ? { ...i, label } : i)),
    );
  }

  removeItem(itemId: string): void {
    this.mutateItems((items) => items.filter((i) => i.id !== itemId));
  }

  addItem(groupId: string, input: HTMLInputElement): void {
    const label = input.value.trim();
    if (!label) return;
    this.days.update((days) =>
      days.map((d) => ({
        ...d,
        groups: d.groups.map((g) =>
          g.id === groupId
            ? { ...g, items: [...g.items, { id: uid(), label, done: false }] }
            : g,
        ),
      })),
    );
    input.value = '';
    input.focus();
  }

  /** Apply a transform to every item list across all days/groups, immutably. */
  private mutateItems(fn: (items: Group['items']) => Group['items']): void {
    this.days.update((days) =>
      days.map((d) => ({
        ...d,
        groups: d.groups.map((g) => ({ ...g, items: fn(g.items) })),
      })),
    );
  }
}
