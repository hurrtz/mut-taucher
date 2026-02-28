import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';

export default function Datenschutz() {
  useDocumentMeta(
    'Datenschutzerklärung — Mut-Taucher',
    'Datenschutzerklärung der Online-Psychotherapie-Praxis Mut-Taucher.',
  );

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Startseite
          </Link>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-text mb-6">Datenschutzerklärung</h1>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text">

            <h2>Datenschutz auf einen Blick</h2>
            <p>
              Der Schutz Ihrer persönlichen Daten ist mir ein wichtiges Anliegen. Personenbezogene Daten werden auf dieser Website nur im notwendigen Umfang und gemäß den geltenden gesetzlichen Datenschutzvorschriften verarbeitet.
            </p>

            <h2>Verantwortliche Stelle</h2>
            <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
            <p>
              Jana Fricke<br />
              M.Sc. Psychologie<br />
              Zeuschelstraße 97, 13127 Berlin<br />
              <a href="mailto:gruppentherapie@mut-taucher.de">gruppentherapie@mut-taucher.de</a><br />
              <a href="tel:+4915253432009">+49 152 53432009</a>
            </p>

            <h2>Erhebung und Verarbeitung personenbezogener Daten</h2>
            <p>
              Beim Besuch dieser Website werden automatisch Informationen durch den Webserver erfasst (z.&nbsp;B. IP-Adresse, Browsertyp, Uhrzeit des Zugriffs). Diese Daten dienen der technischen Bereitstellung und Sicherheit der Website und erlauben keinen Rückschluss auf Ihre Person.
            </p>
            <p>
              Personenbezogene Daten (z.&nbsp;B. Name, E-Mail-Adresse) werden nur erhoben, wenn Sie diese freiwillig angeben, etwa bei der Terminbuchung oder Kontaktaufnahme.
            </p>

            <h2>Zweck der Datenverarbeitung</h2>
            <p>Die Verarbeitung Ihrer Daten erfolgt ausschließlich zu folgenden Zwecken:</p>
            <ul>
              <li>Bereitstellung und Verbesserung der Website</li>
              <li>Bearbeitung von Anfragen</li>
              <li>Terminorganisation und Kommunikation</li>
              <li>Erfüllung gesetzlicher Pflichten</li>
            </ul>
            <p>
              Eine Weitergabe Ihrer Daten an Dritte erfolgt nicht ohne Ihre ausdrückliche Einwilligung, es sei denn, es besteht eine gesetzliche Verpflichtung.
            </p>

            <h2>Online-Terminbuchung / Kontaktaufnahme</h2>
            <p>
              Wenn Sie einen Termin buchen oder Kontakt aufnehmen, werden die von Ihnen angegebenen Daten zur Bearbeitung Ihrer Anfrage und zur Durchführung des Termins gespeichert. Die Daten werden vertraulich behandelt und nicht für andere Zwecke verwendet.
            </p>

            <h2>Videotherapie / Online-Kommunikation</h2>
            <p>
              Für Online-Sitzungen werden datenschutzkonforme Videodienste genutzt. Die Kommunikation erfolgt verschlüsselt. Es findet keine Aufzeichnung der Sitzungen statt.
            </p>

            <h2>Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht auf:</p>
            <ul>
              <li>Auskunft über Ihre gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung oder Einschränkung der Verarbeitung</li>
              <li>Widerruf einer erteilten Einwilligung</li>
              <li>Beschwerde bei einer zuständigen Datenschutzaufsichtsbehörde</li>
            </ul>

            <h2>Datensicherheit</h2>
            <p>
              Diese Website nutzt technische und organisatorische Maßnahmen, um Ihre Daten vor Verlust, Manipulation oder unbefugtem Zugriff zu schützen.
            </p>

            <h2>Änderungen dieser Datenschutzerklärung</h2>
            <p>
              Diese Datenschutzerklärung kann angepasst werden, um rechtliche Anforderungen oder Änderungen des Angebots zu berücksichtigen.
            </p>

          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
