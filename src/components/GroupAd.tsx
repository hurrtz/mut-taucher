import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
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
    <a
      href="#booking"
      className="group my-10 mx-auto block max-w-xl bg-rose-600 rounded-xl px-6 py-6 flex items-center justify-center gap-3 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/30"
    >
      <span className="text-white/80 text-sm sm:text-lg font-medium whitespace-nowrap">
        Noch <span className="text-white font-extrabold text-base sm:text-xl">{spotsLeft}</span> {spotsLeft === 1 ? 'Platz' : 'Plätze'} für die nächste volle Gruppe!
      </span>
    </a>
  );
}
