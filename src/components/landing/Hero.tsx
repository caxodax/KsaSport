'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, ChevronRight, ChevronLeft, Trophy, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface HeroProps {
  settings?: {
    calendar_images?: string[] | null;
    calendar_title?: string | null;
    calendar_season?: string | null;
    calendar_pdf_url?: string | null;
    whatsapp_number?: string | null;
  } | null;
}

export default function Hero({ settings }: HeroProps) {
  const images = Array.isArray(settings?.calendar_images) ? settings.calendar_images : [];
  const [heroIndex, setHeroIndex] = useState(0);

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 0) {
      setHeroIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 0) {
      setHeroIndex((prev) => (prev + 1) % images.length);
    }
  };

  const getHeroJornadaLabel = (idx: number, total: number) => {
    if (idx === total - 1 && total >= 3) return 'Gran Final';
    if (idx === total - 2 && total >= 4) return 'Semifinales';
    return `Jornada #${idx + 1}`;
  };

  return (
    <section className="relative min-h-[90vh] bg-kasa-vinotinto flex items-center pt-20 overflow-hidden w-full max-w-full">
      {/* Background Decor */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-red-900/40 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-kasa-dorado/10 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 w-full min-w-0 z-10 py-12">
        
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
              href="/calendario" 
              className="w-full sm:w-auto group flex items-center justify-center gap-2 bg-transparent text-white border border-white/30 hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-bold transition-all"
            >
              <Calendar className="w-5 h-5 opacity-70 group-hover:opacity-100" />
              Explorar Ligas Activas
            </Link>
          </motion.div>
        </div>

        {/* Right Column - Interactive Matchday Showcase Slider or Brand Carnet */}
        <motion.div 
          className="flex-1 w-full max-w-lg mx-auto lg:max-w-none relative perspective-1000"
          initial={{ opacity: 0, x: 40, rotateY: 10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          {images.length > 0 ? (
            /* MATCHDAY LIVE FIXTURE CARD (REAL DATA) */
            <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-gradient-to-br from-white/15 to-white/5 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col p-4 sm:p-5 transform transition-transform hover:-translate-y-1.5 duration-500 group">
              
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 truncate">
                    {settings?.calendar_season || 'Liga Activa 2026'}
                  </span>
                </div>

                {/* Controles de Slide */}
                {images.length > 1 && (
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/15">
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Jornada anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold text-gray-200 px-1 font-mono">
                      {heroIndex + 1}/{images.length}
                    </span>
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Siguiente jornada"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Poster Display Contained */}
              <Link 
                href="/calendario" 
                className="relative flex-1 w-full bg-slate-950/70 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2 group-hover:border-kasa-dorado/40 transition-colors"
                title="Ver calendario oficial en pantalla completa"
              >
                <img
                  src={images[heroIndex]}
                  alt={`Calendario ${getHeroJornadaLabel(heroIndex, images.length)}`}
                  className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Badge Flotante Superior */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-white/20 shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-kasa-dorado" />
                  <span>{getHeroJornadaLabel(heroIndex, images.length)}</span>
                </div>

                {/* Badge Flotante Inferior */}
                <div className="absolute bottom-2.5 inset-x-2.5 bg-black/80 backdrop-blur-md text-white py-1.5 px-3 rounded-xl border border-white/15 flex items-center justify-between text-[11px] font-bold shadow-lg">
                  <span className="text-gray-300">Rol de Juegos Oficial</span>
                  <span className="text-kasa-dorado inline-flex items-center gap-1 group-hover:underline">
                    Ver más <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </Link>

              {/* Botón Inferior Acceso Rápido */}
              <Link
                href="/calendario"
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-kasa-dorado to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-kasa-vinotinto font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <span>Explorar Calendario Completo ({images.length} Jornadas)</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </Link>

            </div>
          ) : (
            /* BRAND CARNET FALLBACK (SI NO HAY IMÁGENES CARGADAS) */
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
          )}

          {/* Decorative Floating 3D Elements */}
          <motion.div 
            className="hidden sm:flex absolute top-1/4 -left-6 sm:-left-8 w-14 h-14 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md items-center justify-center text-2xl shadow-xl z-20"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            ⚾
          </motion.div>
          <motion.div 
            className="hidden sm:flex absolute bottom-1/6 -right-4 sm:-right-6 w-12 h-12 bg-kasa-dorado/20 border border-kasa-dorado/30 rounded-full backdrop-blur-md items-center justify-center text-xl shadow-xl z-20"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            🏆
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
