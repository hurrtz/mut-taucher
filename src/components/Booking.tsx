import { useState, useEffect, type FormEvent } from 'react';
import { usePublicBooking, type PublicSlot } from '../lib/usePublicBooking';
import { format, startOfMonth, addMonths, isSameDay, isSameMonth, parseISO, startOfWeek, endOfWeek, endOfMonth, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function Booking() {
  const { slots, loading, error, booking, fetchSlots, bookSlot } = usePublicBooking();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '' });
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

  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !bookingForm.name || !bookingForm.email) return;

    const result = await bookSlot(
      selectedSlot.ruleId,
      selectedSlot.date,
      selectedSlot.time,
      bookingForm.name,
      bookingForm.email,
    );

    if (result) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedSlot(null);
        setBookingForm({ name: '', email: '' });
        // Refresh slots to reflect the booking
        fetchSlots(calendarStart, calendarEnd);
      }, 3000);
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
            Der erste Schritt ist oft der mutigste — wir begleiten Sie gerne.
            Finden Sie hier direkt einen passenden Termin für ein unverbindliches Erstgespräch.
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
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-primary transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                  className="px-2 py-0.5 text-xs font-medium text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                >
                  Heute
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-primary transition-colors">
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
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={i}
                      onClick={() => hasSlots && inCurrentMonth && setSelectedDate(day)}
                      disabled={!hasSlots || !inCurrentMonth}
                      className={`
                        relative p-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200 aspect-square
                        ${!inCurrentMonth ? 'text-gray-200 cursor-default' : ''}
                        ${inCurrentMonth && isSelected ? 'bg-primary text-white shadow-md transform scale-105 font-bold' : ''}
                        ${inCurrentMonth && !isSelected && hasSlots ? 'bg-teal-50 text-teal-800 font-semibold hover:bg-teal-100 cursor-pointer ring-1 ring-teal-200' : ''}
                        ${inCurrentMonth && !hasSlots && !isSelected ? 'text-gray-300 cursor-default' : ''}
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
              Wählen Sie ein Datum mit verfügbaren Terminen (markiert mit Punkt).
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
                <h3 className="text-xl font-bold text-gray-900">Termin bestätigt!</h3>
                <p className="text-gray-600">Vielen Dank, {bookingForm.name}.<br/>Eine Bestätigung wurde an {bookingForm.email} gesendet.</p>
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
                            onClick={() => setSelectedSlot(slot)}
                            className={`
                              px-4 py-2 rounded-md text-sm font-medium border transition-all flex flex-col items-center justify-center gap-0.5
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

                {selectedSlot && (
                  <form onSubmit={handleBook} className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        id="name"
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border"
                        value={bookingForm.name}
                        onChange={e => setBookingForm({...bookingForm, name: e.target.value})}
                        placeholder="Ihr Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                      <input
                        type="email"
                        id="email"
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 px-3 py-2 border"
                        value={bookingForm.email}
                        onChange={e => setBookingForm({...bookingForm, email: e.target.value})}
                        placeholder="ihre@email.de"
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={booking}
                      className="w-full py-3 px-6 bg-secondary hover:bg-rose-600 text-white font-semibold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {booking && <Loader2 className="h-5 w-5 animate-spin" />}
                      Termin jetzt buchen
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
