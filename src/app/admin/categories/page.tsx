import { getServiceSupabase } from '@/lib/supabase';
import { Tags, Plus } from 'lucide-react';
import { createCategory } from './actions';
import CategoryRow, { CategoryCard } from './CategoryRow';

export const revalidate = 0;

export default async function CategoriesPage() {
  const supabase = getServiceSupabase();
  
  // Try to fetch categories, handle case if table doesn't exist yet
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h2>
          <p className="text-gray-500 mt-1">Administra las categorías disponibles para asignar a los equipos.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
          <strong>Aviso:</strong> La tabla de categorías aún no existe en Supabase. Por favor, ejecuta el script SQL.
        </div>
      )}

      <div className="flex flex-col gap-8">
        
        {/* Formulario Crear Categoría */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Plus className="w-5 h-5 text-kasa-vinotinto" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nueva Categoría</h3>
          </div>
          
          <form action={createCategory} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none transition-all"
                placeholder="Ej: Master B"
              />
            </div>
            <button 
              type="submit" 
              className="bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full md:w-auto h-[42px]"
            >
              Registrar
            </button>
          </form>
        </div>

        {/* Lista de Categorías */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-kasa-gris flex items-center gap-2">
              <Tags className="w-6 h-6 text-kasa-dorado" />
              Categorías Registradas
            </h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {categories?.length || 0} Total
            </span>
          </div>

          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl">
                <Tags className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900">Sin Categorías</h3>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (Tabla Ampliada) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-8 py-5 text-right text-sm font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <CategoryRow key={cat.id} category={cat} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-8 py-16 text-center">
                      <Tags className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">Sin Categorías</h3>
                      <p className="mt-1 text-base text-gray-500">
                        Crea tu primera categoría usando el formulario.
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
  );
}
