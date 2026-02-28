import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { articles } from '../lib/data';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import JsonLd, { articleData } from '../components/JsonLd';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';

export default function Article() {
  const { slug } = useParams();
  const article = articles.find((a) => a.slug === slug);

  useDocumentMeta({
    title: article ? `${article.title} — Mut-Taucher` : 'Nicht gefunden — Mut-Taucher',
    description: article?.metaDescription,
    canonical: article ? `${BASE_URL}/wissen/${article.slug}` : undefined,
    ogType: 'article',
  });

  const ldData = useMemo(
    () => article ? articleData(article) : null,
    [article],
  );

  if (!article) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Artikel nicht gefunden</h1>
            <Link to="/" className="text-primary hover:underline">Zurück zur Startseite</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {ldData && <JsonLd data={ldData} />}
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Link>

          <img
            src={article.image}
            alt={article.title}
            className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg mb-8"
          />

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-text mb-6">{article.title}</h1>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-text prose-a:text-primary hover:prose-a:text-teal-600">
            <ReactMarkdown>{article.content.replace(/^\s*#\s+.+\n+/, '')}</ReactMarkdown>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-primary/5 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold text-text mb-2">Haben Sie Fragen zu diesem Thema?</h3>
              <p className="text-gray-600 mb-6">
                Gerne können wir in einem persönlichen Gespräch darüber sprechen, wie ich Sie unterstützen kann.
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
