import topicNervensystem from '@/assets/topic-nervensystem.jpeg';
import topicAdhs from '@/assets/topic-adhs.jpeg';
import topicAlkohol from '@/assets/topic-alkohol.jpeg';
import topicAngst from '@/assets/topic-angst.jpeg';
import topicDepression from '@/assets/topic-depression.jpeg';
import topicEmotionsregulation from '@/assets/topic-emotionsregulation.jpeg';
import topicSelbstwert from '@/assets/topic-selbstwert.jpeg';
import topicTrauma from '@/assets/topic-trauma.jpeg';

export interface DayConfig {
  dayOfWeek: number;          // 1=Mon ... 7=Sun (ISO)
  frequency: 'weekly' | 'biweekly';
}

export interface RecurringRule {
  id: string;
  label: string;              // e.g. "Montags Vormittag"
  time: string;               // "10:15"
  durationMinutes: number;    // 90
  days: DayConfig[];          // which days + frequency
  startDate: string;          // ISO date rule begins
  endDate: string | null;     // null = indefinite
  exceptions: string[];       // cancelled ISO dates
}

export interface Event {
  id: number;
  label: string;
  date: string;               // ISO date
  time: string;               // "HH:MM"
  durationMinutes: number;
}

export interface Slot {
  id: string;
  date: string; // ISO string
  time: string; // "10:00"
  durationMinutes: number;
  available: boolean;
  ruleId?: string;            // links back to generating rule
  eventId?: number;           // links back to one-off event
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
    image: topicNervensystem,
    content: `# Unser Nervensystem

Unser Nervensystem ist das zentrale Steuerungs- und Kommunikationssystem unseres Körpers. Es beeinflusst, wie wir denken, fühlen, handeln und Beziehungen gestalten. Gleichzeitig reguliert es viele lebenswichtige Prozesse unbewusst, etwa Atmung, Herzschlag, Verdauung und Schlaf. Das Nervensystem entscheidet fortlaufend, ob wir uns sicher oder bedroht fühlen – und passt unseren Körper entsprechend an.

## Wie ist das Nervensystem aufgebaut?

Vereinfacht lässt sich das Nervensystem in mehrere Bereiche einteilen.

Das **zentrale Nervensystem** umfasst Gehirn und Rückenmark. Hier werden Informationen verarbeitet, Erfahrungen eingeordnet und Reaktionen vorbereitet.

Das **periphere Nervensystem** verbindet das zentrale Nervensystem mit dem restlichen Körper und leitet Sinneseindrücke sowie Steuerimpulse weiter.

Eine besondere Rolle spielt das **vegetative (autonome) Nervensystem**, das weitgehend unbewusst arbeitet. Es gliedert sich hauptsächlich in zwei Anteile:

- das **sympathische Nervensystem**, das den Körper aktiviert und auf Leistung, Stress oder Gefahr vorbereitet
- das **parasympathische Nervensystem**, das für Ruhe, Erholung, Regeneration und Verdauung zuständig ist

Beide Systeme sind keine Gegenspieler, sondern ergänzen sich. Gesundheitlich günstig ist ein flexibles Wechselspiel zwischen Aktivierung und Entspannung.

## Sicherheit, Stress und körperliche Reaktionen

Unser Nervensystem prüft ständig, ob eine Situation als sicher oder bedrohlich erlebt wird. Bei wahrgenommener Gefahr schaltet der Körper in einen Alarmzustand: Puls und Atmung beschleunigen sich, Muskeln spannen sich an, die Aufmerksamkeit richtet sich nach außen. Diese Reaktionen sind evolutionär sinnvoll und dienen dem Schutz.

Hält dieser Zustand jedoch über längere Zeit an, kann das Nervensystem aus dem Gleichgewicht geraten. Chronischer Stress, Überforderung, belastende Lebensereignisse oder traumatische Erfahrungen können dazu führen, dass Entspannung und Erholung kaum noch möglich sind. Der Körper bleibt dann gewissermaßen „in Alarmbereitschaft".

## Nervensystem und psychische Belastungen

Ein gut reguliertes Nervensystem hilft uns, Gefühle wahrzunehmen, zu steuern und in Kontakt mit anderen zu bleiben. Ist diese Regulation eingeschränkt, können unterschiedliche Beschwerden auftreten, zum Beispiel innere Unruhe, Erschöpfung, Angst, depressive Verstimmung, Schlafprobleme oder ein erhöhtes Bedürfnis nach Betäubung durch Substanzen.

Viele dieser Reaktionen sind keine bewussten Entscheidungen, sondern automatische Schutzmechanismen des Körpers. Sie entstehen nicht aus Schwäche, sondern aus Anpassung an Belastung.

## Was kann unterstützend wirken?

Veränderung beginnt häufig mit Verständnis. Zu wissen, wie das eigene Nervensystem funktioniert, kann entlasten und Selbstmitgefühl fördern. Hilfreich sind oft:

- regelmäßige Pausen und ausreichend Schlaf
- Bewegung und rhythmische Aktivitäten
- bewusste Atemübungen oder Entspannungsverfahren
- klare Strukturen und verlässliche Routinen
- soziale Verbindung und das Gefühl von Sicherheit

Diese Faktoren unterstützen das Nervensystem dabei, wieder flexibler zwischen Anspannung und Entspannung wechseln zu können.

## Wie kann Online-Gruppentherapie unterstützen?

In der Gruppentherapie lernen Teilnehmende, die Signale ihres Nervensystems besser zu verstehen und einzuordnen. Durch Psychoedukation, Austausch und praktische Übungen können neue Wege der Selbstregulation entwickelt werden. Der Kontakt mit anderen wirkt häufig stabilisierend und entlastend – besonders, wenn ähnliche Erfahrungen geteilt werden.`,
  },
  {
    id: '2',
    title: 'ADHS',
    slug: 'adhs',
    excerpt: 'ADHS bei Erwachsenen: mehr als nur Unaufmerksamkeit. Was dahintersteckt und wie Therapie helfen kann.',
    metaDescription: 'ADHS bei Erwachsenen verstehen — Symptome, Herausforderungen und therapeutische Unterstützung für ein erfülltes Leben.',
    image: topicAdhs,
    content: `# ADHS

ADHS (Aufmerksamkeitsdefizit-/Hyperaktivitätsstörung) ist mehr als „zappelig sein". Viele Betroffene erleben vor allem Aufmerksamkeitsprobleme, innere Unruhe und Schwierigkeiten mit Organisation und Impulskontrolle. ADHS kann sich bei Kindern, Jugendlichen und Erwachsenen unterschiedlich zeigen – und wird bei Erwachsenen oft erst spät erkannt, weil sich Strategien zur Kompensation entwickelt haben.

## Typische Anzeichen

- **Unaufmerksamkeit**: Abschweifen, Dinge verlegen, Fehler aus Flüchtigkeit, Probleme, Aufgaben zu Ende zu bringen
- **Hyperaktivität/innere Unruhe**: „Getrieben sein", schwer entspannen, ständiger Bewegungsdrang (bei Erwachsenen oft eher innerlich)
- **Impulsivität**: Unterbrechen, vorschnelle Entscheidungen, Reizbarkeit, riskantes Verhalten
- **Exekutive Funktionen**: Zeitmanagement, Priorisieren, Planen, Arbeitsgedächtnis und „Dranbleiben" fallen schwer

ADHS tritt häufig gemeinsam mit Angst, Depression, Schlafproblemen oder problematischem Substanzkonsum auf – manchmal als Folge jahrelanger Überforderung oder Selbstkritik.

## Wie entsteht ADHS?

ADHS gilt als neurobiologisch mitbedingt. Das heißt nicht, dass „nichts zu machen" ist – aber es erklärt, warum reines „Zusammenreißen" selten hilft. Umfeldfaktoren (Stress, Schlaf, Belastungen) können Symptome verstärken oder abmildern.

## Was kann im Alltag helfen?

- **Struktur sichtbar machen**: Wochenplan, Checklisten, feste Ablageorte, Kalender mit Erinnerungen
- **Aufgaben in Mini-Schritte teilen**: Startbarrieren senken („2-Minuten-Regel")
- **Reizreduktion**: Fokus-Zeitfenster, Benachrichtigungen aus, klarer Arbeitsplatz
- **Selbstfreundlichkeit statt Selbstabwertung**: ADHS ist keine Charakterschwäche
- **Schlaf, Bewegung, Pausen**: oft unterschätzt, aber sehr wirksam als „Basis"

## Diagnostik & Behandlung

Eine ADHS-Diagnose erfolgt über fachliche Diagnostik (Anamnese, Fragebögen, ggf. Fremdberichte). In der Behandlung kommen häufig Psychoedukation, verhaltenstherapeutische Strategien/Coaching und – je nach Fall – Medikation zum Einsatz.

## Wie kann Online-Gruppentherapie unterstützen?

In einer Gruppe können Teilnehmende

- alltagsnahe Strategien zu Organisation, Prokrastination, Reizmanagement üben,
- an Scham und Selbstwert arbeiten („Ich bin nicht faul"),
- sich gegenseitig motivieren und dranzubleiben – ohne Leistungsdruck.`,
  },
  {
    id: '3',
    title: 'Alkohol & Drogen',
    slug: 'alkohol-und-drogen',
    excerpt: 'Wege aus der Abhängigkeit und wie man erste Schritte in ein neues Leben wagt.',
    metaDescription: 'Alkohol- und Drogenabhängigkeit verstehen — Anzeichen erkennen, Auslöser verstehen und therapeutische Wege aus der Sucht.',
    image: topicAlkohol,
    content: `# Alkohol & Drogen

Alkohol und andere psychoaktive Substanzen können sich zunächst wie eine Lösung anfühlen. Sie dämpfen Anspannung, machen Gefühle erträglicher oder helfen beim Abschalten. Kurzfristig kann das entlastend wirken. Langfristig verstärken Substanzen jedoch häufig genau die Probleme, die sie eigentlich lindern sollen: Stimmungsschwankungen, Angst, Schlafstörungen, innere Unruhe, Konflikte im sozialen Umfeld, Leistungsabfall und körperliche Folgen.

Wichtig ist dabei: Konsum ist kein Entweder-oder. Zwischen riskantem Konsum, schädlichem Gebrauch und Abhängigkeit gibt es fließende Übergänge. Unterstützung kann und darf in jeder Phase sinnvoll sein – nicht erst dann, wenn „nichts mehr geht".

## Woran merke ich, dass Konsum problematisch wird?

Problematischer Konsum zeigt sich oft nicht plötzlich, sondern schleichend. Mögliche Anzeichen sind:

- häufige Gedanken an die Substanz oder starkes Verlangen (Craving)
- Kontrollverlust: mehr oder häufiger konsumieren als geplant
- steigende Toleranz oder Konsum, um sich „normal" zu fühlen
- Vernachlässigung von Freizeit, Beziehungen, Arbeit oder Studium
- Weiterkonsum trotz negativer körperlicher, psychischer oder sozialer Folgen
- Entzugssymptome wie Zittern, Schwitzen, Unruhe oder Schlaflosigkeit

Nicht jedes dieser Anzeichen muss vorhanden sein. Schon einzelne Punkte können darauf hinweisen, dass ein genaueres Hinschauen hilfreich wäre.

## Warum greifen Menschen zu Substanzen?

Hinter Konsum steht häufig der Versuch, mit innerem Druck umzugehen. Stress, Einsamkeit, Angst, depressive Stimmung, Überforderung oder innere Leere lassen sich durch Substanzen kurzfristig regulieren. Genau darin liegt ihr Risiko: Das Gehirn lernt sehr schnell, dass Konsum Erleichterung bringt – und speichert diese Erfahrung ab.

Dieses Lernen geschieht nicht aus Schwäche, sondern folgt neurobiologischen Prinzipien. Das Belohnungssystem reagiert zuverlässig, auch wenn die langfristigen Folgen ungünstig sind.

## Der Teufelskreis des Konsums

Viele Menschen erleben einen ähnlichen Kreislauf:

Belastung → Konsum → kurzfristige Entlastung → körperlicher und emotionaler Rebound (z. B. schlechter Schlaf, Angst, Stimmungstief) → neue Belastung → erneuter Konsum.

Dieser Kreislauf ist keine Frage von mangelnder Willenskraft. Er ist ein erlernter Mechanismus – und damit grundsätzlich auch veränderbar.

## Erste Schritte, die vielen Menschen helfen

Veränderung beginnt oft klein. Hilfreich können zum Beispiel sein:

- ein Konsumtagebuch (Menge, Situation, Gefühl, Anlass)
- das Erkennen persönlicher Trigger wie bestimmte Orte, Zeiten, Menschen oder Emotionen
- alternative Strategien zur Stress- und Emotionsregulation, etwa Bewegung, Atemübungen, soziale Kontakte oder kurze Skills
- ein realistischer Umgang mit Rückfällen: Ein Ausrutscher ist kein Scheitern, sondern eine Lerngelegenheit
- das Einbinden sicherer Unterstützung, zum Beispiel durch vertraute Personen, Ärzt:innen oder Beratungsstellen

**Wichtig:** Bei einigen Substanzen – insbesondere Alkohol und Benzodiazepinen – kann ein plötzlicher Entzug medizinisch gefährlich sein und sollte immer fachlich begleitet werden.

## Wie Online-Gruppentherapie unterstützen kann

Gruppentherapie kann entlasten, weil Erfahrungen geteilt werden und Scham abnimmt. Sie bietet alltagsnahe Werkzeuge im Umgang mit Craving, Stress und Rückfallmustern und stärkt Motivation, Selbstwirksamkeit und soziale Unterstützung. Der Austausch mit anderen hilft, sich selbst besser zu verstehen und neue Perspektiven zu entwickeln.

## Hilfsangebote

Wenn Sie akut Unterstützung benötigen oder anonym sprechen möchten, können folgende Angebote hilfreich sein:

- **TelefonSeelsorge**: 116 123 (kostenfrei, rund um die Uhr)
- **Sucht & Drogen Hotline**: 01806 313031 (kostenpflichtig)`,
  },
  {
    id: '4',
    title: 'Angst',
    slug: 'angst',
    excerpt: 'Wenn Angst den Alltag bestimmt: Strategien für mehr Sicherheit und innere Ruhe.',
    metaDescription: 'Angststörungen verstehen und bewältigen — von Panikattacken bis sozialer Phobie. Therapeutische Strategien für mehr innere Ruhe.',
    image: topicAngst,
    content: `# Angst

Angst ist eine natürliche Schutzreaktion unseres Körpers. Sie hilft uns, Gefahren zu erkennen und uns darauf vorzubereiten. Problematisch wird Angst dann, wenn sie sehr häufig oder besonders intensiv auftritt – oder wenn sie dazu führt, dass Situationen dauerhaft vermieden werden. Bei sozialer Angst (auch soziale Phobie genannt) steht oft die Sorge im Mittelpunkt, negativ bewertet zu werden: peinlich aufzufallen, zu erröten, zu stottern oder „komisch" zu wirken.

## Typische Anzeichen von Angst

Angst zeigt sich auf unterschiedlichen Ebenen und kann sehr belastend erlebt werden:

- **Körperlich**: Herzrasen, Zittern, Schwitzen, Atemnot, Engegefühl, Magen-Darm-Beschwerden
- **Gedanklich**: Katastrophisierende Gedanken wie „Alle merken, wie nervös ich bin" oder „Das halte ich nicht aus"
- **Verhalten**: Vermeidung (z. B. Treffen absagen), Rückzug oder sogenanntes Sicherheitsverhalten, etwa übermäßige Vorbereitung, Blickkontakt meiden oder der Einsatz von Alkohol zur Beruhigung

Nicht jede Angst zeigt sich gleich. Viele Betroffene entwickeln individuelle Strategien, um mit ihr umzugehen – auch wenn diese langfristig oft neue Probleme schaffen.

## Warum hält sich Angst so hartnäckig?

Angst wird durch Vermeidung kurzfristig geringer. Genau dadurch verstärkt sie sich jedoch langfristig. Das Gehirn lernt: „Gut, dass ich ausgewichen bin – sonst wäre etwas Schlimmes passiert." Die Angst wird nicht überprüft, sondern bestätigt.

Auch Sicherheitsstrategien tragen dazu bei, dass Angst bestehen bleibt. Sie vermitteln das Gefühl, ohne diese Hilfen nicht zurechtzukommen. So entsteht ein Kreislauf, in dem Angst immer mehr Raum einnimmt, obwohl objektiv keine Gefahr besteht.

## Was hilft häufig im Umgang mit Angst?

Ein zentraler Schritt ist das Verständnis dafür, wie Angst funktioniert. Angst ist unangenehm, aber nicht gefährlich. Viele Menschen profitieren von:

- **Psychoedukation**: Wissen über Angst reduziert Ohnmachtsgefühle
- **Schrittweiser Exposition**: gefürchtete Situationen in kleinen, machbaren Schritten aufsuchen
- **Umgang mit Gedanken**: Wahrscheinlichkeiten realistischer einschätzen statt Katastrophen erwarten
- **Körperregulation**: Atemübungen, Muskelentspannung oder achtsame Wahrnehmung
- **Selbstmitgefühl**: Angst ist kein Charakterfehler, sondern eine erlernte Schutzreaktion

Veränderung bedeutet dabei nicht, Angst sofort loszuwerden, sondern einen neuen Umgang mit ihr zu entwickeln.

## Wie kann Online-Gruppentherapie unterstützen?

Gerade bei Angst – insbesondere sozialer Angst – kann Gruppentherapie sehr wirksam sein. Die Gruppe bietet einen geschützten Rahmen, um:

- in Anwesenheit anderer zu sprechen und Rückmeldungen zu erhalten
- soziale Situationen dosiert zu erleben und zu erfahren, dass Angst abklingt
- Zugehörigkeit statt Isolation zu erleben – ein wichtiger Schutzfaktor für psychische Gesundheit

Der Austausch mit anderen wirkt oft entlastend und hilft, eigene Ängste besser einzuordnen. Schritt für Schritt kann so Sicherheit wachsen – im eigenen Tempo und mit fachlicher Begleitung.`,
  },
  {
    id: '5',
    title: 'Depression',
    slug: 'depression',
    excerpt: 'Warum Depression mehr ist als nur Traurigkeit und wie Therapie helfen kann.',
    metaDescription: 'Depression erkennen und behandeln — Symptome, Therapieansätze und der Weg zurück zu Energie und Lebensfreude.',
    image: topicDepression,
    content: `# Depression

Depressionen sind mehr als Traurigkeit oder ein vorübergehendes Stimmungstief. Sie beeinflussen Denken, Fühlen, Körper und Verhalten – oft über Wochen oder länger. Viele Betroffene beschreiben eine tiefe Erschöpfung, innere Leere oder das Gefühl, im Alltag nur noch „funktionieren" zu müssen, obwohl selbst kleine Dinge große Anstrengung kosten.

## Häufige Anzeichen

Depressive Symptome können sich unterschiedlich zeigen. Häufig berichten Betroffene über:

- anhaltend gedrückte Stimmung oder deutlichen Interessen- und Freudverlust
- Antriebsmangel und schnelle Ermüdung
- Schlaf- und Konzentrationsprobleme
- Grübeln, Schuldgefühle und starke Selbstabwertung
- Veränderungen von Appetit oder Gewicht
- sozialen Rückzug und verminderte Kontaktfreude

Nicht alle Anzeichen müssen gleichzeitig auftreten. Auch die Intensität kann schwanken.

## Der depressive Kreislauf

Depressionen halten sich oft durch einen sich selbst verstärkenden Kreislauf aufrecht:

Wenig Energie führt zu weniger Aktivität. Dadurch entstehen kaum positive Erlebnisse, was Grübeln und Selbstkritik verstärkt. Diese wiederum rauben zusätzliche Kraft – und der Antrieb sinkt weiter.

Hinzu kommt, dass Depression den Blick verengt. Negative Informationen wirken besonders laut und überzeugend, während positive Erfahrungen kaum wahrgenommen oder abgewertet werden.

## Was hilft häufig im Alltag?

Veränderung beginnt meist nicht mit großen Schritten, sondern mit kleinen, realistischen Ansätzen. Viele Menschen profitieren von:

- **Sanfter Aktivierung**: sehr kleine, machbare Schritte, zum Beispiel zehn Minuten an die frische Luft gehen
- **Tagesstruktur**: feste Zeiten für Schlaf, Mahlzeiten und kurze Routinen
- **Gedanken überprüfen**: sich fragen, welche Belege es für belastende Gedanken gibt und ob es mildere Sichtweisen gibt
- **Dosiertem Sozialkontakt**: kurze Nachrichten, ein Spaziergang zu zweit statt großer Treffen
- **Körperlicher Unterstützung**: Licht, Bewegung, ausgewogene Ernährung und gegebenenfalls medizinische Abklärung

Ziel ist nicht, sich „zusammenzureißen", sondern dem System langsam wieder mehr Halt zu geben.

## Wann ist schnelle Hilfe wichtig?

Wenn Hoffnungslosigkeit sehr stark wird, Suizidgedanken auftreten oder der Alltag kaum noch zu bewältigen ist, ist es wichtig, zeitnah Unterstützung zu suchen – zum Beispiel über den ärztlichen Bereitschaftsdienst, den Notruf oder die TelefonSeelsorge (116 123).

## Wie kann Online-Gruppentherapie unterstützen?

In der Gruppentherapie erleben viele Menschen Entlastung durch Normalisierung: „Ich bin nicht allein mit dem, was ich erlebe." Gemeinsame Aktivierungspläne, ein sanfter Rahmen von Verbindlichkeit und der Austausch über Grübeln, Selbstkritik, Schlaf und Stress können stabilisierend wirken. Gleichzeitig werden Ressourcen gestärkt und ein selbstmitfühlenderer Umgang mit sich selbst gefördert.`,
  },
  {
    id: '6',
    title: 'Emotionsregulation',
    slug: 'emotionsregulation',
    excerpt: 'Gefühle verstehen, annehmen und steuern lernen — ein Schlüssel zu psychischer Gesundheit.',
    metaDescription: 'Emotionsregulation lernen — Gefühle besser verstehen, annehmen und steuern. Ein zentraler Baustein der Psychotherapie.',
    image: topicEmotionsregulation,
    content: `# Emotionsregulation

Emotionen sind keine Störung, sondern wichtige Signale. Sie zeigen uns Bedürfnisse, Grenzen und Werte an und helfen bei Orientierung und Beziehung. Schwierigkeiten entstehen dann, wenn Gefühle sehr stark, sehr schnell oder scheinbar „aus dem Nichts" auftreten – oder wenn sie nur noch durch Rückzug, Wut, Selbstabwertung oder Substanzen regulierbar erscheinen.

## Was bedeutet Emotionsregulation?

Emotionsregulation heißt nicht, Gefühle zu unterdrücken oder „wegzumachen". Es geht vielmehr darum,

- Emotionen **wahrzunehmen** und benennen zu können,
- ihre **Intensität** zu beeinflussen,
- **handlungsfähig** zu bleiben, auch wenn Gefühle stark sind.

Ziel ist es, zwischen Reiz und Reaktion wieder mehr Spielraum zu gewinnen – statt impulsiv zu reagieren oder innerlich zu erstarren.

## Häufige Schwierigkeiten im Umgang mit Gefühlen

Viele Menschen erleben wiederkehrende Muster, zum Beispiel:

- Überwältigung durch Angst, Wut oder Scham
- Abschalten in Form von innerer Leere, Taubheit oder Dissoziation
- Grübeln statt Fühlen, um Emotionen zu kontrollieren
- Konflikte, impulsive Entscheidungen oder sozialer Rückzug

Diese Muster sind meist erlernte Schutzstrategien. Sie entstehen oft in Situationen, in denen Gefühle früher zu viel oder zu wenig Raum hatten.

## Praktische Strategien zur Emotionsregulation

Emotionsregulation lässt sich üben. Hilfreich können unter anderem sein:

- **Stopp & Boden**: die Füße bewusst spüren, fünf Dinge sehen, hören oder fühlen (Grounding)
- **Atem & Rhythmus**: länger aus- als einatmen, Bewegungen verlangsamen
- **Gefühlsampel**: grün, gelb, rot – erkennen, in welchem Bereich man sich befindet und was dort hilft
- **Bedürfnis-Check**: Habe ich Hunger, bin ich müde, überfordert oder brauche Nähe oder Abstand?
- **Selbstberuhigung**: Musik, Wärme, eine Dusche, Bewegung oder Natur

Nicht jede Strategie wirkt für jede Person gleich. Entscheidend ist, eigene hilfreiche Werkzeuge kennenzulernen.

## Warum Emotionsregulation entlastet

Wenn Gefühle besser reguliert werden können, verlieren sie ihren überwältigenden Charakter. Emotionen werden verständlicher, Beziehungen stabiler und Entscheidungen klarer. Viele erleben mehr Selbstkontrolle – nicht durch Härte, sondern durch Verständnis für sich selbst.

## Wie kann Online-Gruppentherapie unterstützen?

In der Gruppentherapie können Strategien zur Emotionsregulation gemeinsam erlernt und zwischen den Sitzungen erprobt werden. Der Austausch darüber, was in welcher Situation geholfen hat, wirkt oft klärend und entlastend. Gleichzeitig entsteht Verständnis für emotionale Reaktionen – und damit weniger Scham über das Gefühl, „zu viel" zu sein.`,
  },
  {
    id: '7',
    title: 'Selbstwert',
    slug: 'selbstwert',
    excerpt: 'Den eigenen Wert erkennen und stärken — warum ein gesunder Selbstwert die Basis für Veränderung ist.',
    metaDescription: 'Selbstwert stärken — verstehen, woher negative Selbstbilder kommen und wie Therapie zu einem gesunden Selbstwertgefühl beiträgt.',
    image: topicSelbstwert,
    content: `# Selbstwert

Selbstwert beschreibt die innere Überzeugung: „Ich bin in Ordnung – auch wenn ich Fehler mache." Ein stabiler Selbstwert ist nicht gleichbedeutend mit Selbstüberschätzung, sondern mit einer grundlegenden Akzeptanz der eigenen Person. Ist der Selbstwert fragil, hängt er häufig stark von Leistung, Anerkennung oder Kontrolle ab. Kritik, Rückschläge oder Konflikte werden dann schnell als Beweis erlebt, „nicht gut genug" zu sein.

## Woran zeigt sich ein angeschlagener Selbstwert?

Ein niedriger oder instabiler Selbstwert kann sich auf unterschiedliche Weise äußern, zum Beispiel durch:

- einen starken inneren Kritiker und ausgeprägten Perfektionismus
- das Bedürfnis, es allen recht zu machen (People-Pleasing) und Schwierigkeiten, Nein zu sagen
- Angst vor Ablehnung und hohen Vergleichsdruck
- Schamgefühle und Rückzug nach Fehlern
- das Gefühl, sich Anerkennung oder Zugehörigkeit „verdienen" zu müssen

Diese Muster sind oft sehr belastend und beeinflussen Beziehungen, Arbeit und das eigene Wohlbefinden.

## Woher kommen Selbstwertprobleme?

Selbstwert entwickelt sich nicht isoliert, sondern in Beziehung. Häufig spielen frühe Lernerfahrungen eine Rolle, etwa wiederholte Kritik, wenig emotionale Sicherheit, Mobbing, unklare Grenzen oder überhöhte Erwartungen. Auch psychische Belastungen wie Depressionen, Angststörungen oder ADHS können Selbstwertprobleme verstärken oder aufrechterhalten.

Wichtig ist dabei: Selbstwertprobleme sind kein persönliches Versagen, sondern verständliche Anpassungen an frühere Erfahrungen.

## Was stärkt Selbstwert langfristig?

Ein stabilerer Selbstwert entsteht nicht durch ständige Selbstoptimierung, sondern durch eine veränderte innere Haltung. Hilfreich sind häufig:

- **realistische Selbstzuschreibungen**, die Stärken und Schwächen gleichzeitig anerkennen
- **Selbstmitgefühl**, also ein freundlicherer innerer Umgang, ähnlich dem mit einem guten Freund
- **Werteorientierung**: sich an dem zu orientieren, was wirklich wichtig ist – statt daran, wie man wirkt
- **Grenzen üben**, etwa durch kleine, klare Neins und das Formulieren eigener Bedürfnisse
- **Kompetenzerfahrungen** mit machbaren Zielen, die zur eigenen Person passen

Diese Schritte wirken oft langsam, aber nachhaltig.

## Wie kann Online-Gruppentherapie unterstützen?

In der Gruppentherapie können korrigierende Beziehungserfahrungen entstehen: akzeptiert zu sein, ohne perfekt funktionieren zu müssen. Wertschätzendes Feedback stärkt den Blick auf eigene Ressourcen, ohne zu bewerten. Übungen zu Scham, innerem Kritiker, Grenzen und Selbstmitgefühl helfen dabei, neue innere Muster zu entwickeln und zu festigen.`,
  },
  {
    id: '8',
    title: 'Trauma',
    slug: 'trauma',
    excerpt: 'Was Trauma mit uns macht und wie die Seele heilen kann — behutsam und in Ihrem Tempo.',
    metaDescription: 'Trauma verstehen und verarbeiten — behutsame therapeutische Begleitung für Menschen mit traumatischen Erfahrungen.',
    image: topicTrauma,
    content: `# Trauma

Trauma beschreibt eine Erfahrung, die für das Nervensystem zu viel, zu schnell oder zu plötzlich war – und bei der sich ein Mensch hilflos, ausgeliefert oder existenziell bedroht fühlte. Traumatische Erfahrungen können nach Unfällen, Gewalt, Übergriffen, Vernachlässigung, schweren Verlusten oder auch durch anhaltend belastende Beziehungen entstehen.

Wichtig ist: Nicht jede schwere oder schmerzhafte Erfahrung führt zu einer Traumafolgestörung. Wenn jedoch körperliche oder seelische Symptome anhalten und den Alltag beeinträchtigen, ist Unterstützung sinnvoll und wichtig.

## Mögliche Folgen traumatischer Erfahrungen

Traumafolgen können sich sehr unterschiedlich zeigen. Häufig berichten Betroffene über:

- **Wiedererleben**: Flashbacks, Albträume oder sich aufdrängende Erinnerungen
- **Übererregung**: erhöhte Schreckhaftigkeit, innere Unruhe, Schlafprobleme oder Reizbarkeit
- **Vermeidung**: Meiden bestimmter Orte, Menschen oder Gespräche, emotionales „Abschalten"
- **Negative Selbst- und Weltbilder**: Schuldgefühle, Scham, Misstrauen oder ein Gefühl ständiger Bedrohung
- **Dissoziation**: sich unwirklich fühlen, „neben sich stehen", innerlich weg sein

Diese Reaktionen sind keine Schwäche, sondern Schutzmechanismen des Nervensystems, die ursprünglich dem Überleben dienten.

## Warum Stabilisierung an erster Stelle steht

In der traumasensiblen Arbeit wird häufig in Phasen vorgegangen. An erster Stelle steht dabei fast immer Sicherheit und Stabilisierung. Erst wenn ausreichend innere und äußere Stabilität vorhanden ist, kann eine behutsame Verarbeitung traumatischer Erfahrungen sinnvoll sein.

Typische Phasen sind:

1. **Sicherheit und Stabilisierung**: Ressourcenaufbau, Grenzen stärken, Körper- und Emotionsregulation
2. **Verarbeitung**: Auseinandersetzung mit traumatischen Erinnerungen – nur bei ausreichender Stabilität
3. **Integration und Neubeginn**: den Alltag, Beziehungen und Lebenssinn neu gestalten

Dieser Prozess ist individuell und verläuft nicht linear.

## Was kann im Alltag unterstützend wirken?

Auch außerhalb von Therapie können sanfte Schritte helfen, das Nervensystem zu entlasten:

- Grounding und bewusste Orientierung im Hier und Jetzt
- das eigene „Fenster der Toleranz" kennenlernen: Über- und Untererregung erkennen
- verlässliche Routinen, ausreichend Schlaf und Erholungszeiten
- Unterstützung durch vertrauenswürdige Personen und gegebenenfalls Fachstellen

Wichtig ist dabei, sich nicht zu überfordern. Stabilisierung braucht Zeit.

## Wie kann Online-Gruppentherapie unterstützen?

In einer traumasensiblen Gruppentherapie steht meist die Stabilisierung im Vordergrund. Ziel ist nicht das Erzählen belastender Details, sondern:

- der Aufbau von Ressourcen sowie Körper- und Emotionsregulation
- das Erlernen eines sicheren Umgangs mit Triggern
- das Erleben von Grenzen, Schutz und Verlässlichkeit
- Austausch auf Augenhöhe, ohne andere zu überfordern – getragen von klaren Gruppenregeln

Viele Betroffene erleben es als entlastend, mit ihren Reaktionen nicht allein zu sein und Verständnis ohne Druck zu erfahren.`,
  },
];
