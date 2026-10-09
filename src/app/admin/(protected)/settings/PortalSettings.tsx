'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Globe, MessageCircle, Share2, Calendar, FileText, 
  Upload, Trash2, ExternalLink, Save, CheckCircle2, 
  AlertCircle, Loader2, Plus, Eye, Image as ImageIcon,
  RotateCcw, Sparkles, Users, Trophy, X
} from 'lucide-react'
import { updatePortalAndCalendarSettings } from './actions'
import { compressImageClient } from '@/lib/clientImageCompressor'
import { InstagramIcon, TikTokIcon, FacebookIcon, WhatsAppIcon } from '@/components/ui/SocialIcons'

interface PortalSettingsProps {
  settings: {
    logo_url?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    facebook_url?: string | null;
    whatsapp_number?: string | null;

    // Calendario
    calendar_title?: string | null;
    calendar_description?: string | null;
    calendar_season?: string | null;
    calendar_images?: string[] | null;
    calendar_pdf_url?: string | null;
    calendar_is_active?: boolean | null;

    // Tryouts
    tryouts_title?: string | null;
    tryouts_description?: string | null;
    tryouts_season?: string | null;
    tryouts_images?: string[] | null;
    tryouts_pdf_url?: string | null;
    tryouts_is_active?: boolean | null;

    // Drafts
    drafts_title?: string | null;
    drafts_description?: string | null;
    drafts_season?: string | null;
    drafts_images?: string[] | null;
    drafts_pdf_url?: string | null;
    drafts_is_active?: boolean | null;
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
  const [tiktokUrl, setTiktokUrl] = useState(settings?.tiktok_url || '')
  const [facebookUrl, setFacebookUrl] = useState(settings?.facebook_url || '')
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsapp_number || '')

