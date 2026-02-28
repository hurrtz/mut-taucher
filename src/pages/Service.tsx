import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { services } from '../lib/data';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import GroupAd from '../components/GroupAd';

export default function Service() {
  const { slug } = useParams();
  const service = services.find((s) => s.slug === slug);

  useDocumentMeta(
    service ? `${service.title} — Mut-Taucher` : 'Nicht gefunden — Mut-Taucher',
    service?.metaDescription,
  );

  if (!service) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Seite nicht gefunden</h1>
            <Link to="/" className="text-primary hover:underline">Zurück zur Startseite</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/#services" className="inline-flex items-center text-gray-500 hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Link>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-text mb-6">{service.title}</h1>

          {service.image && (
            <div className="rounded-2xl overflow-hidden shadow-xl mb-10">
              <img src={service.image} alt={service.title} className="w-full h-80 object-cover" />
            </div>
          )}

          {slug === 'gruppentherapie' && <GroupAd />}

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text prose-a:text-primary hover:prose-a:text-teal-600">
            <ReactMarkdown>{service.content.replace(/^\s*#\s+.+\n+/, '')}</ReactMarkdown>
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
