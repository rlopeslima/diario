export type View = 'chat' | 'calendar';

export enum EntryType {
    NOTE = 'note',
    EXPENSE = 'expense',
    EVENT = 'event',
}

export interface EntryItem {
    name: string;
    price: number;
}

export interface Entry {
    id: string;
    date: Date;
    type: EntryType;
    description: string;
    amount?: number;
    category?: string;
    vendor?: string;
    reminder?: string; // ISO date string
    items?: EntryItem[];
}