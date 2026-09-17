import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getServiceSupabase } from "@/lib/supabase"
import { getTodayRates } from "@/lib/exchangeRate"
import CantinaPortalClient from "./CantinaPortalClient"

export const revalidate = 0

export default async function CantinaPortalPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/portal/login")
  }

  const adminSupabase = getServiceSupabase()

  // 1. Obtener perfil de atleta
  const { data: athlete } = await adminSupabase
    .from("athletes")
    .select("id, name, cedula, avatar_url, teams(name, category)")
    .eq("user_id", session.user.id)
    .single()

  if (!athlete) {
    redirect("/portal/link-profile")
  }

  // 2. Obtener cuenta de crédito, consumos, pagos y tasa
  const [
    { data: creditAccount },
    { data: orders },
    { data: payments },
    rates
  ] = await Promise.all([
    adminSupabase
      .from("food_credit_accounts")
      .select("*")
      .eq("athlete_id", athlete.id)
      .maybeSingle(),
    adminSupabase
      .from("food_orders")
      .select("*, food_order_items(*)")
      .eq("athlete_id", athlete.id)
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("food_payments")
      .select("*")
      .eq("athlete_id", athlete.id)
      .order("created_at", { ascending: false }),
    getTodayRates()
  ])

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <CantinaPortalClient
        athlete={athlete}
        creditAccount={creditAccount || { balance: 0, credit_limit: 50 }}
        orders={orders || []}
        payments={payments || []}
        rates={rates}
      />
    </div>
  )
}
