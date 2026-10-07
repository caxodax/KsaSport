'use client'

import { useState } from 'react'
import { toggleTournamentEnrollment } from './actions'
import { Trophy, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export type TournamentProduct = {
  id: string
  name: string
  price: number
  description?: string | null
  categories?: string[] | null
  requires_opt_in?: boolean | null
}

interface TournamentEnrollmentManagerProps {
  athleteId: string
  tournamentProducts: TournamentProduct[]
  initialEnrolledIds: string[]
}

export default function TournamentEnrollmentManager({
  athleteId,
  tournamentProducts,
  initialEnrolledIds
}: TournamentEnrollmentManagerProps) {
  const [enrolledSet, setEnrolledSet] = useState<Set<string>>(new Set(initialEnrolledIds))
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const handleToggle = async (productId: string, willEnroll: boolean) => {
    setLoadingIds(prev => new Set(prev).add(productId))

    // Actualización optimista
    const nextSet = new Set(enrolledSet)
    if (willEnroll) {
      nextSet.add(productId)
    } else {
      nextSet.delete(productId)
    }
    setEnrolledSet(nextSet)

    const res = await toggleTournamentEnrollment(athleteId, productId, willEnroll)

    if (res?.error) {
      // Revertir en caso de error
      setEnrolledSet(new Set(enrolledSet))
      toast.error('Error al actualizar inscripción: ' + res.error)
    } else {
      toast.success(
        willEnroll 
          ? '¡Atleta inscrita formalmente en la liga (Confirmada)! 🏆' 
          : 'Atleta retirada de la convocatoria de la liga.'
      )
    }

    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  if (tournamentProducts.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="bg-gradient-to-r from-red-50 via-rose-50/40 to-red-50 p-5 sm:p-6 border-b border-red-200/70">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-red-100 text-kasa-vinotinto text-[10px] font-black uppercase tracking-wider border border-red-200 shadow-2xs">
              Convocatorias Oficiales
            </span>
            {enrolledSet.size > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                {enrolledSet.size} {enrolledSet.size === 1 ? 'inscrita' : 'inscritas'}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mt-2">
          <Trophy className="w-5 h-5 text-kasa-vinotinto shrink-0" />
          <span>Inscripción a Torneos / Ligas</span>
        </h3>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Confirma si esta atleta jugará las ligas activas. Al marcarla, quedará formalmente convocada y podrá abonar cuotas en el portal.
        </p>
      </div>

      <div className="p-3 sm:p-4">
        <ul className="divide-y divide-slate-100">
          {tournamentProducts.map(product => {
            const isEnrolled = enrolledSet.has(product.id)
            const isLoading = loadingIds.has(product.id)

            return (
              <li 
                key={product.id} 
                className="p-3 sm:p-4 hover:bg-slate-50/80 flex items-center justify-between transition-colors rounded-2xl gap-3"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-gray-900 text-sm truncate">{product.name}</h4>
                    {isEnrolled && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Jugará Liga
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs font-semibold text-slate-500">
                    <span>Precio: ${Number(product.price).toFixed(2)}</span>
                    {product.categories && product.categories.length > 0 && (
                      <span>• {product.categories.join(', ')}</span>
                    )}
                  </div>
                </div>

                <label className={`relative inline-flex items-center cursor-pointer shrink-0 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isEnrolled}
                    onChange={(e) => handleToggle(product.id, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                  <span className={`ms-3 text-[11px] font-black w-24 text-center px-2 py-1 rounded-lg border transition-all ${
                    isEnrolled 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {isLoading ? '...' : isEnrolled ? 'CONFIRMADA' : 'NO JUEGA'}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
