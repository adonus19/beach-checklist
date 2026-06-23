import { Component, inject, signal } from '@angular/core';
import { ListStore } from './list-store';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly store = inject(ListStore);

  /** Which card (group id) is currently in edit mode — only one at a time. */
  readonly editingGroupId = signal<string | null>(null);

  isEditing(groupId: string): boolean {
    return this.editingGroupId() === groupId;
  }

  toggleEdit(groupId: string): void {
    this.editingGroupId.update((cur) => (cur === groupId ? null : groupId));
  }
}
