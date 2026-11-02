'use client'

import { useState } from 'react'
import { toggleExemption, toggleAthleteAlliance } from './actions'
import { ShieldCheck, HeartPulse, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

type Product = {
  id: string
  name: string
  price: number
}

type ExemptionManagerProps = {
  athleteId: string
  products: Product[]
  initialExemptions: string[]
  initialHasAlliance?: boolean
}

export default function ExemptionManager({ 
  athleteId, 
  products, 
  initialExemptions,
  initialHasAlliance = false
}: ExemptionManagerProps) {
  const [hasAlliance, setHasAlliance] = useState(Boolean(initialHasAlliance))
  const [exemptions, setExemptions] = useState<Set<string>>(new Set(initialExemptions))
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [isTogglingAlliance, setIsTogglingAlliance] = useState(false)

  const handleToggleAlliance = async (active: boolean) => {
    setIsTogglingAlliance(true)
    setHasAlliance(active)
    const res = await toggleAthleteAlliance(athleteId, active)
    if (res?.error) {
      setHasAlliance(!active)
      toast.error('Error al actualizar alianza: ' + res.error)
    } else {
      toast.success(active ? 'Insignia de Alianza Comercial activada.' : 'Insignia de Alianza Comercial desactivada.');
    }
    setIsTogglingAlliance(false)
  }

  const handleToggleExemption = async (productId: string, isExempt: boolean) => {
    setLoadingIds(prev => new Set(prev).add(productId))
    
    // Optimistic UI update
    const newExemptions = new Set(exemptions)
    if (isExempt) {
      newExemptions.add(productId)
    } else {
      newExemptions.delete(productId)
    }
    setExemptions(newExemptions)

    const result = await toggleExemption(athleteId, productId, isExempt)
    
    if (result?.error) {
      // Revert on error
      setExemptions(new Set(initialExemptions))
      toast.error('Error: ' + result.error)
    } else {
      toast.success(isExempt ? 'Cuota exonerada exitosamente (acuerdo / permiso médico).' : 'Exoneración removida. Cuota activa para cobro.');
    }

    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 p-5 sm:p-6 border-b border-amber-200/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-200/60 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-300/60 shadow-2xs">
              Permisos y Exoneraciones
            </span>
            {exemptions.size > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black">
                {exemptions.size} {exemptions.size === 1 ? 'exonerada' : 'exoneradas'}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mt-2">
          <HeartPulse className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Exoneraciones y Permisos Especiales</span>
        </h3>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Define qué cuotas específicas no se cobrarán a esta atleta (lesiones, reposo médico, becas deportivas o acuerdos especiales).
        </p>
      </div>
      
      {/* LISTA DE PRODUCTOS INDIVIDUALES */}
      <div className="p-3 sm:p-4">
        <ul className="divide-y divide-slate-100">
          {products.map(product => {
            const isExempt = exemptions.has(product.id)
            const isLoading = loadingIds.has(product.id)

            return (
              <li key={product.id} className="p-3 sm:p-4 hover:bg-slate-50/80 flex items-center justify-between transition-colors rounded-2xl">
                <div className="min-w-0 pr-3">
                  <h4 className="font-black text-gray-900 text-sm truncate">{product.name}</h4>
                  <span className="text-xs font-semibold text-slate-500">Precio base: ${Number(product.price).toFixed(2)}</span>
                </div>
                
                <label className={`relative inline-flex items-center cursor-pointer shrink-0 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isExempt}
                    onChange={(e) => handleToggleExemption(product.id, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                  <span className={`ms-3 text-[11px] font-black w-24 text-center px-2 py-1 rounded-lg border transition-all ${
                    isExempt 
                      ? 'bg-amber-100/90 text-amber-900 border-amber-300 shadow-2xs' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {isExempt ? 'EXONERADO' : 'COBRAR'}
                  </span>
                </label>
              </li>
            )
          })}
          {products.length === 0 && (
            <li className="p-8 text-center text-slate-400 font-medium text-sm">
              No hay productos activos en el club para exonerar.
            </li>
          )}
        </ul>

        {/* SECCIÓN OPCIONAL: INSIGNIA INSTITUCIONAL DE ALIANZA */}
        <div className="mt-4 pt-4 border-t border-slate-100 px-3 pb-1">
          <div className="flex items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                <p className="text-xs font-bold text-slate-800">Convenio / Alianza Institucional</p>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Muestra la insignia oficial 🤝 en nómina para atletas con patrocinio formal.
              </p>
            </div>

            <label className={`relative inline-flex items-center cursor-pointer shrink-0 ${isTogglingAlliance ? 'opacity-50 pointer-events-none' : ''}`}>
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={hasAlliance}
                onChange={(e) => handleToggleAlliance(e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
              <span className="ms-2 text-[10px] font-bold text-slate-700 hidden sm:inline">
                {hasAlliance ? 'Activo' : 'Inactivo'}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
