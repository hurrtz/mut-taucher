import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { articles } from '../lib/data';

export default function Articles() {
  return (
    <section id="articles" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-bold text-text mb-4">Wissen & Ressourcen</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Informationen zu häufigen Themen. Ein erster Schritt ist oft das Verstehen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-text mb-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <Link 
                  to={`/wissen/${article.slug}`}
                  className="inline-flex items-center text-primary font-medium hover:text-teal-600 transition-colors"
                >
                  Weiterlesen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
