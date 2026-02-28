import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1518155317743-a4f15dd6178d?auto=format&fit=crop&q=80&w=2560" 
          alt="Ocean surface" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/90" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-4xl md:text-6xl font-bold text-text mb-6 tracking-tight"
        >
          Tauchen Sie nach Ihrem <span className="text-primary">Mut</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          Psychotherapie für ein selbstbestimmtes Leben.
          Gemeinsam finden wir Wege aus der Krise und entdecken Ihre innere Stärke wieder.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
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
