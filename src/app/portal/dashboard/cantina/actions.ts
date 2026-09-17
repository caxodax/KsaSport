"use server"

import { createClient } from "@/lib/supabase/server"
import { getServiceSupabase } from "@/lib/supabase"
import { uploadImageToCloudflare } from "@/lib/cloudflare"
import { revalidatePath } from "next/cache"

export async function reportFoodPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "No autorizado. Por favor inicia sesión." }
  }

  const adminSupabase = getServiceSupabase()

  // 1. Obtener datos del atleta
  const { data: athlete } = await adminSupabase
    .from("athletes")
    .select("id")
    .eq("user_id", session.user.id)
    .single()

  if (!athlete) {
    return { error: "Perfil de atleta no encontrado." }
  }

  // 2. Extraer datos del formulario
  const amount = Number(formData.get("amount"))
  const method = formData.get("method") as string
  const reference = (formData.get("reference") as string) || ""
  const transferred_amount = formData.get("transferred_amount") ? Number(formData.get("transferred_amount")) : null
  const exchange_rate = formData.get("exchange_rate") ? Number(formData.get("exchange_rate")) : null
  const file = formData.get("receipt") as File | null

  if (isNaN(amount) || amount <= 0) {
    return { error: "El monto a pagar debe ser mayor a cero." }
  }

  if (!method) {
    return { error: "Debes seleccionar un método de pago." }
  }

  // 3. Subir comprobante (si fue adjuntado)
  let receiptUrl: string | null = null
  if (file && file.size > 0) {
    receiptUrl = await uploadImageToCloudflare(file, "cantina")
    if (!receiptUrl) {
      return { error: "Error al subir el comprobante. Por favor intenta de nuevo." }
    }
  }

  // 4. Obtener o crear cuenta de crédito del atleta
  let { data: account } = await adminSupabase
    .from("food_credit_accounts")
    .select("id")
    .eq("athlete_id", athlete.id)
    .single()

  if (!account) {
    const { data: newAcc } = await adminSupabase
      .from("food_credit_accounts")
      .insert([{ athlete_id: athlete.id, credit_limit: 50.00, balance: 0.00 }])
      .select("id")
      .single()
    account = newAcc
  }

  // 5. Registrar el pago en food_payments con estatus Pendiente
  const { error: insertErr } = await adminSupabase
    .from("food_payments")
    .insert([{
      athlete_id: athlete.id,
      account_id: account?.id || null,
      amount: Number(amount.toFixed(2)),
      transferred_amount: transferred_amount ? Number(transferred_amount.toFixed(2)) : null,
      exchange_rate: exchange_rate ? Number(exchange_rate.toFixed(4)) : null,
      method: method,
      reference_number: reference.trim() || null,
      receipt_url: receiptUrl,
      status: "Pendiente",
      registered_by: "athlete"
    }])

  if (insertErr) {
    return { error: "Error al registrar el pago: " + insertErr.message }
  }

  revalidatePath("/portal/dashboard")
  revalidatePath("/portal/dashboard/cantina")
  revalidatePath("/admin/cantina")

  return { success: true }
}
