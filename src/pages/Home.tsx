import { useDocumentMeta, BASE_URL, SITE_NAME } from '../lib/useDocumentMeta';
import JsonLd, { localBusinessData } from '../components/JsonLd';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Articles from '../components/Articles';
import Booking from '../components/Booking';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import { trackScrollDepth } from '../lib/analytics';
import { useMemo, useEffect, useRef } from 'react';

export default function Home() {
  useDocumentMeta({
    title: SITE_NAME,
    description: 'Mut-Taucher: Professionelle Online-Psychotherapie per Video. Einzeltherapie, Gruppentherapie und kostenloses Erstgespräch — flexibel und vertraulich.',
    canonical: BASE_URL + '/',
    ogType: 'website',
  });

  const ldData = useMemo(() => localBusinessData(), []);

  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const thresholds: [string, number][] = [
      ['about', 25],
      ['services', 50],
      ['booking', 75],
      ['contact', 100],
    ];

    let armed = false;
    requestAnimationFrame(() => { armed = true; });

    const observer = new IntersectionObserver(
      (entries) => {
        if (!armed) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = thresholds.find(([id]) => entry.target.id === id);
          if (match && !firedRef.current.has(match[1])) {
            firedRef.current.add(match[1]);
            trackScrollDepth(match[1], '/');
          }
        }
      },
      { threshold: 0.1 },
    );

    for (const [id] of thresholds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <JsonLd data={ldData} />
      <Header />
      <Hero />
      <About />
      <Services />
      <Booking />
      <Articles />
      <Contact />
      <Footer />
    </>
  );
}
