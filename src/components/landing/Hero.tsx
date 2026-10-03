'use client'

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Trophy, Sparkles, 
  ExternalLink, QrCode, ShieldCheck, Clock
} from 'lucide-react';
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
    <section className="relative min-h-[92vh] bg-gradient-to-b from-[#180206] via-[#2A050E] to-[#120104] flex items-center pt-24 sm:pt-28 pb-16 overflow-hidden w-full max-w-full">
      
      {/* =========================================================================
          ATMÓSFERA STADIUM LIGHTS EFFECT & TEXTURAS VECTORIALES (PARTE A)
          ========================================================================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        {/* Reflectores de Estadio Superiores (Stadium Floodlights) */}
        <div className="absolute -top-32 left-1/4 -translate-x-1/2 w-[35rem] h-[35rem] bg-gradient-to-b from-amber-300/20 via-kasa-dorado/10 to-transparent rounded-full blur-3xl transform -rotate-12" />
        <div className="absolute -top-32 right-1/4 translate-x-1/2 w-[35rem] h-[35rem] bg-gradient-to-b from-amber-200/20 via-kasa-dorado/10 to-transparent rounded-full blur-3xl transform rotate-12" />
        <div className="absolute top-1/3 -left-36 w-[30rem] h-[30rem] bg-red-950/60 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[40rem] h-[25rem] bg-kasa-dorado/5 rounded-full blur-3xl" />

        {/* Focos de reflector estéreo en el techo */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
        <div className="absolute top-2 left-12 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_20px_6px_rgba(251,191,36,0.6)]" />
        <div className="absolute top-2 left-24 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_20px_6px_rgba(251,191,36,0.6)] hidden sm:block" />
        <div className="absolute top-2 right-12 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_20px_6px_rgba(251,191,36,0.6)]" />
        <div className="absolute top-2 right-24 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_20px_6px_rgba(251,191,36,0.6)] hidden sm:block" />

        {/* Costuras vectoriales de béisbol/sóftbol en los laterales */}
        <svg 
          className="absolute -left-16 top-1/4 w-44 sm:w-64 h-96 opacity-15 text-kasa-dorado" 
          viewBox="0 0 100 200" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
        >
          <path d="M 90,0 Q 10,100 90,200" strokeDasharray="3 5" />
          <path d="M 85,20 L 95,28 M 75,40 L 87,46 M 68,60 L 80,64 M 64,80 L 76,82 M 63,100 L 75,100 M 64,120 L 76,118 M 68,140 L 80,136 M 75,160 L 87,154 M 85,180 L 95,172" strokeWidth="1.8" />
        </svg>

        <svg 
          className="absolute -right-16 bottom-10 w-44 sm:w-64 h-96 opacity-15 text-kasa-dorado" 
          viewBox="0 0 100 200" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
        >
          <path d="M 10,0 Q 90,100 10,200" strokeDasharray="3 5" />
          <path d="M 15,20 L 5,28 M 25,40 L 13,46 M 32,60 L 20,64 M 36,80 L 24,82 M 37,100 L 25,100 M 36,120 L 24,118 M 32,140 L 20,136 M 25,160 L 13,154 M 15,180 L 5,172" strokeWidth="1.8" />
        </svg>

        {/* Trama sutil deportiva */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-10 w-full min-w-0 z-10">
        
        {/* =========================================================================
            LEFT COLUMN: IDENTIDAD ATLETICA & CRONOGRAMA DE JUEGOS (PARTES A + C)
            ========================================================================= */}
        <div className="flex-1 text-center lg:text-left w-full min-w-0">
          
          {/* Badge en vivo inaugural */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center lg:justify-start"
          >
            <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-amber-400/30 text-kasa-dorado text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="font-bold tracking-wide uppercase text-[11px] sm:text-xs">
                {settings?.calendar_season || 'Temporada Oficial 2026'} • En Directo
              </span>
            </span>
          </motion.div>

          {/* Titular Masivo en BEBAS NEUE (Tipografía dominante) */}
          <motion.h1 
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl text-white tracking-wider leading-[0.92] mb-5 uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            CRONOGRAMA OFICIAL <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-kasa-dorado drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)]">
              ROL DE JUEGOS
            </span><br />
            DEL DIAMANTE.
          </motion.h1>

          {/* Copia persuasiva y deportiva */}
          <motion.p 
            className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed font-normal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            Consulta en vivo las jornadas, horarios, sedes oficiales y cruces de la liga. 
            El fixture oficial de béisbol, sóftbol y kickingball está disponible para atletas, técnicos y fanaticada.
          </motion.p>

          {/* Chips informativos de partido / matchday */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 mb-8"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm text-left">
              <div className="flex items-center gap-1.5 text-kasa-dorado text-xs font-bold uppercase mb-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Jornadas</span>
              </div>
              <p className="text-white font-extrabold text-sm sm:text-base">
                {images.length > 0 ? `${images.length} Programadas` : 'Fase Regular'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm text-left">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verificación</span>
              </div>
              <p className="text-white font-extrabold text-sm sm:text-base">
                Mesa Técnica QR
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm text-left">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase mb-0.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>Formato</span>
              </div>
              <p className="text-white font-extrabold text-sm sm:text-base truncate">
                Alta Competencia
              </p>
            </div>
          </motion.div>

          {/* Botón de acción principal: Simulador Carnet QR */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <Link 
              href="/demo-carnet" 
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-kasa-dorado via-yellow-400 to-amber-500 text-kasa-vinotinto px-8 py-4 rounded-2xl text-base sm:text-lg font-black transition-all hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-95 shadow-xl"
            >
              <QrCode className="w-5 h-5 stroke-[2.5] group-hover:rotate-6 transition-transform" />
              <span>Probar Simulador Carnet QR</span>
              <ChevronRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: MATCHDAY LIVE SHOWCASE SLIDER / FIXTURE (PARTE C EN HERO)
            ========================================================================= */}
        <motion.div 
          className="flex-1 w-full max-w-md sm:max-w-lg lg:max-w-none relative perspective-1000"
          initial={{ opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          {images.length > 0 ? (
            /* MATCHDAY LIVE FIXTURE CARD DE ALTA CATEGORÍA */
            <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-gradient-to-b from-white/15 via-[#23040B]/80 to-black/90 rounded-3xl border border-amber-400/30 shadow-[0_0_40px_rgba(212,175,55,0.2)] backdrop-blur-xl overflow-hidden flex flex-col p-4 sm:p-5 transform transition-all hover:border-amber-400/50 duration-500 group">
              
              {/* Card Header Deportivo */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 truncate">
                    {settings?.calendar_season || 'Liga Activa 2026'}
                  </span>
                </div>

                {/* Controles de Slide */}
                {images.length > 1 && (
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-inner">
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Jornada anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold text-amber-200 px-1.5 font-mono">
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

              {/* Visor de Afiche de la Jornada */}
              <Link 
                href="/calendario" 
                className="relative flex-1 w-full bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2 group-hover:border-kasa-dorado/50 transition-colors shadow-inner"
                title="Abrir rol oficial en pantalla completa"
              >
                <img
                  src={images[heroIndex]}
                  alt={`Calendario ${getHeroJornadaLabel(heroIndex, images.length)}`}
                  className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Badge Flotante Superior: Jornada */}
                <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-lg border border-amber-400/30 shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-kasa-dorado" />
                  <span className="tracking-wide">{getHeroJornadaLabel(heroIndex, images.length)}</span>
                </div>

                {/* Badge Flotante Inferior: Ver Detalles */}
                <div className="absolute bottom-2.5 inset-x-2.5 bg-black/85 backdrop-blur-md text-white py-2 px-3.5 rounded-xl border border-white/20 flex items-center justify-between text-xs font-bold shadow-xl">
                  <span className="text-gray-300">Rol Oficial de Partidos</span>
                  <span className="text-kasa-dorado inline-flex items-center gap-1 font-black group-hover:underline">
                    Ver en Pantalla Completa <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>

            </div>
          ) : (
            /* BRAND MATCHDAY CARD (FALLBACK ELEGANTE SI NO HAY IMÁGENES CARGADAS) */
            <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-gradient-to-b from-white/15 via-[#23040B]/80 to-black/90 rounded-3xl border border-amber-400/30 shadow-[0_0_40px_rgba(212,175,55,0.2)] backdrop-blur-xl overflow-hidden flex flex-col p-6 sm:p-8 transform transition-transform hover:-translate-y-1.5 duration-500">
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center backdrop-blur-sm">
                  <Trophy className="w-8 h-8 text-kasa-dorado" />
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Temporada Inaugural
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <span className="text-kasa-dorado text-xs font-mono font-bold tracking-widest uppercase">Match Center KsaSport</span>
                <h3 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
                  FIXTURE OFICIAL 2026
                </h3>
                <p className="text-gray-300 text-sm">
                  El rol de juegos se encuentra activo para la categoría libre y de ascenso. Consulta partidos y campos de juego.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-gray-400 text-xs">Jornadas</div>
                  <div className="text-xl font-bold text-white">Oficiales</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-gray-400 text-xs">Mesa Técnica</div>
                  <div className="text-xl font-bold text-emerald-400">QR Activo</div>
                </div>
              </div>

              <Link
                href="/calendario"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-kasa-dorado to-amber-400 text-kasa-vinotinto font-black text-sm text-center flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition-all"
              >
                <span>Abrir Calendario Oficial</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </Link>
            </div>
          )}

          {/* Elementos flotantes de estética beisbolera */}
          <motion.div 
            className="hidden sm:flex absolute -top-4 -left-6 w-14 h-14 bg-white/10 border border-amber-400/30 rounded-2xl backdrop-blur-md items-center justify-center text-2xl shadow-xl z-20"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            ⚾
          </motion.div>
          <motion.div 
            className="hidden sm:flex absolute -bottom-3 -right-4 w-12 h-12 bg-kasa-dorado/20 border border-kasa-dorado/40 rounded-full backdrop-blur-md items-center justify-center text-xl shadow-xl z-20"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            🏆
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
