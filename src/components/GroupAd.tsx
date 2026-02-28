import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { Users } from 'lucide-react';
import type { TherapyGroup } from '../lib/data';

export default function GroupAd() {
  const [group, setGroup] = useState<TherapyGroup | null>(null);

  useEffect(() => {
    apiFetch<TherapyGroup | null>('/groups/active')
      .then(setGroup)
      .catch(() => {});
  }, []);

  if (!group) return null;

  const spotsLeft = group.maxParticipants - group.currentParticipants;
  if (spotsLeft <= 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0 w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
            <Users size={28} className="text-secondary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-serif">
              {group.label || 'Gruppentherapie'}
            </h3>
            <p className="mt-1 text-gray-700">
              Noch <span className="font-bold text-secondary">{spotsLeft} {spotsLeft === 1 ? 'Platz' : 'Plätze'}</span> frei!
            </p>
          </div>
          <a
            href="#booking"
            className="shrink-0 inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors"
          >
            Jetzt anmelden
          </a>
        </div>
      </div>
    </section>
  );
}
