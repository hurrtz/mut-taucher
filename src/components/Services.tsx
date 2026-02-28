import { Video, Users, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { services } from '../lib/data';
import type { Service } from '../lib/data';
import GroupAd from './GroupAd';
import { trackCtaClicked } from '../lib/analytics';

const iconMap = {
  Video,
  Users,
  MessageCircle,
} as const;

function ServiceCard({ service }: { service: Service }) {
  const Icon = iconMap[service.icon];
  return (
    <Link to={`/leistungen/${service.slug}`} onClick={() => trackCtaClicked(service.title, 'services-grid')} className="pt-6 group">
      <div className="flow-root bg-white rounded-lg px-6 pb-8 h-full group-hover:shadow-lg transition-shadow duration-300">
        <div className="-mt-6">
          <div>
            <span className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
              <Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
          </div>
          <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight group-hover:text-primary transition-colors">
            {service.title}
          </h3>
          <p className="mt-5 text-base text-gray-500">
            {service.excerpt}
          </p>
          <ul className="mt-4 list-disc list-inside text-sm text-gray-500 space-y-2">
            {service.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </div>
    </Link>
  );
}

export default function Services() {
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl font-serif">
            Meine Angebote
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Individuelle Lösungen für Ihre persönliche Situation.
          </p>
        </div>

        <GroupAd />

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
