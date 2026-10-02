'use client'

import { useState, useRef } from 'react'
import { 
  Globe, MessageCircle, Share2, Calendar, FileText, 
  Upload, Trash2, ExternalLink, Save, CheckCircle2, 
  AlertCircle, Loader2, Plus, Eye, Image as ImageIcon
} from 'lucide-react'
import { updatePortalAndCalendarSettings } from './actions'
import { compressImageClient } from '@/lib/clientImageCompressor'

interface PortalSettingsProps {
  settings: {
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

export default function PortalSettings({ settings }: PortalSettingsProps) {
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
        setNewImageFiles([])
        setNewPdfFile(null)
        setRemovePdf(false)
        setTimeout(() => setSuccess(false), 4000)
      }
    } catch (err: any) {
      setError(err?.message || 'Error guardando la configuración.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">
      
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
          <span className="font-bold">¡Configuración guardada exitosamente! Los cambios ya son visibles en la Landing y en /calendario.</span>
        </div>
      )}

      {/* SECCIÓN 1: REDES SOCIALES Y CONTACTO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-700">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Redes Sociales y WhatsApp Oficial</h3>
            <p className="text-xs text-gray-500 mt-0.5">
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-kasa-vinotinto/10 rounded-2xl text-kasa-vinotinto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Calendario Oficial de Ligas Activas</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Contenido público accesible en la ruta <a href="/calendario" target="_blank" className="font-bold text-kasa-vinotinto underline">/calendario</a> sin requerir inicio de sesión.
              </p>
            </div>
          </div>

          {/* Toggle Activo / Pausado */}
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
            <span className="text-xs font-bold text-gray-700">Estado Público:</span>
            <button
              type="button"
              onClick={() => setCalendarIsActive(!calendarIsActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-kasa-dorado-dark" />
                Imágenes y Afiches del Calendario / Rol de Juegos
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Sube las fotos de las jornadas o el fixture. Los visitantes podrán abrirlas y hacerles zoom en pantalla completa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-kasa-vinotinto hover:bg-red-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existentes */}
            {retainedImages.map((url, idx) => (
              <div key={`retained-${idx}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs">
                <img src={url} alt="Calendario" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-md"
                    title="Ver en grande"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveRetainedImage(idx)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md"
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
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(idx)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md"
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
                className="col-span-full py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
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
              <FileText className="w-4 h-4 text-kasa-vinotinto" />
              Documento PDF Descargable del Calendario Oficial
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Permite a los visitantes descargar el archivo PDF completo del rol de juegos o reglamento del torneo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            {newPdfFile ? (
              <div className="flex-1 flex items-center gap-3">
                <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-900 truncate">{newPdfFile.name}</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Nuevo archivo seleccionado (Pendiente de guardar)</p>
                </div>
              </div>
            ) : currentPdfUrl ? (
              <div className="flex-1 flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-600 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-900">Calendario_Oficial_KsaSport.pdf</p>
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

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
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
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
      <div className="sticky bottom-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-kasa-vinotinto to-red-950 hover:from-red-950 hover:to-black text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Guardando y procesando imágenes...</span>
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
