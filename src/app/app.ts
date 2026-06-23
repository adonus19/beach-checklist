import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ListStore } from './list-store';
import { UpdateService } from './update.service';

interface CurrentCard {
  day: string;
  group: string;
  emoji: string;
}

@Component({
  selector: 'app-root',
  imports: [DragDropModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  readonly store = inject(ListStore);
  readonly updates = inject(UpdateService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Which card (group id) is currently in edit mode — only one at a time. */
  readonly editingGroupId = signal<string | null>(null);

  /** The card currently pinned under the sticky header (which list you're on). */
  readonly currentCard = signal<CurrentCard | null>(null);

  private heroEl: HTMLElement | null = null;
  private ticking = false;
  private readonly onScroll = () => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.updateCurrentCard();
      this.ticking = false;
    });
  };

  ngAfterViewInit(): void {
    this.heroEl = this.host.nativeElement.querySelector('.hero');
    addEventListener('scroll', this.onScroll, { passive: true });
    addEventListener('resize', this.onScroll, { passive: true });
    this.updateCurrentCard();
    this.updates.init();
  }

  ngOnDestroy(): void {
    removeEventListener('scroll', this.onScroll);
    removeEventListener('resize', this.onScroll);
  }

  /** Which section (day/person) is currently being edited. */
  readonly editingSectionId = signal<string | null>(null);

  // ----- Card edit mode -----

  isEditing(groupId: string): boolean {
    return this.editingGroupId() === groupId;
  }

  toggleEdit(groupId: string): void {
    this.editingGroupId.update((cur) => (cur === groupId ? null : groupId));
  }

  removeGroup(id: string): void {
    if (!confirm('Delete this whole list?')) return;
    this.store.removeGroup(id);
    if (this.editingGroupId() === id) this.editingGroupId.set(null);
  }

  // ----- Section edit mode -----

  isEditingSection(id: string): boolean {
    return this.editingSectionId() === id;
  }

  toggleEditSection(id: string): void {
    this.editingSectionId.update((cur) => (cur === id ? null : id));
  }

  addSection(): void {
    this.editingSectionId.set(this.store.addSection());
  }

  addGroupTo(sectionId: string): void {
    this.editingGroupId.set(this.store.addGroup(sectionId));
  }

  removeSection(id: string): void {
    if (!confirm('Delete this entire section and all its lists?')) return;
    this.store.removeSection(id);
    if (this.editingSectionId() === id) this.editingSectionId.set(null);
  }

  // ----- Drag to reorder (within a single card) -----

  onDrop(groupId: string, event: CdkDragDrop<unknown>): void {
    this.store.reorderItem(groupId, event.previousIndex, event.currentIndex);
  }

  // ----- "Current list" pinned in the header -----

  private updateCurrentCard(): void {
    if (!this.heroEl) return;
    const line = this.heroEl.getBoundingClientRect().bottom + 8;
    const cards: HTMLElement[] = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('.card'),
    );

    let current: HTMLElement | null = null;
    for (const card of cards) {
      if (card.getBoundingClientRect().top <= line) current = card;
    }

    if (!current) {
      this.currentCard.set(null);
      return;
    }

    const next: CurrentCard = {
      day: current.dataset['day'] ?? '',
      group: current.dataset['group'] ?? '',
      emoji: current.dataset['emoji'] ?? '',
    };
    const cur = this.currentCard();
    if (!cur || cur.group !== next.group || cur.day !== next.day) {
      this.currentCard.set(next);
    }
  }
}
