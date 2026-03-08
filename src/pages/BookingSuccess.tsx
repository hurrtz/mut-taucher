import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { apiFetch } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function BookingSuccess() {
  useDocumentMeta({ title: 'Zahlung erfolgreich' });
  const [searchParams] = useSearchParams();
  const isPayPal = searchParams.get('paypal') === '1';
  const token = searchParams.get('token'); // PayPal order ID

  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(!isPayPal); // Stripe is already captured
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPayPal || !token || captured) return;

    setCapturing(true);
    apiFetch<{ message: string }>('/paypal/capture', {
      method: 'POST',
      body: JSON.stringify({ orderId: token }),
    })
      .then(() => setCaptured(true))
      .catch((e) => setError(e instanceof Error ? e.message : 'Zahlung konnte nicht abgeschlossen werden'))
      .finally(() => setCapturing(false));
  }, [isPayPal, token, captured]);

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {capturing ? (
            <>
              <Loader2 className="h-16 w-16 text-primary mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-serif font-bold text-text mb-4">Zahlung wird verarbeitet...</h1>
              <p className="text-gray-600 mb-2">Bitte warten Sie einen Moment.</p>
            </>
          ) : error ? (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-serif font-bold text-text mb-4">Fehler bei der Zahlung</h1>
              <p className="text-gray-600 mb-8">{error}</p>
              <Link to="/" className="inline-flex items-center px-6 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full transition-colors">
                Zurück zur Startseite
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
