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

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-text mb-6">Allgemeine Geschäftsbedingungen</h1>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text">

            <h2>1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen gelten für alle therapeutischen Leistungen, die von Jana Fricke, M.Sc. Psychologin, Systemische Therapeutin / Familientherapeutin (DGSF), im Rahmen der Online-Psychotherapie-Praxis Mut-Taucher angeboten werden. Mit der Terminbuchung erkennen Sie diese Bedingungen an.
            </p>

            <h2>2. Leistungsangebot</h2>
            <p>
              Das Angebot umfasst psychotherapeutische Einzelsitzungen, Gruppentherapie und Erstgespräche per Videokommunikation. Die Therapie erfolgt auf Grundlage des Heilpraktikergesetzes (Erlaubnis beschränkt auf das Gebiet der Psychotherapie). Es handelt sich nicht um eine ärztliche Behandlung.
            </p>
            <p>
              Die Therapie ersetzt keine ärztliche Diagnostik oder Behandlung. Bei akuten psychiatrischen Notfällen, Suizidalität oder schweren körperlichen Erkrankungen wird empfohlen, sich an den ärztlichen Bereitschaftsdienst (116 117), den Notruf (112) oder die TelefonSeelsorge (116 123) zu wenden.
            </p>

            <h2>3. Terminvereinbarung und Absage</h2>
            <p>
              Termine werden individuell vereinbart. Gebuchte Termine sind verbindlich. Sollten Sie einen Termin nicht wahrnehmen können, bitte ich um Absage mindestens <strong>24 Stunden vor dem vereinbarten Termin</strong>.
            </p>
            <p>
              Bei verspäteter Absage oder Nichterscheinen kann die Sitzung in voller Höhe in Rechnung gestellt werden, es sei denn, die Absage erfolgt aus einem nicht vorhersehbaren, wichtigen Grund (z.&nbsp;B. akute Erkrankung).
            </p>

            <h2>4. Honorar und Zahlung</h2>
            <p>
              Das Honorar richtet sich nach der jeweils gültigen Honorarvereinbarung und wird vor Beginn der Therapie transparent mitgeteilt. Die Leistungen sind gemäß § 4 Nr. 14 UStG von der Umsatzsteuer befreit.
            </p>
            <p>
              Die Abrechnung erfolgt als Selbstzahlerleistung. Eine Erstattung durch gesetzliche Krankenkassen ist in der Regel nicht möglich. Private Krankenversicherungen und Zusatzversicherungen erstatten die Kosten je nach Tarif teilweise oder vollständig – bitte klären Sie dies vorab mit Ihrer Versicherung.
            </p>
            <p>
              Die Zahlung erfolgt per Überweisung innerhalb von 14 Tagen nach Rechnungsstellung.
            </p>

            <h2>5. Schweigepflicht und Vertraulichkeit</h2>
            <p>
              Alle Inhalte der therapeutischen Sitzungen unterliegen der gesetzlichen Schweigepflicht gemäß § 203 StGB. Informationen werden ohne Ihre ausdrückliche Einwilligung nicht an Dritte weitergegeben, es sei denn, es besteht eine gesetzliche Mitteilungspflicht.
            </p>

            <h2>6. Technische Voraussetzungen</h2>
            <p>
              Für die Durchführung der Online-Sitzungen ist eine stabile Internetverbindung sowie ein Gerät mit Kamera und Mikrofon erforderlich. Es wird empfohlen, einen ruhigen, ungestörten Ort für die Sitzung zu wählen. Die Verantwortung für die technischen Voraussetzungen auf Klient:innenseite liegt bei den Teilnehmenden.
            </p>
            <p>
              Sollte eine Sitzung aus technischen Gründen nicht stattfinden können, wird gemeinsam ein Ersatztermin vereinbart.
            </p>

            <h2>7. Haftung</h2>
            <p>
              Die therapeutische Arbeit erfolgt nach bestem Wissen und Gewissen. Ein bestimmter Therapieerfolg kann nicht garantiert werden. Die Haftung beschränkt sich auf Vorsatz und grobe Fahrlässigkeit.
            </p>

            <h2>8. Beendigung der Therapie</h2>
            <p>
              Die Therapie kann von beiden Seiten jederzeit beendet werden. Eine Kündigung bedarf keiner besonderen Form. Bereits vereinbarte und nicht rechtzeitig abgesagte Termine werden gemäß Abschnitt 3 abgerechnet.
            </p>

            <h2>9. Schlussbestimmungen</h2>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Es gilt deutsches Recht. Gerichtsstand ist Berlin.
            </p>

          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
