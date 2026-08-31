'use client'

import { useState } from 'react'
import { ShoppingBag, Trash2, Edit2, Check, X } from 'lucide-react'
import { toggleProductStatus, deleteProduct, updateProduct } from './actions'

type Product = {
  id: string
  name: string
  description: string
  price: number
  is_active: boolean
  categories: string[]
  allows_installments: boolean
}

type Category = { name: string }

function EditProductForm({ product, allCategories, onCancel }: { product: Product, allCategories: Category[], onCancel: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await updateProduct(formData)
    setLoading(false)
    onCancel()
  }

  return (
    <div className="bg-gray-50 p-6 border-y border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-kasa-dorado" /> Editar Producto
        </h4>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={product.id} />
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-[2]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
            <input 
              type="text" name="name" defaultValue={product.name} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-kasa-vinotinto outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Precio ($)</label>
            <input 
              type="number" name="price" step="0.01" defaultValue={product.price} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-kasa-vinotinto outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
          <input 
            type="text" name="description" defaultValue={product.description || ''}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-kasa-vinotinto outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id={`allows_installments_${product.id}`} 
            name="allows_installments" 
            defaultChecked={product.allows_installments}
            className="w-4 h-4 text-kasa-vinotinto focus:ring-kasa-vinotinto border-gray-300 rounded"
          />
          <label htmlFor={`allows_installments_${product.id}`} className="text-sm font-medium text-gray-700">
            Permite Abonos (Cuotas)
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Aplica para Categorías</label>
          <select 
            name="categories" multiple
            defaultValue={product.categories && product.categories.length > 0 ? product.categories : ['Global']}
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-kasa-vinotinto outline-none min-h-[90px]"
          >
            <option value="Global" className="font-bold text-kasa-vinotinto">Global (Todas)</option>
            {allCategories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500 mt-1">Ctrl/Cmd + click para seleccionar varias.</p>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-kasa-vinotinto rounded-md hover:bg-red-900 disabled:opacity-50 flex items-center gap-2">
            {loading ? 'Guardando...' : <><Check className="w-4 h-4" /> Guardar Cambios</>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ProductRow({ product, allCategories }: { product: Product, allCategories: Category[] }) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <tr>
        <td colSpan={5} className="p-0">
          <EditProductForm product={product} allCategories={allCategories} onCancel={() => setIsEditing(false)} />
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
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
              <span key={c} className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {c}
              </span>
            ))}
          </div>
        ) : (
          <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
            Global
          </span>
        )}
        {product.allows_installments && (
          <div className="mt-1">
            <span className="bg-orange-50 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Permite Abonos
            </span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button 
          onClick={() => toggleProductStatus(product.id, product.is_active)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            product.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Click para Activar/Desactivar"
        >
          {product.is_active ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
            title="Editar Producto"
          >
            <Edit2 className="w-5 h-5" />
          </button>
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
        </div>
      </td>
    </tr>
  )
}

export function ProductCard({ product, allCategories }: { product: Product, allCategories: Category[] }) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
        <EditProductForm product={product} allCategories={allCategories} onCancel={() => setIsEditing(false)} />
      </div>
    )
  }

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
            <div className="flex flex-wrap gap-1 mb-1">
              {product.categories.map(c => (
                <span key={c} className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <div className="mb-1">
              <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Global
              </span>
            </div>
          )}
          {product.allows_installments && (
            <span className="bg-orange-50 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Permite Abonos
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
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
    </div>
  )
}
