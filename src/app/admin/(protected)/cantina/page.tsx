import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import { parseDateRange } from '@/lib/dateRange'
import { getTodayRates } from '@/lib/exchangeRate'
import { getCachedTeams, getCachedCategories } from '@/lib/catalogCache'
import CantinaHub from './CantinaHub'

export const revalidate = 0

export default async function CantinaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await checkAdminPermission('manage_catalog')
  const resolvedParams = await searchParams
  const { startDate, endDate, formattedRange } = parseDateRange(resolvedParams)
  const supabase = getServiceSupabase()

  // 1. Obtener Categorías de Comida y Productos
  const [
    { data: foodCategories },
    { data: foodProducts },
    { data: athletes },
    { data: creditAccounts },
    { data: foodOrders },
    { data: foodPayments },
    teams,
    sportCategories,
    rates
  ] = await Promise.all([
    supabase.from('food_categories').select('*').order('name'),
    supabase.from('food_products').select('*, food_categories(name)').order('name'),
    supabase.from('athletes').select('id, name, cedula, avatar_url, team_id, teams(id, name, category)').order('name'),
    supabase.from('food_credit_accounts').select('*'),
    supabase.from('food_orders')
      .select('*, athletes(name, cedula, teams(name, category)), food_order_items(*)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false }),
    supabase.from('food_payments')
      .select('*, athletes(name, cedula, teams(name, category))')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false }),
    getCachedTeams(),
    getCachedCategories(),
    getTodayRates()
  ])

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <CantinaHub
        foodCategories={foodCategories || []}
        foodProducts={foodProducts || []}
        athletes={athletes || []}
        creditAccounts={creditAccounts || []}
        foodOrders={foodOrders || []}
        foodPayments={foodPayments || []}
        teams={teams || []}
        sportCategories={sportCategories || []}
        rates={rates}
        dateRangeStr={formattedRange}
      />
    </div>
  )
}
