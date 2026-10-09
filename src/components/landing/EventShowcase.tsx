'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, Users, ArrowRight, Download, Sparkles, 
  Trophy, X, ChevronLeft, ChevronRight, ExternalLink, Eye 
} from 'lucide-react';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';

interface EventShowcaseProps {
  settings?: {
    calendar_title?: string | null;
    calendar_season?: string | null;
    calendar_description?: string | null;
    calendar_images?: string[] | null;
    calendar_pdf_url?: string | null;
    calendar_is_active?: boolean | null;

    tryouts_title?: string | null;
    tryouts_season?: string | null;
    tryouts_description?: string | null;
    tryouts_images?: string[] | null;
    tryouts_pdf_url?: string | null;
    tryouts_is_active?: boolean | null;

    drafts_title?: string | null;
    drafts_season?: string | null;
    drafts_description?: string | null;
    drafts_images?: string[] | null;
    drafts_pdf_url?: string | null;
    drafts_is_active?: boolean | null;

    whatsapp_number?: string | null;
  } | null;
}

interface LightboxState {
  isOpen: boolean;
  title: string;
  subtitle: string;
  images: string[];
  activeIndex: number;
  pdfUrl?: string | null;
  whatsappUrl?: string | null;
}

export default function EventShowcase({ settings }: EventShowcaseProps) {
  // Datos del Calendario
  const calendarImages = Array.isArray(settings?.calendar_images) ? settings.calendar_images : []
  const hasCalendarImages = calendarImages.length > 0
  const hasCalendarPdf = Boolean(settings?.calendar_pdf_url)

  // Datos de Tryouts
  const tryoutsImages = Array.isArray(settings?.tryouts_images) ? settings.tryouts_images : []
  const hasTryoutsImages = tryoutsImages.length > 0
  const hasTryoutsPdf = Boolean(settings?.tryouts_pdf_url)

  // Datos de Drafts
  const draftsImages = Array.isArray(settings?.drafts_images) ? settings.drafts_images : []
  const hasDraftsImages = draftsImages.length > 0
  const hasDraftsPdf = Boolean(settings?.drafts_pdf_url)

  // WhatsApp oficial
  const rawWhatsapp = (settings?.whatsapp_number || '').replace(/[^0-9]/g, '')
  const tryoutsWhatsappUrl = rawWhatsapp
    ? `https://wa.me/${rawWhatsapp}?text=${encodeURIComponent('Hola KsaSport, deseo información sobre las fechas de los próximos Tryouts y pruebas de talento.')}`
    : '/login?tab=signup'

  const draftsWhatsappUrl = rawWhatsapp
    ? `https://wa.me/${rawWhatsapp}?text=${encodeURIComponent('Hola KsaSport, deseo información sobre los próximos Drafts y torneos de Kickingball.')}`
    : '/login?tab=signup'

  // Estado del Visor Lightbox para afiches
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    title: '',
    subtitle: '',
    images: [],
    activeIndex: 0,
    pdfUrl: null,
    whatsappUrl: null,
  })

  const openLightbox = (
    title: string, 
    subtitle: string, 
    images: string[], 
    startIndex = 0, 
    pdfUrl?: string | null,
    whatsappUrl?: string | null
  ) => {
    if (!images || images.length === 0) return
    setLightbox({
      isOpen: true,
      title,
      subtitle,
      images,
      activeIndex: startIndex,
      pdfUrl,
      whatsappUrl,
    })
  }

  const closeLightbox = () => {
    setLightbox(prev => ({ ...prev, isOpen: false }))
  }

  const nextImage = () => {
    setLightbox(prev => ({
      ...prev,
      activeIndex: (prev.activeIndex + 1) % prev.images.length
    }))
  }

  const prevImage = () => {
    setLightbox(prev => ({
      ...prev,
      activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length
    }))
  }

  return (
    <section id="eventos" className="py-20 sm:py-24 bg-slate-50/60 relative overflow-hidden border-t border-slate-100">
      <div id="tryouts" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de la Sección */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-kasa-vinotinto/10 text-kasa-vinotinto text-xs font-black uppercase tracking-wider mb-4 border border-kasa-vinotinto/20">
            <Sparkles className="w-3.5 h-3.5 text-kasa-dorado-dark" />
            <span>Eventos Oficiales & Convocatorias</span>
          </div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-5 tracking-tight"
          >
            Tu momento de brillar en el campo.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-gray-600 leading-relaxed"
          >
            Sigue la acción de nuestras ligas activas, postúlate a las pruebas de captación o participa en los próximos drafts oficiales del ecosistema deportivo KsaSport.
          </motion.p>
        </div>

        {/* Cuadrícula de 3 Tarjetas Autoadministrables */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          
          {/* TARJETA 1: CALENDARIO DE LIGAS ACTIVAS */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            {/* Glow decorativo de fondo */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-kasa-vinotinto/25 rounded-full blur-3xl pointer-events-none group-hover:bg-kasa-dorado/20 transition-colors duration-700"></div>

            <div className="relative p-6 sm:p-8 z-10 flex flex-col h-full">
              
              {/* Badges superiores */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ligas Activas
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-kasa-dorado border border-white/10 text-[11px] font-bold uppercase tracking-wider">
                  {settings?.calendar_season || 'Temporada 2026'}
                </span>
                {hasCalendarPdf && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Download className="w-3 h-3" /> PDF
                  </span>
                )}
              </div>

              {/* Título y descripción */}
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2.5 tracking-tight leading-tight">
                {settings?.calendar_title || 'Calendario Oficial de Ligas Activas'}
              </h3>
              
              <p className="text-gray-300 text-xs sm:text-sm mb-6 leading-relaxed line-clamp-3">
                {settings?.calendar_description || 
                  'Consulta los horarios, canchas oficiales y resultados de cada jornada. Abierto para toda la comunidad deportiva, familiares y fanáticos.'}
              </p>

              {/* Miniatura visual del afiche o preview */}
              {hasCalendarImages ? (
                <div 
                  onClick={() => openLightbox(
                    settings?.calendar_title || 'Calendario Oficial',
                    settings?.calendar_season || 'Temporada 2026',
                    calendarImages,
                    0,
                    settings?.calendar_pdf_url
                  )}
                  className="mb-6 rounded-2xl overflow-hidden border border-white/15 bg-black/40 relative aspect-[16/10] cursor-pointer group/img hover:border-kasa-dorado/60 transition-colors"
                  title="Haz clic para ver los afiches en grande"
                >
                  <img 
                    src={calendarImages[0]} 
                    alt="Rol de Juegos Preview" 
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-3.5">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-kasa-dorado" /> Afiche oficial de la jornada
                    </span>
                    <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover/img:bg-kasa-dorado group-hover/img:text-black transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <CalendarDays className="w-7 h-7 text-kasa-dorado shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Jornadas oficiales de Fin de Semana</p>
                    <p className="text-gray-400">Rol de juegos y fixture completo sin registro.</p>
                  </div>
                </div>
              )}

              {/* Acciones principales */}
              <div className="mt-auto pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <Link 
                  href="/calendario" 
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-kasa-dorado to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-kasa-vinotinto font-black text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-lg transition-all group-hover:shadow-yellow-500/20 active:scale-95 text-center"
                >
                  <span>Explorar Calendario</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                {settings?.calendar_pdf_url && (
                  <a
                    href={settings.calendar_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-3.5 rounded-2xl border border-white/15 transition-all shrink-0"
                    title="Descargar Rol de Juegos en PDF"
                  >
                    <Download className="w-4 h-4 text-kasa-dorado" />
                    <span>PDF</span>
                  </a>
                )}
              </div>

              <span className="text-[10px] text-gray-400 mt-3 text-center sm:text-left block">
                ● Acceso libre para todo público • No requiere login
              </span>
            </div>
          </motion.div>

          {/* TARJETA 2: SCOUTING Y TRYOUTS OFICIALES */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-kasa-vinotinto via-red-950 to-kasa-vinotinto text-white border border-red-900/50 shadow-xl flex flex-col justify-between hover:border-red-800 transition-all"
          >
            {/* Glow decorativo de fondo */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-red-900/40 rounded-full blur-3xl pointer-events-none group-hover:bg-kasa-dorado/20 transition-colors duration-700"></div>

            <div className="relative p-6 sm:p-8 z-10 flex flex-col h-full">
              
              {/* Badges superiores */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white border border-white/20 text-[11px] font-black uppercase tracking-wider">
                  <Users className="w-3 h-3 text-kasa-dorado" />
                  Captación de Talento
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/10 text-[11px] font-bold uppercase tracking-wider">
                  {settings?.tryouts_season || 'Temporada 2026'}
                </span>
                {hasTryoutsPdf && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Download className="w-3 h-3" /> Convocatoria
                  </span>
                )}
              </div>

              {/* Título y descripción */}
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2.5 tracking-tight leading-tight">
                {settings?.tryouts_title || 'Scouting y Tryouts Oficiales'}
              </h3>
              
              <p className="text-white/80 text-xs sm:text-sm mb-6 leading-relaxed line-clamp-3">
                {settings?.tryouts_description || 
                  '¿Tienes talento para el Béisbol o Kickingball? Regístrate en nuestras próximas pruebas y forma parte de nuestros equipos en competencia oficial.'}
              </p>

              {/* Miniatura visual del afiche o preview */}
              {hasTryoutsImages ? (
                <div 
                  onClick={() => openLightbox(
                    settings?.tryouts_title || 'Scouting y Tryouts',
                    settings?.tryouts_season || 'Temporada 2026',
                    tryoutsImages,
                    0,
                    settings?.tryouts_pdf_url,
                    tryoutsWhatsappUrl
                  )}
                  className="mb-6 rounded-2xl overflow-hidden border border-white/20 bg-black/40 relative aspect-[16/10] cursor-pointer group/img hover:border-kasa-dorado/60 transition-colors"
                  title="Haz clic para ver los afiches de Tryouts"
                >
                  <img 
                    src={tryoutsImages[0]} 
                    alt="Tryouts Preview" 
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-between p-3.5">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-kasa-dorado" /> Afiche oficial de convocatoria
                    </span>
                    <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover/img:bg-kasa-dorado group-hover/img:text-black transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-3">
                  <Users className="w-7 h-7 text-kasa-dorado shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Evaluación técnica y física</p>
                    <p className="text-white/70">Coordinación directa para aspirantes y atletas libres.</p>
                  </div>
                </div>
              )}

              {/* Acciones principales */}
              <div className="mt-auto pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <a 
                  href={tryoutsWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-kasa-vinotinto font-black text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 text-center"
                >
                  <WhatsAppIcon className="w-4 h-4 text-emerald-600 fill-current" />
                  <span>Consultar por WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                {settings?.tryouts_pdf_url && (
                  <a
                    href={settings.tryouts_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-3.5 rounded-2xl border border-white/20 transition-all shrink-0"
                    title="Descargar bases de la convocatoria en PDF"
                  >
                    <Download className="w-4 h-4 text-kasa-dorado" />
                    <span>PDF</span>
                  </a>
                )}
              </div>

              <span className="text-[10px] text-white/60 mt-3 text-center sm:text-left block">
                ● Pruebas presenciales • Atletas y Nuevos Talentos
              </span>
            </div>
          </motion.div>

          {/* TARJETA 3: DRAFTS DE KICKINGBALL */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-950 via-amber-950/60 to-black text-white border border-amber-900/40 shadow-xl flex flex-col justify-between hover:border-amber-800 transition-all"
          >
            {/* Glow decorativo de fondo */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-amber-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-yellow-500/20 transition-colors duration-700"></div>

            <div className="relative p-6 sm:p-8 z-10 flex flex-col h-full">
              
              {/* Badges superiores */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Drafts Kickingball
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/10 text-[11px] font-bold uppercase tracking-wider">
                  {settings?.drafts_season || 'Temporada 2026'}
                </span>
                {hasDraftsPdf && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Download className="w-3 h-3" /> Ficha
                  </span>
                )}
              </div>

              {/* Título y descripción */}
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2.5 tracking-tight leading-tight">
                {settings?.drafts_title || 'Drafts de Kickingball'}
              </h3>
              
              <p className="text-gray-300 text-xs sm:text-sm mb-6 leading-relaxed line-clamp-3">
                {settings?.drafts_description || 
                  'Postulación y selección oficial de atletas para el circuito élite y categorías competitivas de Kickingball. Consulta el rol y fichajes.'}
              </p>

              {/* Miniatura visual del afiche o preview */}
              {hasDraftsImages ? (
                <div 
                  onClick={() => openLightbox(
                    settings?.drafts_title || 'Drafts de Kickingball',
                    settings?.drafts_season || 'Temporada 2026',
                    draftsImages,
                    0,
                    settings?.drafts_pdf_url,
                    draftsWhatsappUrl
                  )}
                  className="mb-6 rounded-2xl overflow-hidden border border-white/20 bg-black/40 relative aspect-[16/10] cursor-pointer group/img hover:border-kasa-dorado/60 transition-colors"
                  title="Haz clic para ver los afiches del Draft"
                >
                  <img 
                    src={draftsImages[0]} 
                    alt="Drafts Preview" 
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-between p-3.5">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-kasa-dorado" /> Afiche oficial del Draft
                    </span>
                    <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover/img:bg-kasa-dorado group-hover/img:text-black transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-kasa-dorado shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Selección oficial de jugadoras</p>
                    <p className="text-gray-400">Armado de equipos y roster para la temporada regular.</p>
                  </div>
                </div>
              )}

              {/* Acciones principales */}
              <div className="mt-auto pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <a 
                  href={draftsWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 text-center"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current text-black" />
                  <span>Postularme al Draft</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                {settings?.drafts_pdf_url && (
                  <a
                    href={settings.drafts_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-3.5 rounded-2xl border border-white/20 transition-all shrink-0"
                    title="Descargar reglamento o planilla del Draft en PDF"
                  >
                    <Download className="w-4 h-4 text-kasa-dorado" />
                    <span>PDF</span>
                  </a>
                )}
              </div>

              <span className="text-[10px] text-gray-400 mt-3 text-center sm:text-left block">
                ● Circuito Oficial KsaSport • Béisbol & Kickingball
              </span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* MODAL LIGHTBOX INTERACTIVO PARA AFICHES Y CONVOCATORIAS */}
      <AnimatePresence>
        {lightbox.isOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={closeLightbox}
          >
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer shadow-lg"
              title="Cerrar visor"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Flecha Anterior */}
            {lightbox.images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer shadow-xl backdrop-blur-md"
                title="Imagen anterior"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Flecha Siguiente */}
            {lightbox.images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer shadow-xl backdrop-blur-md"
                title="Siguiente imagen"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Contenedor Central */}
            <div 
              className="relative max-w-4xl max-h-[92vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Título en modal */}
              <div className="mb-3 text-center">
                <h4 className="text-lg sm:text-xl font-black text-white">{lightbox.title}</h4>
                <p className="text-xs text-kasa-dorado font-bold mt-0.5">{lightbox.subtitle}</p>
              </div>

              {/* Imagen activa */}
              <img
                src={lightbox.images[lightbox.activeIndex]}
                alt={lightbox.title}
                className="max-h-[72vh] max-w-full w-auto object-contain rounded-2xl shadow-2xl border border-white/15"
              />

              {/* Barra inferior de acciones */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
                {lightbox.images.length > 1 && (
                  <span className="text-white/80 font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
                    Afiche {lightbox.activeIndex + 1} de {lightbox.images.length}
                  </span>
                )}

                <a
                  href={lightbox.images[lightbox.activeIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold transition-colors"
                >
                  <span>Tamaño Completo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {lightbox.pdfUrl && (
                  <a
                    href={lightbox.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-kasa-dorado hover:bg-yellow-400 text-kasa-vinotinto font-black transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </a>
                )}

                {lightbox.whatsappUrl && (
                  <a
                    href={lightbox.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white font-bold transition-colors"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                    <span>Consultar por WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
