import { useState, type FormEvent } from 'react';
import { useBooking } from '../lib/useBooking';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Trash2, Plus, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const { slots, addSlot, removeSlot } = useBooking();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTime, setNewTime] = useState('10:00');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (password === 'secret') {
      setIsAuthenticated(true);
    } else {
      alert('Falsches Passwort');
    }
  };

  const handleAddSlot = (e: FormEvent) => {
    e.preventDefault();
    addSlot(format(selectedDate, 'yyyy-MM-dd'), newTime);
    setNewTime('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="Passwort"
          />
          <button type="submit" className="w-full bg-primary text-white py-2 rounded hover:bg-teal-600">
            Login
          </button>
          <Link to="/" className="block text-center mt-4 text-sm text-gray-500 hover:underline">Zurück zur Website</Link>
        </form>
      </div>
    );
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Termin-Verwaltung</h1>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary hover:underline">Zur Website</Link>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-2 text-red-500 hover:text-red-700"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Slot Panel */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Neuen Termin anlegen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                <input 
                  type="date" 
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <button 
                onClick={handleAddSlot}
                disabled={!newTime}
                className="w-full bg-primary text-white py-2 rounded-md hover:bg-teal-600 disabled:opacity-50"
              >
                Termin hinzufügen
              </button>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-semibold flex items-center gap-2">
                <CalendarIcon size={20} className="text-gray-500" />
                Übersicht: {format(weekStart, 'MMMM yyyy', { locale: de })}
              </h2>
              <div className="space-x-2">
                <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="px-3 py-1 border rounded hover:bg-gray-50">← Woche</button>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="px-3 py-1 border rounded hover:bg-gray-50">Woche →</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const daySlots = slots.filter(s => isSameDay(parseISO(s.date), day));
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div key={day.toISOString()} className={`min-h-[150px] border rounded-lg p-2 ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                    <div className="text-center font-medium text-gray-700 mb-2 border-b pb-1">
                      {format(day, 'EEE', { locale: de })}<br/>
                      <span className="text-sm text-gray-500">{format(day, 'd.M.')}</span>
                    </div>
                    <div className="space-y-2">
                      {daySlots.length === 0 && <div className="text-xs text-center text-gray-400 py-4">-</div>}
                      {daySlots.sort((a,b) => a.time.localeCompare(b.time)).map(slot => (
                        <div 
                          key={slot.id} 
                          className={`
                            text-xs p-2 rounded flex justify-between items-center group
                            ${slot.available ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}
                          `}
                        >
                          <span className="font-mono">{slot.time}</span>
                          <button 
                            onClick={() => removeSlot(slot.id)}
                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Löschen"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
