import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import heroImage from '@/assets/hero.jpg';

export default function Hero() {
  return (
    <>
      {/* Mobile: stacked layout — image on top, text below */}
      <section id="home" className="md:hidden flex flex-col">
        <div className="relative h-[60vh] overflow-hidden">
          <img
            src={heroImage}
            alt="Psychotherapeutin vor einer Wand mit Efeu"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="px-6 py-8 bg-background -mt-8 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-serif text-3xl font-bold text-text mb-4 tracking-tight"
          >
            Psychologische Online-Therapie <span className="text-primary">Mut Taucher</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg text-gray-700 mb-6 leading-relaxed"
          >
            Ich lade Sie herzlich ein mit meiner Unterstützung mutig in Ihr Inneres zu tauchen — für mehr Resilienz und Lebenszufriedenheit.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col gap-4"
          >
            <a
              href="#booking"
              className="px-8 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full shadow-lg transition-all text-center"
            >
              Erstgespräch vereinbaren
            </a>
            <a
              href="#about"
              className="px-8 py-3 bg-white hover:bg-gray-50 text-text font-semibold rounded-full shadow-lg transition-all border border-gray-200 text-center"
            >
              Mehr erfahren
            </a>
          </motion.div>
        </div>
      </section>

      {/* Desktop: original overlay layout */}
      <section className="relative h-screen hidden md:flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Psychotherapeutin vor einer Wand mit Efeu"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/80 to-transparent" />
        </div>

        <div className="relative z-10 px-12 lg:px-20 max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-serif text-6xl font-bold text-text mb-6 tracking-tight"
          >
            Psychologische Online-Therapie <span className="text-primary">Mut Taucher</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-700 mb-8 leading-relaxed"
          >
            Ich lade Sie herzlich ein mit meiner Unterstützung mutig in Ihr Inneres zu tauchen — für mehr Resilienz und Lebenszufriedenheit.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-row gap-4"
          >
            <a
              href="#booking"
              className="px-8 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              Erstgespräch vereinbaren
            </a>
            <a
              href="#about"
              className="px-8 py-3 bg-white/80 hover:bg-white text-text font-semibold rounded-full shadow-lg backdrop-blur-sm transition-all border border-gray-200"
            >
              Mehr erfahren
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce"
        >
          <ArrowDown className="text-gray-400 w-8 h-8" />
        </motion.div>
      </section>
    </>
  );
}
