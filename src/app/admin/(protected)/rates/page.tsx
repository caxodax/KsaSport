import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import SettingsDashboard from '../settings/SettingsDashboard'
import { getTodayRates, getExchangeRatesHistory } from '@/lib/exchangeRate'

export const revalidate = 0

export default async function RatesPage() {
  await checkAdminPermission('manage_settings')
  const supabase = getServiceSupabase()
  
  // 1. Configuración global
  const { data: settings } = await supabase
    .from('club_settings')
    .select('*')
    .eq('id', 1)
    .single()

  // 2. Categorías
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // 3. Tasas oficiales e histórico
  const currentRates = await getTodayRates();
  const ratesHistory = await getExchangeRatesHistory(40);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <SettingsDashboard
        settings={settings || { id: 1, grace_period_days: 5, penalty_amount: 10.00 }}
        categories={categories || []}
        currentRates={currentRates}
        ratesHistory={ratesHistory}
        initialTab="rates"
      />
    </div>
  )
}
