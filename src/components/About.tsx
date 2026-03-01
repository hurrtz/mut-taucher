import { Award, Compass, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import aboutImage from '@/assets/about.jpg';

export default function About() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          
          <div className="relative mb-12 lg:mb-0">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <Link to="/ueber-mich" className="block relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 transform md:rotate-2 md:hover:rotate-0 hover:scale-105 transition-all duration-500 cursor-pointer">
              <img
                src={aboutImage}
                alt="Portrait der Therapeutin"
                className="w-full h-full object-cover"
              />
            </Link>
          </div>

          <div>
            <h2 className="text-3xl font-serif font-bold text-text mb-6 relative">
              <span className="relative z-10">Über mich</span>
              <span className="absolute bottom-1 left-0 w-24 h-3 bg-secondary/20 -z-0 transform -rotate-2"></span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Willkommen bei Mut-Taucher. Ich bin Systemische Therapeutin aus Leidenschaft und begleite Menschen auf ihrem Weg zu mehr innerer Stärke und Klarheit.
            </p>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              In meiner Arbeit lege ich großen Wert auf einen geschützten Raum, in dem Sie so sein dürfen, wie Sie sind. Mit meiner Erfahrung unterstütze ich Sie dabei, schwierige Lebensphasen zu meistern und neue Perspektiven zu entwickeln.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text">Empathisch</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Ein wertschätzender und respektvoller Umgang auf Augenhöhe ist für mich selbstverständlich.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <Compass className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text">Lösungsorientiert</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Wir blicken nicht nur zurück, sondern vor allem nach vorne, um konkrete Veränderungen zu bewirken.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow sm:col-span-2">
                <div className="flex-shrink-0">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text">Fundiert</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Meine Arbeit basiert auf wissenschaftlich anerkannten Methoden und langjähriger Erfahrung.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center lg:text-left">
              <Link
                to="/ueber-mich"
                className="inline-block px-6 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full transition-colors shadow-md"
              >
                Mehr erfahren
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
