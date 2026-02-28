import { useState } from 'react';
import { getConsent, setConsent } from '../lib/consent';
import { initAnalytics } from '../lib/analytics';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(getConsent() === 'undecided');

  if (!visible) return null;

  function accept() {
    setConsent('accepted');
    initAnalytics();
    setVisible(false);
  }

  function decline() {
    setConsent('declined');
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 py-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Wir verwenden Cookies zur Analyse der Websitenutzung. Weitere Informationen finden Sie in unserer{' '}
          <a href="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</a>.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full transition-colors"
          >
            Ablehnen
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-teal-500 rounded-full transition-colors"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
