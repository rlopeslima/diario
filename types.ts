export type View = 'chat' | 'calendar';

export enum EntryType {
    NOTE = 'note',
    EXPENSE = 'expense',
    EVENT = 'event',
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
}