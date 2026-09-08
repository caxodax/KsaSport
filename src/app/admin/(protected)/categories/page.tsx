import { getServiceSupabase } from '@/lib/supabase';
import { Tags } from 'lucide-react';
import CategoryRow, { CategoryCard } from './CategoryRow';
import CategoryCreateForm from './CategoryCreateForm';

export const revalidate = 0;

export default async function CategoriesPage() {
  const supabase = getServiceSupabase();
  
  // Fetch categories with dynamic positions
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, positions')
    .order('name');

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Gestión de Categorías y Disciplinas
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Administra las disciplinas del club y configura las posiciones deportivas específicas para cada una.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl text-sm">
          <strong>Aviso:</strong> Error al cargar categorías: {error.message}. Por favor verifica las migraciones SQL.
        </div>
      )}

      <div className="flex flex-col gap-6">
        
        {/* Formulario Crear Categoría con soporte para Posiciones */}
        <CategoryCreateForm />

        {/* Lista de Categorías */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Tags className="w-5 h-5 text-kasa-dorado" />
              Disciplinas Registradas
            </h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              {categories?.length || 0} Total
            </span>
          </div>

          {/* VISTA MÓVIL (Tarjetas First-Mobile) */}
          <div className="md:hidden flex flex-col p-3.5 gap-3 bg-gray-50/40">
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl">
                <Tags className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <h3 className="text-sm font-bold text-gray-900">Sin Categorías</h3>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (Tabla Ampliada) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                    Categoría / Disciplina
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Posiciones Configuradas
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-28">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <CategoryRow key={cat.id} category={cat} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center">
                      <Tags className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                      <h3 className="text-base font-bold text-gray-900">Sin Categorías</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Crea tu primera categoría deportiva usando el formulario de arriba.
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
