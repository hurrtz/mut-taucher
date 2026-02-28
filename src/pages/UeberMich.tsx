import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import aboutImage from '@/assets/about.jpg';
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

          <div className="rounded-2xl overflow-hidden shadow-xl mb-10">
            <img
              src={aboutImage}
              alt="Portrait der Therapeutin"
              className="w-full h-80 object-cover"
            />
          </div>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text">
            <p>
              Willkommen bei Mut-Taucher. Ich bin Psychotherapeutin aus Leidenschaft und begleite
              Menschen auf ihrem Weg zu mehr innerer Stärke und Klarheit.
            </p>

            <h2>Mein Werdegang</h2>
            <p>
              Nach meinem Studium der Psychologie habe ich mich intensiv in verschiedenen
              therapeutischen Verfahren weitergebildet. Durch meine langjährige Erfahrung in
              unterschiedlichen klinischen und ambulanten Settings bringe ich ein breites
              Spektrum an Fachwissen mit, das mir erlaubt, individuell auf die Bedürfnisse
              meiner Klient:innen einzugehen.
            </p>

            <h2>Mein therapeutischer Ansatz</h2>
            <p>
              In meiner Arbeit lege ich großen Wert auf einen geschützten Raum, in dem Sie so
              sein dürfen, wie Sie sind. Mein Ansatz ist lösungsorientiert und basiert auf
              wissenschaftlich anerkannten Methoden. Gemeinsam blicken wir nicht nur zurück,
              sondern vor allem nach vorne, um konkrete Veränderungen in Ihrem Leben zu bewirken.
            </p>

            <h2>Was mir wichtig ist</h2>
            <p>
              Ein wertschätzender und respektvoller Umgang auf Augenhöhe ist für mich
              selbstverständlich. Ich glaube daran, dass jeder Mensch die Ressourcen in sich
              trägt, die er braucht — manchmal braucht es nur die richtige Begleitung, um sie
              zu entdecken. Genau dabei möchte ich Sie unterstützen.
            </p>
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
