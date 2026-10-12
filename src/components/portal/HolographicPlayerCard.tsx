'use client'

import React, { useState, useRef, useCallback } from 'react'
import { 
  Trophy, ShieldCheck, Sparkles, Share2, Download, 
  CheckCircle2, AlertOctagon, Rotate3d, Copy, Check
} from 'lucide-react'
import { formatCedula } from '@/lib/cedula'
import { toast } from 'sonner'
import BrandLogo from '@/components/ui/BrandLogo'

export interface HolographicPlayerCardProps {
  athlete: {
    id: string
    name: string
    cedula: string | number
    status: string
    avatar_url?: string | null
    position?: string | null
    stats_avg?: number | string | null
    stats_hits?: number | string | null
    stats_rbi?: number | string | null
    stats_runs?: number | string | null
    paid_until?: string | null
  }
  team?: {
    name?: string | null
    logo_url?: string | null
    category?: string | null
  } | null
  className?: string
  showShareActions?: boolean
}

/**
 * HolographicPlayerCard: Cromo deportivo 3D holográfico de alta gama.
 * - Física interactiva 3D Tilt por cursor / giroscopio táctil.
 * - Brillo holográfico tornasol (Sheen Shader nativo con CSS).
 * - Renderizador a Canvas 1080x1920 para exportar directamente a Estados de WhatsApp e Historias de Instagram.
 * - Genera sensación "WAO" e impulsa la viralidad orgánica de KsaSport.
 */
