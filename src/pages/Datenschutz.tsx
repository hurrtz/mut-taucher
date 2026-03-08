import { Link } from 'react-router-dom';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';

export default function Datenschutz() {
  useDocumentMeta({
    title: 'Datenschutzerklärung',
    description: 'Datenschutzerklärung der Online-Psychotherapie-Praxis Mut-Taucher.',
    canonical: BASE_URL + '/datenschutz',
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

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-text mb-6">Datenschutzerklärung</h1>

          <nav className="mb-10 rounded-xl bg-white border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Inhalt</p>
            <ol className="columns-1 sm:columns-2 gap-x-8 space-y-1 text-sm list-decimal list-inside text-gray-600">
              <li><a href="#allgemeine-hinweise" className="hover:text-primary transition-colors">Allgemeine Hinweise</a></li>
              <li><a href="#verantwortliche-stelle" className="hover:text-primary transition-colors">Verantwortliche Stelle</a></li>
              <li><a href="#erhebung-speicherung" className="hover:text-primary transition-colors">Erhebung und Speicherung</a></li>
              <li><a href="#kontaktaufnahme" className="hover:text-primary transition-colors">Kontaktaufnahme</a></li>
              <li><a href="#terminbuchung" className="hover:text-primary transition-colors">Terminbuchung</a></li>
              <li><a href="#videotherapie" className="hover:text-primary transition-colors">Videotherapie / Online-Sitzungen</a></li>
              <li><a href="#weitergabe" className="hover:text-primary transition-colors">Weitergabe von Daten</a></li>
              <li><a href="#speicherdauer" className="hover:text-primary transition-colors">Speicherdauer</a></li>
              <li><a href="#datensicherheit" className="hover:text-primary transition-colors">Datensicherheit</a></li>
              <li><a href="#ihre-rechte" className="hover:text-primary transition-colors">Ihre Rechte</a></li>
              <li><a href="#beschwerderecht" className="hover:text-primary transition-colors">Beschwerderecht</a></li>
              <li><a href="#aenderungen" className="hover:text-primary transition-colors">Änderungen</a></li>
              <li><a href="#hosting" className="hover:text-primary transition-colors">Hosting und Datenbank</a></li>
              <li><a href="#therapie-de" className="hover:text-primary transition-colors">Videotherapie über therapie.de</a></li>
              <li><a href="#amplitude" className="hover:text-primary transition-colors">Webanalyse mit Amplitude</a></li>
              <li><a href="#gesundheitsdaten" className="hover:text-primary transition-colors">Hinweis zu Gesundheitsdaten</a></li>
              <li><a href="#zahlungsabwicklung" className="hover:text-primary transition-colors">Zahlungsabwicklung</a></li>
            </ol>
          </nav>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text">

            <h2 id="allgemeine-hinweise">Allgemeine Hinweise</h2>
            <p>
              Der Schutz Ihrer persönlichen Daten ist mir ein wichtiges Anliegen. Personenbezogene Daten werden auf dieser Website nur im erforderlichen Umfang und im Einklang mit den geltenden datenschutzrechtlichen Vorschriften, insbesondere der Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG), verarbeitet.
            </p>
            <p>
              Diese Datenschutzerklärung informiert Sie darüber, welche personenbezogenen Daten beim Besuch dieser Website sowie im Rahmen der Nutzung der angebotenen Leistungen verarbeitet werden.
            </p>

            <h2 id="verantwortliche-stelle">Verantwortliche Stelle</h2>
            <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
            <p>
              Jana Fricke<br />
              M.Sc. Psychologie<br />
              Zeuschelstraße 97<br />
              13127 Berlin
            </p>
            <p>
              E-Mail: <a href="mailto:info@mut-taucher.de">info@mut-taucher.de</a><br />
              Telefon: <a href="tel:+4915253432009">+49 152 53432009</a>
            </p>

            <h2 id="erhebung-speicherung">Erhebung und Speicherung personenbezogener Daten beim Besuch der Website</h2>
            <p>
              Beim Aufrufen dieser Website werden automatisch Informationen durch den Webserver erfasst. Diese Informationen werden in sogenannten Server-Logfiles gespeichert.
            </p>
            <p>Erfasst werden können insbesondere:</p>
            <ul>
              <li>IP-Adresse des anfragenden Geräts</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>aufgerufene Seite / Datei</li>
              <li>übertragene Datenmenge</li>
              <li>Browsertyp und Browserversion</li>
              <li>verwendetes Betriebssystem</li>
              <li>Referrer-URL (die zuvor besuchte Seite)</li>
            </ul>
            <p>Diese Daten werden verarbeitet, um:</p>
            <ul>
              <li>die technische Funktionsfähigkeit der Website sicherzustellen</li>
              <li>die Systemsicherheit zu gewährleisten</li>
              <li>Missbrauch der Website zu verhindern</li>
            </ul>
            <p>
              Rechtsgrundlage für diese Verarbeitung ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren und stabilen Bereitstellung der Website).
            </p>
            <p>
              Die Server-Logfiles werden in der Regel nach spätestens 7 Tagen gelöscht, sofern keine sicherheitsrelevanten Ereignisse eine längere Speicherung erforderlich machen.
            </p>

            <h2 id="kontaktaufnahme">Kontaktaufnahme</h2>
            <p>
              Wenn Sie per E-Mail oder über ein Kontaktformular mit mir Kontakt aufnehmen, werden die von Ihnen übermittelten personenbezogenen Daten (z.&nbsp;B. Name, E-Mail-Adresse, Inhalt der Anfrage) gespeichert, um Ihre Anfrage zu bearbeiten.
            </p>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Verarbeitung zur Durchführung vorvertraglicher Maßnahmen) oder Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bearbeitung von Anfragen).
            </p>
            <p>
              Die Daten werden gelöscht, sobald sie für die Bearbeitung Ihrer Anfrage nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>

            <h2 id="terminbuchung">Terminbuchung</h2>
            <p>
              Wenn Sie über die Website einen Termin buchen, werden die von Ihnen angegebenen personenbezogenen Daten (z.&nbsp;B. Name, Kontaktdaten und ggf. weitere Angaben) verarbeitet, um den Termin zu organisieren und durchzuführen.
            </p>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. Durchführung vorvertraglicher Maßnahmen).
            </p>
            <p>
              Die im Zusammenhang mit Terminbuchungen erhobenen Daten werden nur so lange gespeichert, wie dies für die Durchführung der Leistung und zur Erfüllung gesetzlicher Aufbewahrungspflichten erforderlich ist.
            </p>

            <h2 id="videotherapie">Videotherapie / Online-Sitzungen</h2>
            <p>
              Therapeutische Sitzungen können über einen datenschutzkonformen Videodienst durchgeführt werden.
            </p>
            <p>
              Die Kommunikation erfolgt verschlüsselt. Eine Aufzeichnung der Sitzungen erfolgt nicht.
            </p>
            <p>
              Die Verarbeitung der Daten erfolgt zur Durchführung der vereinbarten therapeutischen Leistung auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO.
            </p>
            <p>
              Soweit im Rahmen der therapeutischen Zusammenarbeit Gesundheitsdaten verarbeitet werden, erfolgt dies zusätzlich auf Grundlage von Art. 9 Abs. 2 lit. h DSGVO (Verarbeitung von Gesundheitsdaten im Rahmen therapeutischer Leistungen).
            </p>

            <h2 id="weitergabe">Weitergabe von Daten</h2>
            <p>Eine Weitergabe Ihrer personenbezogenen Daten an Dritte erfolgt grundsätzlich nicht, es sei denn:</p>
            <ul>
              <li>Sie haben ausdrücklich eingewilligt</li>
              <li>die Weitergabe ist gesetzlich vorgeschrieben</li>
              <li>sie ist zur Vertragsdurchführung erforderlich</li>
              <li>sie erfolgt im Rahmen einer Auftragsverarbeitung gemäß Art. 28 DSGVO</li>
            </ul>
            <p>
              Dienstleister, die im Rahmen der technischen Bereitstellung dieser Website tätig sind (z.&nbsp;B. Hostinganbieter), können Zugriff auf personenbezogene Daten erhalten, soweit dies zur Erbringung ihrer Leistungen erforderlich ist.
            </p>

            <h2 id="speicherdauer">Speicherdauer</h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie dies für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
            </p>
            <p>
              Gesetzliche Aufbewahrungsfristen können sich insbesondere aus steuerrechtlichen Vorschriften ergeben (z.&nbsp;B. 6 oder 10 Jahre).
            </p>
            <p>
              Nach Ablauf der jeweiligen Fristen werden die Daten gelöscht.
            </p>

            <h2 id="datensicherheit">Datensicherheit</h2>
            <p>
              Diese Website nutzt technische und organisatorische Sicherheitsmaßnahmen, um Ihre Daten vor Verlust, Manipulation oder unbefugtem Zugriff zu schützen.
            </p>
            <p>
              Die Datenübertragung über diese Website erfolgt verschlüsselt (SSL- bzw. TLS-Verschlüsselung).
            </p>

            <h2 id="ihre-rechte">Ihre Rechte</h2>
            <p>Sie haben nach der DSGVO folgende Rechte:</p>
            <ul>
              <li>Recht auf Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p>
              Darüber hinaus haben Sie das Recht, eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen.
            </p>

            <h2 id="beschwerderecht">Beschwerderecht bei einer Aufsichtsbehörde</h2>
            <p>
              Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
            </p>
            <p>Zuständige Aufsichtsbehörde in Berlin ist:</p>
            <p>
              Berliner Beauftragte für Datenschutz und Informationsfreiheit<br />
              Alt-Moabit 59–61<br />
              10555 Berlin
            </p>

            <h2 id="aenderungen">Änderungen dieser Datenschutzerklärung</h2>
            <p>
              Diese Datenschutzerklärung kann angepasst werden, wenn sich rechtliche Anforderungen oder das Angebot dieser Website ändern.
            </p>
            <p>
              Es gilt jeweils die aktuelle auf dieser Website veröffentlichte Fassung.
            </p>

            <h2 id="hosting">Hosting und Datenbank</h2>
            <p>Diese Website wird bei folgendem Anbieter gehostet:</p>
            <p>
              Host Europe GmbH<br />
              Hansestraße 111<br />
              51149 Köln<br />
              Deutschland
            </p>
            <p>
              Der Hostinganbieter stellt die technische Infrastruktur für den Betrieb der Website bereit. Dabei werden personenbezogene Daten verarbeitet, die beim Besuch der Website anfallen (z.&nbsp;B. IP-Adresse, Zugriffszeitpunkte, technische Informationen zum Browser).
            </p>
            <p>
              Darüber hinaus werden im Rahmen der Nutzung der Website eingegebene Daten (z.&nbsp;B. Kontaktdaten oder Terminbuchungen) in einer Datenbank gespeichert, die ebenfalls auf Servern des Hostinganbieters betrieben wird.
            </p>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren und zuverlässigen Bereitstellung der Website) sowie Art. 6 Abs. 1 lit. b DSGVO, soweit die Verarbeitung zur Durchführung eines Vertrags erforderlich ist.
            </p>
            <p>
              Mit dem Hostinganbieter besteht ein Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO.
            </p>

            <h2 id="therapie-de">Videotherapie über therapie.de</h2>
            <p>
              Online-Sitzungen können über den Videodienst von therapie.de durchgeführt werden.
            </p>
            <p>Betreiber der Plattform ist:</p>
            <p>
              therapie.de GmbH<br />
              Eppendorfer Weg 24<br />
              20259 Hamburg<br />
              Deutschland
            </p>
            <p>
              Wenn Sie an einer Videositzung teilnehmen, werden zur Durchführung der Kommunikation technische Verbindungsdaten verarbeitet. Dazu können insbesondere IP-Adresse, Zeitpunkt der Verbindung sowie technische Geräteinformationen gehören.
            </p>
            <p>
              Die Verarbeitung erfolgt ausschließlich zur Durchführung der vereinbarten therapeutischen Leistung.
            </p>
            <p>
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie — soweit Gesundheitsdaten betroffen sind — Art. 9 Abs. 2 lit. h DSGVO.
            </p>
            <p>
              Die Kommunikation erfolgt verschlüsselt. Eine Aufzeichnung der Sitzungen findet nicht statt.
            </p>
            <p>
              Weitere Informationen zur Datenverarbeitung durch therapie.de finden Sie in der Datenschutzerklärung des Anbieters.
            </p>

            <h2 id="amplitude">Webanalyse mit Amplitude</h2>
            <p>Diese Website verwendet Amplitude, einen Webanalysedienst der</p>
            <p>
              Amplitude Inc.<br />
              201 Third Street, Suite 200<br />
              San Francisco, CA 94103<br />
              USA
            </p>
            <p>
              Amplitude ermöglicht die Analyse des Nutzerverhaltens auf der Website, um das Angebot und die Benutzerfreundlichkeit zu verbessern.
            </p>
            <p>Dabei können unter anderem folgende Daten verarbeitet werden:</p>
            <ul>
              <li>besuchte Seiten</li>
              <li>Interaktionen mit der Website</li>
              <li>technische Informationen zum Endgerät und Browser</li>
              <li>anonymisierte oder pseudonymisierte Nutzungskennungen</li>
            </ul>
            <p>
              Die Nutzung von Amplitude erfolgt nur nach ausdrücklicher Einwilligung über das eingesetzte Cookie- bzw. Consent-Management-System.
            </p>
            <p>
              Rechtsgrundlage der Verarbeitung ist Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
            </p>
            <p>
              Die Einwilligung kann jederzeit über die Cookie-Einstellungen der Website widerrufen werden.
            </p>
            <p>
              Da Amplitude ein Unternehmen mit Sitz in den USA ist, kann eine Datenübermittlung in ein Drittland erfolgen. Diese erfolgt auf Grundlage der jeweils gültigen gesetzlichen Übermittlungsmechanismen gemäß Art. 44 ff. DSGVO.
            </p>
            <p>
              Weitere Informationen zur Datenverarbeitung durch Amplitude finden Sie in der Datenschutzerklärung des Anbieters.
            </p>

            <h2 id="gesundheitsdaten">Hinweis zu Gesundheitsdaten</h2>
            <p>
              Im Rahmen therapeutischer Leistungen können besondere Kategorien personenbezogener Daten im Sinne des Art. 9 DSGVO verarbeitet werden, insbesondere Gesundheitsdaten.
            </p>
            <p>
              Diese Daten werden ausschließlich verarbeitet, soweit dies zur Durchführung der therapeutischen Leistung erforderlich ist und unterliegen besonderen Vertraulichkeits- und Sicherheitsanforderungen.
            </p>

            <h2 id="zahlungsabwicklung">Zahlungsabwicklung</h2>
            <p>
              Für die Abwicklung von Zahlungen können externe Zahlungsdienstleister eingesetzt werden. Dabei werden die zur Zahlungsabwicklung erforderlichen Daten an den jeweiligen Anbieter übermittelt.
            </p>
            <p>
              Die Verarbeitung erfolgt zur Durchführung des Vertrags gemäß Art. 6 Abs. 1 lit. b DSGVO.
            </p>

            <h3>Zahlung via PayPal</h3>
            <p>Wenn Sie PayPal als Zahlungsmethode wählen, erfolgt die Zahlungsabwicklung über:</p>
            <p>
              PayPal (Europe) S.à r.l. et Cie, S.C.A.<br />
              22–24 Boulevard Royal<br />
              L-2449 Luxemburg
            </p>
            <p>
              Im Rahmen der Zahlungsabwicklung können personenbezogene Daten an PayPal übermittelt werden, insbesondere Name, E-Mail-Adresse, Zahlungsbetrag und Transaktionsdaten.
            </p>
            <p>
              Weitere Informationen zum Datenschutz bei PayPal finden Sie in der Datenschutzerklärung von PayPal.
            </p>

            <h3>Zahlung via Stripe</h3>
            <p>Für Kreditkarten- und andere Onlinezahlungen kann der Zahlungsdienstleister Stripe eingesetzt werden.</p>
            <p>
              Stripe Payments Europe Ltd.<br />
              1 Grand Canal Street Lower<br />
              Grand Canal Dock<br />
              Dublin<br />
              Irland
            </p>
            <p>
              Im Rahmen der Zahlungsabwicklung werden die für die Transaktion notwendigen Daten an Stripe übermittelt.
            </p>
            <p>
              Stripe kann Daten auch an verbundene Unternehmen in den USA übermitteln. Die Übermittlung erfolgt auf Grundlage der geltenden datenschutzrechtlichen Vorschriften für Drittlandübermittlungen gemäß Art. 44 ff. DSGVO.
            </p>
            <p>
              Weitere Informationen zur Datenverarbeitung durch Stripe finden Sie in der Datenschutzerklärung von Stripe.
            </p>

          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
