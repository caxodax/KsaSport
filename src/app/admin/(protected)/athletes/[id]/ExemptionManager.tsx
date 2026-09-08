'use client'

import { useState } from 'react'
import { toggleExemption } from './actions'
import { Check, ShieldCheck, ShieldAlert } from 'lucide-react'

type Product = {
  id: string
  name: string
  price: number
}

type ExemptionManagerProps = {
  athleteId: string
  products: Product[]
  initialExemptions: string[]
}

export default function ExemptionManager({ athleteId, products, initialExemptions }: ExemptionManagerProps) {
  const [exemptions, setExemptions] = useState<Set<string>>(new Set(initialExemptions))
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const handleToggle = async (productId: string, isExempt: boolean) => {
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
    
    if (result.error) {
      // Revert on error
      setExemptions(new Set(initialExemptions))
      alert('Error: ' + result.error)
    }

    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 p-5 sm:p-6 border-b border-amber-200/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-200/60 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-300/60 shadow-2xs">
              Membresía Especial
            </span>
          </div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mt-1">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            Configuración de Alianza Comercial
          </h3>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Selecciona de qué productos está exonerada esta jugadora. Las cuotas pasarán automáticamente a $0.00.
          </p>
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        <ul className="divide-y divide-slate-100">
          {products.map(product => {
            const isExempt = exemptions.has(product.id)
            const isLoading = loadingIds.has(product.id)

            return (
              <li key={product.id} className="p-3 sm:p-4 hover:bg-slate-50/80 flex items-center justify-between transition-colors rounded-2xl">
                <div className="min-w-0 pr-3">
                  <h4 className="font-black text-gray-900 text-sm truncate">{product.name}</h4>
                  <span className="text-xs font-semibold text-slate-500">Precio normal: ${Number(product.price).toFixed(2)}</span>
                </div>
                
                <label className={`relative inline-flex items-center cursor-pointer shrink-0 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isExempt}
                    onChange={(e) => handleToggle(product.id, e.target.checked)}
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
      </div>
    </div>
  )
}