export default function HolographicPlayerCard({
  athlete,
  team,
  className = '',
  showShareActions = true,
}: HolographicPlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const isSolvente = athlete.status === 'Solvente'
  const formattedAvg = athlete.stats_avg
    ? Number(athlete.stats_avg).toFixed(3).replace('0.', '.')
    : '.000'

  // Manejador del 3D Tilt táctil y con cursor
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Rotación máxima de 15 grados en X e Y
    const rotX = ((y - centerY) / centerY) * -12
    const rotY = ((x - centerX) / centerX) * 12

    setRotateX(rotX)
    setRotateY(rotY)
    setSheenPos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    })
  }, [])

  const handlePointerEnter = () => {
    setIsHovered(true)
  }

  const handlePointerLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
    setSheenPos({ x: 50, y: 50 })
  }

  // Generador nativo del afiche 1080x1920 para WhatsApp / Instagram Stories
  const handleExportStory = async () => {
    setIsExporting(true)
    const toastId = toast.loading('Generando tu Cromo Pro para historias...')

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('No se pudo inicializar Canvas')

      // 1. Fondo atmosférico de estadio
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920)
      bgGrad.addColorStop(0, '#190206')
      bgGrad.addColorStop(0.35, '#3B0813')
      bgGrad.addColorStop(0.7, '#190206')
      bgGrad.addColorStop(1, '#0D0103')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, 1080, 1920)

      // 2. Luces de estadio (Spotlights circulares)
      const light1 = ctx.createRadialGradient(250, 200, 10, 250, 200, 600)
      light1.addColorStop(0, 'rgba(212, 175, 55, 0.22)')
      light1.addColorStop(1, 'transparent')
      ctx.fillStyle = light1
      ctx.fillRect(0, 0, 1080, 1000)

      const light2 = ctx.createRadialGradient(850, 250, 10, 850, 250, 600)
      light2.addColorStop(0, 'rgba(212, 175, 55, 0.18)')
      light2.addColorStop(1, 'transparent')
      ctx.fillStyle = light2
      ctx.fillRect(0, 0, 1080, 1000)

      // 3. Cabecera KsaSport en la historia
      ctx.fillStyle = '#D4AF37'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '6px'
      ctx.fillText('★ KSA SPORTS OFFICIAL ATHLETE ★', 540, 140)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '500 24px sans-serif'
      ctx.letterSpacing = '2px'
      ctx.fillText('TEMPORADA OFICIAL 2026', 540, 185)

      // 4. Tarjeta Central (Contenedor Cromo)
      const cardX = 90
      const cardY = 240
      const cardW = 900
      const cardH = 1420
      const radius = 48

      // Sombra proyectada
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
      ctx.shadowBlur = 50
      ctx.shadowOffsetY = 25

      // Fondo de la tarjeta
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, radius)
      const cardBg = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
      cardBg.addColorStop(0, '#26040A')
      cardBg.addColorStop(0.5, '#5A0F1D')
      cardBg.addColorStop(1, '#1A0206')
      ctx.fillStyle = cardBg
      ctx.fill()

      // Borde Dorado Metalizado
      ctx.shadowColor = 'transparent'
      ctx.lineWidth = 6
      const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
      borderGrad.addColorStop(0, '#F5DE88')
      borderGrad.addColorStop(0.5, '#D4AF37')
      borderGrad.addColorStop(1, '#856404')
      ctx.strokeStyle = borderGrad
      ctx.stroke()

      // Borde interior fino
      ctx.lineWidth = 1.5
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.roundRect(cardX + 16, cardY + 16, cardW - 32, cardH - 32, radius - 16)
      ctx.stroke()

      // 5. Categoría y Estatus Pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
      ctx.beginPath()
      ctx.roundRect(cardX + 40, cardY + 45, 340, 56, 28)
      ctx.fill()
      ctx.fillStyle = '#D4AF37'
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'left'
      ctx.letterSpacing = '2px'
      ctx.fillText(team?.category?.toUpperCase() || 'CATEGORÍA LIBRE', cardX + 70, cardY + 81)

      // Pill de Solvencia
      ctx.fillStyle = isSolvente ? '#059669' : '#DC2626'
      ctx.beginPath()
      ctx.roundRect(cardX + cardW - 360, cardY + 45, 320, 56, 28)
      ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(isSolvente ? '● HABILITADA OFICIAL' : '● EN REVISIÓN', cardX + cardW - 200, cardY + 81)

      // 6. Foto del Atleta
      const avatarCenterX = 540
      const avatarCenterY = cardY + 420
      const avatarRadius = 220

      // Halo del avatar
      ctx.beginPath()
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 10, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(212, 175, 55, 0.4)'
      ctx.fill()
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 5
      ctx.stroke()

      // Si tiene foto, intentamos cargarla o usamos el fallback de iniciales
      let imageLoaded = false
      if (athlete.avatar_url) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = athlete.avatar_url!
          })
          ctx.save()
          ctx.beginPath()
          ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(img, avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
          ctx.restore()
          imageLoaded = true
        } catch {
          imageLoaded = false
        }
      }

      if (!imageLoaded) {
        ctx.beginPath()
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#420B15'
        ctx.fill()
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 130px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(athlete.name.slice(0, 2).toUpperCase() || 'KS', avatarCenterX, avatarCenterY + 45)
      }

      // 7. Nombre y Equipo
      ctx.textAlign = 'center'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 64px sans-serif'
      ctx.letterSpacing = '3px'
      ctx.fillText(athlete.name.toUpperCase(), 540, cardY + 740)

      ctx.fillStyle = '#D4AF37'
      ctx.font = 'bold 36px sans-serif'
      ctx.letterSpacing = '4px'
      ctx.fillText(team?.name?.toUpperCase() || 'KSA SPORTS ROSTER', 540, cardY + 805)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.font = '500 26px monospace'
      ctx.fillText(`C.I. ${formatCedula(athlete.cedula)}`, 540, cardY + 855)

      // 8. Grid de Estadísticas (4 Cuadros Profesionales)
      const statsY = cardY + 920
      const statW = 185
      const statH = 160
      const statGap = 20
      const startX = 540 - ((statW * 4 + statGap * 3) / 2)

      const statsData = [
        { label: 'AVG', value: formattedAvg, color: '#D4AF37' },
        { label: 'HITS', value: String(athlete.stats_hits || 0), color: '#FFFFFF' },
        { label: 'CI', value: String(athlete.stats_rbi || 0), color: '#FFFFFF' },
        { label: 'CA', value: String(athlete.stats_runs || 0), color: '#FFFFFF' },
      ]

      statsData.forEach((st, idx) => {
        const sx = startX + idx * (statW + statGap)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.beginPath()
        ctx.roundRect(sx, statsY, statW, statH, 24)
        ctx.fill()
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
        ctx.font = 'bold 22px sans-serif'
        ctx.letterSpacing = '1px'
        ctx.fillText(st.label, sx + statW / 2, statsY + 48)

        ctx.fillStyle = st.color
        ctx.font = 'bold 50px sans-serif'
        ctx.fillText(st.value, sx + statW / 2, statsY + 120)
      })

      // 9. Pie de Tarjeta Antifraude
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = 'bold 24px sans-serif'
      ctx.letterSpacing = '2px'
      ctx.fillText('FICHA OFICIAL DIGITAL • VERIFICACIÓN ANTIFRAUDE', 540, cardY + cardH - 65)

      // 10. Pie Viral de la Historia (Atrae Clientes)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 28px sans-serif'
      ctx.letterSpacing = '1px'
      ctx.fillText('¿Quieres este sistema para tu liga o club?', 540, 1760)

      ctx.fillStyle = '#D4AF37'
      ctx.font = 'bold 32px sans-serif'
      ctx.fillText('ksasport.com • El Ecosistema Deportivo Inteligente', 540, 1815)

      // Convertir a blob
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('No se pudo generar la imagen')
        
        const fileName = `cromo-pro-${athlete.name.toLowerCase().replace(/\s+/g, '-')}.png`
        const file = new File([blob], fileName, { type: 'image/png' })

        // Si el navegador soporta compartir archivos nativamente (móviles / Web Share API)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Ficha Oficial de ${athlete.name} | KsaSport`,
              text: `¡Mira mi cromo oficial de kickingball de esta temporada en KsaSport!`,
            })
            toast.success('¡Listo para compartir en tu estado!', { id: toastId })
            setIsExporting(false)
            return
          } catch (err: any) {
            if (err.name === 'AbortError') {
              setIsExporting(false)
              toast.dismiss(toastId)
              return
            }
          }
        }

        // Descarga de archivo como fallback
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)

        toast.success('¡Cromo descargado en alta resolución! Súbelo a tus estados de WhatsApp o Instagram.', {
          id: toastId,
          duration: 4000,
        })
        setIsExporting(false)
      }, 'image/png')
    } catch (err: any) {
      console.error(err)
      toast.error('Ocurrió un error al generar el cromo', { id: toastId })
      setIsExporting(false)
    }
  }

  const handleCopyVerifyLink = () => {
    const url = `${window.location.origin}/portal/verify/${athlete.id}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    toast.success('Enlace de credencial oficial copiado al portapapeles')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      
      {/* TARJETA 3D INTERACTIVA */}
      <div 
        className="w-full max-w-[340px] sm:max-w-[360px] cursor-grab active:cursor-grabbing select-none"
        style={{ perspective: '1100px' }}
      >
        <div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            transformStyle: 'preserve-3d',
          }}
          className="relative rounded-[2.5rem] p-5 sm:p-6 bg-gradient-to-b from-[#2E040B] via-kasa-vinotinto to-[#140105] text-white border-2 border-kasa-dorado/70 shadow-[0_15px_45px_-10px_rgba(90,15,29,0.5),0_0_20px_rgba(212,175,55,0.25)] overflow-hidden"
        >
          {/* Textura de costuras y líneas deportivas */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none mix-blend-overlay" />

          {/* Destello Holográfico Tornasol Dinámico (Sheen) */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovered ? 0.45 : 0.2,
              background: `radial-gradient(circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.8) 0%, rgba(212,175,55,0.4) 30%, transparent 65%)`,
              mixBlendMode: 'color-dodge',
            }}
          />

          {/* CABECERA DEL CROMO */}
          <div className="relative z-10 flex items-center justify-between mb-4 border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-kasa-dorado animate-ping" />
              <span className="text-[10px] font-black tracking-widest uppercase text-kasa-dorado font-display">
                {team?.category || 'CATEGORÍA LIBRE'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                isSolvente ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              }`}>
                {isSolvente ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertOctagon className="w-3 h-3 text-rose-400" />}
                <span>{isSolvente ? 'Habilitada' : 'Restringida'}</span>
              </span>
            </div>
          </div>

          {/* FOTO DEL ATLETA CON DUAL CREST Y HALO DORADO */}
          <div className="relative z-10 flex flex-col items-center my-2">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-kasa-dorado via-yellow-200 to-kasa-dorado-dark shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                {athlete.avatar_url ? (
                  <img
                    src={athlete.avatar_url}
                    alt={athlete.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-black text-kasa-dorado">
                    {athlete.name?.slice(0, 2).toUpperCase() || 'KS'}
                  </span>
                )}
              </div>

              {/* Escudo del equipo oficial en miniatura acoplado */}
              {team?.logo_url && (
                <div 
                  className="absolute bottom-0 right-0 w-11 h-11 rounded-full bg-white p-0.5 shadow-xl border-2 border-kasa-dorado overflow-hidden flex items-center justify-center"
                  title={team?.name || 'Equipo'}
                >
                  <img
                    src={team.logo_url}
                    alt={team?.name || 'Equipo'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Posición en el campo */}
            {athlete.position && (
              <span className="mt-2.5 inline-block px-3 py-0.5 rounded-full bg-black/40 border border-white/20 text-[10px] font-black uppercase tracking-wider text-amber-200 shadow-sm">
                Posición: {athlete.position}
              </span>
            )}
          </div>

          {/* IDENTIFICACIÓN DEL ATLETA */}
          <div className="relative z-10 text-center my-3">
            <h3 className="text-2xl sm:text-3xl font-display uppercase tracking-wide text-white leading-tight drop-shadow-md">
              {athlete.name}
            </h3>
            <p className="text-xs font-black uppercase tracking-widest text-kasa-dorado mt-0.5">
              {team?.name || 'KsaSport Club'}
            </p>
            <p className="text-[11px] font-mono text-white/60 mt-0.5">
              C.I. {formatCedula(athlete.cedula)}
            </p>
          </div>

          {/* RATINGS / ESTADÍSTICAS PRO */}
          <div className="relative z-10 grid grid-cols-4 gap-2 my-4">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10 shadow-inner">
              <span className="text-[9px] font-black uppercase text-white/60 tracking-wider block">AVG</span>
              <span className="text-base sm:text-lg font-black text-kasa-dorado leading-none mt-1 block">
                {formattedAvg}
              </span>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10 shadow-inner">
              <span className="text-[9px] font-black uppercase text-white/60 tracking-wider block">HITS</span>
              <span className="text-base sm:text-lg font-black text-white leading-none mt-1 block">
                {athlete.stats_hits || 0}
              </span>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10 shadow-inner">
              <span className="text-[9px] font-black uppercase text-white/60 tracking-wider block">CI</span>
              <span className="text-base sm:text-lg font-black text-white leading-none mt-1 block">
                {athlete.stats_rbi || 0}
              </span>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10 shadow-inner">
              <span className="text-[9px] font-black uppercase text-white/60 tracking-wider block">CA</span>
              <span className="text-base sm:text-lg font-black text-white leading-none mt-1 block">
                {athlete.stats_runs || 0}
              </span>
            </div>
          </div>

          {/* PIE DEL CROMO */}
          <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-kasa-dorado" />
              <span>Verificación Antifraude</span>
            </div>
            <span className="font-mono text-[9px] text-kasa-dorado">
              ID: {athlete.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ACCIONES Y BOTONES DE VIRALIDAD */}
      {showShareActions && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 w-full max-w-sm">
          <button
            type="button"
            onClick={handleExportStory}
            disabled={isExporting}
            className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-kasa-dorado via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-kasa-vinotinto font-black text-xs tracking-wider transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>{isExporting ? 'Generando...' : 'Compartir en Historia'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyVerifyLink}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20 active:scale-95 cursor-pointer"
            title="Copiar enlace oficial de credencial"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">Copiar Link</span>
          </button>
        </div>
      )}

      <p className="text-[11px] text-gray-500 text-center mt-3 flex items-center gap-1.5">
        <Rotate3d className="w-3.5 h-3.5 text-kasa-dorado" />
        <span>Mueve o toca el cromo para activar el reflejo 3D</span>
      </p>
    </div>
  )
}
