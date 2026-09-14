'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Wallet, Camera, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { reportPayment } from '../../actions'

type Product = {
  id: string
  name: string
  price: number
  rate_type?: string
  description: string
  allows_installments?: boolean
  amount_paid?: number
  amount_pending?: number
  months_owed?: number
  start_date?: string
  penalty_applied?: number
}

export default function PaymentForm({ 
  products,
  isLate,
  penaltyAmount,
  gracePeriodDays,
  rates
}: { 
  products: Product[],
  isLate?: boolean,
  penaltyAmount?: number,
  gracePeriodDays?: number,
  rates?: {
    usd: number;
    eur: number;
    usdt?: number;
    usdt_promedio?: number;
    date: string;
    source: string;
  }
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [amountToPay, setAmountToPay] = useState<string>('')
  
  type PaymentSplit = {
    id: number;
    amount: string;
    transferred_amount?: string;
    payment_currency?: string;
    exchange_rate?: string;
    date_rate?: string;
    rate_type?: string;
    method: string;
    reference_number: string;
    file: File | null;
  }
  const [splits, setSplits] = useState<PaymentSplit[]>([])

  const getRateForProduct = (rateType?: string) => {
    if (rateType === 'EUR') return Number(rates?.eur) || 968.0673;
    return Number(rates?.usd) || 832.4883;
  };

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
    const pending = product.amount_pending !== undefined ? product.amount_pending : product.price
    const pendingStr = pending.toString()
    setAmountToPay(pendingStr)

    const effectiveRate = getRateForProduct(product.rate_type)
    const dateRate = rates?.date || new Date().toISOString().split('T')[0]

    setSplits([{
      id: Date.now(),
      amount: pendingStr,
      transferred_amount: (pending * effectiveRate).toFixed(2),
      payment_currency: 'USD',
      exchange_rate: effectiveRate.toFixed(4),
      date_rate: dateRate,
      rate_type: product.rate_type || 'USD',
      method: '',
      reference_number: '',
      file: null
    }])
    setError('')
  }

  const handleAddSplit = () => {
    const totalSplitsAmount = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    const remaining = Number(amountToPay) - totalSplitsAmount
    
    if (remaining <= 0) {
      setError('La suma de los métodos ya cubre el monto total indicado.')
      return
    }

    const effectiveRate = getRateForProduct(selectedProduct?.rate_type)
    const dateRate = rates?.date || new Date().toISOString().split('T')[0]

    setSplits([...splits, {
      id: Date.now(),
      amount: remaining.toString(),
      transferred_amount: (remaining * effectiveRate).toFixed(2),
      payment_currency: 'USD',
      exchange_rate: effectiveRate.toFixed(4),
      date_rate: dateRate,
      rate_type: selectedProduct?.rate_type || 'USD',
      method: '',
      reference_number: '',
      file: null
    }])
    setError('')
  }

  const handleRemoveSplit = (id: number) => {
    if (splits.length === 1) return
    setSplits(splits.filter(s => s.id !== id))
  }

  const updateSplit = (id: number, field: keyof PaymentSplit, value: any) => {
    const effectiveRate = getRateForProduct(selectedProduct?.rate_type)
    const dateRate = rates?.date || new Date().toISOString().split('T')[0]

    setSplits(splits.map(s => {
      if (s.id !== id) return s

      if (field === 'method') {
        const isBs = value === 'Pago Móvil' || value === 'Transferencia Bancaria' || value === 'Efectivo en Bolívares'
        const isUsdt = value === 'USDT'
        const isEurCash = value === 'Efectivo en Euros'
        const numAmount = Number(s.amount) || 0

        let currency = 'USD'
        let rate = '1.0000'
        let transferred = s.amount

        if (isBs) {
          currency = 'VES'
          rate = effectiveRate.toFixed(4)
          transferred = (numAmount * effectiveRate).toFixed(2)
        } else if (isUsdt) {
          currency = 'USDT'
          rate = '1.0000'
          transferred = numAmount.toFixed(2)
        } else if (isEurCash) {
          currency = 'EUR'
          rate = (Number(rates?.eur) || 968.0673).toFixed(4)
          transferred = numAmount.toFixed(2)
        } else {
          currency = selectedProduct?.rate_type || 'USD'
          rate = '1.0000'
          transferred = numAmount.toFixed(2)
        }

        return {
          ...s,
          method: value,
          payment_currency: currency,
          exchange_rate: rate,
          transferred_amount: transferred,
          date_rate: dateRate,
          rate_type: selectedProduct?.rate_type || 'USD'
        }
      }

      if (field === 'amount') {
        const numAmount = Number(value) || 0
        let transferred = s.transferred_amount
        if (s.payment_currency === 'VES') {
          transferred = (numAmount * effectiveRate).toFixed(2)
        } else {
          transferred = numAmount.toFixed(2)
        }
        return {
          ...s,
          amount: value,
          transferred_amount: transferred
        }
      }

      return { ...s, [field]: value }
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    
    // Validar suma de montos
    const totalSplitsAmount = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    if (Math.abs(totalSplitsAmount - Number(amountToPay)) > 0.01) {
      setError(`La suma de los métodos ($${totalSplitsAmount.toFixed(2)}) no coincide con el total a abonar ($${Number(amountToPay).toFixed(2)}).`)
      return
    }

    // Validar campos vacíos
    for (const split of splits) {
      if (!split.method) return setError('Selecciona el método de pago para todos los abonos.')
      if (!split.reference_number) return setError('Ingresa el número de referencia para todos los abonos.')
      if (!split.file) return setError('Sube el comprobante para todos los abonos.')
      if (Number(split.amount) <= 0) return setError('El monto de cada abono debe ser mayor a 0.')
    }

    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('product_id', selectedProduct.id)
    formData.append('concept', selectedProduct.name)
    formData.append('total_amount', amountToPay)
    
    // Serializar los datos de texto incluyendo datos congelados de tasa
    const splitsData = splits.map(s => ({
      amount: s.amount,
      method: s.method,
      reference: s.reference_number,
      rate_type: s.rate_type || selectedProduct.rate_type || 'USD',
      exchange_rate: s.exchange_rate || '1.0000',
      usdt_promedio: rates?.usdt_promedio || rates?.usdt || 960.00,
      transferred_amount: s.transferred_amount || s.amount,
      payment_currency: s.payment_currency || 'USD',
      date_rate: s.date_rate || rates?.date || new Date().toISOString().split('T')[0]
    }))
    formData.append('splits_json', JSON.stringify(splitsData))

    // Adjuntar los archivos
    splits.forEach((s, i) => {
      if (s.file) formData.append(`receipt_${i}`, s.file)
    })

    const result = await reportPayment(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/portal/dashboard" className="text-kasa-vinotinto font-bold text-sm flex items-center gap-1 hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver al Perfil
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Centro de Pagos</h1>
        <p className="text-gray-500 mt-1">Selecciona el concepto que deseas abonar y reporta tu pago.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!selectedProduct ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => {
            const isMensualidad = product.name.toLowerCase().includes('mensualidad');
            let hasPenalty = false;
            
            if (isMensualidad) {
              if (product.start_date && gracePeriodDays !== undefined) {
                const startDate = new Date(product.start_date);
                const deadline = new Date(startDate.getFullYear(), startDate.getMonth(), gracePeriodDays);
                hasPenalty = new Date() > deadline;
              } else {
                hasPenalty = !!isLate;
              }
            }

            const penaltyTotal = hasPenalty ? (penaltyAmount || 0) : 0;
            const finalPrice = Number(product.price) + penaltyTotal;
            const finalPending = Math.max(0, finalPrice - (product.amount_paid || 0));
            const currSymbol = product.rate_type === 'EUR' ? '€' : '$';
            
            return (
              <button
                key={product.id}
                onClick={() => handleSelect({ 
                  ...product, 
                  price: finalPrice, 
                  amount_pending: finalPending,
                  penalty_applied: penaltyTotal,
                  name: hasPenalty ? `${product.name} + Recargo por Mora` : product.name 
                })}
                className="text-left bg-white p-6 rounded-2xl border border-gray-200 hover:border-kasa-dorado hover:shadow-md transition-all group relative overflow-hidden cursor-pointer"
              >
                {hasPenalty && (
                  <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    Aplica Recargo
                  </div>
                )}
                <div className="flex justify-between items-start mb-2 mt-2">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-kasa-vinotinto transition-colors pr-2">
                    {product.name}
                  </h3>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-kasa-vinotinto bg-red-50 px-3 py-1 rounded-full inline-block">
                      {currSymbol}{finalPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase">
                      {product.rate_type || 'USD'}
                    </span>
                  </div>
                </div>
                {product.months_owed && product.months_owed > 1 && isMensualidad ? (
                  <p className="text-sm font-bold text-orange-600 mb-1">Adeuda {product.months_owed} meses</p>
                ) : null}
                <p className="text-sm text-gray-500">{product.description}</p>
                {product.amount_paid && product.amount_paid > 0 ? (
                  <div className="mt-3 flex justify-between items-center bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                    <span className="text-xs font-bold text-orange-800">Abonado: {currSymbol}{product.amount_paid.toFixed(2)}</span>
                    <span className="text-xs font-bold text-red-600">Resta: {currSymbol}{finalPending.toFixed(2)}</span>
                  </div>
                ) : null}
                {hasPenalty && (
                  <p className="text-xs text-red-500 font-medium mt-2 bg-red-50 p-2 rounded-md">
                    El monto incluye ${penaltyTotal.toFixed(2)} por pago fuera de la fecha límite (Día {gracePeriodDays}).
                  </p>
                )}
              </button>
            )
          })}
          {products.length === 0 && (
            <div className="col-span-full p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">No hay productos disponibles</h3>
              <p className="text-sm text-gray-500 mt-1">Actualmente no hay conceptos de pago habilitados para tu categoría.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Concepto seleccionado:</p>
              <h3 className="font-bold text-xl text-gray-900">{selectedProduct.name}</h3>
              {selectedProduct.penalty_applied && selectedProduct.penalty_applied > 0 ? (
                <p className="text-xs text-rose-600 font-bold mt-1">
                  Incluye recargo de mora: +${selectedProduct.penalty_applied.toFixed(2)}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total a Pagar:</p>
              <span className="font-bold text-2xl text-kasa-vinotinto">
                {selectedProduct.rate_type === 'EUR' ? '€' : '$'}
                {(selectedProduct.amount_pending ?? selectedProduct.price).toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 block font-bold uppercase">{selectedProduct.rate_type || 'USD'}</span>
            </div>
          </div>

          {/* BANNER DESTACADO DE TASA OFICIAL BCV Y TOTAL EN BOLÍVARES */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base shadow-xs shrink-0">
                  🏦
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide flex flex-wrap items-center gap-2">
                    <span>Tasa Oficial BCV</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Fecha Valor: {rates?.date || new Date().toISOString().split('T')[0]}
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Calculada automáticamente con la cotización oficial del Banco Central de Venezuela.
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0 bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-emerald-200">
                <div className="text-[10px] sm:text-xs text-emerald-700 font-bold uppercase">Cotización Oficial:</div>
                <div className="text-lg font-mono font-black text-emerald-900">
                  Bs. {getRateForProduct(selectedProduct.rate_type).toFixed(2)} <span className="text-xs font-bold text-slate-500">/ {selectedProduct.rate_type || 'USD'}</span>
                </div>
              </div>
            </div>

            {/* Total equivalente a pagar en Bolívares */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span>🇻🇪</span> Total a Pagar en Bolívares (Bs.):
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-700">
                  Bs. {((Number(amountToPay) || (selectedProduct.amount_pending ?? selectedProduct.price)) * getRateForProduct(selectedProduct.rate_type)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Referencia USDT */}
            <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <span>🟢</span> Tasa USDT de Referencia (Binance P2P):
              </span>
              <span className="font-mono font-bold text-slate-800">
                Bs. {Number(rates?.usdt_promedio || rates?.usdt || 959.68).toFixed(2)} / USDT
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total a Reportar ($)</label>
              <input 
                type="number" 
                step="0.01"
                min="1"
                max={selectedProduct.allows_installments ? selectedProduct.amount_pending ?? selectedProduct.price : undefined}
                value={amountToPay}
                onChange={(e) => {
                  const val = e.target.value
                  setAmountToPay(val)
                  if (splits.length === 1) {
                    updateSplit(splits[0].id, 'amount', val)
                  }
                }}
                disabled={!selectedProduct.allows_installments}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-yellow-50 font-bold disabled:bg-gray-100 disabled:text-gray-500"
              />
              {selectedProduct.allows_installments ? (
                <p className="text-xs text-gray-500 mt-1">Este producto permite cuotas. Modifica el monto si vas a realizar un abono parcial.</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Este producto requiere el pago completo.</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="font-bold text-gray-800">Métodos de Pago</h4>
                <button 
                  type="button" 
                  onClick={handleAddSplit}
                  className="text-xs font-bold text-kasa-dorado hover:text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full transition-colors"
                >
                  + Añadir otro método
                </button>
              </div>

              {splits.map((split, index) => (
                <div key={split.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                  {splits.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSplit(split.id)}
                      className="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-200 p-1.5 rounded-full transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Monto de esta parte ({selectedProduct.rate_type === 'EUR' ? '€ EUR' : '$ ' + (selectedProduct.rate_type || 'USD')}) *
                      </label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        value={split.amount}
                        onChange={(e) => updateSplit(split.id, 'amount', e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Método de Pago *</label>
                      <select 
                        value={split.method}
                        onChange={(e) => updateSplit(split.id, 'method', e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto font-bold text-gray-800"
                      >
                        <option value="">Selecciona el método...</option>
                        <option value="Pago Móvil">📱 Pago Móvil (Bs)</option>
                        <option value="Transferencia Bancaria">🏦 Transferencia Bancaria (Bs)</option>
                        <option value="Efectivo en Bolívares">💵 Efectivo en Bolívares (Bs)</option>
                        <option value="Zelle">🇺🇸 Zelle (USD)</option>
                        <option value="Efectivo">💵 Efectivo en Dólares ($ USD)</option>
                        <option value="Efectivo en Euros">💶 Efectivo en Euros (€ EUR)</option>
                        <option value="USDT">🟢 USDT / Binance Cripto</option>
                      </select>
                    </div>
                  </div>

                  {/* Vista previa informativa antes de seleccionar método */}
                  {!split.method && (
                    <div className="mb-4 p-3 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>💡</span> Tasa oficial BCV ({rates?.date || 'Hoy'}): <strong className="text-gray-900 font-mono">Bs. {getRateForProduct(selectedProduct.rate_type).toFixed(2)}</strong>
                      </span>
                      <span className="font-bold text-slate-800">
                        Total en Bs: <strong className="text-emerald-700 font-mono text-sm">Bs. {(Number(split.amount || 0) * getRateForProduct(selectedProduct.rate_type)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </span>
                    </div>
                  )}

                  {/* Bloque de Conversión Automática de Tasa BCV (Bolívares) */}
                  {(split.method === 'Pago Móvil' || split.method === 'Transferencia Bancaria' || split.method === 'Efectivo en Bolívares') && (
                    <div className="mb-4 p-3.5 bg-sky-50/90 rounded-xl border border-sky-200 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-sky-200/80">
                        <span className="font-bold text-sky-950 flex items-center gap-1.5">
                          <span>🏦</span> Tasa Oficial BCV ({split.date_rate || rates?.date || 'Hoy'}):
                        </span>
                        <span className="font-mono font-black text-sky-900 bg-white px-2.5 py-0.5 rounded-md border border-sky-200 shadow-2xs">
                          Bs. {Number(split.exchange_rate || getRateForProduct(selectedProduct.rate_type)).toFixed(2)} / {selectedProduct.rate_type || 'USD'}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <label className="block text-[11px] font-black uppercase text-sky-900 tracking-wider mb-1">
                          Monto a Transferir / Pagado en Bolívares (Bs.) *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-700 font-bold text-xs">
                            Bs.
                          </div>
                          <input 
                            type="number"
                            step="0.01"
                            value={split.transferred_amount || ''}
                            onChange={(e) => updateSplit(split.id, 'transferred_amount', e.target.value)}
                            required
                            placeholder="Calculado automáticamente"
                            className="w-full pl-10 pr-3 py-2 bg-white rounded-lg border border-sky-300 text-sm font-mono font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                          />
                        </div>
                        <p className="text-[10px] text-sky-700 mt-1">
                          Monto total en Bolívares reflejado en tu comprobante de Pago Móvil o transferencia bancaria.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bloque para USDT / Binance */}
                  {split.method === 'USDT' && (
                    <div className="mb-4 p-3.5 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-emerald-200/80">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>🟢</span> Tasa USDT de Referencia (Binance P2P):
                        </span>
                        <span className="font-mono font-black text-emerald-900 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                          Bs. {Number(rates?.usdt_promedio || rates?.usdt || 959.68).toFixed(2)} / USDT
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <label className="block text-[11px] font-black uppercase text-emerald-900 tracking-wider mb-1">
                          Monto a Transferir en USDT *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700 font-bold text-xs">
                            ₮
                          </div>
                          <input 
                            type="number"
                            step="0.01"
                            value={split.transferred_amount || split.amount || ''}
                            onChange={(e) => updateSplit(split.id, 'transferred_amount', e.target.value)}
                            required
                            placeholder="Monto en USDT"
                            className="w-full pl-10 pr-3 py-2 bg-white rounded-lg border border-emerald-300 text-sm font-mono font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                          />
                        </div>
                        <p className="text-[10px] text-emerald-700 mt-1">
                          Monto exacto en USDT enviado a través de Binance Pay o transferencia de billetera.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Referencia</label>
                    <input 
                      type="text" 
                      value={split.reference_number}
                      onChange={(e) => updateSplit(split.id, 'reference_number', e.target.value)}
                      required
                      placeholder="Últimos 6 dígitos o Nro de Zelle"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Comprobante</label>
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-white transition-colors cursor-pointer group bg-gray-50/50">
                      {split.file ? (
                        <div className="text-center">
                          <CheckCircle2 className="w-6 h-6 mb-1 text-green-500 mx-auto" />
                          <span className="text-xs font-medium text-gray-900 block truncate max-w-[200px]">{split.file.name}</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-6 h-6 mb-1 text-gray-400 group-hover:text-kasa-vinotinto transition-colors mx-auto" />
                          <span className="text-xs font-medium">Subir foto</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/jpeg, image/png, image/webp" 
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              setError('La imagen es muy pesada. Máximo 5MB.')
                              return
                            }
                            updateSplit(split.id, 'file', file)
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {splits.length > 1 && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-sm">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Total Métodos:</span>
                  <span className={Math.abs(splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) - Number(amountToPay)) > 0.01 ? 'text-red-600' : 'text-green-600'}>
                    ${splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setSelectedProduct(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 px-4 py-3 bg-kasa-vinotinto hover:bg-red-900 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-70"
              >
                {loading ? 'Enviando...' : 'Reportar Pago'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}
