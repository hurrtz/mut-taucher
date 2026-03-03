export const DAY_LABELS = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const DAY_LABELS_LONG = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const DURATION_OPTIONS = [
  { value: 30, label: '30 Min.' },
  { value: 60, label: '60 Min.' },
  { value: 90, label: '90 Min.' },
  { value: 0, label: 'Andere' },
];

export type EventCategory = 'erstgespraech' | 'einzeltherapie' | 'gruppentherapie' | 'andere';

export const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: 'erstgespraech', label: 'Erstgespräch' },
  { value: 'einzeltherapie', label: 'Einzeltherapie' },
  { value: 'gruppentherapie', label: 'Gruppentherapie' },
  { value: 'andere', label: 'Andere' },
];

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  erstgespraech: 'cyan',
  einzeltherapie: 'blue',
  gruppentherapie: 'purple',
  andere: 'gold',
};
