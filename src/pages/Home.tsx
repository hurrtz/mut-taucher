import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import JsonLd, { localBusinessData } from '../components/JsonLd';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Articles from '../components/Articles';
import Booking from '../components/Booking';
import Footer from '../components/Footer';
import { useMemo } from 'react';

export default function Home() {
  useDocumentMeta({
    title: 'Mut-Taucher — Online-Psychotherapie',
    description: 'Mut-Taucher: Professionelle Online-Psychotherapie per Video. Einzeltherapie, Gruppentherapie und kostenloses Erstgespräch — flexibel und vertraulich.',
    canonical: BASE_URL + '/',
    ogType: 'website',
  });

  const ldData = useMemo(() => localBusinessData(), []);

  return (
    <>
      <JsonLd data={ldData} />
      <Header />
      <Hero />
      <About />
      <Services />
      <Booking />
      <Articles />
      <Footer />
    </>
  );
}
