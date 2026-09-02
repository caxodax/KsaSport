'use client'

import { useState } from 'react'
import { Trophy, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { optInToProduct } from '@/app/portal/dashboard/actions'

type OptInCardProps = {
  athleteId: string
  product: {
    id: string
    name: string
    price: number
    description: string
  }
}

export default function OptInCard({ athleteId, product }: OptInCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    const result = await optInToProduct(athleteId, product.id)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setShowModal(false)
      // Opcional: mostrar un success visual aquí antes de que revalide
    }
  }

  return (
    <>
      <div className="bg-gradient-to-r from-kasa-dorado/10 to-amber-50 rounded-2xl border border-kasa-dorado/30 p-5 shadow-sm relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform">
          <Trophy className="w-32 h-32 text-kasa-dorado" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-kasa-dorado text-kasa-vinotinto text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md">
              Invitación a Torneo
            </span>
          </div>
          
          <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{product.description || 'Confirma tu participación en este evento.'}</p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">Costo de Participación</span>
              <span className="text-2xl font-black text-kasa-vinotinto">${Number(product.price).toFixed(2)}</span>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="bg-kasa-vinotinto text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-kasa-vinotinto/20 hover:bg-kasa-vinotinto/90 hover:scale-105 transition-all"
            >
              ¡Quiero Participar!
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Confirmar Participación</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-center mb-6">
                Estás a punto de confirmar tu inscripción a <strong>{product.name}</strong>. 
                Esto generará un compromiso de pago de <span className="font-bold text-kasa-vinotinto">${Number(product.price).toFixed(2)}</span> en tu cuenta.
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-kasa-vinotinto text-white font-bold rounded-xl hover:bg-kasa-vinotinto/90 transition-colors shadow-lg shadow-kasa-vinotinto/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Confirmando...' : 'Sí, Inscribirme'}
                  {!loading && <CheckCircle className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
