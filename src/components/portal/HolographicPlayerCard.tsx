'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Trophy, ShieldCheck, Sparkles, Share2, Download, 
  CheckCircle2, AlertOctagon, Rotate3d, Copy, Check, Smartphone
} from 'lucide-react'
import { formatCedula } from '@/lib/cedula'
import { toast } from 'sonner'

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
 * Carga una imagen de forma segura para Canvas HTML5 evitando restricciones de CORS
 * y canvas tainting mediante nuestro endpoint proxy interno.
 */
async function loadImageForCanvas(url?: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null

  try {
    // Si ya es un blob o data URL local, cargarlo directamente
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = url
      })
    }

    // Usar el proxy same-origin de KsaSport para evitar bloqueos CORS
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl)
    if (!res.ok) {
      console.warn('Proxy error loading image for canvas:', res.status, url)
      return null
    }

    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(null)
      }
      img.src = objectUrl
    })
  } catch (err) {
    console.warn('Error en loadImageForCanvas:', err)
    return null
  }
}

/**
 * HolographicPlayerCard: Cromo deportivo 3D holográfico de alta gama.
 * - Giroscopio físico nativo (DeviceOrientation) para inclinación 3D al mover el teléfono en la mano.
 * - Soporte táctil y de ratón (Pointer / Touch drag).
 * - Brillo holográfico tornasol (Sheen Shader nativo con CSS).
 * - Renderizador a Canvas 1080x1920 con soporte de foto del atleta y escudo oficial del equipo.
 * - Exportación limpia para WhatsApp Status / Instagram Stories con Web Share nativo y descarga en HD.
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
  const [isInteracting, setIsInteracting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [gyroActive, setGyroActive] = useState(false)
  const [needsIosPermission, setNeedsIosPermission] = useState(false)
  const [avatarImgError, setAvatarImgError] = useState(false)
  const [teamLogoError, setTeamLogoError] = useState(false)

  const isSolvente = athlete.status === 'Solvente'
  const formattedAvg = athlete.stats_avg
    ? Number(athlete.stats_avg).toFixed(3).replace('0.', '.')
    : '.000'

  // Manejador del giroscopio físico del dispositivo (mover el teléfono en el aire)
  const handleDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return

    // gamma: rotación lateral izquierda/derecha (-90 a 90)
    // beta: inclinación adelante/atrás (-180 a 180). Normalmente sostener el teléfono está entre 30 y 60 grados.
    const gamma = Math.max(-28, Math.min(28, e.gamma))
    const beta = Math.max(15, Math.min(65, e.beta))

    // Convertir a rotación 3D (+/- 14 grados)
    const rotY = (gamma / 28) * 14
    const rotX = -((beta - 42) / 23) * 14

    setRotateX(rotX)
    setRotateY(rotY)

    // Ajustar posición del destello holográfico
    const sheenX = Math.round(50 + (gamma / 28) * 45)
    const sheenY = Math.round(50 + ((beta - 42) / 23) * 45)
    setSheenPos({
      x: Math.max(5, Math.min(95, sheenX)),
      y: Math.max(5, Math.min(95, sheenY)),
    })
  }, [])

  // Inicializar sensor de movimiento
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Verificar si es iOS 13+ que requiere permiso explícito del usuario
    if (
      typeof (window as any).DeviceOrientationEvent !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent?.requestPermission === 'function'
    ) {
      setNeedsIosPermission(true)
    } else if (typeof window.DeviceOrientationEvent !== 'undefined') {
      // Android / navegadores estándar: activar de inmediato
      window.addEventListener('deviceorientation', handleDeviceOrientation, true)
      setGyroActive(true)

      return () => {
        window.removeEventListener('deviceorientation', handleOrientationCleanup, true)
      }
    }

    function handleOrientationCleanup(e: DeviceOrientationEvent) {
      handleDeviceOrientation(e)
    }
  }, [handleDeviceOrientation])

  // Activar sensor de movimiento en iOS tras interacción
  const enableIosGyroscope = async () => {
    if (
      typeof (window as any).DeviceOrientationEvent !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent?.requestPermission === 'function'
    ) {
      try {
        const response = await (window as any).DeviceOrientationEvent.requestPermission()
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation, true)
          setGyroActive(true)
          setNeedsIosPermission(false)
          toast.success('¡Sensor 3D activado! Mueve tu teléfono para ver el reflejo.')
        } else {
          toast.info('Permiso denegado. Puedes usar tu dedo sobre el cromo.')
        }
      } catch (err) {
        console.warn('Error al solicitar permiso de giroscopio:', err)
      }
    }
  }

  // Manejador del 3D Tilt táctil y con ratón
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Rotación máxima de 15 grados en X e Y
    const rotX = ((y - centerY) / centerY) * -14
    const rotY = ((x - centerX) / centerX) * 14

    setRotateX(rotX)
    setRotateY(rotY)
    setSheenPos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    })
  }, [])

  const handlePointerEnter = () => {
    setIsInteracting(true)
    if (needsIosPermission) {
      enableIosGyroscope()
    }
  }

  const handlePointerLeave = () => {
    setIsInteracting(false)
    // Si no hay giroscopio activo, regresar a la posición neutra
    if (!gyroActive) {
      setRotateX(0)
      setRotateY(0)
      setSheenPos({ x: 50, y: 50 })
    }
  }

  // Generador Canvas 1080x1920 con soporte para Foto del Atleta y Escudo del Equipo
  const generateCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo inicializar Canvas')

    // Cargar en paralelo la foto del atleta y el escudo del equipo vía proxy same-origin
    const [avatarImg, teamLogoImg] = await Promise.all([
      loadImageForCanvas(athlete.avatar_url),
      loadImageForCanvas(team?.logo_url),
    ])

    // 1. Fondo atmosférico de estadio Vinotinto de noche
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920)
    bgGrad.addColorStop(0, '#190206')
    bgGrad.addColorStop(0.35, '#3B0813')
    bgGrad.addColorStop(0.7, '#190206')
    bgGrad.addColorStop(1, '#0D0103')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 1080, 1920)

    // 2. Luces de estadio (Spotlights doradas ambientales)
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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.font = '500 24px sans-serif'
    ctx.letterSpacing = '2px'
    ctx.fillText('TEMPORADA OFICIAL 2026', 540, 185)

    // 4. Tarjeta Central (Contenedor Cromo)
    const cardX = 80
    const cardY = 220
    const cardW = 920
    const cardH = 1440
    const radius = 48

    // Sombra proyectada
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 55
    ctx.shadowOffsetY = 30

    // Fondo de la tarjeta con gradiente Vinotinto Metalizado
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, radius)
    const cardBg = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
    cardBg.addColorStop(0, '#24040A')
    cardBg.addColorStop(0.5, '#560E1C')
    cardBg.addColorStop(1, '#1A0206')
    ctx.fillStyle = cardBg
    ctx.fill()

    // Borde exterior Dorado Metalizado
    ctx.shadowColor = 'transparent'
    ctx.lineWidth = 7
    const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
    borderGrad.addColorStop(0, '#F5DE88')
    borderGrad.addColorStop(0.5, '#D4AF37')
    borderGrad.addColorStop(1, '#856404')
    ctx.strokeStyle = borderGrad
    ctx.stroke()

    // Borde interior fino
    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.beginPath()
    ctx.roundRect(cardX + 16, cardY + 16, cardW - 32, cardH - 32, radius - 16)
    ctx.stroke()

    // 5. Watermark de fondo con el escudo del equipo (Sentido de pertenencia institucional)
    if (teamLogoImg) {
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, radius)
      ctx.clip()
      ctx.globalAlpha = 0.08
      const wmSize = 700
      ctx.drawImage(
        teamLogoImg,
        cardX + (cardW - wmSize) / 2,
        cardY + (cardH - wmSize) / 2,
        wmSize,
        wmSize
      )
      ctx.restore()
    }

    // 6. Pill de Categoría y Escudo en la Cabecera de la Tarjeta
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.beginPath()
    ctx.roundRect(cardX + 40, cardY + 45, 360, 60, 30)
    ctx.fill()
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Mini logo del equipo en cabecera si existe
    if (teamLogoImg) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(cardX + 75, cardY + 75, 20, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(teamLogoImg, cardX + 55, cardY + 55, 40, 40)
      ctx.restore()
      ctx.beginPath()
      ctx.arc(cardX + 75, cardY + 75, 20, 0, Math.PI * 2)
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.fillStyle = '#D4AF37'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'left'
    ctx.letterSpacing = '2px'
    ctx.fillText(
      team?.category?.toUpperCase() || 'KICKINGBALL',
      teamLogoImg ? cardX + 110 : cardX + 65,
      cardY + 83
    )

    // Pill de Solvencia Arbitral
    ctx.fillStyle = isSolvente ? '#059669' : '#DC2626'
    ctx.beginPath()
    ctx.roundRect(cardX + cardW - 350, cardY + 45, 310, 60, 30)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(isSolvente ? '● HABILITADA OFICIAL' : '● EN REVISIÓN', cardX + cardW - 195, cardY + 83)

    // 7. Foto del Atleta (Avatar Central con Pro Cover Crop)
    const avatarCenterX = 540
    const avatarCenterY = cardY + 420
    const avatarRadius = 210

    // Halo y sombra dorada alrededor de la foto
    ctx.beginPath()
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 8, 0, Math.PI * 2)
    ctx.strokeStyle = '#D4AF37'
    ctx.lineWidth = 6
    ctx.stroke()

    if (avatarImg) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2)
      ctx.clip()

      // Aspect ratio crop (Object-fit cover)
      const aspect = avatarImg.width / avatarImg.height
      let sWidth = avatarImg.width
      let sHeight = avatarImg.height
      let sx = 0
      let sy = 0
      if (aspect > 1) {
        sWidth = avatarImg.height
        sx = (avatarImg.width - sWidth) / 2
      } else {
        sHeight = avatarImg.width
        sy = (avatarImg.height - sHeight) / 2
      }

      ctx.drawImage(
        avatarImg,
        sx,
        sy,
        sWidth,
        sHeight,
        avatarCenterX - avatarRadius,
        avatarCenterY - avatarRadius,
        avatarRadius * 2,
        avatarRadius * 2
      )
      ctx.restore()
    } else {
      // Fallback de iniciales de lujo
      ctx.beginPath()
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#3E0812'
      ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 125px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(athlete.name.slice(0, 2).toUpperCase() || 'KS', avatarCenterX, avatarCenterY + 45)
    }

    // 8. Escudo Oficial del Equipo Acoplado al Avatar (Dual-Crest Club Badge)
    const badgeX = avatarCenterX + 140
    const badgeY = avatarCenterY + 140
    const badgeR = 70

    // Fondo blanco circular del badge para máxima nitidez del escudo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 8

    ctx.beginPath()
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()

    ctx.shadowColor = 'transparent'
    ctx.lineWidth = 5
    ctx.strokeStyle = '#D4AF37'
    ctx.stroke()

    if (teamLogoImg) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(badgeX, badgeY, badgeR - 4, 0, Math.PI * 2)
      ctx.clip()
      const pad = 12
      const logoW = (badgeR - pad) * 2
      ctx.drawImage(teamLogoImg, badgeX - logoW / 2, badgeY - logoW / 2, logoW, logoW)
      ctx.restore()
    } else {
      ctx.fillStyle = '#5A0F1D'
      ctx.beginPath()
      ctx.arc(badgeX, badgeY, badgeR - 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#D4AF37'
      ctx.font = 'bold 45px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(team?.name?.slice(0, 2).toUpperCase() || 'EQ', badgeX, badgeY + 16)
    }

    // Posición del jugador pill
    if (athlete.position) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.beginPath()
      ctx.roundRect(avatarCenterX - 140, avatarCenterY + avatarRadius + 18, 280, 44, 22)
      ctx.fill()
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = '#F5DE88'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '2px'
      ctx.fillText(`POSICIÓN: ${athlete.position.toUpperCase()}`, avatarCenterX, avatarCenterY + avatarRadius + 47)
    }

    // 9. Nombre del Atleta (Tipografía de impacto deportivo)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 62px sans-serif'
    ctx.letterSpacing = '3px'
    ctx.fillText(athlete.name.toUpperCase(), 540, cardY + 735)

    // 10. Sección de Identidad de Equipo (Nombre + Escudo Oficial alineados)
    const teamNameStr = team?.name?.toUpperCase() || 'KSA SPORTS CLUB'
    ctx.font = 'bold 36px sans-serif'
    const teamNameMetrics = ctx.measureText(teamNameStr)

    if (teamLogoImg) {
      const inlineLogoSize = 48
      const gap = 14
      const totalWidth = inlineLogoSize + gap + teamNameMetrics.width
      const startX = 540 - totalWidth / 2

      // Mini escudo junto al nombre
      ctx.save()
      ctx.beginPath()
      ctx.arc(startX + inlineLogoSize / 2, cardY + 795 - 12, inlineLogoSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(teamLogoImg, startX, cardY + 795 - 12 - inlineLogoSize / 2, inlineLogoSize, inlineLogoSize)
      ctx.restore()

      ctx.beginPath()
      ctx.arc(startX + inlineLogoSize / 2, cardY + 795 - 12, inlineLogoSize / 2, 0, Math.PI * 2)
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Texto de equipo en dorado brillante
      ctx.textAlign = 'left'
      ctx.fillStyle = '#D4AF37'
      ctx.letterSpacing = '3px'
      ctx.fillText(teamNameStr, startX + inlineLogoSize + gap, cardY + 795)
    } else {
      ctx.textAlign = 'center'
      ctx.fillStyle = '#D4AF37'
      ctx.letterSpacing = '4px'
      ctx.fillText(teamNameStr, 540, cardY + 795)
    }

    // Cédula de Identidad
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.font = '500 26px monospace'
    ctx.letterSpacing = '2px'
    ctx.fillText(`C.I. ${formatCedula(athlete.cedula)}`, 540, cardY + 845)

    // 11. Grid de Estadísticas Oficiales (4 Bloques)
    const statsY = cardY + 915
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

    // 12. Pie de Tarjeta Antifraude
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.font = 'bold 24px sans-serif'
    ctx.letterSpacing = '2px'
    ctx.fillText('FICHA OFICIAL DIGITAL • VERIFICACIÓN ANTIFRAUDE', 540, cardY + cardH - 65)

    // 13. Pie Comercial de Conversión B2B
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px sans-serif'
    ctx.letterSpacing = '1px'
    ctx.fillText('¿Quieres este sistema para tu liga o club?', 540, 1755)

    ctx.fillStyle = '#D4AF37'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText('ksasport.com • El Ecosistema Deportivo Inteligente', 540, 1810)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  }

  // Descargar archivo blob localmente
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  // Compartir en Historia de WhatsApp / Instagram usando Web Share API nativo con solo el archivo adjunto
  const handleShareStory = async () => {
    setIsExporting(true)
    const toastId = toast.loading('Generando cromo con tu foto y escudo oficial...')

    try {
      const blob = await generateCanvasBlob()
      if (!blob) throw new Error('No se pudo generar la imagen')

      const fileName = `cromo-pro-${athlete.name.toLowerCase().replace(/\s+/g, '-')}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // Web Share API nativo (móviles)
      // REGLA CRÍTICA: Enviar ÚNICAMENTE files: [file] sin text/title para evitar que WhatsApp descarte la imagen.
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
          })
          toast.success('¡Cromo listo! Selecciónalo para tu estado o historia.', { id: toastId })
          setIsExporting(false)
          return
        } catch (err: any) {
          if (err.name === 'AbortError') {
            setIsExporting(false)
            toast.dismiss(toastId)
            return
          }
          console.warn('Share intent error, falling back to download:', err)
        }
      }

      // Si no soporta compartir directamente o hubo error, descargar la imagen en la galería
      downloadBlob(blob, fileName)
      toast.success('¡Cromo guardado en tu galería! Súbelo a WhatsApp o Instagram.', {
        id: toastId,
        duration: 5000,
      })
      setIsExporting(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Ocurrió un error al generar el cromo', { id: toastId })
      setIsExporting(false)
    }
  }

  // Descarga directa en Alta Resolución
  const handleDownloadDirect = async () => {
    setIsExporting(true)
    const toastId = toast.loading('Descargando cromo en alta resolución...')

    try {
      const blob = await generateCanvasBlob()
      if (!blob) throw new Error('No se pudo generar la imagen')

      const fileName = `cromo-pro-${athlete.name.toLowerCase().replace(/\s+/g, '-')}.png`
      downloadBlob(blob, fileName)

      toast.success('¡Cromo guardado en tu galería!', { id: toastId })
      setIsExporting(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Error al descargar el cromo', { id: toastId })
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
        onClick={needsIosPermission ? enableIosGyroscope : undefined}
      >
        <div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: isInteracting ? 'transform 0.08s ease-out' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transformStyle: 'preserve-3d',
            touchAction: 'none',
          }}
          className="relative rounded-[2.5rem] p-5 sm:p-6 bg-gradient-to-b from-[#2E040B] via-kasa-vinotinto to-[#140105] text-white border-2 border-kasa-dorado/70 shadow-[0_15px_45px_-10px_rgba(90,15,29,0.5),0_0_20px_rgba(212,175,55,0.25)] overflow-hidden"
        >
          {/* Watermark del escudo del equipo en la tarjeta 3D en pantalla */}
          {team?.logo_url && !teamLogoError && (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] overflow-hidden"
              aria-hidden="true"
            >
              <img 
                src={team.logo_url} 
                alt="" 
                className="w-72 h-72 object-contain filter grayscale" 
              />
            </div>
          )}

          {/* Textura de costuras y líneas deportivas */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none mix-blend-overlay" />

          {/* Destello Holográfico Tornasol Dinámico (Sheen) */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isInteracting || gyroActive ? 0.45 : 0.22,
              background: `radial-gradient(circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.85) 0%, rgba(212,175,55,0.45) 30%, transparent 65%)`,
              mixBlendMode: 'color-dodge',
            }}
          />

          {/* CABECERA DEL CROMO */}
          <div className="relative z-10 flex items-center justify-between mb-4 border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              {team?.logo_url && !teamLogoError ? (
                <img
                  src={team.logo_url}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover border border-kasa-dorado/50 shadow-2xs"
                  onError={() => setTeamLogoError(true)}
                />
              ) : (
                <span className="w-2 h-2 rounded-full bg-kasa-dorado animate-ping" />
              )}
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
                {athlete.avatar_url && !avatarImgError ? (
                  <img
                    src={athlete.avatar_url}
                    alt={athlete.name}
                    loading="lazy"
                    decoding="async"
                    onError={() => setAvatarImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-black text-kasa-dorado">
                    {athlete.name?.slice(0, 2).toUpperCase() || 'KS'}
                  </span>
                )}
              </div>

              {/* Escudo del equipo oficial en miniatura acoplado */}
              {team?.logo_url && !teamLogoError && (
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

          {/* IDENTIFICACIÓN DEL ATLETA Y EQUIPO */}
          <div className="relative z-10 text-center my-3">
            <h3 className="text-2xl sm:text-3xl font-display uppercase tracking-wide text-white leading-tight drop-shadow-md">
              {athlete.name}
            </h3>

            {/* Escudo y Nombre del Equipo con sentido de pertenencia */}
            <div className="flex items-center justify-center gap-1.5 mt-1">
              {team?.logo_url && !teamLogoError && (
                <img
                  src={team.logo_url}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover border border-kasa-dorado/60 shadow-2xs"
                />
              )}
              <p className="text-xs font-black uppercase tracking-widest text-kasa-dorado">
                {team?.name || 'KsaSport Club'}
              </p>
            </div>

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
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
          {/* Botón 1: Compartir directamente en WhatsApp / Instagram */}
          <button
            type="button"
            onClick={handleShareStory}
            disabled={isExporting}
            className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-kasa-dorado via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-kasa-vinotinto font-black text-xs tracking-wider transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>{isExporting ? 'Generando...' : 'Compartir Imagen'}</span>
          </button>

          {/* Botón 2: Guardar en Galería HD */}
          <button
            type="button"
            onClick={handleDownloadDirect}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Descargar cromo HD a tu galería de fotos"
          >
            <Download className="w-4 h-4 text-kasa-dorado shrink-0" />
            <span className="hidden sm:inline">Guardar HD</span>
          </button>

          {/* Botón 3: Copiar Link de Verificación */}
          <button
            type="button"
            onClick={handleCopyVerifyLink}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20 active:scale-95 cursor-pointer"
            title="Copiar enlace oficial de credencial"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">Link</span>
          </button>
        </div>
      )}

      {/* Indicador de Giroscopio y Sensores */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 text-center">
        {needsIosPermission ? (
          <button
            type="button"
            onClick={enableIosGyroscope}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-300 hover:bg-amber-500/20 transition-colors font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5 text-kasa-dorado animate-bounce" />
            <span>Toca aquí para activar el sensor 3D en iPhone</span>
          </button>
        ) : gyroActive ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Rotate3d className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Sensor 3D activo: inclina tu celular o desliza con el dedo</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Rotate3d className="w-3.5 h-3.5 text-kasa-dorado" />
            <span>Desliza con el dedo sobre el cromo para inclinarlo en 3D</span>
          </span>
        )}
      </div>
    </div>
  )
}
