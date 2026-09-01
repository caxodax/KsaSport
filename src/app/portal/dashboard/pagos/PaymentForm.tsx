'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Wallet, Camera, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { reportPayment } from '../../actions'

type Product = {
  id: string
  name: string
  price: number
  description: string
  allows_installments?: boolean
  amount_paid?: number
  amount_pending?: number
  months_owed?: number
}

export default function PaymentForm({ 
  products,
  isLate,
  penaltyAmount
}: { 
  products: Product[],
  isLate?: boolean,
  penaltyAmount?: number
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [amountToPay, setAmountToPay] = useState<string>('')
  
  type PaymentSplit = {
    id: number;
    amount: string;
    method: string;
    reference_number: string;
    file: File | null;
  }
  const [splits, setSplits] = useState<PaymentSplit[]>([])

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
    const pending = product.amount_pending ?? product.price
    setAmountToPay(pending.toString())
    setSplits([{
      id: Date.now(),
      amount: pending.toString(),
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

    setSplits([...splits, {
      id: Date.now(),
      amount: remaining.toString(),
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
    setSplits(splits.map(s => s.id === id ? { ...s, [field]: value } : s))
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
    
    // Serializar los datos de texto (metodos y referencias)
    const splitsData = splits.map(s => ({
      amount: s.amount,
      method: s.method,
      reference: s.reference_number
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
            const hasPenalty = isMensualidad && isLate;
            const penaltyTotal = hasPenalty ? (penaltyAmount || 0) * (product.months_owed || 1) : 0;
            const finalPrice = Number(product.price) + penaltyTotal;
            
            return (
              <button
                key={product.id}
                onClick={() => handleSelect({ ...product, price: finalPrice, name: hasPenalty ? `${product.name} + Recargo por Mora` : product.name })}
                className="text-left bg-white p-6 rounded-2xl border border-gray-200 hover:border-kasa-dorado hover:shadow-md transition-all group relative overflow-hidden"
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
                  <span className="font-bold text-kasa-vinotinto bg-red-50 px-3 py-1 rounded-full shrink-0">
                    ${finalPrice.toFixed(2)}
                  </span>
                </div>
                {product.months_owed && product.months_owed > 1 && isMensualidad ? (
                  <p className="text-sm font-bold text-orange-600 mb-1">Adeuda {product.months_owed} meses</p>
                ) : null}
                <p className="text-sm text-gray-500">{product.description}</p>
                {product.amount_paid && product.amount_paid > 0 ? (
                  <div className="mt-3 flex justify-between items-center bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                    <span className="text-xs font-bold text-orange-800">Abonado: ${product.amount_paid.toFixed(2)}</span>
                    <span className="text-xs font-bold text-red-600">Resta: ${product.amount_pending?.toFixed(2)}</span>
                  </div>
                ) : null}
                {hasPenalty && (
                  <p className="text-xs text-red-500 font-medium mt-2 bg-red-50 p-2 rounded-md">
                    El monto incluye ${penaltyTotal} por {product.months_owed || 1} {product.months_owed === 1 ? 'mes' : 'meses'} de atraso (${penaltyAmount} por mes).
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
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Monto Base:</p>
              <span className="font-bold text-2xl text-kasa-vinotinto">${(selectedProduct.amount_pending ?? selectedProduct.price).toFixed(2)}</span>
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Monto de esta parte ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        value={split.amount}
                        onChange={(e) => updateSplit(split.id, 'amount', e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Método</label>
                      <select 
                        value={split.method}
                        onChange={(e) => updateSplit(split.id, 'method', e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                      >
                        <option value="">Selecciona...</option>
                        <option value="Pago Móvil">Pago Móvil (Bs)</option>
                        <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                        <option value="Zelle">Zelle</option>
                        <option value="Efectivo">Efectivo</option>
                      </select>
                    </div>
                  </div>

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
