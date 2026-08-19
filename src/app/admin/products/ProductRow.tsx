'use client'

import { ShoppingBag, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { toggleProductStatus, deleteProduct } from './actions'

type Product = {
  id: string
  name: string
  description: string
  price: number
  is_active: boolean
  categories: string[]
}

export default function ProductRow({ product }: { product: Product }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${product.is_active ? 'bg-green-50' : 'bg-gray-100'}`}>
            <ShoppingBag className={`w-5 h-5 ${product.is_active ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{product.name}</div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description || 'Sin descripción'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-kasa-vinotinto">${Number(product.price).toFixed(2)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {product.categories && product.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {product.categories.map(c => (
              <span key={c} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                {c}
              </span>
            ))}
          </div>
        ) : (
          <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
            Global (Todas)
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button 
          onClick={() => toggleProductStatus(product.id, product.is_active)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            product.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {product.is_active ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
          onClick={() => {
            if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
              deleteProduct(product.id)
            }
          }}
          className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
          title="Eliminar Producto"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </td>
    </tr>
  )
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${product.is_active ? 'bg-green-50' : 'bg-gray-100'}`}>
            <ShoppingBag className={`w-5 h-5 ${product.is_active ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{product.name}</h4>
            <span className="font-bold text-kasa-vinotinto">${Number(product.price).toFixed(2)}</span>
          </div>
        </div>
        <button 
          onClick={() => toggleProductStatus(product.id, product.is_active)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            product.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {product.is_active ? 'Activo' : 'Inactivo'}
        </button>
      </div>
      
      <p className="text-xs text-gray-500">{product.description || 'Sin descripción'}</p>
      
      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
        <div>
          {product.categories && product.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {product.categories.map(c => (
                <span key={c} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
              Global
            </span>
          )}
        </div>
        <button 
          onClick={() => {
            if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
              deleteProduct(product.id)
            }
          }}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
