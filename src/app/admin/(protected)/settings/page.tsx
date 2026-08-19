import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import { Settings as SettingsIcon, Save } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export const revalidate = 0

async function updateSettings(formData: FormData) {
  'use server'
  const grace_period_days = Number(formData.get('grace_period_days'))
  const penalty_amount = Number(formData.get('penalty_amount'))

  const supabase = getServiceSupabase()
  await supabase
    .from('club_settings')
    .update({ grace_period_days, penalty_amount, updated_at: new Date().toISOString() })
    .eq('id', 1)

  revalidatePath('/admin/settings')
}

export default async function SettingsPage() {
  await checkAdminPermission('manage_settings')
  const supabase = getServiceSupabase()
  
  const { data: settings } = await supabase
    .from('club_settings')
    .select('*')
    .eq('id', 1)
    .single()

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-kasa-dorado" />
          Configuración Global
        </h2>
        <p className="text-gray-500 mt-1">
          Ajusta las reglas del club, penalidades y fechas de gracia.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Política de Morosidad</h3>
        
        <form action={updateSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="grace_period_days" className="block text-sm font-bold text-gray-700 mb-2">
                Días de Gracia (Mes en curso)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  id="grace_period_days" 
                  name="grace_period_days" 
                  defaultValue={settings?.grace_period_days || 5}
                  min={0}
                  max={31}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-gray-500 text-sm">días</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Cuántos días del mes actual puede tardar la atleta en pagar sin recibir multa. (Ej: 5 = Tiene hasta el día 5 del mes).
              </p>
            </div>

            <div>
              <label htmlFor="penalty_amount" className="block text-sm font-bold text-gray-700 mb-2">
                Monto de Penalidad ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-gray-500 text-sm font-bold">$</span>
                </div>
                <input 
                  type="number" 
                  id="penalty_amount" 
                  name="penalty_amount" 
                  defaultValue={settings?.penalty_amount || 5.00}
                  step="0.01"
                  min={0}
                  required
                  className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                El recargo automático que se sumará a su "Mensualidad" si paga después de los días de gracia.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              className="bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
