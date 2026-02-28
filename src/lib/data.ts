export interface Slot {
  id: string;
  date: string; // ISO string
  time: string; // "10:00"
  available: boolean;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Markdown or HTML
  slug: string;
  image: string;
}

export const initialSlots: Slot[] = [
  { id: '1', date: '2026-03-01', time: '10:00', available: true },
  { id: '2', date: '2026-03-01', time: '14:00', available: true },
  { id: '3', date: '2026-03-02', time: '11:00', available: true },
  { id: '4', date: '2026-03-03', time: '09:00', available: true },
  { id: '5', date: '2026-03-05', time: '16:00', available: true },
];

export const articles: Article[] = [
  {
    id: '1',
    title: 'Alkoholismus verstehen',
    slug: 'alkoholismus-verstehen',
    excerpt: 'Wege aus der Abhängigkeit und wie man erste Schritte in ein neues Leben wagt.',
    content: `
# Alkoholismus verstehen

Alkoholismus ist eine Krankheit, die nicht nur den Körper, sondern auch die Seele und das soziale Umfeld betrifft. Oft beginnt es schleichend: ein Glas zur Entspannung, dann zwei, dann die Flasche.

**Die ersten Anzeichen:**
- Der Gedanke an Alkohol bestimmt den Tagesablauf.
- Heimliches Trinken.
- Vernachlässigung von Pflichten und Hobbys.

**Wege aus der Sucht:**
Der erste Schritt ist die Erkenntnis. Es ist keine Schande, Hilfe zu suchen. In meiner Praxis biete ich Ihnen einen geschützten Raum, um über Ihre Ängste und Sorgen zu sprechen. Gemeinsam erarbeiten wir Strategien, um die Auslöser zu verstehen und Alternativen zu finden.
    `,
    image: 'https://images.unsplash.com/photo-1516575334481-f85287c2c81d?auto=format&fit=crop&q=80&w=2000',
  },
  {
    id: '2',
    title: 'Depression: Ein stiller Begleiter',
    slug: 'depression-ein-stiller-begleiter',
    excerpt: 'Warum Depression mehr ist als nur Traurigkeit und wie Therapie helfen kann.',
    content: `
# Depression: Ein stiller Begleiter

Depression ist wie eine graue Wolke, die sich über das Leben legt und die Farben verschluckt. Es ist nicht einfach "schlechte Laune", sondern eine ernste Erkrankung, die das Denken, Fühlen und Handeln beeinflusst.

**Symptome:**
- Antriebslosigkeit und bleierne Müdigkeit.
- Verlust von Interesse und Freude.
- Schuldgefühle und Wertlosigkeit.

**Therapieansatz:**
In der Therapie geht es darum, diese graue Wolke Schritt für Schritt aufzulösen. Wir schauen uns an, was die Depression aufrechterhält und wie Sie wieder Zugang zu Ihren Ressourcen finden können. Kleine Schritte sind hier oft der Schlüssel zum Erfolg.
    `,
    image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&q=80&w=2000',
  },
  {
    id: '3',
    title: 'Angst bewältigen',
    slug: 'angst-bewaeltigen',
    excerpt: 'Wenn Angst den Alltag bestimmt: Strategien für mehr Sicherheit und Ruhe.',
    content: `
# Angst bewältigen

Angst ist eigentlich ein Schutzmechanismus. Doch wenn sie außer Kontrolle gerät, wird sie zur Last. Panikattacken, soziale Phobien oder generalisierte Ängste können das Leben massiv einschränken.

**Umgang mit Angst:**
- **Atmen:** Bewusste Atmung signalisiert dem Körper Sicherheit.
- **Konfrontation:** Vermeidung verstärkt die Angst oft langfristig.
- **Verstehen:** Woher kommt die Angst? Was will sie mir sagen?

In unseren Sitzungen lernen Sie, der Angst nicht mehr hilflos ausgeliefert zu sein. Wir üben Techniken zur Beruhigung und erarbeiten Wege, sich den angstauslösenden Situationen wieder anzunähern.
    `,
    image: 'https://images.unsplash.com/photo-1501556424050-d4816356b73e?auto=format&fit=crop&q=80&w=2000',
  },
];
