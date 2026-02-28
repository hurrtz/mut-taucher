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
  content: string;
  slug: string;
  image: string;
  metaDescription: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  icon: 'Video' | 'Users' | 'MessageCircle';
  color: 'primary' | 'secondary' | 'accent';
  bullets: string[];
  content: string;
  metaDescription: string;
}

export const initialSlots: Slot[] = [
  { id: '1', date: '2026-03-01', time: '10:00', available: true },
  { id: '2', date: '2026-03-01', time: '14:00', available: true },
  { id: '3', date: '2026-03-02', time: '11:00', available: true },
  { id: '4', date: '2026-03-03', time: '09:00', available: true },
  { id: '5', date: '2026-03-05', time: '16:00', available: true },
];

export const services: Service[] = [
  {
    id: '1',
    title: 'Einzeltherapie per Video',
    slug: 'einzeltherapie',
    excerpt: 'Im vertraulichen 1:1 Gespräch widmen wir uns ganz Ihren Themen. Flexibel und ortsunabhängig via sicherem Video-Call.',
    icon: 'Video',
    color: 'primary',
    bullets: ['50 Minuten pro Sitzung', 'Flexible Terminplanung', 'Bequem von zu Hause'],
    metaDescription: 'Online-Einzeltherapie per Video — vertraulich, flexibel und ortsunabhängig. 50-minütige Sitzungen mit erfahrener Psychotherapeutin.',
    content: `
# Einzeltherapie per Video

Die Einzeltherapie ist das Herzstück meiner Arbeit. In einem geschützten, vertraulichen Rahmen widmen wir uns ganz Ihren persönlichen Themen — bequem von zu Hause aus über einen sicheren Video-Call.

## Wie läuft eine Sitzung ab?

Jede Sitzung dauert **50 Minuten**. In der ersten Sitzung lernen wir uns kennen und besprechen Ihr Anliegen. Gemeinsam erarbeiten wir Ihre Therapieziele und entwickeln einen individuellen Behandlungsplan.

**Was Sie erwartet:**
- Ein empathisches, wertschätzungsvolles Gespräch auf Augenhöhe
- Wissenschaftlich fundierte Methoden, individuell angepasst
- Konkrete Werkzeuge und Übungen für den Alltag
- Flexible Terminvergabe, auch abends

## Für wen ist Einzeltherapie geeignet?

Einzeltherapie eignet sich für eine Vielzahl von Themen: Depressionen, Angststörungen, Burnout, Traumafolgestörungen, Beziehungsprobleme, Selbstwertthemen und viele mehr. Im Erstgespräch klären wir gemeinsam, ob dieses Format für Sie das richtige ist.
    `,
  },
  {
    id: '2',
    title: 'Gruppentherapie per Video',
    slug: 'gruppentherapie',
    excerpt: 'Der Austausch mit anderen Betroffenen kann sehr heilsam sein. Gemeinsam lernen wir voneinander und stärken uns gegenseitig.',
    icon: 'Users',
    color: 'secondary',
    bullets: ['Kleingruppen (max. 6 Personen)', 'Wöchentliche Treffen', 'Geleiteter Austausch'],
    metaDescription: 'Online-Gruppentherapie in Kleingruppen — gemeinsam wachsen, voneinander lernen. Wöchentliche geleitete Sitzungen per Video.',
    content: `
# Gruppentherapie per Video

Manchmal hilft es enorm zu erfahren, dass man mit seinen Problemen nicht allein ist. In der Gruppentherapie treffen Sie auf andere Menschen, die ähnliche Herausforderungen erleben — und gemeinsam finden wir Wege nach vorn.

## Das Format

- **Kleingruppen** mit maximal 6 Teilnehmenden
- **Wöchentliche Sitzungen** à 90 Minuten per Video
- **Geschlossene Gruppen** für Vertrauen und Kontinuität
- Professionell moderiert und strukturiert

## Warum Gruppentherapie?

Die Gruppe bietet etwas, das Einzeltherapie allein nicht leisten kann: das Erleben von Gemeinschaft, gegenseitigem Verständnis und der Erfahrung, dass Veränderung möglich ist. Sie lernen nicht nur aus Ihren eigenen Prozessen, sondern auch aus den Erfahrungen anderer.

**Aktuelle Gruppenangebote:**
- Emotionsregulation & Achtsamkeit
- Umgang mit Ängsten
- Selbstwert stärken

Sprechen Sie mich an — ich berate Sie gerne, welche Gruppe zu Ihnen passt.
    `,
  },
  {
    id: '3',
    title: 'Erstgespräch',
    slug: 'erstgespraech',
    excerpt: 'Lernen Sie mich und meine Arbeitsweise unverbindlich kennen. Wir besprechen Ihr Anliegen und klären erste Fragen.',
    icon: 'MessageCircle',
    color: 'accent',
    bullets: ['Kostenloses Kennenlernen (20 Min.)', 'Klärung des Bedarfs', 'Keine Verpflichtung'],
    metaDescription: 'Kostenloses Erstgespräch — lernen Sie mich unverbindlich kennen. 20 Minuten für Ihre Fragen und eine erste Einschätzung.',
    content: `
# Erstgespräch

Der erste Schritt ist oft der schwierigste. Deshalb biete ich Ihnen ein **kostenloses, unverbindliches Erstgespräch** an, in dem wir uns kennenlernen und gemeinsam herausfinden, wie ich Sie am besten unterstützen kann.

## Was erwartet Sie?

Das Erstgespräch dauert ca. **20 Minuten** und findet per Video statt. Es geht darum:

- **Ihr Anliegen** kurz zu besprechen
- Einen ersten Eindruck meiner **Arbeitsweise** zu bekommen
- Offene **Fragen** zu klären (Ablauf, Kosten, Häufigkeit)
- Gemeinsam einzuschätzen, ob die **Chemie stimmt**

## Keine Verpflichtung

Das Erstgespräch ist völlig unverbindlich. Es geht nicht darum, sich sofort festzulegen, sondern darum, eine informierte Entscheidung treffen zu können. Therapie funktioniert am besten, wenn die Beziehung zwischen Therapeutin und Klient:in stimmt.

Buchen Sie einfach einen Termin über den Kalender — ich freue mich auf Sie.
    `,
  },
];

