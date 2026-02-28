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
import { useMemo } from 'react';

export default function Home() {
  useDocumentMeta({
    title: SITE_NAME,
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
      <Contact />
      <Footer />
    </>
  );
}
