'use client'

import { useState } from 'react'
import { Ban, AlertTriangle, Loader2, X, Check } from 'lucide-react'
import { voidPayment } from '@/app/admin/(protected)/payments/actions'
import { toast } from 'sonner'

interface VoidPaymentButtonProps {
  paymentId: string
  concept: string
  amount: number
  rateType?: string
  athleteName: string
  status: string
}

export default function VoidPaymentButton({
  paymentId,
  concept,
  amount,
  rateType = 'USD',
  athleteName,
  status
}: VoidPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  // Si ya está anulado, no mostramos botón de acción
  if (status === 'Anulado') {
    return null
  }

  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await voidPayment(paymentId, reason)
      if (res?.error) {
        toast.error('Error al anular pago: ' + res.error)
      } else {
        toast.success(`Pago de $${Number(amount).toFixed(2)} anulado correctamente. Saldo revertido.`)
        setIsOpen(false)
        setReason('')
      }
    } catch (err: any) {
      toast.error('Error inesperado: ' + (err?.message || 'No se pudo anular'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg transition-all cursor-pointer shadow-2xs"
        title="Anular contablemente este pago"
      >
        <Ban className="w-3.5 h-3.5 text-rose-500" />
        <span>Anular</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 overflow-hidden relative animate-in zoom-in-95 duration-200">
            
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-rose-900 via-red-900 to-kasa-vinotinto p-5 text-white relative">
              <button
                type="button"
                onClick={() => !loading && setIsOpen(false)}
                className="absolute top-4 right-4 text-rose-200 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-200">
                    Control Financiero
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Anular Registro de Pago
                  </h3>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <form onSubmit={handleVoid} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Esta acción marcará el pago como <strong>ANULADO</strong> en el sistema y descontará este dinero del saldo de <strong className="text-gray-900">{athleteName}</strong>.
              </p>

              {/* Detalle del pago */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Concepto:</span>
                  <span className="font-bold text-gray-900 text-right truncate max-w-[220px]">{concept}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Monto:</span>
                  <span className="font-mono font-black text-rose-700 text-sm">
                    {rateType === 'EUR' ? '€' : '$'}{Number(amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Motivo de anulación */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Motivo de la anulación (Opcional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Error en el monto, pago duplicado, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-xs text-gray-900 font-medium transition-all"
                />
              </div>

              {/* Advertencia */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 font-medium">
                ⚠️ El pago no se borrará físicamente para mantener el historial contable, pero quedará excluido de los ingresos del club y del estado de cuenta de la atleta.
              </div>

              {/* Botones */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Anulando...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Confirmar Anulación</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
