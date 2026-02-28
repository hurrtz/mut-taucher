import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Articles from '../components/Articles';
import Booking from '../components/Booking';
import Footer from '../components/Footer';

export default function Home() {
  useDocumentMeta(
    'Mut-Taucher — Online-Psychotherapie',
    'Mut-Taucher: Professionelle Online-Psychotherapie per Video. Einzeltherapie, Gruppentherapie und kostenloses Erstgespräch — flexibel und vertraulich.',
  );

  return (
    <>
      <Header />
      <Hero />
      <About />
      <Services />
      <Articles />
      <Booking />
      <Footer />
    </>
  );
}
