import { Link } from 'react-router-dom';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';

export default function AGB() {
  useDocumentMeta({
    title: 'Allgemeine Geschäftsbedingungen',
    description: 'Allgemeine Geschäftsbedingungen der Online-Psychotherapie-Praxis Mut-Taucher.',
    canonical: BASE_URL + '/agb',
  });

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Startseite
          </Link>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-text mb-2">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-lg text-gray-500 mb-8">Online-Praxis Mut-Taucher — Jana Fricke</p>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text">

            <h2>1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle therapeutischen Leistungen, die von Jana Fricke, M.Sc. Psychologin, Systemische Therapeutin / Familientherapeutin (DGSF), im Rahmen der Online-Praxis Mut-Taucher angeboten werden.
            </p>
            <p>
              Das Angebot umfasst insbesondere Erstgespräche, Einzelsitzungen sowie Gruppentherapien, die per Videokommunikation durchgeführt werden.
            </p>
            <p>
              Mit der Buchung eines Termins über die Website oder andere vereinbarte Kommunikationswege kommt ein Dienstleistungsvertrag zustande. Mit der Terminbuchung erkennen Sie diese Allgemeinen Geschäftsbedingungen an.
            </p>

            <h2>2. Art der Leistung</h2>
            <p>
              Die angebotenen Leistungen erfolgen im Rahmen der Heilpraktikererlaubnis, beschränkt auf das Gebiet der Psychotherapie gemäß Heilpraktikergesetz.
            </p>
            <p>
              Die angebotene Therapie stellt keine ärztliche Behandlung dar und ersetzt weder ärztliche Diagnostik noch medizinische Behandlung.
            </p>
            <p>
              Bei akuten psychiatrischen Notfällen, Suizidalität oder schweren körperlichen Erkrankungen wenden Sie sich bitte an:
            </p>
            <ul>
              <li>den ärztlichen Bereitschaftsdienst (116 117)</li>
              <li>den Notruf (112)</li>
              <li>die TelefonSeelsorge (116 123)</li>
            </ul>

            <h2>3. Terminvereinbarung und Ausfallhonorar</h2>
            <p>
              Vereinbarte Termine sind verbindlich.
            </p>
            <p>
              Eine kostenfreie Absage oder Verschiebung eines Termins ist bis spätestens <strong>48 Stunden vor dem vereinbarten Termin</strong> möglich.
            </p>
            <p>
              Bei Absagen weniger als 48 Stunden vor dem Termin sowie bei Nichterscheinen wird das vereinbarte Honorar in voller Höhe als Ausfallhonorar berechnet.
            </p>
            <p>
              Das Ausfallhonorar wird erhoben, da der Termin kurzfristig in der Regel nicht anderweitig vergeben werden kann.
            </p>
            <p>
              Dem Patienten bleibt der Nachweis vorbehalten, dass kein oder ein wesentlich geringerer Schaden entstanden ist.
            </p>

            <h2>4. Honorar und Zahlung</h2>
            <p>
              Die Höhe des Honorars richtet sich nach der jeweils aktuell gültigen Honorarvereinbarung und wird vor der Terminbuchung transparent ausgewiesen.
            </p>
            <p>
              Die Leistungen werden als Selbstzahlerleistungen erbracht.
            </p>
            <p>
              Eine Kostenübernahme durch gesetzliche Krankenkassen erfolgt in der Regel nicht. Private Krankenversicherungen oder Zusatzversicherungen können die Kosten je nach Tarif teilweise oder vollständig erstatten. Eine Klärung mit der jeweiligen Versicherung liegt in der Verantwortung des Patienten.
            </p>
            <p>
              Die Zahlung erfolgt per Überweisung auf das angegebene Konto.
            </p>
            <p>
              Sofern nicht anders vereinbart, ist der Rechnungsbetrag innerhalb von 14 Tagen nach Rechnungsstellung zu begleichen.
            </p>

            <h2>5. Schweigepflicht und Vertraulichkeit</h2>
            <p>
              Alle Inhalte der therapeutischen Sitzungen unterliegen der gesetzlichen Schweigepflicht gemäß § 203 StGB.
            </p>
            <p>
              Informationen werden ohne ausdrückliche Einwilligung des Patienten nicht an Dritte weitergegeben, es sei denn, es besteht eine gesetzliche Offenlegungspflicht.
            </p>

            <h2>6. Durchführung der Online-Sitzungen</h2>
            <p>
              Die Sitzungen finden per Videokommunikation statt.
            </p>
            <p>
              Voraussetzung für die Teilnahme ist eine stabile Internetverbindung sowie ein Endgerät mit Kamera und Mikrofon.
            </p>
            <p>
              Die Verantwortung für die technischen Voraussetzungen auf Seiten des Patienten liegt bei den Teilnehmenden.
            </p>
            <p>
              Sollte eine Sitzung aufgrund technischer Probleme nicht durchgeführt werden können, wird nach Möglichkeit ein Ersatztermin vereinbart.
            </p>

            <h2>7. Haftung</h2>
            <p>
              Die therapeutische Arbeit erfolgt nach bestem Wissen und Gewissen. Ein bestimmter Behandlungserfolg kann nicht garantiert werden.
            </p>
            <p>
              Die Haftung für Schäden ist auf Vorsatz und grobe Fahrlässigkeit beschränkt, soweit gesetzlich zulässig.
            </p>
            <p>
              Die Haftung für Schäden aus der Verletzung von Leben, Körper oder Gesundheit bleibt hiervon unberührt.
            </p>

            <h2>8. Beendigung der Therapie</h2>
            <p>
              Die therapeutische Zusammenarbeit kann von beiden Seiten jederzeit beendet werden.
            </p>
            <p>
              Bereits vereinbarte Termine müssen gemäß den Regelungen in Abschnitt 3 rechtzeitig abgesagt werden. Andernfalls wird das vereinbarte Honorar als Ausfallhonorar berechnet.
            </p>

            <h2>9. Schlussbestimmungen</h2>
            <p>
              Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland.
            </p>

          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
