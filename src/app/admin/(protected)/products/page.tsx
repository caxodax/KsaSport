import { getServiceSupabase } from '@/lib/supabase'
import { ShoppingBag, Plus } from 'lucide-react'
import { createProduct } from './actions'
import ProductRow, { ProductCard } from './ProductRow'
import ProductCreateForm from './ProductCreateForm'
import { checkAdminPermission } from '@/lib/auth-admin'

export const revalidate = 0

export default async function ProductsPage() {
  await checkAdminPermission('manage_catalog')
  const supabase = getServiceSupabase()
  
  // Fetch Products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch Categories for the selector
  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .order('name')

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Catálogo de Tienda</h2>
        <p className="text-gray-500 mt-1">Administra los servicios, mensualidades y artículos disponibles para pago.</p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Formulario Crear Producto */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Plus className="w-5 h-5 text-kasa-vinotinto" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nuevo Producto / Servicio</h3>
          </div>
          
          <ProductCreateForm categories={categories || []} />
        </div>

        {/* Lista de Productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-kasa-gris flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-kasa-dorado" />
              Productos Registrados
            </h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {products?.length || 0} Total
            </span>
          </div>

          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
            {products && products.length > 0 ? (
              products.map((p) => (
                <ProductCard key={p.id} product={p as any} allCategories={categories || []} />
              ))
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900">Sin Productos</h3>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (Tabla Ampliada) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Aplica A</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products && products.length > 0 ? (
                  products.map((p) => (
                    <ProductRow key={p.id} product={p as any} allCategories={categories || []} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                      <ShoppingBag className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">Sin Productos</h3>
                      <p className="mt-1 text-base text-gray-500">
                        Crea tu primer producto para que las atletas puedan reportar sus pagos.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
