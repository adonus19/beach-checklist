import { Component, computed, effect, signal } from '@angular/core';
import { buildPlan } from './data';
import { Day } from './models';

const STORAGE_KEY = 'beach-checklist:v1';

/** Read the saved { itemId: done } map from localStorage. */
function loadDoneMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

/** Apply the saved done-state onto the plan definitions. */
function hydrate(data: Day[]): Day[] {
  const saved = loadDoneMap();
  return data.map((d) => ({
    ...d,
    groups: d.groups.map((g) => ({
      ...g,
      items: g.items.map((i) => ({ ...i, done: saved[i.id] ?? i.done })),
    })),
  }));
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly days = signal<Day[]>(hydrate(buildPlan()));

  constructor() {
    // Persist the checked-state to localStorage whenever it changes.
    effect(() => {
      const map: Record<string, boolean> = {};
      for (const d of this.days()) {
        for (const g of d.groups) {
          for (const i of g.items) map[i.id] = i.done;
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
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

  groupDone(group: { items: { done: boolean }[] }): number {
    return group.items.filter((i) => i.done).length;
  }

  toggle(itemId: string): void {
    this.days.update((days) =>
      days.map((d) => ({
        ...d,
        groups: d.groups.map((g) => ({
          ...g,
          items: g.items.map((i) =>
            i.id === itemId ? { ...i, done: !i.done } : i,
          ),
        })),
      })),
    );
  }

  resetAll(): void {
    if (!confirm('Uncheck every item and start fresh?')) return;
    this.days.update((days) =>
      days.map((d) => ({
        ...d,
        groups: d.groups.map((g) => ({
          ...g,
          items: g.items.map((i) => ({ ...i, done: false })),
        })),
      })),
    );
  }
}
