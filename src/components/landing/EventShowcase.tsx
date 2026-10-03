'use client'

import { motion } from 'framer-motion';
import { CalendarDays, Users, ArrowRight, Download, MessageCircle, Sparkles, Trophy } from 'lucide-react';
import Link from 'next/link';

interface EventShowcaseProps {
  settings?: {
    calendar_title?: string | null;
    calendar_season?: string | null;
    calendar_description?: string | null;
    calendar_images?: string[] | null;
    calendar_pdf_url?: string | null;
    calendar_is_active?: boolean | null;
    whatsapp_number?: string | null;
  } | null;
}

export default function EventShowcase({ settings }: EventShowcaseProps) {
  const images = Array.isArray(settings?.calendar_images) ? settings.calendar_images : []
  const hasImages = images.length > 0
  const hasPdf = Boolean(settings?.calendar_pdf_url)

  const rawWhatsapp = (settings?.whatsapp_number || '').replace(/[^0-9]/g, '')
  const tryoutsWhatsappUrl = rawWhatsapp
    ? `https://wa.me/${rawWhatsapp}?text=${encodeURIComponent('Hola KsaSport, deseo información sobre las fechas de los próximos tryouts y pruebas de talento.')}`
    : '/login?tab=signup'

  return (
    <section id="eventos" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight"
          >
            Tu momento de brillar.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            Ya sea que busques entrar a un equipo competitivo o quieras seguir los resultados de tu liga favorita.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: Ligas Activas (Magnética y muy visual) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            {/* Glow decorativo de fondo */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-kasa-vinotinto/30 rounded-full blur-3xl pointer-events-none group-hover:bg-kasa-dorado/20 transition-colors duration-700"></div>

            <div className="relative p-8 sm:p-10 z-10 flex flex-col h-full">
              
              {/* Badges superiores */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ligas Activas
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-kasa-dorado border border-white/10 text-xs font-bold uppercase tracking-wider">
                  {settings?.calendar_season || 'Temporada 2026'}
                </span>
                {hasPdf && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Download className="w-3 h-3" /> PDF Disponible
                  </span>
                )}
              </div>

              {/* Título y descripción */}
              <h3 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
                {settings?.calendar_title || 'Calendario Oficial de Partidos'}
              </h3>
              
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                {settings?.calendar_description || 
                  'Consulta los horarios, canchas oficiales y resultados de cada jornada. Abierto para toda la comunidad deportiva, familiares y fanáticos.'}
              </p>

              {/* Miniatura visual del calendario o preview */}
              {hasImages ? (
                <div className="mb-6 rounded-2xl overflow-hidden border border-white/15 bg-black/40 relative aspect-[16/9] group-hover:border-kasa-dorado/50 transition-colors">
                  <img 
                    src={images[0]} 
                    alt="Rol de Juegos Preview" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-kasa-dorado" /> Afiche oficial de la jornada disponible
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <CalendarDays className="w-8 h-8 text-kasa-dorado shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Jornadas oficiales de Sábados y Domingos</p>
                    <p className="text-gray-400">Rol de juegos y fixture completo sin necesidad de iniciar sesión.</p>
                  </div>
                </div>
              )}

              {/* Acciones principales */}
              <div className="mt-auto pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link 
                  href="/calendario" 
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-kasa-dorado to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-kasa-vinotinto font-black text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl transition-all group-hover:shadow-yellow-500/20 active:scale-95"
                >
                  <span>Explorar Calendario Oficial</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>

                {settings?.calendar_pdf_url && (
                  <a
                    href={settings.calendar_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-4 py-3.5 rounded-2xl border border-white/15 transition-all"
                    title="Descargar versión PDF"
                  >
                    <Download className="w-4 h-4 text-kasa-dorado" />
                    <span className="hidden sm:inline">PDF</span>
                  </a>
                )}
              </div>

              <span className="text-[11px] text-gray-400 mt-3 text-center sm:text-left block">
                ● Acceso libre para todo público • No requiere registrarse
              </span>
            </div>
          </motion.div>

          {/* Card 2: Tryouts */}
          <motion.div 
            id="tryouts"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-kasa-vinotinto via-red-950 to-kasa-vinotinto text-white flex flex-col justify-between border border-red-900/50 shadow-xl"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBMMTQgMTRMMjggME0wIDI4TDE0IDE0TDI4IDI4IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4=')] bg-repeat opacity-20"></div>
            
            <div className="relative p-8 sm:p-10 flex flex-col h-full z-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8">
                <Users className="w-8 h-8 text-kasa-dorado" />
              </div>
              
              <div className="mb-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider">
                  Captación de Talento
                </span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Scouting y Tryouts</h3>
              <p className="text-white/80 text-base mb-8 max-w-md leading-relaxed">
                ¿Tienes talento para el Béisbol o Kickingball? Regístrate en nuestras próximas pruebas y forma parte de nuestros equipos en competencia oficial.
              </p>
              
              <div className="mt-auto pt-6">
                <a 
                  href={tryoutsWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-kasa-vinotinto font-black text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl transition-all active:scale-95 group-hover:shadow-white/20"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <span>Consultar Fechas por WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Decorative Abstract Element */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-900 rounded-full blur-3xl opacity-50 group-hover:bg-kasa-dorado transition-colors duration-700 pointer-events-none"></div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
