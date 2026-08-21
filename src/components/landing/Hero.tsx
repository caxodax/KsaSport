'use client'

import { motion } from 'framer-motion';
import { Calendar, Users, ChevronRight, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] bg-kasa-vinotinto flex items-center pt-20 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-red-900/40 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-kasa-dorado/10 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 w-full z-10 py-12">
        
        {/* Left Column - Copy */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-kasa-dorado text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kasa-dorado opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-kasa-dorado"></span>
              </span>
              Inscripciones Abiertas 2026
            </span>
          </motion.div>

          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            El Ecosistema <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-kasa-dorado via-yellow-200 to-kasa-dorado">
              Inteligente
            </span><br />
            del Deporte.
          </motion.h1>

          <motion.p 
            className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            Únete a la liga de béisbol, sóftbol y kickingball mejor organizada. 
            Estadísticas en vivo, autogestión para atletas y un proceso de scouting 100% digital.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <Link 
              href="#tryouts" 
              className="w-full sm:w-auto group relative flex items-center justify-center gap-2 bg-kasa-dorado text-kasa-vinotinto px-8 py-4 rounded-xl text-lg font-bold transition-all hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              <Users className="w-5 h-5" />
              Ver Próximos Tryouts
            </Link>
            <Link 
              href="#eventos" 
              className="w-full sm:w-auto group flex items-center justify-center gap-2 bg-transparent text-white border border-white/30 hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-bold transition-all"
            >
              <Calendar className="w-5 h-5 opacity-70 group-hover:opacity-100" />
              Explorar Ligas Activas
            </Link>
          </motion.div>
        </div>

        {/* Right Column - Visual Abstract Mockup */}
        <motion.div 
          className="flex-1 w-full max-w-lg mx-auto lg:max-w-none relative perspective-1000"
          initial={{ opacity: 0, x: 40, rotateY: 10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          {/* Abstract representation of the Digital Carnet / App UI */}
          <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col p-6 sm:p-8 transform transition-transform hover:-translate-y-2 duration-500">
            
            {/* Mock Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Trophy className="w-8 h-8 text-kasa-dorado" />
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                Solvente
              </div>
            </div>

            {/* Mock Profile Info */}
            <div className="space-y-4 mb-auto">
              <div className="w-1/3 h-4 bg-white/20 rounded-full"></div>
              <div className="w-2/3 h-8 bg-white/30 rounded-full"></div>
              <div className="w-1/2 h-4 bg-white/10 rounded-full"></div>
            </div>

            {/* Mock Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-white/50 text-sm mb-1">AVG</div>
                <div className="text-2xl font-bold text-white">.450</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-white/50 text-sm mb-1">HITS</div>
                <div className="text-2xl font-bold text-white">12</div>
              </div>
            </div>

            {/* QR Mockup */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white rounded-2xl p-3 shadow-2xl rotate-12 opacity-90 group-hover:rotate-6 transition-all duration-500">
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="w-2/3 h-2/3 bg-gray-400 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* Decorative Floating Elements */}
          <motion.div 
            className="absolute top-1/4 -left-8 w-16 h-16 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center text-2xl"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            ⚾
          </motion.div>
          <motion.div 
            className="absolute bottom-1/4 -right-4 w-12 h-12 bg-kasa-dorado/20 border border-kasa-dorado/30 rounded-full backdrop-blur-md flex items-center justify-center text-xl"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            🏅
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
