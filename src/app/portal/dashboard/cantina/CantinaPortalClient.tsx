"use client"

import { useState } from "react"
import Link from "next/link"
import {
  UtensilsCrossed,
  ArrowLeft,
  DollarSign,
  CreditCard,
  History,
  Calendar,
  ChevronDown,
  ChevronUp,
  Camera,
  Upload,
  CheckCircle2,
  Check,
  AlertCircle,
  Clock,
  X,
  FileText
} from "lucide-react"
import { formatCedula } from "@/lib/cedula"
import { reportFoodPayment } from "./actions"

interface CantinaPortalClientProps {
  athlete: any
  creditAccount: {
    id?: string
    balance: number
    credit_limit: number
  }
  orders: any[]
  payments: any[]
  rates: any
}

export default function CantinaPortalClient({
  athlete,
  creditAccount,
  orders,
  payments,
  rates
}: CantinaPortalClientProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "payments">("orders")
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [payAmount, setPayAmount] = useState<string>(creditAccount.balance > 0 ? creditAccount.balance.toString() : "")
  const [payMethod, setPayMethod] = useState<string>("Pago Móvil")
  const [payReference, setPayReference] = useState<string>("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isSubmittingPay, setIsSubmittingPay] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const bcvEuroRate = Number(rates?.eur || rates?.usd || 0)
  const balanceEUR = Number(creditAccount.balance || 0)
  const balanceBs = balanceEUR * bcvEuroRate
  const creditLimitEUR = Number(creditAccount.credit_limit || 50)
  const availableCreditEUR = Math.max(0, creditLimitEUR - balanceEUR)

  // Desglose de bolívares en el formulario de pago
  const inputAmountEUR = Number(payAmount) || 0
  const inputAmountBs = inputAmountEUR * bcvEuroRate

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputAmountEUR <= 0) {
      showToast("Ingresa un monto válido a pagar.", "error")
      return
    }

    setIsSubmittingPay(true)
    try {
      const formData = new FormData()
      formData.append("amount", inputAmountEUR.toString())
      formData.append("method", payMethod)
      formData.append("reference", payReference)
      formData.append("transferred_amount", inputAmountBs.toFixed(2))
      formData.append("exchange_rate", bcvEuroRate.toString())
      if (receiptFile) {
        formData.append("receipt", receiptFile)
      }

      const res = await reportFoodPayment(formData)
      if (res?.error) {
        showToast(res.error, "error")
      } else {
        showToast("¡Pago de cantina reportado con éxito! El administrador lo validará en breve.", "success")
        setIsPayModalOpen(false)
        setPayReference("")
        setReceiptFile(null)
      }
    } catch (err: any) {
      showToast("Error al reportar pago: " + err.message, "error")
    } finally {
      setIsSubmittingPay(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-bounce transition-all ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Barra de Retorno */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-kasa-vinotinto bg-white px-4 py-2 rounded-xl border border-gray-200 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>
        <span className="text-xs font-semibold text-gray-400">
          Atleta: <b>{athlete.name}</b>
        </span>
      </div>

      {/* TARJETA DE ESTADO DE CUENTA DE CANTINA (Hero Card Mobile-First) */}
      <div className="bg-gradient-to-br from-kasa-vinotinto via-red-950 to-black rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-kasa-dorado/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <UtensilsCrossed className="w-5 h-5 text-kasa-dorado" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-kasa-dorado">
                Cantina & Alimentos KsaSports
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Estado de Cuenta de Cantina</h1>
            <p className="text-white/70 text-xs sm:text-sm mt-1">
              Consulta tus consumos asignados y reporta tus abonos o pagos.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <span className="text-[10px] uppercase font-bold text-gray-300">Saldo Deudor Actual</span>
            <div className="text-3xl font-black text-white">
              €{balanceEUR.toFixed(2)}{" "}
              <span className="text-xs font-normal text-kasa-dorado">EUR</span>
            </div>
            {bcvEuroRate > 0 && balanceEUR > 0 && (
              <span className="text-xs font-bold text-amber-200">
                ≈ Bs. {balanceBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })} (@ Bs. {bcvEuroRate.toFixed(2)})
              </span>
            )}
            <div className="text-[10px] text-white/60 mt-1 flex gap-2 border-t border-white/10 pt-1">
              <span>Límite: €{creditLimitEUR.toFixed(2)}</span>
              <span>•</span>
              <span className="text-emerald-300">Disponible: €{availableCreditEUR.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Botón Destacado de Pago */}
        {balanceEUR > 0 && (
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/80 font-medium">
              Puedes pagar la totalidad de tu saldo o hacer un abono parcial.
            </p>
            <button
              onClick={() => {
                setPayAmount(balanceEUR.toString())
                setIsPayModalOpen(true)
              }}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-kasa-dorado to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-kasa-vinotinto font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Pagar Deuda de Cantina
            </button>
          </div>
        )}
      </div>

      {/* PESTAÑAS: CONSUMOS VS PAGOS REPORTADOS */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-4 text-xs sm:text-sm font-black transition-colors relative ${
            activeTab === "orders" ? "text-kasa-vinotinto" : "text-gray-400 hover:text-gray-700"
          }`}
        >
          Consumos Asignados ({orders.length})
          {activeTab === "orders" && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-kasa-vinotinto rounded-t-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`pb-3 px-4 text-xs sm:text-sm font-black transition-colors relative ${
            activeTab === "payments" ? "text-kasa-vinotinto" : "text-gray-400 hover:text-gray-700"
          }`}
        >
          Historial de Pagos ({payments.length})
          {activeTab === "payments" && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-kasa-vinotinto rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* TAB: CONSUMOS REALIZADOS */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400 border border-gray-100">
              <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-bold text-gray-600">No tienes consumos de cantina registrados.</p>
              <p className="text-xs text-gray-400 mt-1">Los consumos despachados por el administrador aparecerán aquí.</p>
            </div>
          ) : (
            orders.map(order => {
              const items = order.food_order_items || []
              return (
                <div key={order.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">
                        {new Date(order.created_at).toLocaleDateString("es-VE", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      {order.notes && (
                        <p className="text-xs text-amber-700 font-medium mt-0.5 italic">Nota: {order.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black text-kasa-vinotinto">
                        €{Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Detalle de ítems */}
                  <div className="bg-gray-50/80 rounded-xl p-3 divide-y divide-gray-100">
                    {items.map((it: any) => (
                      <div key={it.id} className="py-1.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                        <span className="text-gray-800 font-medium">
                          {it.quantity}x {it.product_name}
                        </span>
                        <span className="font-bold text-gray-900">
                          {it.currency === 'USD' ? '$' : it.currency === 'USDT' ? 'USDT ' : '€'}{Number(it.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* TAB: HISTORIAL DE PAGOS */}
      {activeTab === "payments" && (
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400 border border-gray-100">
              <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-bold text-gray-600">No tienes pagos reportados todavía.</p>
            </div>
          ) : (
            payments.map(payment => (
              <div key={payment.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm">{payment.method}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      payment.status === "Completado"
                        ? "bg-emerald-100 text-emerald-800"
                        : payment.status === "Pendiente"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(payment.created_at).toLocaleDateString("es-VE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })} • Ref: {payment.reference_number || "S/R"}
                  </p>
                  {payment.admin_notes && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      Observación: {payment.admin_notes}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-base font-black text-gray-900 block">
                    €{Number(payment.amount).toFixed(2)}
                  </span>
                  {payment.transferred_amount && (
                    <span className="text-xs text-gray-400">
                      Bs. {Number(payment.transferred_amount).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: REPORTAR PAGO DE CANTINA */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-kasa-vinotinto" />
                Reportar Pago de Cantina
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Monto en EUR */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Monto a Pagar (€ EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-sm font-black px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kasa-dorado"
                />
                {bcvEuroRate > 0 && inputAmountEUR > 0 && (
                  <p className="text-xs text-amber-700 font-bold mt-1">
                    Equivalente oficial: Bs. {inputAmountBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })} (@ Bs. {bcvEuroRate.toFixed(2)})
                  </p>
                )}
              </div>

              {/* Método de Pago */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Método de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kasa-dorado"
                >
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Efectivo en Euros">Efectivo en Euros (€)</option>
                  <option value="Efectivo en Dólares">Efectivo en Dólares ($)</option>
                  <option value="Efectivo en Bolívares">Efectivo en Bolívares (Bs)</option>
                  <option value="Zelle">Zelle</option>
                  <option value="USDT/Binance">USDT / Binance</option>
                </select>
              </div>

              {/* Referencia Bancaria */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Número de Referencia</label>
                <input
                  type="text"
                  placeholder="Últimos dígitos o código de confirmación"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200"
                />
              </div>

              {/* Comprobante con Cámara / Archivo (Mobile Friendly) */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Foto del Comprobante / Voucher</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    id="receipt-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setReceiptFile(e.target.files[0])
                      }
                    }}
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-kasa-vinotinto flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      {receiptFile ? receiptFile.name : "Tomar foto o subir comprobante"}
                    </span>
                    <span className="text-[10px] text-gray-400">PNG, JPG o captura de pantalla</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="flex-1 py-3 rounded-xl bg-kasa-vinotinto text-white font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingPay ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enviar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
