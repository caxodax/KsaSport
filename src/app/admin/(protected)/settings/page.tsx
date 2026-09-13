import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import SettingsDashboard from './SettingsDashboard'
import { getTodayRates, getExchangeRatesHistory } from '@/lib/exchangeRate'

export const revalidate = 0

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await checkAdminPermission('manage_settings')
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialTab = resolvedParams?.tab === 'rates' ? 'rates' : 'penalties';
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

  // 3. Conteo de equipos por categoría
  const { data: teams } = await supabase
    .from('teams')
    .select('id, category')

  // 4. Conteo de atletas activos por categoría
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, team_id, teams!inner(category)')
    .in('status', ['Solvente', 'Moroso'])

  const teamsCountMap: Record<string, number> = {}
  teams?.forEach(t => {
    if (t.category) {
      teamsCountMap[t.category.trim()] = (teamsCountMap[t.category.trim()] || 0) + 1
    }
  })

  const athletesCountMap: Record<string, number> = {}
  athletes?.forEach(a => {
    const cat = (a.teams as any)?.category
    if (cat) {
      athletesCountMap[cat.trim()] = (athletesCountMap[cat.trim()] || 0) + 1
    }
  })

  const enrichedCategories = (categories || []).map(c => ({
    ...c,
    teamsCount: teamsCountMap[c.name?.trim()] || 0,
    athletesCount: athletesCountMap[c.name?.trim()] || 0
  }))

  // 5. Tasas oficiales e histórico
  const currentRates = await getTodayRates();
  const ratesHistory = await getExchangeRatesHistory(30);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <SettingsDashboard
        settings={settings || { id: 1, grace_period_days: 5, penalty_amount: 10.00 }}
        categories={enrichedCategories}
        currentRates={currentRates}
        ratesHistory={ratesHistory}
        initialTab={initialTab}
      />
    </div>
  )
}

