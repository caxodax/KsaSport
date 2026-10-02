'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Trophy, Calendar, Download, MessageCircle, ArrowLeft, 
  ExternalLink, ZoomIn, X, ChevronLeft, ChevronRight,
  ShieldCheck, Share2, FileText, CheckCircle2
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const rawWhatsapp = (settings?.whatsapp_number || '').replace(/[^0-9]/g, '')
  const whatsappUrl = rawWhatsapp
    ? `https://wa.me/${rawWhatsapp}?text=${encodeURIComponent('Hola KsaSport, deseo información sobre el calendario de juegos de la temporada.')}`
    : null

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') {
        setLightboxIndex((lightboxIndex + 1) % images.length)
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, images.length])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans selection:bg-kasa-dorado selection:text-kasa-vinotinto">
      
      {/* HEADER DE NAVEGACIÓN SUPERIOR */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Banner Principal */}
        <div className="relative rounded-3xl bg-gradient-to-br from-kasa-vinotinto via-red-950 to-slate-950 border border-white/15 p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-kasa-dorado/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-4">
            
            {/* Badges superiores */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Torneo Activo
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider">
                {settings?.calendar_season || 'Temporada 2026'}
              </span>
            </div>

            {/* Título de la Liga */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {settings?.calendar_title || 'Calendario Oficial de Ligas Activas'}
            </h1>

            {/* Descripción */}
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
              {settings?.calendar_description || 
                'Consulta los partidos, horarios y sedes oficiales de cada jornada. La entrada a las instalaciones es libre para familiares, delegados y fanáticos.'}
            </p>

            {/* Acciones Destacadas (Descargar PDF / WhatsApp) */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              {settings?.calendar_pdf_url && (
                <a
                  href={settings.calendar_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-kasa-dorado to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-kasa-vinotinto font-black text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Descargar Calendario (PDF)</span>
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 transition-all active:scale-95"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span>Consultas por WhatsApp</span>
                </a>
              )}
            </div>

          </div>
        </div>

        {/* GALERÍA DE IMÁGENES / ROL DE JUEGOS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-kasa-dorado" />
                Rol de Juegos y Afiches Oficiales
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Haz clic o pulsa sobre cualquier afiche para verlo en pantalla completa con zoom.
              </p>
            </div>
            
            {images.length > 0 && (
              <span className="text-xs font-bold text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {images.length} {images.length === 1 ? 'Afiche' : 'Afiches'}
              </span>
            )}
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative rounded-3xl overflow-hidden bg-slate-800/80 border border-white/10 shadow-lg cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                    <img
                      src={url}
                      alt={`Jornada ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Overlay interactivo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                    <div className="flex items-center justify-between text-white">
                      <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <ZoomIn className="w-4 h-4 text-kasa-dorado" /> Ampliar Pantalla Completa
                      </span>
                      <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
        </section>

      </main>

      {/* LIGHTBOX MODAL FULLSCREEN */}
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
                setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Botón Siguiente */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((lightboxIndex + 1) % images.length)
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Contenedor de la Imagen */}
          <div 
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt={`Calendario Jornada ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 font-bold">
              <span>Afiche {lightboxIndex + 1} de {images.length}</span>
              <span>•</span>
              <a
                href={images[lightboxIndex]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-kasa-dorado hover:underline inline-flex items-center gap-1"
              >
                Abrir en tamaño original <ExternalLink className="w-3 h-3" />
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
