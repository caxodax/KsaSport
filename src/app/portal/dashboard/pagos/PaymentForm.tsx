'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Wallet, Camera } from 'lucide-react'
import Link from 'next/link'
import { reportPayment } from '../../actions'

type Product = {
  id: string
  name: string
  price: number
  description: string
}

export default function PaymentForm({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')
    formData.append('product_id', selectedProduct!.id)
    formData.append('concept', selectedProduct!.name)
    formData.append('amount', selectedProduct!.price.toString())
    
    // Aquí podrías procesar la subida del comprobante a Supabase Storage si quisieras
    // Por ahora enviamos los datos textuales al action
    
    const result = await reportPayment(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Si tiene éxito, el action redirige automáticamente al dashboard
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
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              className="text-left bg-white p-6 rounded-2xl border border-gray-200 hover:border-kasa-dorado hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 text-lg group-hover:text-kasa-vinotinto transition-colors">{product.name}</h3>
                <span className="font-bold text-kasa-vinotinto bg-red-50 px-3 py-1 rounded-full">${Number(product.price).toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500">{product.description}</p>
            </button>
          ))}
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
              <p className="text-sm text-gray-500">Total a pagar:</p>
              <span className="font-bold text-2xl text-kasa-vinotinto">${Number(selectedProduct.price).toFixed(2)}</span>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
              <select 
                name="method"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
              >
                <option value="">Selecciona cómo pagaste</option>
                <option value="Pago Móvil">Pago Móvil (Bs)</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Zelle">Zelle</option>
                <option value="Efectivo (Entregado)">Efectivo (Físico)</option>
                <option value="Cashea">Cashea (En desarrollo)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Referencia</label>
              <input 
                type="text" 
                name="reference_number"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                placeholder="Últimos 6 dígitos o Nro de Zelle"
              />
              <p className="text-xs text-gray-500 mt-1">Si pagaste en efectivo, escribe "Efectivo" y la fecha.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (Opcional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                <Camera className="w-8 h-8 mb-2 text-gray-400" />
                <span className="text-sm font-medium">Sube una foto del pago</span>
                <span className="text-xs mt-1">JPG o PNG, máx 2MB</span>
                <input type="file" className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setSelectedProduct(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
              >
                Cambiar Concepto
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