  // 1. Calendario de Ligas
  const [calendarTitle, setCalendarTitle] = useState(settings?.calendar_title || 'Calendario Oficial de Ligas Activas')
  const [calendarSeason, setCalendarSeason] = useState(settings?.calendar_season || 'Temporada 2026')
  const [calendarDescription, setCalendarDescription] = useState(settings?.calendar_description || '')
  const [calendarIsActive, setCalendarIsActive] = useState(settings?.calendar_is_active !== false)
  const [retainedImages, setRetainedImages] = useState<string[]>(
    Array.isArray(settings?.calendar_images) ? settings.calendar_images : []
  )
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string }[]>([])
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(settings?.calendar_pdf_url || null)
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null)
  const [removePdf, setRemovePdf] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // 2. Scouting y Tryouts
  const [tryoutsTitle, setTryoutsTitle] = useState(settings?.tryouts_title || 'Scouting y Tryouts Oficiales')
  const [tryoutsSeason, setTryoutsSeason] = useState(settings?.tryouts_season || 'Temporada 2026')
  const [tryoutsDescription, setTryoutsDescription] = useState(
    settings?.tryouts_description || '¿Tienes talento para el Béisbol o Kickingball? Regístrate en nuestras próximas pruebas y forma parte de nuestros equipos en competencia oficial.'
  )
  const [tryoutsIsActive, setTryoutsIsActive] = useState(settings?.tryouts_is_active !== false)
  const [tryoutsRetainedImages, setTryoutsRetainedImages] = useState<string[]>(
    Array.isArray(settings?.tryouts_images) ? settings.tryouts_images : []
  )
  const [tryoutsNewImageFiles, setTryoutsNewImageFiles] = useState<{ file: File; preview: string }[]>([])
  const [tryoutsCurrentPdfUrl, setTryoutsCurrentPdfUrl] = useState<string | null>(settings?.tryouts_pdf_url || null)
  const [tryoutsNewPdfFile, setTryoutsNewPdfFile] = useState<File | null>(null)
  const [tryoutsRemovePdf, setTryoutsRemovePdf] = useState(false)
  const tryoutsImageInputRef = useRef<HTMLInputElement>(null)
  const tryoutsPdfInputRef = useRef<HTMLInputElement>(null)

  // 3. Drafts de Kickingball
  const [draftsTitle, setDraftsTitle] = useState(settings?.drafts_title || 'Drafts de Kickingball')
  const [draftsSeason, setDraftsSeason] = useState(settings?.drafts_season || 'Temporada 2026')
  const [draftsDescription, setDraftsDescription] = useState(
    settings?.drafts_description || 'Postulación y selección oficial de atletas para el circuito élite y categorías competitivas de Kickingball.'
  )
  const [draftsIsActive, setDraftsIsActive] = useState(settings?.drafts_is_active !== false)
  const [draftsRetainedImages, setDraftsRetainedImages] = useState<string[]>(
    Array.isArray(settings?.drafts_images) ? settings.drafts_images : []
  )
  const [draftsNewImageFiles, setNewImageFilesDrafts] = useState<{ file: File; preview: string }[]>([])
  const [draftsCurrentPdfUrl, setDraftsCurrentPdfUrl] = useState<string | null>(settings?.drafts_pdf_url || null)
  const [draftsNewPdfFile, setDraftsNewPdfFile] = useState<File | null>(null)
  const [draftsRemovePdf, setDraftsRemovePdf] = useState(false)
  const draftsImageInputRef = useRef<HTMLInputElement>(null)
  const draftsPdfInputRef = useRef<HTMLInputElement>(null)

  // Estado de guardado
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Navegación por sub-pestañas para evitar scroll infinito en móviles y desktop
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'tryouts' | 'drafts' | 'branding'>('calendar')
  // Visor Lightbox para previsualizar afiches en grande sin deformar el panel
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null)

  // Sincronizar estado si cambian las props del servidor (por router.refresh())
  useEffect(() => {
    if (settings) {
      setCurrentLogoUrl(settings.logo_url || DEFAULT_BRAND_LOGO)
      setInstagramUrl(settings.instagram_url || '')
      setTiktokUrl(settings.tiktok_url || '')
      setFacebookUrl(settings.facebook_url || '')
      setWhatsappNumber(settings.whatsapp_number || '')

      // Calendario
      setCalendarTitle(settings.calendar_title || 'Calendario Oficial de Ligas Activas')
      setCalendarSeason(settings.calendar_season || 'Temporada 2026')
      setCalendarDescription(settings.calendar_description || '')
      setCalendarIsActive(settings.calendar_is_active !== false)
      setRetainedImages(Array.isArray(settings.calendar_images) ? settings.calendar_images : [])
      setCurrentPdfUrl(settings.calendar_pdf_url || null)

      // Tryouts
      setTryoutsTitle(settings.tryouts_title || 'Scouting y Tryouts Oficiales')
      setTryoutsSeason(settings.tryouts_season || 'Temporada 2026')
      setTryoutsDescription(
        settings.tryouts_description || '¿Tienes talento para el Béisbol o Kickingball? Regístrate en nuestras próximas pruebas y forma parte de nuestros equipos en competencia oficial.'
      )
      setTryoutsIsActive(settings.tryouts_is_active !== false)
      setTryoutsRetainedImages(Array.isArray(settings.tryouts_images) ? settings.tryouts_images : [])
      setTryoutsCurrentPdfUrl(settings.tryouts_pdf_url || null)

      // Drafts
      setDraftsTitle(settings.drafts_title || 'Drafts de Kickingball')
      setDraftsSeason(settings.drafts_season || 'Temporada 2026')
      setDraftsDescription(
        settings.drafts_description || 'Postulación y selección oficial de atletas para el circuito élite y categorías competitivas de Kickingball.'
      )
      setDraftsIsActive(settings.drafts_is_active !== false)
      setDraftsRetainedImages(Array.isArray(settings.drafts_images) ? settings.drafts_images : [])
      setDraftsCurrentPdfUrl(settings.drafts_pdf_url || null)
    }
  }, [settings])

  // Helper para procesar imágenes con compresión
  const processImageFiles = async (files: FileList | null): Promise<{ file: File; preview: string }[]> => {
    if (!files || files.length === 0) return []
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
    return processed
  }

  // Handlers Calendario
  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const items = await processImageFiles(e.target.files)
    setNewImageFiles(prev => [...prev, ...items])
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

  // Handlers Tryouts
  const handleAddTryoutsImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const items = await processImageFiles(e.target.files)
    setTryoutsNewImageFiles(prev => [...prev, ...items])
    if (tryoutsImageInputRef.current) tryoutsImageInputRef.current.value = ''
  }

  const handleRemoveRetainedTryoutsImage = (indexToRemove: number) => {
    setTryoutsRetainedImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleRemoveNewTryoutsImage = (indexToRemove: number) => {
    setTryoutsNewImageFiles(prev => {
      URL.revokeObjectURL(prev[indexToRemove].preview)
      return prev.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const handleTryoutsPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo PDF no debe pesar más de 10MB.')
        return
      }
      setTryoutsNewPdfFile(file)
      setTryoutsRemovePdf(false)
    }
  }

  // Handlers Drafts
  const handleAddDraftsImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const items = await processImageFiles(e.target.files)
    setNewImageFilesDrafts(prev => [...prev, ...items])
    if (draftsImageInputRef.current) draftsImageInputRef.current.value = ''
  }

  const handleRemoveRetainedDraftsImage = (indexToRemove: number) => {
    setDraftsRetainedImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleRemoveNewDraftsImage = (indexToRemove: number) => {
    setNewImageFilesDrafts(prev => {
      URL.revokeObjectURL(prev[indexToRemove].preview)
      return prev.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const handleDraftsPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo PDF no debe pesar más de 10MB.')
        return
      }
      setDraftsNewPdfFile(file)
      setDraftsRemovePdf(false)
    }
  }

  // Handlers Logo
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

  // Submit General
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

      // Redes
      formData.append('instagram_url', instagramUrl)
      formData.append('tiktok_url', tiktokUrl)
      formData.append('facebook_url', facebookUrl)
      formData.append('whatsapp_number', whatsappNumber)

      // 1. Calendario
      formData.append('calendar_title', calendarTitle)
      formData.append('calendar_season', calendarSeason)
      formData.append('calendar_description', calendarDescription)
      formData.append('calendar_is_active', String(calendarIsActive))
      formData.append('retained_images', JSON.stringify(retainedImages))
      newImageFiles.forEach(item => formData.append('new_images', item.file))
      if (newPdfFile) formData.append('calendar_pdf', newPdfFile)
      formData.append('remove_pdf', String(removePdf))

      // 2. Tryouts
      formData.append('tryouts_title', tryoutsTitle)
      formData.append('tryouts_season', tryoutsSeason)
      formData.append('tryouts_description', tryoutsDescription)
      formData.append('tryouts_is_active', String(tryoutsIsActive))
      formData.append('tryouts_retained_images', JSON.stringify(tryoutsRetainedImages))
      tryoutsNewImageFiles.forEach(item => formData.append('tryouts_new_images', item.file))
      if (tryoutsNewPdfFile) formData.append('tryouts_pdf', tryoutsNewPdfFile)
      formData.append('tryouts_remove_pdf', String(tryoutsRemovePdf))

      // 3. Drafts
      formData.append('drafts_title', draftsTitle)
      formData.append('drafts_season', draftsSeason)
      formData.append('drafts_description', draftsDescription)
      formData.append('drafts_is_active', String(draftsIsActive))
      formData.append('drafts_retained_images', JSON.stringify(draftsRetainedImages))
      draftsNewImageFiles.forEach(item => formData.append('drafts_new_images', item.file))
      if (draftsNewPdfFile) formData.append('drafts_pdf', draftsNewPdfFile)
      formData.append('drafts_remove_pdf', String(draftsRemovePdf))

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

          setInstagramUrl(res.settings.instagram_url || '')
          setTiktokUrl(res.settings.tiktok_url || '')
          setFacebookUrl(res.settings.facebook_url || '')
          setWhatsappNumber(res.settings.whatsapp_number || '')

          // Calendario
          setCurrentPdfUrl(res.settings.calendar_pdf_url || null)
          setRetainedImages(Array.isArray(res.settings.calendar_images) ? res.settings.calendar_images : [])
          setCalendarTitle(res.settings.calendar_title || 'Calendario Oficial de Ligas Activas')
          setCalendarSeason(res.settings.calendar_season || 'Temporada 2026')
          setCalendarDescription(res.settings.calendar_description || '')
          setCalendarIsActive(res.settings.calendar_is_active !== false)

          // Tryouts
          setTryoutsCurrentPdfUrl(res.settings.tryouts_pdf_url || null)
          setTryoutsRetainedImages(Array.isArray(res.settings.tryouts_images) ? res.settings.tryouts_images : [])
          setTryoutsTitle(res.settings.tryouts_title || 'Scouting y Tryouts Oficiales')
          setTryoutsSeason(res.settings.tryouts_season || 'Temporada 2026')
          setTryoutsDescription(res.settings.tryouts_description || '')
          setTryoutsIsActive(res.settings.tryouts_is_active !== false)

          // Drafts
          setDraftsCurrentPdfUrl(res.settings.drafts_pdf_url || null)
          setDraftsRetainedImages(Array.isArray(res.settings.drafts_images) ? res.settings.drafts_images : [])
          setDraftsTitle(res.settings.drafts_title || 'Drafts de Kickingball')
          setDraftsSeason(res.settings.drafts_season || 'Temporada 2026')
          setDraftsDescription(res.settings.drafts_description || '')
          setDraftsIsActive(res.settings.drafts_is_active !== false)
        }

        if (newLogoPreview) URL.revokeObjectURL(newLogoPreview)
        setNewLogoFile(null)
        setNewLogoPreview(null)
        setRemoveLogo(false)

        newImageFiles.forEach(item => URL.revokeObjectURL(item.preview))
        setNewImageFiles([])
        setNewPdfFile(null)
        setRemovePdf(false)

        tryoutsNewImageFiles.forEach(item => URL.revokeObjectURL(item.preview))
        setTryoutsNewImageFiles([])
        setTryoutsNewPdfFile(null)
        setTryoutsRemovePdf(false)

        draftsNewImageFiles.forEach(item => URL.revokeObjectURL(item.preview))
        setNewImageFilesDrafts([])
        setDraftsNewPdfFile(null)
        setDraftsRemovePdf(false)

        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setError('Ocurrió un error inesperado al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full min-w-0">
      
      {/* Alertas Globales */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm shadow-xs animate-in zoom-in-95 duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm shadow-xs animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-bold">¡Configuración guardada exitosamente! Los cambios ya son visibles en la Landing, Portal, /calendario y eventos.</span>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN POR SUB-PESTAÑAS (TABS RESPONSIVAS) */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-2xs">
        {/* Tab 1: Calendario de Ligas */}
        <button
          type="button"
          onClick={() => setActiveSubTab('calendar')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'calendar'
              ? 'bg-white text-gray-950 shadow-xs border border-gray-200/80 font-black'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeSubTab === 'calendar' ? 'text-kasa-vinotinto' : 'text-gray-400'}`} />
          <span>Calendario de Ligas</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeSubTab === 'calendar' ? 'bg-kasa-vinotinto/10 text-kasa-vinotinto' : 'bg-gray-200 text-gray-600'
          }`}>
            {retainedImages.length + newImageFiles.length}
          </span>
          <span className={`w-2 h-2 rounded-full ${calendarIsActive ? 'bg-emerald-500' : 'bg-gray-400'}`} title={calendarIsActive ? 'Publicado' : 'En pausa'} />
        </button>

        {/* Tab 2: Scouting y Tryouts */}
        <button
          type="button"
          onClick={() => setActiveSubTab('tryouts')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'tryouts'
              ? 'bg-white text-gray-950 shadow-xs border border-gray-200/80 font-black'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <Users className={`w-4 h-4 ${activeSubTab === 'tryouts' ? 'text-kasa-vinotinto' : 'text-gray-400'}`} />
          <span>Scouting & Tryouts</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeSubTab === 'tryouts' ? 'bg-kasa-vinotinto/10 text-kasa-vinotinto' : 'bg-gray-200 text-gray-600'
          }`}>
            {tryoutsRetainedImages.length + tryoutsNewImageFiles.length}
          </span>
          <span className={`w-2 h-2 rounded-full ${tryoutsIsActive ? 'bg-emerald-500' : 'bg-gray-400'}`} title={tryoutsIsActive ? 'Publicado' : 'En pausa'} />
        </button>

        {/* Tab 3: Drafts Kickingball */}
        <button
          type="button"
          onClick={() => setActiveSubTab('drafts')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'drafts'
              ? 'bg-white text-gray-950 shadow-xs border border-gray-200/80 font-black'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <Trophy className={`w-4 h-4 ${activeSubTab === 'drafts' ? 'text-kasa-vinotinto' : 'text-gray-400'}`} />
          <span>Drafts Kickingball</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeSubTab === 'drafts' ? 'bg-kasa-vinotinto/10 text-kasa-vinotinto' : 'bg-gray-200 text-gray-600'
          }`}>
            {draftsRetainedImages.length + draftsNewImageFiles.length}
          </span>
          <span className={`w-2 h-2 rounded-full ${draftsIsActive ? 'bg-emerald-500' : 'bg-gray-400'}`} title={draftsIsActive ? 'Publicado' : 'En pausa'} />
        </button>

        {/* Tab 4: Marca y Redes */}
        <button
          type="button"
          onClick={() => setActiveSubTab('branding')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'branding'
              ? 'bg-white text-gray-950 shadow-xs border border-gray-200/80 font-black'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <Share2 className={`w-4 h-4 ${activeSubTab === 'branding' ? 'text-kasa-vinotinto' : 'text-gray-400'}`} />
          <span>Marca & Redes</span>
        </button>
      </div>

      {/* CONTENIDO 1: MARCA Y REDES SOCIALES */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
                      Oficial
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

            {/* Dual Preview Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Contenedor badge protector que garantiza el máximo contraste sobre fondos oscuros.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                    Fondo Claro / Login / PWA
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Retina / 1x</span>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-white rounded-xl border border-slate-200 shadow-2xs p-1">
                    <img
                      src={activeLogoPreview}
                      alt="Previsualización KsaSport Fondo Claro"
                      className="w-8 h-8 object-contain"
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
                  Renderizado directo con transparencia nativa sobre superficies blancas y claras.
                </p>
              </div>
            </div>

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
                  Alimentan los botones del pie de página (Footer) y los accesos rápidos de contacto en la Landing Page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Instagram */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center p-0.5 shadow-2xs">
                    <InstagramIcon className="w-3.5 h-3.5 fill-current" />
                  </span>
                  Perfil de Instagram
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={e => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/kasasports"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all pr-10"
                  />
                  {instagramUrl && (
                    <a 
                      href={instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600"
                      title="Abrir perfil de Instagram"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">URL de la cuenta oficial de Instagram.</p>
              </div>

              {/* TikTok */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center p-0.5 shadow-2xs border border-white/20">
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </span>
                  Perfil de TikTok
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={e => setTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/@kasasports"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all pr-10"
                  />
                  {tiktokUrl && (
                    <a 
                      href={tiktokUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                      title="Abrir perfil de TikTok"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">URL del perfil oficial de TikTok (@kasasports).</p>
              </div>

              {/* Facebook */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center p-0.5 shadow-2xs">
                    <FacebookIcon className="w-3.5 h-3.5 fill-current" />
                  </span>
                  Página de Facebook
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={e => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/kasasport"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all pr-10"
                  />
                  {facebookUrl && (
                    <a 
                      href={facebookUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                      title="Abrir página de Facebook"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">Enlace a la página oficial de Facebook.</p>
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center p-0.5 shadow-2xs">
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                  </span>
                  WhatsApp Oficial (Tryouts)
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
                  Formato internacional sin + (Ej: <strong>584125012771</strong>).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: CALENDARIO DE LIGAS ACTIVAS */}
      {activeSubTab === 'calendar' && (
        <div className="animate-in fade-in duration-200">
          <EventCardSection
            sectionNumber="1"
            badgeLabel="Ligas Activas"
            icon={<Calendar className="w-6 h-6" />}
            title="Calendario Oficial de Ligas Activas"
            subtitle="Contenido público accesible en la ruta /calendario y en la primera tarjeta de la landing page."
            isActive={calendarIsActive}
            onToggleActive={() => setCalendarIsActive(!calendarIsActive)}
            titleLabel="Nombre de la Liga o Torneo"
            titleValue={calendarTitle}
            onChangeTitle={setCalendarTitle}
            titlePlaceholder="Ej: Torneo Apertura 2026 - Kickingball & Sóftbol"
            seasonLabel="Edición o Temporada"
            seasonValue={calendarSeason}
            onChangeSeason={setCalendarSeason}
            seasonPlaceholder="Ej: Temporada Regular 2026"
            descLabel="Información de Jornadas, Horarios y Sedes"
            descValue={calendarDescription}
            onChangeDesc={setCalendarDescription}
            descPlaceholder="Ej: Consulta las fechas y partidos oficiales de cada fin de semana en el Campo Deportivo KsaSport."
            imagesHeading="Imágenes y Afiches del Calendario / Rol de Juegos"
            imagesHelpText="Sube las fotos de las jornadas o el fixture. Puedes tocarlas para verlas en grande con zoom."
            emptyImagesText="Aún no has subido imágenes del calendario"
            retainedImages={retainedImages}
            newImageFiles={newImageFiles}
            imageInputRef={imageInputRef}
            onAddImages={handleAddImages}
            onRemoveRetained={handleRemoveRetainedImage}
            onRemoveNew={handleRemoveNewImage}
            pdfHeading="Documento PDF Descargable del Calendario Oficial"
            pdfHelpText="Permite a los visitantes descargar el archivo PDF completo del rol de juegos o reglamento del torneo."
            pdfDefaultFileName="Calendario_Oficial_KsaSport.pdf"
            currentPdfUrl={currentPdfUrl}
            newPdfFile={newPdfFile}
            removePdf={removePdf}
            pdfInputRef={pdfInputRef}
            onPdfChange={handlePdfChange}
            onRemovePdf={() => {
              setCurrentPdfUrl(null)
              setNewPdfFile(null)
              setRemovePdf(true)
              if (pdfInputRef.current) pdfInputRef.current.value = ''
            }}
            onUndoRemovePdf={() => {
              setRemovePdf(false)
              setCurrentPdfUrl(settings?.calendar_pdf_url || null)
            }}
            onOpenPreview={setPreviewModalUrl}
          />
        </div>
      )}

      {/* CONTENIDO 3: SCOUTING Y TRYOUTS OFICIALES */}
      {activeSubTab === 'tryouts' && (
        <div className="animate-in fade-in duration-200">
          <EventCardSection
            sectionNumber="2"
            badgeLabel="Captación de Talento"
            icon={<Users className="w-6 h-6" />}
            title="Scouting y Tryouts Oficiales"
            subtitle="Convocatorias abiertas, fechas de pruebas y evaluación de aspirantes mostradas en la segunda tarjeta de la landing."
            isActive={tryoutsIsActive}
            onToggleActive={() => setTryoutsIsActive(!tryoutsIsActive)}
            titleLabel="Título de la Convocatoria de Tryouts"
            titleValue={tryoutsTitle}
            onChangeTitle={setTryoutsTitle}
            titlePlaceholder="Ej: Scouting y Tryouts Oficiales 2026"
            seasonLabel="Temporada o Categoría"
            seasonValue={tryoutsSeason}
            onChangeSeason={setTryoutsSeason}
            seasonPlaceholder="Ej: Categorías Juvenil, Adulto & Élite"
            descLabel="Requisitos, Fechas y Sedes de Pruebas"
            descValue={tryoutsDescription}
            onChangeDesc={setTryoutsDescription}
            descPlaceholder="Ej: ¿Tienes talento para el Béisbol o Kickingball? Regístrate en nuestras próximas pruebas y forma parte de nuestros equipos."
            imagesHeading="Afiches y Convocatorias Gráficas de Tryouts"
            imagesHelpText="Sube los afiches promocionales con las fechas, edades y requisitos de los tryouts para consulta pública."
            emptyImagesText="Aún no has subido afiches de Tryouts"
            retainedImages={tryoutsRetainedImages}
            newImageFiles={tryoutsNewImageFiles}
            imageInputRef={tryoutsImageInputRef}
            onAddImages={handleAddTryoutsImages}
            onRemoveRetained={handleRemoveRetainedTryoutsImage}
            onRemoveNew={handleRemoveNewTryoutsImage}
            pdfHeading="Documento PDF de Convocatoria / Ficha de Inscripción"
            pdfHelpText="Permite a los aspirantes descargar la planilla de inscripción, consentimiento o bases oficiales de la prueba."
            pdfDefaultFileName="Convocatoria_Tryouts_KsaSport.pdf"
            currentPdfUrl={tryoutsCurrentPdfUrl}
            newPdfFile={tryoutsNewPdfFile}
            removePdf={tryoutsRemovePdf}
            pdfInputRef={tryoutsPdfInputRef}
            onPdfChange={handleTryoutsPdfChange}
            onRemovePdf={() => {
              setTryoutsCurrentPdfUrl(null)
              setTryoutsNewPdfFile(null)
              setTryoutsRemovePdf(true)
              if (tryoutsPdfInputRef.current) tryoutsPdfInputRef.current.value = ''
            }}
            onUndoRemovePdf={() => {
              setTryoutsRemovePdf(false)
              setTryoutsCurrentPdfUrl(settings?.tryouts_pdf_url || null)
            }}
            onOpenPreview={setPreviewModalUrl}
          />
        </div>
      )}

      {/* CONTENIDO 4: DRAFTS DE KICKINGBALL */}
      {activeSubTab === 'drafts' && (
        <div className="animate-in fade-in duration-200">
          <EventCardSection
            sectionNumber="3"
            badgeLabel="Drafts Kickingball"
            icon={<Trophy className="w-6 h-6" />}
            title="Drafts de Kickingball"
            subtitle="Información de reclutamiento, rol de selección y fichas del circuito de Kickingball mostradas en la tercera tarjeta."
            isActive={draftsIsActive}
            onToggleActive={() => setDraftsIsActive(!draftsIsActive)}
            titleLabel="Nombre del Torneo / Draft"
            titleValue={draftsTitle}
            onChangeTitle={setDraftsTitle}
            titlePlaceholder="Ej: Drafts Oficiales de Kickingball"
            seasonLabel="Edición o Circuito"
            seasonValue={draftsSeason}
            onChangeSeason={setDraftsSeason}
            seasonPlaceholder="Ej: Circuito Apertura 2026"
            descLabel="Bases del Draft, Roster y Fichajes"
            descValue={draftsDescription}
            onChangeDesc={setDraftsDescription}
            descPlaceholder="Ej: Postulación y selección oficial de atletas para el circuito élite y categorías competitivas de Kickingball."
            imagesHeading="Afiches del Draft, Equipos y Fichajes"
            imagesHelpText="Sube las fotos y artes gráficos con las fechas de selección y rosters del draft de Kickingball."
            emptyImagesText="Aún no has subido afiches del Draft"
            retainedImages={draftsRetainedImages}
            newImageFiles={draftsNewImageFiles}
            imageInputRef={draftsImageInputRef}
            onAddImages={handleAddDraftsImages}
            onRemoveRetained={handleRemoveRetainedDraftsImage}
            onRemoveNew={handleRemoveNewDraftsImage}
            pdfHeading="Documento PDF Oficial del Reglamento o Planilla del Draft"
            pdfHelpText="Permite descargar las bases del draft, estatutos o lista oficial de jugadoras seleccionables."
            pdfDefaultFileName="Reglamento_Draft_Kickingball.pdf"
            currentPdfUrl={draftsCurrentPdfUrl}
            newPdfFile={draftsNewPdfFile}
            removePdf={draftsRemovePdf}
            pdfInputRef={draftsPdfInputRef}
            onPdfChange={handleDraftsPdfChange}
            onRemovePdf={() => {
              setDraftsCurrentPdfUrl(null)
              setDraftsNewPdfFile(null)
              setDraftsRemovePdf(true)
              if (draftsPdfInputRef.current) draftsPdfInputRef.current.value = ''
            }}
            onUndoRemovePdf={() => {
              setDraftsRemovePdf(false)
              setDraftsCurrentPdfUrl(settings?.drafts_pdf_url || null)
            }}
            onOpenPreview={setPreviewModalUrl}
          />
        </div>
      )}

      {/* MODAL LIGHTBOX / VISOR DE AFICHE EN PANTALLA COMPLETA */}
      {previewModalUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 text-white">
              <span className="text-xs sm:text-sm font-black tracking-wide text-gray-200">
                Previsualización de Afiche Oficial
              </span>
              <div className="flex items-center gap-2">
                <a 
                  href={previewModalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Abrir Original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalUrl(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-red-600/80 text-gray-200 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 sm:p-4 overflow-auto flex items-center justify-center bg-black/50 min-h-[300px]">
              <img 
                src={previewModalUrl} 
                alt="Afiche ampliado" 
                className="max-h-[76vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

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
              <span>Guardando y procesando eventos...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5 text-kasa-dorado" />
              <span>Guardar Presencia Digital y Eventos</span>
            </>
          )}
        </button>
      </div>

    </form>
  )
}

/**
 * Componente Reutilizable y 100% Responsivo para Gestión de Tarjetas de Eventos
 */
interface EventCardSectionProps {
  sectionNumber: string;
  badgeLabel: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isActive: boolean;
  onToggleActive: () => void;
  titleLabel: string;
  titleValue: string;
  onChangeTitle: (val: string) => void;
  titlePlaceholder: string;
  seasonLabel: string;
  seasonValue: string;
  onChangeSeason: (val: string) => void;
  seasonPlaceholder: string;
  descLabel: string;
  descValue: string;
  onChangeDesc: (val: string) => void;
  descPlaceholder: string;
  imagesHeading: string;
  imagesHelpText: string;
  emptyImagesText: string;
  retainedImages: string[];
  newImageFiles: { file: File; preview: string }[];
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onAddImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveRetained: (idx: number) => void;
  onRemoveNew: (idx: number) => void;
  pdfHeading: string;
  pdfHelpText: string;
  pdfDefaultFileName: string;
  currentPdfUrl: string | null;
  newPdfFile: File | null;
  removePdf: boolean;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  onPdfChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePdf: () => void;
  onUndoRemovePdf: () => void;
  onOpenPreview: (url: string) => void;
}

function EventCardSection({
  sectionNumber,
  badgeLabel,
  icon,
  title,
  subtitle,
  isActive,
  onToggleActive,
  titleLabel,
  titleValue,
  onChangeTitle,
  titlePlaceholder,
  seasonLabel,
  seasonValue,
  onChangeSeason,
  seasonPlaceholder,
  descLabel,
  descValue,
  onChangeDesc,
  descPlaceholder,
  imagesHeading,
  imagesHelpText,
  emptyImagesText,
  retainedImages,
  newImageFiles,
  imageInputRef,
  onAddImages,
  onRemoveRetained,
  onRemoveNew,
  pdfHeading,
  pdfHelpText,
  pdfDefaultFileName,
  currentPdfUrl,
  newPdfFile,
  removePdf,
  pdfInputRef,
  onPdfChange,
  onRemovePdf,
  onUndoRemovePdf,
  onOpenPreview
}: EventCardSectionProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 w-full min-w-0">
      
      {/* Cabecera de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2.5 bg-kasa-vinotinto/10 rounded-2xl text-kasa-vinotinto shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 break-words">{title}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                {badgeLabel}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 break-words">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Toggle Activo / Pausado */}
        <div className="flex items-center justify-between sm:justify-start gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 shrink-0">
          <span className="text-xs font-bold text-gray-700">Estado Público:</span>
          <button
            type="button"
            onClick={onToggleActive}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              isActive 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {isActive ? '● Publicado' : '○ En Pausa'}
          </button>
        </div>
      </div>

      {/* Título y Temporada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-700">
            {titleLabel}
          </label>
          <input
            type="text"
            value={titleValue}
            onChange={e => onChangeTitle(e.target.value)}
            placeholder={titlePlaceholder}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-700">
            {seasonLabel}
          </label>
          <input
            type="text"
            value={seasonValue}
            onChange={e => onChangeSeason(e.target.value)}
            placeholder={seasonPlaceholder}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all"
          />
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-gray-700">
          {descLabel}
        </label>
        <textarea
          rows={3}
          value={descValue}
          onChange={e => onChangeDesc(e.target.value)}
          placeholder={descPlaceholder}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all resize-none"
        />
      </div>

      {/* GESTOR DE IMÁGENES Y AFICHES REDISEÑADO (COMPACTO Y ELEGANTE) */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200/70">
          <div className="min-w-0">
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-kasa-dorado-dark shrink-0" />
              <span>{imagesHeading}</span>
              <span className="text-[10px] font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                {retainedImages.length + newImageFiles.length} afiches
              </span>
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5 break-words">
              {imagesHelpText}
            </p>
          </div>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-kasa-vinotinto hover:bg-red-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Subir Afiches</span>
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={onAddImages}
          />
        </div>

        {/* Galería Compacta de Miniaturas */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* Botón Integrado de Añadir Más */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="relative aspect-[3/4] max-h-48 sm:max-h-52 rounded-xl border-2 border-dashed border-slate-300 hover:border-kasa-vinotinto hover:bg-red-50/20 transition-all flex flex-col items-center justify-center p-2 text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-red-100/70 text-slate-500 group-hover:text-kasa-vinotinto flex items-center justify-center mb-1.5 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-kasa-vinotinto leading-tight">
              Añadir afiche
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
              JPG, PNG, WebP
            </span>
          </button>

          {/* Existentes */}
          {retainedImages.map((url, idx) => (
            <div 
              key={`retained-${idx}`} 
              className="group relative aspect-[3/4] max-h-48 sm:max-h-52 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs hover:shadow-md transition-all cursor-pointer"
              onClick={() => onOpenPreview(url)}
            >
              <img 
                src={url} 
                alt={`Afiche ${idx + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold tracking-tight shadow-xs pointer-events-none">
                #{idx + 1}
              </span>

              <div 
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 flex items-center justify-end gap-1.5 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onOpenPreview(url)}
                  className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-900 shadow-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  title="Ver en pantalla completa"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRetained(idx)}
                  className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  title="Eliminar afiche"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Nuevas por subir */}
          {newImageFiles.map((item, idx) => (
            <div 
              key={`new-${idx}`} 
              className="group relative aspect-[3/4] max-h-48 sm:max-h-52 rounded-xl overflow-hidden border-2 border-dashed border-emerald-500 bg-emerald-50/40 shadow-2xs hover:shadow-md transition-all cursor-pointer"
              onClick={() => onOpenPreview(item.preview)}
            >
              <img 
                src={item.preview} 
                alt={`Nuevo ${idx + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold shadow-xs pointer-events-none">
                Nuevo
              </span>

              <div 
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 flex items-center justify-end gap-1.5 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onOpenPreview(item.preview)}
                  className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-900 shadow-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  title="Ver en pantalla completa"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveNew(idx)}
                  className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  title="Quitar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GESTOR DE PDF DESCARGABLE */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div>
          <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-kasa-vinotinto shrink-0" />
            <span>{pdfHeading}</span>
          </h4>
          <p className="text-xs text-gray-400 mt-0.5 break-words">
            {pdfHelpText}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200">
          {removePdf ? (
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 bg-amber-50/80 p-3 rounded-xl border border-amber-200">
              <span className="font-semibold break-words">El documento PDF se eliminará al guardar los cambios.</span>
              <button
                type="button"
                onClick={onUndoRemovePdf}
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
                <p className="text-xs font-bold text-gray-900 truncate">{pdfDefaultFileName}</p>
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
              onChange={onPdfChange}
            />

            {(currentPdfUrl || newPdfFile) && (
              <button
                type="button"
                onClick={onRemovePdf}
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
  )
}
