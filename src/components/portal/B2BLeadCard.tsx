'use client'

import React from 'react'
import { Trophy, Sparkles, MessageCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react'

interface B2BLeadCardProps {
  whatsappNumber?: string | null
  sourceContext?: string
  className?: string
  compact?: boolean
}

/**
 * B2BLeadCard: Componente de captación y conversión de clientes (Ligas, Clubes, Academias).
 * Ubicado estratégicamente en la verificación pública del QR y en el portal de atletas.
 * Convierte el tráfico natural de árbitros, mánagers y organizadores en leads calificados.
 */
export default function B2BLeadCard({
  whatsappNumber,
  sourceContext = 'Credencial QR',
  className = '',
  compact = false,
}: B2BLeadCardProps) {
  // Limpiar número o usar fallback por defecto del club
  const cleanPhone = (whatsappNumber || '584120000000').replace(/[^0-9]/g, '')
  
  const messageText = encodeURIComponent(
    `¡Hola equipo KsaSport! Vi su sistema a través de la ${sourceContext} y me gustaría conocer los planes para digitalizar mi propia liga / torneo deportivo.`
  )
  
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${messageText}`

  if (compact) {
    return (
      <div className={`rounded-2xl p-4 bg-gradient-to-br from-[#1C0307] via-kasa-vinotinto to-[#2B060D] text-white border border-kasa-dorado/30 shadow-premium relative overflow-hidden ${className}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-kasa-dorado/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-kasa-dorado border border-white/15 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">¿Diriges un club o liga?</p>
              <p className="text-[10px] text-white/70 truncate">Digitaliza tus carnets y pagos con KsaSport</p>
            </div>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-3 py-1.5 rounded-xl bg-kasa-dorado hover:bg-yellow-400 text-kasa-vinotinto text-[11px] font-black tracking-wider flex items-center gap-1 transition-transform active:scale-95 shadow-md"
          >
            <span>Demo</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#1C0307] via-kasa-vinotinto to-[#140105] text-white border border-kasa-dorado/35 shadow-premium relative overflow-hidden group ${className}`}>
      {/* Halo de luz dorada ambiental */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-kasa-dorado/15 rounded-full blur-3xl pointer-events-none group-hover:bg-kasa-dorado/25 transition-colors duration-500" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-red-900/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        
        {/* Contenido Editorial */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-black text-kasa-dorado uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-kasa-dorado animate-pulse" />
            <span>KsaSport Cloud Platform</span>
          </div>

          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
            ¿Diriges un torneo, academia o liga deportiva?
          </h3>

          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Elimina planillas de papel y comprobantes desordenados. Gestiona inscripciones, solvencias en tiempo real, cantina a crédito y carnets digitales QR antifraude con tu propia marca.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold text-white/70">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Validación en campo
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-kasa-dorado" /> Pagos multimoneda (USD / Bs / EUR)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Estadísticas oficiales
            </span>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="shrink-0 w-full sm:w-auto">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-kasa-dorado via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-kasa-vinotinto font-black text-xs sm:text-sm tracking-wide transition-all duration-300 shadow-lg shadow-kasa-dorado/20 hover:shadow-xl hover:shadow-kasa-dorado/30 active:scale-95 text-center cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-kasa-vinotinto" />
            <span>Solicitar Demo para mi Liga</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-[10px] text-center text-white/50 mt-2">
            Atención directa para directores y mánagers
          </p>
        </div>

      </div>
    </div>
  )
}
