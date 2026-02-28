import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ueberMich1 from '@/assets/ueber-mich-1.jpg';
import ueberMich2 from '@/assets/ueber-mich-2.jpg';
import ueberMich3 from '@/assets/ueber-mich-3.jpg';
import ueberMich4 from '@/assets/ueber-mich-4.jpg';
import { ArrowLeft } from 'lucide-react';

export default function UeberMich() {
  useDocumentMeta(
    'Über mich — Mut-Taucher',
    'Erfahren Sie mehr über mich, meinen Werdegang und meinen therapeutischen Ansatz.',
  );

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/#about" className="inline-flex items-center text-gray-500 hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Startseite
          </Link>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-text mb-8">Über mich</h1>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src={ueberMich1} alt="Portrait 1" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src={ueberMich2} alt="Portrait 2" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src={ueberMich3} alt="Portrait 3" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text">
            <p>
              Schon während meines Psychologiestudiums durfte ich im Rahmen eines Praktikums meine erste psychologische Gruppe leiten. Damals begleitete ich junge Mädchen, die über Herausforderungen mit Eltern, Schule und den Veränderungen der Pubertät sprechen wollten.
            </p>

            <p>
              Mich hat tief berührt zu erleben, wie sich Schritt für Schritt eine vertrauensvolle, offene und empathische Atmosphäre entwickelte — getragen von gegenseitigem Verständnis und gemeinsamer Erfahrung. In dieser Zeit entstand meine Begeisterung für die Arbeit mit Gruppen. Seitdem sind therapeutische Gruppen ein fester Bestandteil meines beruflichen Weges geblieben.
            </p>

            <p>
              Im Laufe meiner Tätigkeit konnte ich vielfältige Erfahrungen mit Jugendlichen, Familien und Erwachsenen sammeln. Besonders prägend war für mich dabei immer wieder die Erkenntnis, wie sehr unsere Beziehungen zu anderen Menschen unsere Lebenszufriedenheit beeinflussen. Aus diesem Grund habe ich die Ausbildung zur systemischen Therapeutin absolviert. Der systemische Ansatz bildet heute das Fundament meiner Arbeit.
            </p>

            <p>
              Ergänzend fließen in meine therapeutische Arbeit auch Elemente aus der Verhaltenstherapie sowie der tiefenpsychologisch fundierten Therapie ein. Diese Kombination ermöglicht es mir, Menschen individuell, ressourcenorientiert und zugleich strukturiert zu begleiten.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-xl my-10">
            <img src={ueberMich4} alt="Therapeutin bei der Arbeit" className="w-full h-80 object-cover" />
          </div>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text">
            <h2>Erfahrungsschwerpunkte in der Arbeit mit Erwachsenengruppen</h2>
            <ul>
              <li>Begleitung von langzeitarbeitslosen Menschen auf dem Weg zurück in eine berufliche Tätigkeit</li>
              <li>Coaching von Pflegekräften zur Stärkung psychischer Gesundheit und Selbstfürsorge</li>
              <li>Therapie von Menschen mit Suchterkrankungen im Rahmen ambulanter Rehabilitation</li>
              <li>Therapie und Beratung zur Verbesserung der Fahrfähigkeit, insbesondere im Umgang mit Alkohol</li>
              <li>Vorbereitungskurse auf die Medizinisch-Psychologische Untersuchung (MPU)</li>
            </ul>

            <p>
              Ich empfinde es als große Bereicherung, Menschen auf ihrem Weg weg von Leidensdruck und Belastung hin zu mehr Lebenszufriedenheit, Selbstwirksamkeit und Selbstannahme zu begleiten. Eine verständliche Psychoedukation ist dabei für mich ein zentraler Bestandteil, um Zusammenhänge transparent zu machen und nachhaltige Veränderung zu unterstützen.
            </p>

            <p>
              Gerne begleite und unterstütze ich auch Sie auf Ihrem persönlichen Weg.
            </p>

            <h2>Häufige Themen meiner Arbeit</h2>
            <div className="not-prose grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {[
                'Persönlichkeitsentwicklung', 'Alkohol', 'Sucht', 'Drogen',
                'Selbstwert', 'Frustrationstoleranz', 'Depression', 'Ängste',
                'Trauma', 'Erziehung', 'Entwicklung über die Lebensspanne',
                'Frühkindliche Entwicklung', 'Selbstfürsorge', 'Achtsamkeit',
                'Beziehungsfähigkeit', 'Burnout', 'Lernen „Nein" zu sagen',
              ].map((topic) => (
                <span
                  key={topic}
                  className="px-4 py-2 bg-primary/10 text-text rounded-full text-sm text-center"
                >
                  {topic}
                </span>
              ))}
              <span className="px-4 py-2 text-gray-400 text-sm text-center">…</span>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-serif font-bold text-text mb-8">Werdegang</h2>
            <div className="space-y-0 border-l-2 border-primary/30 ml-2">
              {[
                { year: 'seit Aug. 2022', title: 'Verkehrspsychologin gem. Anl. 15 FeV', desc: 'Durchführung von Kursen nach §70 und §36 FeV; Beratung und Therapie von Menschen mit Suchterkrankungen, Verhaltensauffälligkeiten und/oder Impulsivitätsstörungen', tag: 'Berufserfahrung' },
                { year: '2022', title: 'Verkehrspsychologin gem. Anl. 15 FeV', desc: 'DEKRA Akademie GmbH (MPD)', tag: 'Weiterbildung' },
                { year: '2022—2023', title: 'Psychologin im betrieblichen Gesundheitsmanagement', desc: 'Durchführung von Workshops zur Verbesserung der psychischen Gesundheit mit Pflegekräften', tag: 'Berufserfahrung' },
                { year: '2020—2021', title: 'Ambulante Familienhilfe und Familientherapie', desc: 'Beratung und Therapie mit Familien zur Stärkung der Erziehungsfähigkeit und Vermeidung von Kindeswohlgefährdung', tag: 'Berufserfahrung' },
                { year: '2020', title: 'Durchführung von Workshops', desc: 'Thema Interkulturelle Desensibilisierung für Angestellte der Deutschen Bahn', tag: 'Berufserfahrung' },
                { year: '2019—2022', title: 'Systemische Therapeutin (DGSF zertifiziert)', desc: 'Systematisches Zentrum WISPO AG, Berlin', tag: 'Ausbildung' },
                { year: '2019', title: 'Psychologischer Coach', desc: 'Projekt der Deutschen Bahn zur Qualifizierung und Integration von Arbeitslosen in den Arbeitsmarkt', tag: 'Berufserfahrung' },
                { year: '2018—2020', title: 'Bildungsbegleiterin im Projekt „Einsteigen…!"', desc: 'Mit dem Ticket Schulabschluss in deine berufliche Zukunft — Begleitung, Beratung und Unterricht für schwierige Jugendliche, die ihren Schulabschluss nachholen wollen', tag: 'Berufserfahrung' },
                { year: '2018', title: 'Kursleiterin Autogenes Training', desc: null, tag: 'Weiterbildung' },
                { year: '2017—2018', title: 'Co-Therapeutin', desc: 'Bei Familien-, Eltern- und Paargesprächen, sowie bei Gruppenpsychotherapien für Kinder und Jugendliche', tag: 'Berufserfahrung' },
                { year: '2017', title: 'Erziehungs- und Familienberatung (EFB)', desc: null, tag: 'Praktikum' },
                { year: '2015—2018', title: 'M. Sc. Psychologie, Schwerpunkt Kognitive Neurowissenschaften', desc: 'Otto-von-Guericke-Universität Magdeburg', tag: 'Studium' },
                { year: '2015', title: 'Talk, talk, talk and more', desc: 'Ein Kommunikations- und Kompetenztraining für Jugendliche (TTT)', tag: 'Weiterbildung' },
                { year: '2015', title: 'Klinik für Psychiatrie und Psychotherapie', desc: null, tag: 'Praktikum' },
                { year: '2014', title: 'Sabine Lück, Psychologische Psychotherapeutin und Kinder- und Jugendlichentherapeutin', desc: null, tag: 'Praktikum' },
                { year: '2013—2014', title: 'Generation-Code-Beraterin', desc: null, tag: 'Weiterbildung' },
                { year: '2012—2015', title: 'B. Sc. Psychologie', desc: 'Technische Universität Braunschweig', tag: 'Studium' },
                { year: '2008—2012', title: 'Kita, Schulkindergarten und Förderschule im Landkreis Peine', desc: null, tag: 'Praktika' },
                { year: '2010—2012', title: 'Staatlich anerkannte Erzieherin', desc: 'Herman-Nohl-Schule, Hildesheim', tag: 'Ausbildung' },
                { year: '2008—2010', title: 'Staatlich anerkannte Sozialassistentin', desc: 'Herman-Nohl-Schule, Hildesheim', tag: 'Ausbildung' },
              ].map((item, i) => (
                <div key={i} className="relative pl-8 pb-8 last:pb-0">
                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                    <span className="text-sm font-mono text-gray-400 whitespace-nowrap">{item.year}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.tag === 'Berufserfahrung' ? 'bg-primary/10 text-primary' :
                      item.tag === 'Ausbildung' || item.tag === 'Studium' ? 'bg-secondary/10 text-secondary' :
                      item.tag === 'Weiterbildung' ? 'bg-accent/10 text-accent' :
                      'bg-gray-100 text-gray-500'
                    }`}>{item.tag}</span>
                  </div>
                  <h3 className="text-base font-semibold text-text">{item.title}</h3>
                  {item.desc && <p className="text-sm text-gray-500 mt-1">{item.desc}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-primary/5 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold text-text mb-2">Interesse geweckt?</h3>
              <p className="text-gray-600 mb-6">
                Vereinbaren Sie jetzt einen Termin — ich freue mich darauf, Sie kennenzulernen.
              </p>
              <Link
                to="/#booking"
                className="inline-block px-6 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full transition-colors shadow-md"
              >
                Termin vereinbaren
              </Link>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
