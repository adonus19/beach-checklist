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
  }

  ngOnDestroy(): void {
    removeEventListener('scroll', this.onScroll);
    removeEventListener('resize', this.onScroll);
  }

  // ----- Edit mode -----

  isEditing(groupId: string): boolean {
    return this.editingGroupId() === groupId;
  }

  toggleEdit(groupId: string): void {
    this.editingGroupId.update((cur) => (cur === groupId ? null : groupId));
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
