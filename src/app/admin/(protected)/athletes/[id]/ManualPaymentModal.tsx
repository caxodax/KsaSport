'use client'

import { useState } from 'react'
import { 
  CreditCard, DollarSign, Calendar, Tag, Check, AlertCircle, 
  Loader2, X, PlusCircle, Trophy, CheckCircle2, FileText, ArrowRight,
  AlertTriangle
} from 'lucide-react'
import { recordManualPayment } from './actions'
import { toast } from 'sonner'

export interface AthleteProductForPayment {
  id: string
  name: string
  price: number
  requires_opt_in?: boolean | null
  allows_installments?: boolean | null
  isEnrolled: boolean
  amountPaid: number
  amountPending: number
  isExempt: boolean
}

interface ManualPaymentModalProps {
  athleteId: string
  athleteName: string
  products: AthleteProductForPayment[]
}

const PAYMENT_METHODS = [
  'Efectivo (USD)',
  'Pago Móvil (Bs)',
  'Zelle',
  'Punto de Venta',
  'Transferencia Bancaria',
  'Efectivo (EUR)',
  'Otro'
]

export default function ManualPaymentModal({
  athleteId,
  athleteName,
  products
}: ManualPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Buscar primer producto que tenga saldo pendiente o el primero de la lista
  const defaultProduct = products.find(p => p.amountPending > 0) || products[0]
  const [selectedProductId, setSelectedProductId] = useState<string>(defaultProduct?.id || '')
  
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<string>('Efectivo (USD)')
  const [rateType, setRateType] = useState<'USD' | 'EUR'>('USD')
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Estado para el Alert/Modal de confirmación de liga inactiva
  const [isConfirmingEnroll, setIsConfirmingEnroll] = useState(false)

  const selectedProduct = products.find(p => p.id === selectedProductId)

  const handleOpen = () => {
    const prod = products.find(p => p.amountPending > 0) || products[0]
    if (prod) {
      setSelectedProductId(prod.id)
      setAmount(prod.amountPending > 0 ? prod.amountPending.toString() : '')
    }
    setIsConfirmingEnroll(false)
    setIsOpen(true)
  }

  const handleProductChange = (id: string) => {
    setSelectedProductId(id)
    const prod = products.find(p => p.id === id)
    if (prod && prod.amountPending > 0) {
      setAmount(prod.amountPending.toString())
    }
  }

  const handlePayFullRemaining = () => {
    if (selectedProduct && selectedProduct.amountPending > 0) {
      setAmount(selectedProduct.amountPending.toFixed(2))
    }
  }

  const executePayment = async (numAmount: number) => {
    setLoading(true)
    try {
      const res = await recordManualPayment({
        athleteId,
        productId: selectedProductId,
        amount: numAmount,
        rateType,
        method,
        paymentDate,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined
      })

      if (res?.error) {
        toast.error('Error al registrar pago: ' + res.error)
      } else {
        toast.success(
          `¡Abono de $${numAmount.toFixed(2)} registrado exitosamente!` +
          (selectedProduct?.requires_opt_in ? ' (Atleta confirmada en la liga 🏆)' : '')
        )
        setIsOpen(false)
        setIsConfirmingEnroll(false)
        setAmount('')
        setReference('')
        setNotes('')
      }
    } catch (err: any) {
      toast.error('Error inesperado: ' + (err?.message || 'No se pudo registrar'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Ingresa un monto numérico válido mayor a 0.')
      return
    }

    if (!selectedProductId) {
      toast.error('Selecciona un producto para aplicar el abono.')
      return
    }

    // SI EL PRODUCTO ES TORNEO / REQUIERE OPT-IN Y LA ATLETA NO TIENE EL CHECK ACTIVO:
    // Mostramos la alerta de confirmación para evitar errores humanos
    if (selectedProduct?.requires_opt_in && !selectedProduct.isEnrolled) {
      setIsConfirmingEnroll(true)
      return
    }

    // Si ya está inscrita o es un producto normal (mensualidad), procesamos directamente
    executePayment(numAmount)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 via-rose-700 to-kasa-vinotinto hover:from-red-700 hover:to-rose-800 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
      >
        <PlusCircle className="w-4 h-4 text-white" />
        <span>Registrar Abono / Pago Manual</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 relative">
            
            {/* Cabecera del Modal */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-kasa-vinotinto p-6 text-white relative">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setIsConfirmingEnroll(false)
                }}
                className="absolute top-5 right-5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <CreditCard className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                    Caja Administrativa
                  </span>
                  <h3 className="text-xl font-black text-white">
                    Registrar Abono o Pago Manual
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2 font-medium">
                Atleta: <strong className="text-white font-bold">{athleteName}</strong>. Carga un abono o pago fuera de línea que se reflejará de inmediato en su perfil y portal.
              </p>
            </div>

            {/* Formulario Principal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Selección de Producto */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Concepto / Producto a Abonar
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-kasa-vinotinto focus:outline-hidden text-sm font-bold text-gray-900 transition-all"
                  required
                >
                  {products.map(p => {
                    let tag = ''
                    if (p.requires_opt_in && !p.isEnrolled) {
                      tag = '⚠️ (No juega aún - requiere confirmación)'
                    } else if (p.amountPending > 0) {
                      tag = `(Debe: $${p.amountPending.toFixed(2)})`
                    } else if (p.amountPaid > 0) {
                      tag = '(Completado)'
                    }
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price.toFixed(2)} {tag}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Tarjeta de Resumen del Producto Seleccionado */}
              {selectedProduct && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Precio Total:</span>
                    <span className="font-mono font-black text-gray-900">${selectedProduct.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Ya Abonado:</span>
                    <span className="font-mono font-bold text-emerald-700">${selectedProduct.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <span className="font-black text-slate-700">Saldo Pendiente:</span>
                    <span className="font-mono font-black text-rose-600 text-sm">
                      ${selectedProduct.amountPending.toFixed(2)}
                    </span>
                  </div>

                  {/* Estado de Convocatoria si es Torneo */}
                  {selectedProduct.requires_opt_in && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Estatus en esta Liga:</span>
                      {selectedProduct.isEnrolled ? (
                        <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Confirmada / Jugará Liga
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-black text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          No Convocada (No Juega Aún)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Banner de Opt-In Automático para Torneos/Ligas */}
                  {selectedProduct.requires_opt_in && (
                    <div className={`rounded-xl p-3 flex items-start gap-2.5 text-xs border ${
                      selectedProduct.isEnrolled
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200/90 text-amber-950'
                    }`}>
                      <Trophy className={`w-4 h-4 shrink-0 mt-0.5 ${selectedProduct.isEnrolled ? 'text-emerald-700' : 'text-amber-700'}`} />
                      <div>
                        <p className="font-black">
                          {selectedProduct.isEnrolled
                            ? 'Atleta inscrita formalmente en esta liga'
                            : 'Atleta actualmente NO activa en esta liga'}
                        </p>
                        <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                          {selectedProduct.isEnrolled
                            ? 'Este abono se sumará a su cuenta corriente de la liga normalmente.'
                            : 'Al guardar, se te solicitará confirmación para activarla automáticamente en la liga y registrar el pago.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Monto y Botón de Saldo Completo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Monto a Abonar (USD)
                  </label>
                  {selectedProduct && selectedProduct.amountPending > 0 && (
                    <button
                      type="button"
                      onClick={handlePayFullRemaining}
                      className="text-[11px] font-black text-kasa-vinotinto hover:underline cursor-pointer"
                    >
                      Abonar saldo restante (${selectedProduct.amountPending.toFixed(2)})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-kasa-vinotinto focus:outline-hidden text-base font-mono font-black text-gray-900 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Método de Pago y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-kasa-vinotinto focus:outline-hidden text-xs font-bold text-gray-900 transition-all"
                    required
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Fecha del Pago
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-kasa-vinotinto focus:outline-hidden text-xs font-bold text-gray-900 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Referencia y Notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    N° de Referencia / Recibo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej: 123456 o Recibo #42"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-kasa-vinotinto focus:outline-hidden text-xs font-medium text-gray-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Nota / Observación (Opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Pago en taquilla, cuota 1"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-kasa-vinotinto focus:outline-hidden text-xs font-medium text-gray-900 transition-all"
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl border border-slate-300 text-xs font-black text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar y Guardar Pago</span>
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* ALERT / DIALOG DE CONFIRMACIÓN PARA EVITAR ERRORES HUMANOS */}
            {isConfirmingEnroll && selectedProduct && (
              <div className="absolute inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-amber-300 text-center space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle className="w-8 h-8 text-amber-600 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-gray-900">
                      ¿Confirmar participación y abono?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      La jugadora <strong className="text-gray-900">{athleteName}</strong> actualmente <strong>NO tiene activa</strong> su participación en:
                    </p>
                    <div className="bg-slate-100 p-2.5 rounded-xl text-xs font-black text-gray-900 border border-slate-200">
                      🏆 {selectedProduct.name}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      ¿Deseas registrar este abono de <strong className="text-emerald-700 font-mono text-sm">${Number(amount).toFixed(2)}</strong> y <strong className="text-rose-700">marcarla automáticamente como confirmada (true)</strong> para jugar la liga?
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingEnroll(false)}
                      disabled={loading}
                      className="w-full sm:w-1/2 px-4 py-3 rounded-2xl border border-slate-300 text-xs font-black text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancelar / Revisar
                    </button>
                    <button
                      type="button"
                      onClick={() => executePayment(Number(amount))}
                      disabled={loading}
                      className="w-full sm:w-1/2 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Sí, Activar y Abonar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
