import { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
}

export function localBusinessData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'PsychologicalTreatment',
    name: 'Psychologische Online-Therapie Mut-Taucher',
    description: 'Professionelle Online-Psychotherapie per Video. Einzeltherapie, Gruppentherapie und kostenloses Erstgespräch.',
    url: 'https://mut-taucher.de',
    telephone: '+4915253432009',
    email: 'gruppentherapie@mut-taucher.de',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Zeuschelstraße 97',
      addressLocality: 'Berlin',
      postalCode: '13127',
      addressCountry: 'DE',
    },
    provider: {
      '@type': 'Person',
      name: 'Jana Fricke',
      jobTitle: 'M.Sc. Psychologin, Systemische Therapeutin (DGSF)',
    },
    areaServed: {
      '@type': 'Country',
      name: 'DE',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceType: 'Online',
    },
  };
}

export function articleData(article: { title: string; excerpt: string; slug: string; image: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.image,
    url: `https://mut-taucher.de/wissen/${article.slug}`,
    author: {
      '@type': 'Person',
      name: 'Jana Fricke',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mut-Taucher',
    },
  };
}

export function serviceData(service: { title: string; excerpt: string; slug: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.excerpt,
    url: `https://mut-taucher.de/leistungen/${service.slug}`,
    provider: {
      '@type': 'Person',
      name: 'Jana Fricke',
      jobTitle: 'M.Sc. Psychologin, Systemische Therapeutin (DGSF)',
    },
    areaServed: {
      '@type': 'Country',
      name: 'DE',
    },
  };
}
