export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  note?: string;
  items: ChecklistItem[];
}

export interface Day {
  id: string;
  name: string;
  theme: string;
  emoji: string;
  note?: string;
  groups: Group[];
}
