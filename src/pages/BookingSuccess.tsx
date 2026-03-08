import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CheckCircle } from 'lucide-react';

export default function BookingSuccess() {
  useDocumentMeta({ title: 'Zahlung erfolgreich' });

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-serif font-bold text-text mb-4">Zahlung erfolgreich!</h1>
          <p className="text-gray-600 mb-2">
            Vielen Dank — Ihr Termin ist nun bestätigt.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Sie erhalten in Kürze eine Bestätigung per E-Mail mit allen Details.
          </p>
          <Link to="/" className="inline-flex items-center px-6 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full transition-colors">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
