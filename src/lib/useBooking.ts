import { useState, useEffect } from 'react';
import { type Slot, initialSlots } from './data';

export const useBooking = () => {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('mut-taucher-slots');
    if (stored) {
      setSlots(JSON.parse(stored));
    } else {
      setSlots(initialSlots);
    }
  }, []);

  const saveSlots = (newSlots: Slot[]) => {
    setSlots(newSlots);
    localStorage.setItem('mut-taucher-slots', JSON.stringify(newSlots));
  };

  const bookSlot = (id: string, name: string, email: string) => {
    const newSlots = slots.map(slot => 
      slot.id === id ? { ...slot, available: false } : slot
    );
    saveSlots(newSlots);
    console.log(`Booking confirmed for ${name} (${email}) on slot ${id}`);
    // Here you would typically send an email via API
  };

  const addSlot = (date: string, time: string) => {
    const newSlot: Slot = {
      id: Math.random().toString(36).substr(2, 9),
      date,
      time,
      available: true,
    };
    saveSlots([...slots, newSlot]);
  };

  const removeSlot = (id: string) => {
    const newSlots = slots.filter(s => s.id !== id);
    saveSlots(newSlots);
  };

  return { slots, bookSlot, addSlot, removeSlot };
};
