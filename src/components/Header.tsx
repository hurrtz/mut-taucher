import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import favicon from '/favicon.png';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: 'Über mich', href: '/#about' },
    { name: 'Leistungen', href: '/#services' },
    { name: 'Wissen', href: '/#articles' },
    { name: 'Kontakt', href: '/#contact' },
  ];

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 font-serif text-2xl text-primary font-bold">
              <img src={favicon} alt="Mut-Taucher Logo" className="h-7 w-7" />
              <span>Mut Taucher</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {links.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-text hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="/#booking"
                className="bg-primary hover:bg-teal-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                Termin buchen
              </a>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text hover:text-primary focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-text hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a
              href="/#booking"
              className="bg-primary text-white block px-3 py-2 rounded-md text-base font-medium mt-4 text-center"
              onClick={() => setIsOpen(false)}
            >
              Termin buchen
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
