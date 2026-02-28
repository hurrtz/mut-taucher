import { useState } from 'react';
import { CheckCircle, AlertCircle, Send } from 'lucide-react';
import { apiFetch } from '../lib/api';
import contactImage from '@/assets/contact.jpg';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function Contact() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('submitting');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      ...Object.fromEntries(fd),
      sendCopy: fd.has('sendCopy'),
    };

    try {
      await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setFormState('success');
      form.reset();
    } catch {
      setFormState('error');
      setErrorMessage('Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.');
    }
  }

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-slate-50 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl font-serif">
            Kontakt
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Schreiben Sie mir — ich melde mich zeitnah bei Ihnen.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div className="hidden lg:block">
            <img
              src={contactImage}
              alt="Kontakt aufnehmen"
              className="rounded-2xl shadow-2xl border-4 border-white/50 w-full object-cover"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
            {formState === 'success' ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text mb-2">Nachricht gesendet!</h3>
                <p className="text-gray-500">
                  Vielen Dank für Ihre Nachricht. Ich melde mich so schnell wie möglich bei Ihnen.
                </p>
                <button
                  type="button"
                  onClick={() => setFormState('idle')}
                  className="mt-6 text-primary hover:text-teal-600 font-medium transition-colors"
                >
                  Weitere Nachricht senden
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {formState === 'error' && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail *
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Nachricht *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors resize-y"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    name="sendCopy"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                  />
                  Kopie an meine E-Mail-Adresse senden
                </label>

                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors shadow-md"
                >
                  {formState === 'submitting' ? (
                    'Wird gesendet...'
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Nachricht senden
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
