'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Globe, MessageCircle, Share2, Calendar, FileText, 
  Upload, Trash2, ExternalLink, Save, CheckCircle2, 
  AlertCircle, Loader2, Plus, Eye, Image as ImageIcon,
  RotateCcw, Sparkles
} from 'lucide-react'
import { updatePortalAndCalendarSettings } from './actions'
import { compressImageClient } from '@/lib/clientImageCompressor'

interface PortalSettingsProps {
  settings: {
    logo_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    whatsapp_number?: string | null;
    calendar_title?: string | null;
    calendar_description?: string | null;
    calendar_season?: string | null;
    calendar_images?: string[] | null;
    calendar_pdf_url?: string | null;
    calendar_is_active?: boolean | null;
  }
}

const DEFAULT_BRAND_LOGO = 'https://pub-d9a707e799754eaf97bb7a295f4a8030.r2.dev/branding/ksasport-official-logo.png'

export default function PortalSettings({ settings }: PortalSettingsProps) {
  const router = useRouter()

  // Logotipo Oficial de la Marca
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>(settings?.logo_url || DEFAULT_BRAND_LOGO)
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const activeLogoPreview = newLogoPreview || (removeLogo ? DEFAULT_BRAND_LOGO : (currentLogoUrl || DEFAULT_BRAND_LOGO))

  // Redes Sociales
  const [instagramUrl, setInstagramUrl] = useState(settings?.instagram_url || '')
  const [facebookUrl, setFacebookUrl] = useState(settings?.facebook_url || '')
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsapp_number || '')

  // Calendario
  const [calendarTitle, setCalendarTitle] = useState(settings?.calendar_title || 'Calendario Oficial de Ligas Activas')
  const [calendarSeason, setCalendarSeason] = useState(settings?.calendar_season || 'Temporada 2026')
  const [calendarDescription, setCalendarDescription] = useState(settings?.calendar_description || '')
  const [calendarIsActive, setCalendarIsActive] = useState(settings?.calendar_is_active !== false)

  // Imágenes existentes y nuevas
  const [retainedImages, setRetainedImages] = useState<string[]>(
    Array.isArray(settings?.calendar_images) ? settings.calendar_images : []
  )
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string }[]>([])

  // PDF
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(settings?.calendar_pdf_url || null)
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null)
  const [removePdf, setRemovePdf] = useState(false)

  // Estado de guardado
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sincronizar estado si cambian las props del servidor (por router.refresh())
  useEffect(() => {
    if (settings) {
      setCurrentLogoUrl(settings.logo_url || DEFAULT_BRAND_LOGO)
      setInstagramUrl(settings.instagram_url || '')
      setFacebookUrl(settings.facebook_url || '')
      setWhatsappNumber(settings.whatsapp_number || '')
      setCalendarTitle(settings.calendar_title || 'Calendario Oficial de Ligas Activas')
      setCalendarSeason(settings.calendar_season || 'Temporada 2026')
      setCalendarDescription(settings.calendar_description || '')
      setCalendarIsActive(settings.calendar_is_active !== false)
      setRetainedImages(Array.isArray(settings.calendar_images) ? settings.calendar_images : [])
      setCurrentPdfUrl(settings.calendar_pdf_url || null)
    }
  }, [settings])

  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const processed: { file: File; preview: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const original = files[i]
      if (original.size > 10 * 1024 * 1024) {
        setError(`El archivo ${original.name} excede el límite de 10MB.`)
        continue
      }
      const optimized = await compressImageClient(original, 1920, 0.85)
      const preview = URL.createObjectURL(optimized)
      processed.push({ file: optimized, preview })
    }

    setNewImageFiles(prev => [...prev, ...processed])
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleRemoveRetainedImage = (indexToRemove: number) => {
    setRetainedImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleRemoveNewImage = (indexToRemove: number) => {
    setNewImageFiles(prev => {
      URL.revokeObjectURL(prev[indexToRemove].preview)
      return prev.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo de logotipo no debe superar 10MB.')
      return
    }
    const preview = URL.createObjectURL(file)
    setNewLogoFile(file)
    setNewLogoPreview(preview)
    setRemoveLogo(false)
  }

  const handleResetLogo = () => {
    if (newLogoPreview) {
      URL.revokeObjectURL(newLogoPreview)
    }
    setNewLogoFile(null)
    setNewLogoPreview(null)
    setRemoveLogo(true)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo PDF no debe pesar más de 10MB.')
        return
      }
      setNewPdfFile(file)
      setRemovePdf(false)
    }
  }

  const handleRemoveCurrentPdf = () => {
    setCurrentPdfUrl(null)
    setNewPdfFile(null)
    setRemovePdf(true)
    if (pdfInputRef.current) pdfInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      const formData = new FormData()
      
      // Logotipo
      if (newLogoFile) {
        formData.append('logo', newLogoFile)
      }
      formData.append('remove_logo', String(removeLogo))

      formData.append('instagram_url', instagramUrl)
      formData.append('facebook_url', facebookUrl)
      formData.append('whatsapp_number', whatsappNumber)

      formData.append('calendar_title', calendarTitle)
      formData.append('calendar_season', calendarSeason)
      formData.append('calendar_description', calendarDescription)
      formData.append('calendar_is_active', String(calendarIsActive))

      formData.append('retained_images', JSON.stringify(retainedImages))
      newImageFiles.forEach(item => {
        formData.append('new_images', item.file)
      })

      if (newPdfFile) {
        formData.append('calendar_pdf', newPdfFile)
      }
      formData.append('remove_pdf', String(removePdf))

      const res = await updatePortalAndCalendarSettings(formData)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        if (res.settings) {
          if (res.settings.logo_url) {
            setCurrentLogoUrl(res.settings.logo_url)
          } else if (removeLogo) {
            setCurrentLogoUrl(DEFAULT_BRAND_LOGO)
          }
          setCurrentPdfUrl(res.settings.calendar_pdf_url || null)
          setRetainedImages(Array.isArray(res.settings.calendar_images) ? res.settings.calendar_images : [])
          setInstagramUrl(res.settings.instagram_url || '')
          setFacebookUrl(res.settings.facebook_url || '')
          setWhatsappNumber(res.settings.whatsapp_number || '')
          setCalendarTitle(res.settings.calendar_title || 'Calendario Oficial de Ligas Activas')
          setCalendarSeason(res.settings.calendar_season || 'Temporada 2026')
          setCalendarDescription(res.settings.calendar_description || '')
          setCalendarIsActive(res.settings.calendar_is_active !== false)
        }
        if (newLogoPreview) {
          URL.revokeObjectURL(newLogoPreview)
        }
        setNewLogoFile(null)
        setNewLogoPreview(null)
        setRemoveLogo(false)
        if (logoInputRef.current) logoInputRef.current.value = ''
        setNewImageFiles([])
        setNewPdfFile(null)
        setRemovePdf(false)
        if (imageInputRef.current) imageInputRef.current.value = ''
        if (pdfInputRef.current) pdfInputRef.current.value = ''
        
        // Refrescar estado del servidor en segundo plano sin recarga completa
        router.refresh()
        setTimeout(() => setSuccess(false), 4500)
      }
    } catch (err: any) {
      console.error('Error al guardar configuración de portal:', err)
      const msg = err?.message || ''
      if (msg.includes('441') || msg.includes('Server Components render') || msg.includes('Failed to fetch')) {
        setError('Ocurrió un error al procesar los archivos en el servidor. Verifica que los archivos no excedan el límite permitido e intenta nuevamente.')
      } else {
        setError(msg || 'Error guardando la configuración.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300 relative">
      
      {/* OVERLAY MODAL LOADER NO BLOQUEANTE / FEEDBACK VISUAL INMEDIATO */}
      {saving && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-kasa-vinotinto/10 border border-kasa-dorado/30 text-kasa-vinotinto flex items-center justify-center relative shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin text-kasa-vinotinto" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-gray-900">
                {newLogoFile && (newPdfFile || newImageFiles.length > 0)
                  ? 'Subiendo nuevo logotipo y archivos...'
                  : newLogoFile
                  ? 'Actualizando logotipo oficial...'
                  : newPdfFile && newImageFiles.length > 0
                  ? 'Subiendo PDF e imágenes...'
                  : newPdfFile
                  ? 'Subiendo documento PDF...'
                  : newImageFiles.length > 0
                  ? 'Optimizando imágenes...'
                  : 'Guardando configuración...'}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {newLogoFile
                  ? 'Cargando el nuevo logotipo oficial de KsaSport a Cloudflare R2 y actualizando los componentes de la plataforma.'
                  : newPdfFile && newImageFiles.length > 0
                  ? 'Cargando el PDF oficial y optimizando las fotos del fixture en Cloudflare R2.'
                  : newPdfFile
                  ? 'Cargando el rol de juegos PDF oficial a Cloudflare R2. Puede tardar unos segundos según tu conexión.'
                  : newImageFiles.length > 0
                  ? `Optimizando y subiendo ${newImageFiles.length} imagen(es) en alta resolución.`
                  : 'Actualizando parámetros y enlaces del portal.'}
              </p>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-kasa-vinotinto via-kasa-dorado to-kasa-vinotinto h-full w-full animate-pulse" />
            </div>

            <p className="text-[11px] text-gray-400 font-medium">
              Por favor, espera un momento sin recargar la página.
            </p>
          </div>
        </div>
      )}
      
      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm shadow-xs animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-bold">¡Configuración guardada exitosamente! Los cambios ya son visibles en la Landing, Portal y /calendario.</span>
        </div>
      )}

      {/* SECCIÓN 0: IDENTIDAD DE MARCA & LOGOTIPO OFICIAL */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-kasa-vinotinto/10 rounded-2xl text-kasa-vinotinto shrink-0">
              <Sparkles className="w-6 h-6 text-kasa-dorado" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 truncate">Identidad de Marca & Logotipo Oficial</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-kasa-dorado/20 text-yellow-800 border border-kasa-dorado/30 shrink-0">
                  Punto 4.3
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 sm:line-clamp-none">
                Escudo dinámico de KsaSport. Se aplica en el Navbar superior, Footer, Portal de Atletas, App Móvil (PWA) y Menú Admin.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            <input
              type="file"
              ref={logoInputRef}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-kasa-vinotinto hover:bg-kasa-vinotinto-dark text-white transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4 text-kasa-dorado shrink-0" />
              <span>Cambiar Logotipo</span>
            </button>
            {(newLogoPreview || removeLogo || (currentLogoUrl && !currentLogoUrl.includes('ksasport-official-logo.png'))) && (
              <button
                type="button"
                onClick={handleResetLogo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-red-700 hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
                title="Restablecer logotipo al diseño original de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Restablecer Original</span>
              </button>
            )}
          </div>
        </div>

        {/* Dual Preview Box: Impeccable verification for Dark and Light backgrounds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview sobre Vinotinto (Navbar / Sidebar) */}
          <div className="bg-kasa-vinotinto rounded-2xl p-4 sm:p-5 border border-white/10 shadow-inner flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-kasa-dorado bg-black/25 px-2.5 py-1 rounded-full border border-kasa-dorado/20">
                Cabecera Vinotinto / Navbar
              </span>
              <span className="text-[10px] text-white/50 font-mono">#5A0F1D</span>
            </div>
            
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-xl bg-white/95 border border-white/40 shadow-xs flex items-center justify-center p-1 shrink-0">
                <img
                  src={activeLogoPreview}
                  alt="Previsualización KsaSport"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-wider text-white leading-none">
                  KASA SPORTS
                </span>
                <span className="text-[10px] text-white/70 font-semibold tracking-widest uppercase mt-0.5">
                  Ecosistema Deportivo
                </span>
              </div>
            </div>

            <p className="text-[11px] text-white/60">
              Contenedor badge protector que garantiza el máximo contraste de la &quot;k&quot; vinotinto y &quot;S&quot; dorada sobre fondos oscuros.
            </p>
          </div>

          {/* Preview sobre Fondo Claro (Cards / Login / Documentos) */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                Fondo Claro / Login / PWA
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Retina / 1x</span>
            </div>

            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src={activeLogoPreview}
                  alt="Previsualización KsaSport Fondo Claro"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-wider text-gray-900 leading-none">
                  KASA SPORTS
                </span>
                <span className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase mt-0.5">
                  Portal & Documentos
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Renderizado directo con transparencia nativa sobre superficies blancas y gris claro.
            </p>
          </div>
        </div>

        {/* Notificación si hay archivo nuevo seleccionado */}
        {newLogoFile && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 w-full min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span className="font-bold shrink-0">Nuevo archivo:</span>
              <span className="font-mono truncate">{newLogoFile.name}</span>
              <span className="text-amber-700 shrink-0">({Math.round(newLogoFile.size / 1024)} KB)</span>
            </div>
            <span className="font-bold text-kasa-vinotinto shrink-0">Pulsa &quot;Guardar&quot; para aplicar</span>
          </div>
        )}

        {/* Notificación si se restablece */}
        {removeLogo && !newLogoFile && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2 text-xs text-blue-900 w-full min-w-0">
            <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold">Se restablecerá el logotipo oficial de fábrica al guardar.</span>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: REDES SOCIALES Y CONTACTO */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 w-full min-w-0">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 min-w-0">
          <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-700 shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 truncate">Redes Sociales y WhatsApp Oficial</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Alimentan los botones del pie de página (Footer) y el enlace de contacto de Tryouts en la Landing Page.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Instagram */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
              Perfil de Instagram
            </label>
            <div className="relative">
              <input
                type="url"
                value={instagramUrl}
                onChange={e => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/ksasport"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all pr-10"
              />
              {instagramUrl && (
                <a 
                  href={instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600"
                  title="Abrir enlace"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-gray-400">URL completa de la cuenta oficial de Instagram.</p>
          </div>

          {/* Facebook */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Página de Facebook
            </label>
            <div className="relative">
              <input
                type="url"
                value={facebookUrl}
                onChange={e => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/ksasport"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all pr-10"
              />
              {facebookUrl && (
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  title="Abrir enlace"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-gray-400">Enlace a la página o comunidad de Facebook.</p>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp Oficial (Tryouts y Consultas)
            </label>
            <div className="relative">
              <input
                type="text"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="Ej: 584128505629"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono font-bold text-gray-900 focus:bg-white focus:border-emerald-600 outline-none transition-all pr-10"
              />
              {whatsappNumber && (
                <a 
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600"
                  title="Probar chat de WhatsApp"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              Formato internacional con código de país (sin el signo +). Ej: <strong>584128505629</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CALENDARIO DE LIGAS ACTIVAS */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2.5 bg-kasa-vinotinto/10 rounded-2xl text-kasa-vinotinto shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 break-words">Calendario Oficial de Ligas Activas</h3>
              <p className="text-xs text-gray-500 mt-0.5 break-words">
                Contenido público accesible en la ruta <a href="/calendario" target="_blank" className="font-bold text-kasa-vinotinto underline">/calendario</a> sin requerir inicio de sesión.
              </p>
            </div>
          </div>

          {/* Toggle Activo / Pausado */}
          <div className="flex items-center justify-between sm:justify-start gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 shrink-0">
            <span className="text-xs font-bold text-gray-700">Estado Público:</span>
            <button
              type="button"
              onClick={() => setCalendarIsActive(!calendarIsActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                calendarIsActive 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {calendarIsActive ? '● Publicado' : '○ En Pausa'}
            </button>
          </div>
        </div>

        {/* Título y Temporada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700">
              Nombre de la Liga o Torneo
            </label>
            <input
              type="text"
              value={calendarTitle}
              onChange={e => setCalendarTitle(e.target.value)}
              placeholder="Ej: Torneo Apertura 2026 - Kickingball & Sóftbol"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700">
              Edición o Temporada
            </label>
            <input
              type="text"
              value={calendarSeason}
              onChange={e => setCalendarSeason(e.target.value)}
              placeholder="Ej: Temporada Regular 2026"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-700">
            Información de Jornadas, Horarios y Sedes
          </label>
          <textarea
            rows={3}
            value={calendarDescription}
            onChange={e => setCalendarDescription(e.target.value)}
            placeholder="Ej: Consulta las fechas y partidos oficiales de cada fin de semana en el Campo Deportivo KsaSport. Entrada libre para familiares y fanáticos."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all resize-none"
          />
        </div>

        {/* GESTOR DE IMÁGENES DEL CALENDARIO */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-kasa-dorado-dark shrink-0" />
                <span>Imágenes y Afiches del Calendario</span>
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 break-words">
                Sube las fotos de las jornadas o el fixture. Los visitantes podrán abrirlas y hacerles zoom en pantalla completa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-kasa-vinotinto hover:bg-red-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Subir Imagen
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleAddImages}
            />
          </div>

          {/* Galería de imágenes (Existentes + Nuevas) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Existentes */}
            {retainedImages.map((url, idx) => (
              <div key={`retained-${idx}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs">
                <img src={url} alt="Calendario" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent sm:bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end sm:items-center justify-center gap-2.5 p-3 sm:p-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 sm:w-8 sm:h-8 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-md flex items-center justify-center cursor-pointer"
                    title="Ver en grande"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveRetainedImage(idx)}
                    className="w-10 h-10 sm:w-8 sm:h-8 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md flex items-center justify-center cursor-pointer"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Nuevas por subir */}
            {newImageFiles.map((item, idx) => (
              <div key={`new-${idx}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-emerald-400 bg-emerald-50/50 shadow-2xs">
                <img src={item.preview} alt="Nueva" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  Por guardar
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent sm:bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end sm:items-center justify-center p-3 sm:p-0">
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(idx)}
                    className="w-10 h-10 sm:w-8 sm:h-8 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md flex items-center justify-center cursor-pointer"
                    title="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {retainedImages.length === 0 && newImageFiles.length === 0 && (
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="col-span-full py-8 sm:py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors p-4"
              >
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-700">Aún no has subido imágenes del calendario</p>
                <p className="text-xs text-gray-400 mt-0.5">Haz clic aquí para seleccionar los afiches o fotos del rol de juegos.</p>
              </div>
            )}
          </div>
        </div>

        {/* GESTOR DE PDF DESCARGABLE */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div>
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-kasa-vinotinto shrink-0" />
              <span>Documento PDF Descargable del Calendario Oficial</span>
            </h4>
            <p className="text-xs text-gray-400 mt-0.5 break-words">
              Permite a los visitantes descargar el archivo PDF completo del rol de juegos o reglamento del torneo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200">
            {removePdf ? (
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                <span className="font-semibold break-words">El PDF oficial se eliminará al guardar los cambios.</span>
                <button
                  type="button"
                  onClick={() => {
                    setRemovePdf(false)
                    setCurrentPdfUrl(settings?.calendar_pdf_url || null)
                  }}
                  className="font-black underline text-amber-900 hover:text-black cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Deshacer
                </button>
              </div>
            ) : newPdfFile ? (
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
                <div className="truncate min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{newPdfFile.name}</p>
                  <p className="text-[10px] text-emerald-600 font-bold truncate">Nuevo archivo seleccionado (Pendiente de guardar)</p>
                </div>
              </div>
            ) : currentPdfUrl ? (
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 text-red-600 shrink-0" />
                <div className="truncate min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">Calendario_Oficial_KsaSport.pdf</p>
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-kasa-vinotinto font-bold hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    Ver archivo actual <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 text-xs text-gray-500 font-medium">
                No hay ningún PDF publicado actualmente.
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer text-center"
              >
                {currentPdfUrl || newPdfFile ? 'Reemplazar PDF' : 'Subir Archivo PDF'}
              </button>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfChange}
              />

              {(currentPdfUrl || newPdfFile) && (
                <button
                  type="button"
                  onClick={handleRemoveCurrentPdf}
                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                  title="Eliminar PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* BOTÓN FLOTANTE O FIJO DE GUARDADO */}
      <div className="sticky bottom-4 sm:bottom-6 z-20 flex justify-end pb-[env(safe-area-inset-bottom,0px)]">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-kasa-vinotinto to-red-950 hover:from-red-950 hover:to-black text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Guardando y procesando...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5 text-kasa-dorado" />
              <span>Guardar Redes y Calendario</span>
            </>
          )}
        </button>
      </div>

    </form>
  )
}
