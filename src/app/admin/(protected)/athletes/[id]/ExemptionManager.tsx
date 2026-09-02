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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-kasa-dorado/10 p-5 border-b border-kasa-dorado/20 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-kasa-dorado" />
            Configuración de Alianza Comercial
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona de qué productos está exonerada esta jugadora. Las deudas de estos productos pasarán automáticamente a $0.00.
          </p>
        </div>
      </div>
      
      <div className="p-2">
        <ul className="divide-y divide-gray-50">
          {products.map(product => {
            const isExempt = exemptions.has(product.id)
            const isLoading = loadingIds.has(product.id)

            return (
              <li key={product.id} className="p-3 sm:p-4 hover:bg-gray-50 flex items-center justify-between transition-colors rounded-xl">
                <div>
                  <h4 className="font-bold text-gray-900">{product.name}</h4>
                  <span className="text-sm text-gray-500">Precio normal: ${Number(product.price).toFixed(2)}</span>
                </div>
                
                <label className={`relative inline-flex items-center cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isExempt}
                    onChange={(e) => handleToggle(product.id, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-kasa-dorado/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kasa-dorado"></div>
                  <span className="ms-3 text-sm font-bold text-gray-700 w-20 text-right">
                    {isExempt ? 'EXONERADO' : 'COBRAR'}
                  </span>
                </label>
              </li>
            )
          })}
          {products.length === 0 && (
            <li className="p-8 text-center text-gray-500">
              No hay productos activos en el club para exonerar.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
