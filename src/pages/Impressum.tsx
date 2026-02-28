import { Link } from 'react-router-dom';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';

export default function Impressum() {
  useDocumentMeta({
    title: 'Impressum',
    description: 'Impressum der Online-Psychotherapie-Praxis Mut-Taucher.',
    canonical: BASE_URL + '/impressum',
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

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-text mb-6">Impressum</h1>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text">

            <h2>Angaben gemäß § 5 TMG</h2>
            <p>
              Jana Fricke<br />
              M.Sc. Psychologin<br />
              Systemische Therapeutin / Familientherapeutin (DGSF)
            </p>

            <h2>Anschrift</h2>
            <p>
              Zeuschelstraße 97<br />
              13127 Berlin
            </p>

            <h2>Kontakt</h2>
            <p>
              E-Mail: <a href="mailto:gruppentherapie@mut-taucher.de">gruppentherapie@mut-taucher.de</a><br />
              Telefon: <a href="tel:+4915253432009">+49 152 53432009</a>
            </p>

            <h2>Steuernummer</h2>
            <p>35/294/00442</p>

            <h2>Berufsrechtliche Angaben</h2>
            <p>
              Erlaubnis zur berufsmäßigen Ausübung der Heilkunde ohne Bestallung beschränkt auf das Gebiet der Psychotherapie, aufgrund von § 1 Abs. 1 des Heilpraktikergesetzes vom 17. Februar 1939 (RGBl. I S. 251, BGBI. III 2122-2)
            </p>
            <p>
              Erteilt am 12.11.2021 durch:<br />
              Abt. Familie, Jugend, Gesundheit und Bürgerdienste, Gesundheitsamt<br />
              Bezirksamt Lichtenberg, Berlin
            </p>

            <h2>Umsatzsteuer</h2>
            <p>
              Die Leistungen sind gemäß § 4 Nr. 14 UStG von der Umsatzsteuer befreit.
            </p>

            <h2>Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieterin bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte verantwortlich. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen.
            </p>

            <h2>Haftung für Links</h2>
            <p>
              Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte kein Einfluss besteht. Für diese Inhalte wird keine Haftung übernommen.
            </p>

            <h2>Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiberin erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht.
            </p>

          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
