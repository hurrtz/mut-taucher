import { useState, useEffect, type FormEvent } from 'react';
import { usePublicBooking, type PublicSlot, type BankDetails } from '../lib/usePublicBooking';
import { format, startOfMonth, addMonths, isSameDay, isSameMonth, parseISO, startOfWeek, endOfWeek, endOfMonth, eachDayOfInterval, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { trackBookingDateSelected, trackBookingSlotSelected, trackBookingSubmitted } from '../lib/analytics';
import { validateEmail, validatePhone } from '../lib/validation';

export default function Booking() {
  const { slots, loading, error, booking, fetchSlots, bookSlot } = usePublicBooking();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [bookingForm, setBookingForm] = useState({ firstName: '', lastName: '', email: '', phone: '', street: '', zip: '', city: '', message: '' });
  const [consent, setConsent] = useState({ agb: false, datenschutz: false, widerruf: false });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string | null; phone?: string | null }>({});
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'wire_transfer'>('wire_transfer');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch slots when calendar range changes
  useEffect(() => {
    fetchSlots(calendarStart, calendarEnd);
  }, [fetchSlots, calendarStart.getTime(), calendarEnd.getTime()]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

  const allConsented = consent.agb && consent.datenschutz && consent.widerruf;

  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(bookingForm.email);
    const phoneErr = validatePhone(bookingForm.phone);
    if (emailErr || phoneErr) {
      setFieldErrors({ email: emailErr, phone: phoneErr });
      return;
    }
    if (!selectedSlot || !bookingForm.firstName || !bookingForm.lastName || !bookingForm.email || !bookingForm.phone || !bookingForm.street || !bookingForm.zip || !bookingForm.city || !allConsented) return;

    const result = await bookSlot(
      { ruleId: selectedSlot.ruleId, eventId: selectedSlot.eventId },
      selectedSlot.date,
      selectedSlot.time,
      bookingForm.firstName,
      bookingForm.lastName,
      bookingForm.email,
      bookingForm.phone,
      bookingForm.street,
      bookingForm.zip,
      bookingForm.city,
      paymentMethod,
      bookingForm.message || undefined,
    );

    if (result) {
      trackBookingSubmitted(selectedSlot.date, selectedSlot.time);

      // Stripe: redirect to hosted checkout
      if (result.stripeCheckoutUrl) {
        window.location.href = result.stripeCheckoutUrl;
        return;
      }

      // PayPal: redirect to PayPal approval
      if (result.paypalApprovalUrl) {
        window.location.href = result.paypalApprovalUrl;
        return;
      }

      // Wire transfer: show bank details
      setBankDetails(result.bankDetails ?? null);
      setSelectedSlot(null);
      setIsSuccess(true);
      setConsent({ agb: false, datenschutz: false, widerruf: false });
      void fetchSlots(calendarStart, calendarEnd, { silent: true });
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min.`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
  };

  return (
    <section id="booking" className="relative py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-teal-50 to-primary/10 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse [animation-delay:4s]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-text mb-4">Termin vereinbaren</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Der erste Schritt ist oft der mutigste — ich begleite Sie gerne.
            Finden Sie hier direkt einen passenden Termin für Ihr Erstgespräch.
          </p>
          <p className="mt-3 text-sm text-gray-400 max-w-2xl mx-auto">
            Erstgespräch (50 Minuten) — 95,00 €. Kostenfreie Absage bis 48 Stunden vor dem Termin.
            Bei späterer Absage oder Nichterscheinen wird das Honorar als Ausfallhonorar berechnet.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden md:flex">
          {/* Calendar Section */}
          <div className="p-10 md:w-1/2 border-r border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </h3>
              <div className="flex items-center space-x-2">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-primary transition-colors cursor-pointer">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                  className="px-2 py-0.5 text-xs font-medium text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  Heute
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-primary transition-colors cursor-pointer">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                <div key={d} className="text-xs font-medium text-gray-400 uppercase">{d}</div>
              ))}
            </div>

            {loading && slots.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const inCurrentMonth = isSameMonth(day, currentMonth);
                  const daySlots = slots.filter(s => isSameDay(parseISO(s.date), day));
                  const hasSlots = daySlots.length > 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isPast = isBefore(day, startOfDay(new Date()));
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (hasSlots && inCurrentMonth && !isPast) {
                          setSelectedDate(day);
                          trackBookingDateSelected(format(day, 'yyyy-MM-dd'));
                        }
                      }}
                      disabled={!hasSlots || !inCurrentMonth || isPast}
                      className={`
                        relative p-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200 aspect-square
                        ${!inCurrentMonth ? 'text-gray-200 cursor-default' : ''}
                        ${inCurrentMonth && isSelected ? 'bg-primary text-white shadow-md transform scale-105 font-bold' : ''}
                        ${inCurrentMonth && !isSelected && hasSlots && !isPast ? 'bg-teal-50 text-teal-800 font-semibold hover:bg-teal-100 cursor-pointer ring-1 ring-teal-200' : ''}
                        ${inCurrentMonth && (!hasSlots || isPast) && !isSelected ? 'text-gray-300 cursor-default' : ''}
                        ${isToday && !isSelected ? 'ring-1 ring-gray-400 ring-inset' : ''}
                      `}
                    >
                      <span className="text-sm">
                        {format(day, 'd')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <p className="mt-6 text-xs text-gray-400 text-center">
              Wählen Sie ein hervorgehobenes Datum, um verfügbare Termine zu sehen.
            </p>
          </div>

          {/* Slots & Form Section */}
          <div className="p-10 md:w-1/2 bg-gray-50/50">
            {!selectedDate ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
                <CalendarIcon className="h-12 w-12 text-gray-300" />
                <p>Wählen Sie links ein Datum aus, um freie Zeiten zu sehen.</p>
              </div>
            ) : isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Termin reserviert!</h3>
                {bankDetails ? (
                  <div className="space-y-3">
                    <p className="text-gray-600">Bitte überweisen Sie den Betrag, um Ihren Termin zu bestätigen:</p>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-left space-y-1.5">
                      <p><strong>Empfänger:</strong> {bankDetails.accountHolder}</p>
                      <p><strong>IBAN:</strong> {bankDetails.iban}</p>
                      <p><strong>BIC:</strong> {bankDetails.bic}</p>
                      <p><strong>Bank:</strong> {bankDetails.bankName}</p>
                      <p><strong>Betrag:</strong> {bankDetails.amount}</p>
                      <p><strong>Verwendungszweck:</strong> {bankDetails.reference}</p>
                    </div>
                    <p className="text-xs text-gray-400">Eine Bestätigung wurde an {bookingForm.email} gesendet.</p>
                  </div>
                ) : (
                  <p className="text-gray-600">Zahlung erfolgreich. Eine Bestätigung wurde an {bookingForm.email} gesendet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-text mb-4">
                    Verfügbare Zeiten am {format(selectedDate, 'd. MMMM', { locale: de })}
                  </h3>
                  {(() => {
                    const daySlots = slots
                      .filter(s => isSameDay(parseISO(s.date), selectedDate))
                      .sort((a, b) => a.time.localeCompare(b.time));

                    if (daySlots.length === 0) {
                      return (
                        <p className="text-gray-400 text-sm">Keine verfügbaren Zeiten an diesem Tag.</p>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 gap-3">
                        {daySlots.map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => {
                              setSelectedSlot(slot);
                              trackBookingSlotSelected(slot.date, slot.time);
                            }}
                            className={`
                              px-4 py-2 rounded-md text-sm font-medium border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer
                              ${selectedSlot?.id === slot.id
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}
                            `}
                          >
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {slot.time} Uhr
                            </span>
                            <span className={`text-xs ${selectedSlot?.id === slot.id ? 'text-white/80' : 'text-gray-400'}`}>
                              {formatDuration(slot.durationMinutes)}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlot && !isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSlot(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-serif font-bold text-text">Erstgespräch buchen</h3>
              <button onClick={() => setSelectedSlot(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {/* 1. Terminübersicht */}
              <div className="bg-teal-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Leistung</span>
                  <span className="font-medium text-text">Erstgespräch ({formatDuration(selectedSlot.durationMinutes)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preis</span>
                  <span className="font-medium text-text">95,00 €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Termin</span>
                  <span className="font-medium text-text">{format(parseISO(selectedSlot.date), 'EEEE, d. MMMM yyyy', { locale: de })}, {selectedSlot.time} Uhr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zahlung</span>
                  <span className="font-medium text-text">Im Voraus</span>
                </div>
              </div>

              <form onSubmit={handleBook} className="space-y-4">
                {/* 2. Persönliche Angaben */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-firstName" className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
                    <input
                      type="text"
                      id="modal-firstName"
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border"
                      value={bookingForm.firstName}
                      onChange={e => setBookingForm({...bookingForm, firstName: e.target.value})}
                      placeholder="Vorname"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-lastName" className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
                    <input
                      type="text"
                      id="modal-lastName"
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border"
                      value={bookingForm.lastName}
                      onChange={e => setBookingForm({...bookingForm, lastName: e.target.value})}
                      placeholder="Nachname"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
                  <input
                    type="email"
                    id="modal-email"
                    required
                    className={`w-full rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border ${fieldErrors.email ? 'border-red-400' : 'border-gray-300'}`}
                    value={bookingForm.email}
                    onChange={e => { setBookingForm({...bookingForm, email: e.target.value}); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: validateEmail(e.target.value) })); }}
                    onBlur={e => setFieldErrors(p => ({ ...p, email: validateEmail(e.target.value) }))}
                    placeholder="ihre@email.de"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label htmlFor="modal-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    id="modal-phone"
                    required
                    className={`w-full rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border ${fieldErrors.phone ? 'border-red-400' : 'border-gray-300'}`}
                    value={bookingForm.phone}
                    onChange={e => { setBookingForm({...bookingForm, phone: e.target.value}); if (fieldErrors.phone) setFieldErrors(p => ({ ...p, phone: validatePhone(e.target.value) })); }}
                    onBlur={e => setFieldErrors(p => ({ ...p, phone: validatePhone(e.target.value) }))}
                    placeholder="+49 …"
                  />
                  {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="modal-street" className="block text-sm font-medium text-gray-700 mb-1">Straße und Hausnummer *</label>
                  <input
                    type="text"
                    id="modal-street"
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border"
                    value={bookingForm.street}
                    onChange={e => setBookingForm({...bookingForm, street: e.target.value})}
                    placeholder="Musterstraße 1"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="modal-zip" className="block text-sm font-medium text-gray-700 mb-1">PLZ *</label>
                    <input
                      type="text"
                      id="modal-zip"
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border"
                      value={bookingForm.zip}
                      onChange={e => setBookingForm({...bookingForm, zip: e.target.value})}
                      placeholder="10115"
                    />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="modal-city" className="block text-sm font-medium text-gray-700 mb-1">Ort *</label>
                    <input
                      type="text"
                      id="modal-city"
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border"
                      value={bookingForm.city}
                      onChange={e => setBookingForm({...bookingForm, city: e.target.value})}
                      placeholder="Berlin"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="modal-message" className="block text-sm font-medium text-gray-700 mb-1">Kurze Nachricht oder Anliegen <span className="font-normal text-gray-400">(optional)</span></label>
                  <textarea
                    id="modal-message"
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border resize-none"
                    value={bookingForm.message}
                    onChange={e => setBookingForm({...bookingForm, message: e.target.value})}
                    placeholder="Was beschäftigt Sie derzeit?"
                  />
                </div>

                {/* 3. Zahlungsart */}
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-gray-700">Zahlungsart *</legend>
                  {/* Stripe and PayPal temporarily disabled
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-primary bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMethod" value="stripe" checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      className="text-primary focus:ring-primary" />
                    <div>
                      <span className="text-sm font-medium text-text">Kreditkarte / Online-Zahlung</span>
                      <span className="block text-xs text-gray-400">Sichere Zahlung über Stripe</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-primary bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMethod" value="paypal" checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="text-primary focus:ring-primary" />
                    <div>
                      <span className="text-sm font-medium text-text">PayPal</span>
                      <span className="block text-xs text-gray-400">Sichere Zahlung über PayPal</span>
                    </div>
                  </label>
                  */}
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'wire_transfer' ? 'border-primary bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMethod" value="wire_transfer" checked={paymentMethod === 'wire_transfer'}
                      onChange={() => setPaymentMethod('wire_transfer')}
                      className="text-primary focus:ring-primary" />
                    <div>
                      <span className="text-sm font-medium text-text">Überweisung</span>
                      <span className="block text-xs text-gray-400">Bankdaten werden nach der Buchung angezeigt</span>
                    </div>
                  </label>
                </fieldset>

                {/* 4. Zahlungsinformation */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 leading-relaxed space-y-2">
                  <p><strong className="text-gray-600">Hinweis:</strong> Termine können bis 48&nbsp;Stunden vorher kostenfrei abgesagt werden. Danach fällt ein Ausfallhonorar an.</p>
                </div>

                {/* 4. Rechtliche Checkboxen */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.agb}
                      onChange={e => setConsent({...consent, agb: e.target.checked})}
                      className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">
                      Ich habe die{' '}
                      <a href="/agb" target="_blank" className="text-primary underline hover:text-teal-600">Behandlungsbedingungen einschließlich der Ausfallregelung</a>{' '}
                      gelesen und akzeptiere sie. *
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.datenschutz}
                      onChange={e => setConsent({...consent, datenschutz: e.target.checked})}
                      className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">
                      Ich habe die{' '}
                      <a href="/datenschutz" target="_blank" className="text-primary underline hover:text-teal-600">Datenschutzerklärung</a>{' '}
                      zur Kenntnis genommen. *
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.widerruf}
                      onChange={e => setConsent({...consent, widerruf: e.target.checked})}
                      className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">
                      Ich verlange ausdrücklich, dass die Dienstleistung bereits vor Ablauf der Widerrufsfrist beginnt. Mir ist bekannt, dass mein Widerrufsrecht mit vollständiger Vertragserfüllung erlischt. *
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* 5. Kostenpflichtiger Buchungsbutton */}
                <button
                  type="submit"
                  disabled={booking || !allConsented}
                  className="w-full py-3 px-6 bg-primary hover:bg-teal-500 text-white font-semibold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {booking && <Loader2 className="h-5 w-5 animate-spin" />}
                  Kostenpflichtig buchen
                </button>

                {/* 6. Hinweis unter dem Button */}
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Mit der Buchung entsteht ein kostenpflichtiger Vertrag über ein Erstgespräch ({formatDuration(selectedSlot.durationMinutes)}) zum Preis von 95,00&nbsp;€.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
