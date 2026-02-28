import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import heroImage from '@/assets/hero.jpg';

export default function Hero() {
  return (
    <section id="home" className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Psychotherapeutin vor einer Wand mit Efeu"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/80 to-transparent" />
      </div>

      <div className="relative z-10 px-6 sm:px-12 lg:px-20 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-4"
        >
          <span className="text-base md:text-lg font-serif text-gray-600 border-l-2 border-primary/40 pl-3">Praxis für Online-Psychotherapie (Heilpraktikergesetz)</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-serif text-4xl md:text-6xl font-bold text-text mb-6 tracking-tight"
        >
          Tauchen Sie nach Ihrem <span className="text-primary">Mut</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed"
        >
          Psychotherapie für ein selbstbestimmtes Leben.
          Gemeinsam finden wir Wege aus der Krise und entdecken Ihre innere Stärke wieder.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
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
  );
}
