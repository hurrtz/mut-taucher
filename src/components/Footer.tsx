import { Anchor, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-text text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div>
            <div className="flex items-center gap-2 font-serif text-2xl font-bold mb-4">
              <Anchor className="h-6 w-6 text-primary" />
              <span>Mut-Taucher</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Gemeinsam tauchen wir nach Ihrem Mut. Psychotherapie für ein selbstbestimmtes Leben in Balance.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Kontakt</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <a href="mailto:hallo@mut-taucher.de" className="hover:text-white transition-colors">hallo@mut-taucher.de</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <a href="tel:+491234567890" className="hover:text-white transition-colors">+49 123 456 7890</a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span>Online / Video-Sprechstunde</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Rechtliches</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
              <li><Link to="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">AGB</a></li>
            </ul>
          </div>
          
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Mut-Taucher. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
