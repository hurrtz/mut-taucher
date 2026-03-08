import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { XCircle } from 'lucide-react';

export default function BookingCancelled() {
  useDocumentMeta({ title: 'Zahlung abgebrochen' });

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-serif font-bold text-text mb-4">Zahlung abgebrochen</h1>
          <p className="text-gray-600 mb-2">
            Die Zahlung wurde nicht abgeschlossen. Ihr Termin wurde nicht bestätigt.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Sie können es jederzeit erneut versuchen.
          </p>
          <Link to="/#booking" className="inline-flex items-center px-6 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full transition-colors">
            Erneut buchen
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