export const articles: Article[] = [
  {
    id: '1',
    title: 'Unser Nervensystem',
    slug: 'unser-nervensystem',
    excerpt: 'Wie unser autonomes Nervensystem unsere Reaktionen steuert und was das für die Therapie bedeutet.',
    metaDescription: 'Verstehen Sie, wie das autonome Nervensystem Stress, Angst und Entspannung steuert — und wie Therapie daran ansetzen kann.',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=2000',
    content: `
# Unser Nervensystem

Das autonome Nervensystem ist die Schaltzentrale unserer Stressreaktionen. Es entscheidet in Sekundenbruchteilen, ob wir uns sicher fühlen oder in den Kampf-oder-Flucht-Modus wechseln.

## Sympathikus und Parasympathikus

Unser Nervensystem besteht aus zwei Hauptakteuren:
- **Sympathikus**: Aktiviert den Körper bei Gefahr — Herzschlag steigt, Muskeln spannen sich an, wir sind in Alarmbereitschaft.
- **Parasympathikus**: Sorgt für Entspannung und Regeneration — Verdauung, Ruhe, soziale Verbundenheit.

## Die Polyvagal-Theorie

Die Polyvagal-Theorie von Stephen Porges erweitert dieses Bild um einen dritten Zustand: den **dorsalen Vagus**, der bei extremer Überforderung zu Erstarrung und Rückzug führt.

**Was bedeutet das für die Therapie?**
In der Therapie lernen wir, die Signale des Nervensystems zu erkennen und bewusst zu regulieren. Denn viele psychische Beschwerden — von Angst über Depression bis zu Traumafolgen — hängen eng mit der Regulation unseres Nervensystems zusammen.
    `,
  },
  {
    id: '2',
    title: 'ADHS',
    slug: 'adhs',
    excerpt: 'ADHS bei Erwachsenen: mehr als nur Unaufmerksamkeit. Was dahintersteckt und wie Therapie helfen kann.',
    metaDescription: 'ADHS bei Erwachsenen verstehen — Symptome, Herausforderungen und therapeutische Unterstützung für ein erfülltes Leben.',
    image: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80&w=2000',
    content: `
# ADHS

ADHS (Aufmerksamkeitsdefizit-Hyperaktivitätsstörung) ist weit mehr als "nicht stillsitzen können". Gerade bei Erwachsenen zeigt sich ADHS oft anders als erwartet — und bleibt häufig lange unerkannt.

## Wie zeigt sich ADHS bei Erwachsenen?

- **Schwierigkeiten mit der Selbstorganisation** — Termine vergessen, Projekte nicht abschließen
- **Emotionale Dysregulation** — intensive Gefühle, schnelle Stimmungswechsel
- **Innere Unruhe** — das Gefühl, ständig unter Strom zu stehen
- **Hyperfokus** — tiefes Eintauchen in interessante Aufgaben, Schwierigkeiten beim Wechsel

## ADHS und Selbstwert

Viele Betroffene haben jahrelang gehört, sie seien "faul", "undiszipliniert" oder "zu empfindlich". Diese Erfahrungen hinterlassen Spuren im Selbstbild.

**In der Therapie** geht es darum, ADHS zu verstehen, individuelle Strategien zu entwickeln und ein realistisches, wertschätzendes Selbstbild aufzubauen — jenseits von Defizitzuschreibungen.
    `,
  },
  {
    id: '3',
    title: 'Alkohol und Drogen',
    slug: 'alkohol-und-drogen',
    excerpt: 'Wege aus der Abhängigkeit und wie man erste Schritte in ein neues Leben wagt.',
    metaDescription: 'Alkohol- und Drogenabhängigkeit verstehen — Anzeichen erkennen, Auslöser verstehen und therapeutische Wege aus der Sucht.',
    image: 'https://images.unsplash.com/photo-1516575334481-f85287c2c81d?auto=format&fit=crop&q=80&w=2000',
    content: `
# Alkohol und Drogen

Sucht ist eine Erkrankung, die nicht nur den Körper, sondern auch die Seele und das soziale Umfeld betrifft. Oft beginnt es schleichend — ein Glas zur Entspannung, ein Joint nach der Arbeit — und entwickelt sich zu einem Muster, das schwer zu durchbrechen ist.

## Anzeichen einer Abhängigkeit

- Der Gedanke an die Substanz bestimmt den Tagesablauf
- Heimlicher Konsum oder Bagatellisierung
- Vernachlässigung von Pflichten und Beziehungen
- Entzugserscheinungen bei Reduktion
- Kontrollverlust über die Menge

## Therapeutische Unterstützung

In der Therapie biete ich Ihnen einen geschützten, wertfreien Raum. Gemeinsam erarbeiten wir:
- Was sind die **Auslöser** für Ihren Konsum?
- Welche **Funktion** erfüllt die Substanz in Ihrem Leben?
- Welche **Alternativen** können Sie entwickeln?

Der erste Schritt ist die Erkenntnis. Es ist keine Schande, Hilfe zu suchen.
    `,
  },
  {
    id: '4',
    title: 'Angst',
    slug: 'angst',
    excerpt: 'Wenn Angst den Alltag bestimmt: Strategien für mehr Sicherheit und innere Ruhe.',
    metaDescription: 'Angststörungen verstehen und bewältigen — von Panikattacken bis sozialer Phobie. Therapeutische Strategien für mehr innere Ruhe.',
    image: 'https://images.unsplash.com/photo-1501556424050-d4816356b73e?auto=format&fit=crop&q=80&w=2000',
    content: `
# Angst

Angst ist eigentlich ein Schutzmechanismus — sie warnt uns vor Gefahren und macht uns wachsam. Doch wenn sie außer Kontrolle gerät, wird sie zur Last. Panikattacken, soziale Phobien oder generalisierte Ängste können das Leben massiv einschränken.

## Formen der Angst

- **Panikstörung**: Plötzliche, intensive Angstanfälle mit körperlichen Symptomen
- **Soziale Phobie**: Angst vor Bewertung und sozialen Situationen
- **Generalisierte Angststörung**: Ständiges Sich-Sorgen-Machen über verschiedene Lebensbereiche
- **Spezifische Phobien**: Angst vor bestimmten Objekten oder Situationen

## Umgang mit Angst

- **Atmen**: Bewusste Atmung signalisiert dem Körper Sicherheit
- **Konfrontation**: Vermeidung verstärkt die Angst oft langfristig
- **Verstehen**: Woher kommt die Angst? Was will sie mir sagen?

In unseren Sitzungen lernen Sie, der Angst nicht mehr hilflos ausgeliefert zu sein. Wir üben Techniken zur Beruhigung und erarbeiten Wege, sich den angstauslösenden Situationen wieder anzunähern.
    `,
  },
  {
    id: '5',
    title: 'Depression',
    slug: 'depression',
    excerpt: 'Warum Depression mehr ist als nur Traurigkeit und wie Therapie helfen kann.',
    metaDescription: 'Depression erkennen und behandeln — Symptome, Therapieansätze und der Weg zurück zu Energie und Lebensfreude.',
    image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&q=80&w=2000',
    content: `
# Depression

Depression ist wie eine graue Wolke, die sich über das Leben legt und die Farben verschluckt. Es ist nicht einfach "schlechte Laune", sondern eine ernste Erkrankung, die das Denken, Fühlen und Handeln beeinflusst.

## Symptome

- Antriebslosigkeit und bleierne Müdigkeit
- Verlust von Interesse und Freude
- Schuldgefühle und Gefühle der Wertlosigkeit
- Schlafstörungen — zu viel oder zu wenig
- Konzentrationsschwierigkeiten
- Rückzug aus sozialen Kontakten

## Therapieansatz

In der Therapie geht es darum, diese graue Wolke Schritt für Schritt aufzulösen. Wir schauen uns an:
- Was **erhält** die Depression aufrecht?
- Welche **Denkmuster** spielen eine Rolle?
- Wie finden Sie wieder Zugang zu Ihren **Ressourcen**?

Kleine Schritte sind hier oft der Schlüssel zum Erfolg. Gemeinsam erarbeiten wir einen Weg, der zu Ihnen passt.
    `,
  },
  {
    id: '6',
    title: 'Emotionsregulation',
    slug: 'emotionsregulation',
    excerpt: 'Gefühle verstehen, annehmen und steuern lernen — ein Schlüssel zu psychischer Gesundheit.',
    metaDescription: 'Emotionsregulation lernen — Gefühle besser verstehen, annehmen und steuern. Ein zentraler Baustein der Psychotherapie.',
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=2000',
    content: `
# Emotionsregulation

Gefühle sind wie Wellen — sie kommen und gehen. Doch manchmal fühlt es sich an, als würden die Wellen über einem zusammenschlagen. Emotionsregulation bedeutet nicht, Gefühle zu unterdrücken, sondern einen gesunden Umgang mit ihnen zu finden.

## Was ist Emotionsregulation?

Emotionsregulation umfasst die Fähigkeiten:
- Eigene **Gefühle wahrzunehmen** und zu benennen
- Die **Intensität** von Emotionen zu beeinflussen
- **Impulse zu steuern**, auch unter Stress
- Unangenehme Gefühle **auszuhalten**, ohne sofort zu reagieren

## Warum fällt es manchen schwerer?

Schwierigkeiten mit der Emotionsregulation können verschiedene Ursachen haben:
- Kindheitserfahrungen, in denen Gefühle nicht gesehen oder bestraft wurden
- Traumatische Erlebnisse
- Neurologische Besonderheiten (z.B. ADHS)

## Therapeutische Ansätze

In der Therapie arbeiten wir daran, Ihren emotionalen Werkzeugkasten zu erweitern. Dazu gehören Achtsamkeitsübungen, Stresstoleranz-Strategien und das Verstehen der eigenen emotionalen Muster.
    `,
  },
  {
    id: '7',
    title: 'Selbstwert',
    slug: 'selbstwert',
    excerpt: 'Den eigenen Wert erkennen und stärken — warum ein gesunder Selbstwert die Basis für Veränderung ist.',
    metaDescription: 'Selbstwert stärken — verstehen, woher negative Selbstbilder kommen und wie Therapie zu einem gesunden Selbstwertgefühl beiträgt.',
    image: 'https://images.unsplash.com/photo-1508558936510-0af1e3cccbab?auto=format&fit=crop&q=80&w=2000',
    content: `
# Selbstwert

"Ich bin nicht gut genug." "Andere können das besser." "Ich habe es nicht verdient." — Solche Gedanken kennen viele Menschen. Ein niedriger Selbstwert ist oft die stille Kraft hinter vielen psychischen Belastungen.

## Woher kommt ein niedriger Selbstwert?

Unser Selbstbild entsteht nicht im Vakuum. Es wird geprägt durch:
- **Frühe Beziehungserfahrungen** — Wurden wir gesehen, gehört, wertgeschätzt?
- **Leistungsdruck** — Das Gefühl, nur durch Leistung wertvoll zu sein
- **Kritische innere Stimmen** — Oft die internalisierten Stimmen wichtiger Bezugspersonen
- **Vergleiche** — besonders verstärkt durch soziale Medien

## Der Weg zu einem gesunden Selbstwert

Selbstwertarbeit in der Therapie bedeutet:
- Die eigenen **Glaubenssätze** zu erkennen und zu hinterfragen
- Einen **mitfühlenden inneren Dialog** zu entwickeln
- Eigene **Stärken und Grenzen** realistisch wahrzunehmen
- Sich von fremden **Bewertungsmaßstäben** zu lösen

Ein gesunder Selbstwert ist nicht Überheblichkeit — er ist die Basis für authentische Beziehungen und ein erfülltes Leben.
    `,
  },
  {
    id: '8',
    title: 'Trauma',
    slug: 'trauma',
    excerpt: 'Was Trauma mit uns macht und wie die Seele heilen kann — behutsam und in Ihrem Tempo.',
    metaDescription: 'Trauma verstehen und verarbeiten — behutsame therapeutische Begleitung für Menschen mit traumatischen Erfahrungen.',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=2000',
    content: `
# Trauma

Ein Trauma entsteht, wenn wir Erfahrungen machen, die unsere Verarbeitungsfähigkeit übersteigen. Das können einmalige Ereignisse sein — ein Unfall, ein Überfall — oder wiederholte Erfahrungen wie Vernachlässigung oder Missbrauch in der Kindheit.

## Wie zeigt sich Trauma?

Traumafolgen können vielfältig sein:
- **Wiedererleben**: Flashbacks, Albträume, intrusive Erinnerungen
- **Vermeidung**: Orte, Menschen oder Situationen werden gemieden
- **Übererregung**: Schreckhaftigkeit, Schlafstörungen, Reizbarkeit
- **Emotionale Taubheit**: Das Gefühl, von sich selbst oder der Welt abgetrennt zu sein

## Traumatherapie

Traumatherapie ist keine Konfrontationstherapie im herkömmlichen Sinne. Sie folgt dem Prinzip der **Stabilisierung vor Verarbeitung**:

1. **Stabilisierung**: Sicherheit herstellen, Ressourcen aufbauen, Symptome managen
2. **Verarbeitung**: Behutsames Bearbeiten der traumatischen Erfahrungen
3. **Integration**: Das Erlebte einordnen und in die Lebensgeschichte integrieren

Jeder Mensch hat sein eigenes Tempo. In der Therapie bestimmen Sie, wie schnell oder langsam wir vorgehen.
    `,
  },
];
