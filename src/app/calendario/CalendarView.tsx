'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Trophy, Calendar, Download, MessageCircle, ArrowLeft, 
  ExternalLink, ZoomIn, X, ChevronLeft, ChevronRight,
  Sparkles, Layers
} from 'lucide-react'

interface CalendarViewProps {
  settings: {
    calendar_title?: string | null;
    calendar_season?: string | null;
    calendar_description?: string | null;
    calendar_images?: string[] | null;
    calendar_pdf_url?: string | null;
    calendar_is_active?: boolean | null;
    whatsapp_number?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
  }
}

export default function CalendarView({ settings }: CalendarViewProps) {
  const images = Array.isArray(settings?.calendar_images) ? settings.calendar_images : []
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Touch Swipe para móvil
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && images.length > 0) {
      setActiveIndex((prev) => (prev + 1) % images.length)
    } else if (isRightSwipe && images.length > 0) {
      setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === 'Escape') setLightboxIndex(null)
        if (e.key === 'ArrowRight') setLightboxIndex((lightboxIndex + 1) % images.length)
        if (e.key === 'ArrowLeft') setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
        return
      }

      if (images.length > 1) {
        if (e.key === 'ArrowRight') setActiveIndex((prev) => (prev + 1) % images.length)
        if (e.key === 'ArrowLeft') setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, images.length])

  const rawWhatsapp = (settings?.whatsapp_number || '').replace(/[^0-9]/g, '')
  const whatsappUrl = rawWhatsapp
    ? `https://wa.me/${rawWhatsapp}?text=${encodeURIComponent('Hola KsaSport, deseo información sobre el calendario de juegos de la temporada.')}`
    : null

  // Etiqueta legible para cada afiche en orden ascendente (#1 -> Final)
  const getJornadaLabel = (idx: number, total: number) => {
    if (idx === total - 1 && total >= 3) return 'Finales'
    if (idx === total - 2 && total >= 4) return 'Semifinales'
    return `Jornada ${idx + 1}`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-kasa-dorado selection:text-kasa-vinotinto">
      
      {/* HEADER DE NAVEGACIÓN SUPERIOR */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-kasa-vinotinto text-white flex items-center justify-center font-black shadow-md border border-white/10 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-kasa-dorado" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-base text-white leading-none">
                KASA SPORTS
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Calendario Oficial
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver al</span> Inicio
            </Link>

            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all shadow-xs"
            >
              Soy Atleta
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION DE LA LIGA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        
        {/* Banner de Cabecera */}
        <div className="relative rounded-3xl bg-gradient-to-br from-kasa-vinotinto via-red-950 to-slate-950 border border-white/15 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-kasa-dorado/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-3.5">
            {/* Badges superiores */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Torneo Activo
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider">
                {settings?.calendar_season || 'Temporada 2026'}
              </span>
              {images.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-kasa-dorado/20 text-yellow-300 border border-kasa-dorado/30 text-xs font-bold">
                  {images.length} Jornadas Oficiales
                </span>
              )}
            </div>

            {/* Título de la Liga */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {settings?.calendar_title || 'Calendario Oficial de Ligas Activas'}
            </h1>

            {/* Descripción */}
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
              {settings?.calendar_description || 
                'Consulta los partidos, horarios y sedes oficiales de cada jornada. La entrada a las instalaciones es libre para familiares, delegados y fanáticos.'}
            </p>

            {/* Acciones Destacadas (Descargar PDF / WhatsApp) */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {settings?.calendar_pdf_url && (
                <a
                  href={settings.calendar_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-kasa-dorado to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-kasa-vinotinto font-black text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Descargar Calendario (PDF)</span>
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Consultas por WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN DEL SLIDER DEPORTIVO DE CALENDARIO */}
        {images.length > 0 ? (
          <section className="space-y-6">
            
            {/* SELECTOR RÁPIDO DE JORNADAS (PILL STRIP HORIZONTAL) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-bold">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Layers className="w-4 h-4 text-kasa-dorado" />
                  Selecciona una Jornada (1 al {images.length}):
                </span>
                <span>
                  Mostrando {activeIndex + 1} de {images.length}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {images.map((_, idx) => {
                  const isCurrent = activeIndex === idx
                  const label = getJornadaLabel(idx, images.length)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-kasa-vinotinto to-red-950 text-white border border-kasa-dorado shadow-md ring-2 ring-kasa-dorado/30'
                          : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-kasa-dorado' : 'bg-gray-500'}`} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CONTENEDOR PRINCIPAL DEL SLIDER INTERACTIVO */}
            <div 
              className="relative max-w-4xl mx-auto rounded-3xl bg-slate-900/90 border border-white/15 p-3 sm:p-6 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col items-center justify-center select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Botón Flotante Anterior */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title="Jornada Anterior (←)"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Botón Flotante Siguiente */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title="Siguiente Jornada (→)"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Imagen Contenida Sin Recortes (Object Contain) */}
              <div 
                className="relative group w-full flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setLightboxIndex(activeIndex)}
              >
                <img
                  src={images[activeIndex]}
                  alt={`Afiche ${getJornadaLabel(activeIndex, images.length)}`}
                  className="max-h-[62vh] sm:max-h-[72vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                />

                {/* Badge Superior sobre la Imagen */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-kasa-dorado" />
                  <span>{getJornadaLabel(activeIndex, images.length)}</span>
                </div>

                {/* Badge Flotante para Ampliar en Pantalla Completa */}
                <div className="absolute bottom-3 inset-x-3 sm:inset-x-auto sm:right-3 flex items-center justify-center sm:justify-end">
                  <span className="bg-black/80 hover:bg-black backdrop-blur-md text-white text-xs font-black px-4 py-2 rounded-xl border border-white/20 shadow-lg inline-flex items-center gap-1.5 transition-all group-hover:scale-105 group-hover:border-kasa-dorado">
                    <ZoomIn className="w-4 h-4 text-kasa-dorado" />
                    <span>Toca para ver en pantalla completa</span>
                  </span>
                </div>
              </div>

              {/* Controles y Navegación Inferior del Slider */}
              <div className="w-full mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 px-2 font-medium">
                <span className="hidden sm:inline">Desliza o usa las flechas del teclado</span>
                <span className="sm:hidden font-bold text-gray-300">Desliza con el dedo (Swipe)</span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(activeIndex)}
                    className="text-kasa-dorado hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" /> Ver en Pantalla Completa
                  </button>
                </div>
              </div>
            </div>

            {/* TIRA DE MINIATURAS (FILMSTRIP) */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-gray-400 px-1">Todas las Jornadas del Torneo:</p>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
                {images.map((url, idx) => {
                  const isCurrent = activeIndex === idx
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`relative shrink-0 w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-kasa-dorado shadow-lg ring-2 ring-kasa-dorado/40 scale-105'
                          : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-black text-white px-1.5 py-0.5 rounded-sm">
                        #{idx + 1}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

          </section>
        ) : (
          /* Estado Vacío Elegante */
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/10 text-kasa-dorado flex items-center justify-center mx-auto shadow-inner">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">El calendario de la próxima jornada está en preparación</h3>
              <p className="text-xs text-gray-400 mt-1">
                La comisión técnica está cargando los horarios y canchas oficiales. Puedes consultarnos de inmediato por WhatsApp.
              </p>
            </div>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Escribir a la Comisión Técnica
              </a>
            )}
          </div>
        )}

      </main>

      {/* LIGHTBOX MODAL FULLSCREEN INTERACTIVO CON ZOOM */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Botón Cerrar */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Botón Anterior */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newIdx = (lightboxIndex - 1 + images.length) % images.length
                setLightboxIndex(newIdx)
                setActiveIndex(newIdx)
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shadow-xl backdrop-blur-md"
              title="Anterior"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Botón Siguiente */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newIdx = (lightboxIndex + 1) % images.length
                setLightboxIndex(newIdx)
                setActiveIndex(newIdx)
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shadow-xl backdrop-blur-md"
              title="Siguiente"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Contenedor de la Imagen */}
          <div 
            className="relative max-w-5xl max-h-[92vh] flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt={`Calendario ${getJornadaLabel(lightboxIndex, images.length)}`}
              className="max-h-[86vh] max-w-full w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-300 font-bold bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <span className="text-kasa-dorado">{getJornadaLabel(lightboxIndex, images.length)}</span>
              <span>•</span>
              <span>Afiche {lightboxIndex + 1} de {images.length}</span>
              <span>•</span>
              <a
                href={images[lightboxIndex]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-kasa-dorado hover:underline inline-flex items-center gap-1"
              >
                Tamaño Original <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-white/10 bg-slate-950 py-8 px-4 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Kasa Sports. Todos los derechos reservados.</p>
        <p className="mt-1">Ecosistema inteligente para la gestión de ligas deportivas.</p>
      </footer>

    </div>
  )
}
