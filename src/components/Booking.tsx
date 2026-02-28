import { useState, type FormEvent } from 'react';
import { useBooking } from '../lib/useBooking';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import type { Slot } from '../lib/data';

export default function Booking() {
  const { slots, bookSlot } = useBooking();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  const availableSlots = slots.filter(s => s.available);

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  const handleBook = (e: FormEvent) => {
    e.preventDefault();
    if (selectedSlot && bookingForm.name && bookingForm.email) {
      bookSlot(selectedSlot.id, bookingForm.name, bookingForm.email);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedSlot(null);
        setBookingForm({ name: '', email: '' });
      }, 3000);
    }
  };

  return (
    <section id="booking" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold text-text mb-4">Termin vereinbaren</h2>
          <p className="text-lg text-gray-600">
            Finden Sie hier direkt einen passenden Termin für ein unverbindliches Erstgespräch.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden md:flex">
          {/* Calendar Section */}
          <div className="p-8 md:w-1/2 border-r border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text">
                {format(currentWeekStart, 'MMMM yyyy', { locale: de })}
              </h3>
              <div className="flex space-x-2">
                <button onClick={prevWeek} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-primary transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={nextWeek} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-primary transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                <div key={d} className="text-xs font-medium text-gray-400 uppercase">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const daySlots = availableSlots.filter(s => isSameDay(parseISO(s.date), day));
                const hasSlots = daySlots.length > 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={i}
                    onClick={() => hasSlots && setSelectedDate(day)}
                    disabled={!hasSlots}
                    className={`
                      relative p-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200
                      ${isSelected ? 'bg-primary text-white shadow-md transform scale-105' : ''}
                      ${!isSelected && hasSlots ? 'hover:bg-teal-50 text-text cursor-pointer' : ''}
                      ${!hasSlots ? 'text-gray-300 cursor-default' : ''}
                      ${isToday && !isSelected ? 'ring-1 ring-primary ring-inset' : ''}
                    `}
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {hasSlots && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`}></span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <p className="mt-6 text-xs text-gray-400 text-center">
              Wählen Sie ein Datum mit verfügbaren Terminen (markiert mit Punkt).
            </p>
          </div>

          {/* Slots & Form Section */}
          <div className="p-8 md:w-1/2 bg-gray-50/50">
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
                  <div className="grid grid-cols-2 gap-3">
                    {availableSlots
                      .filter(s => isSameDay(parseISO(s.date), selectedDate))
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            px-4 py-2 rounded-md text-sm font-medium border transition-all flex items-center justify-center gap-2
                            ${selectedSlot?.id === slot.id 
                              ? 'bg-primary text-white border-primary shadow-sm' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}
                          `}
                        >
                          <Clock className="h-4 w-4" />
                          {slot.time} Uhr
                        </button>
                      ))}
                  </div>
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
                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-secondary hover:bg-rose-600 text-white font-semibold rounded-md shadow-md transition-colors"
                    >
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
