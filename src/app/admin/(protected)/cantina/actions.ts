'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { checkAdminPermission } from '@/lib/auth-admin'

// 1. Registrar Venta / Asignar Deuda de Cantina al Atleta
export async function createFoodOrder(
  athleteId: string,
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }[],
  notes?: string
) {
  await checkAdminPermission('manage_catalog')
  const supabase = getServiceSupabase()

  if (!athleteId) {
    return { error: 'Debes seleccionar un atleta.' }
  }

  if (!items || items.length === 0) {
    return { error: 'Debes seleccionar al menos un producto.' }
  }

  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0)

  // Obtener o crear cuenta de crédito del atleta
  let { data: account } = await supabase
    .from('food_credit_accounts')
    .select('id, balance, credit_limit')
    .eq('athlete_id', athleteId)
    .single()

  if (!account) {
    const { data: newAccount, error: createAccErr } = await supabase
      .from('food_credit_accounts')
      .insert([{ athlete_id: athleteId, credit_limit: 50.00, balance: 0.00 }])
      .select('id, balance, credit_limit')
      .single()

    if (createAccErr || !newAccount) {
      return { error: 'Error al inicializar la cuenta de crédito del atleta: ' + (createAccErr?.message || '') }
    }
    account = newAccount
  }

  // 1. Crear Orden
  const { data: order, error: orderErr } = await supabase
    .from('food_orders')
    .insert([{
      athlete_id: athleteId,
      total: Number(total.toFixed(2)),
      notes: notes || null,
      created_by: 'admin'
    }])
    .select('id')
    .single()

  if (orderErr || !order) {
    return { error: 'Error al registrar la orden: ' + (orderErr?.message || '') }
  }

  // 2. Insertar Detalle de Ítems
  const itemsToInsert = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.subtotal
  }))

  const { error: itemsErr } = await supabase
    .from('food_order_items')
    .insert(itemsToInsert)

  if (itemsErr) {
    console.error('Error al insertar items de comanda:', itemsErr)
  }

  // 3. Actualizar Saldo Deudor en food_credit_accounts
  const newBalance = Number((Number(account.balance || 0) + total).toFixed(2))
  await supabase
    .from('food_credit_accounts')
    .update({ 
      balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', account.id)

  revalidatePath('/admin/cantina')
  revalidatePath('/portal/dashboard')
  revalidatePath('/portal/dashboard/cantina')

  return { success: true, orderId: order.id, total, newBalance }
}

// 2. Ajustar Límite de Crédito
export async function updateFoodCreditLimit(athleteId: string, newLimit: number) {
  await checkAdminPermission('manage_catalog')
  const supabase = getServiceSupabase()

  if (newLimit < 0) {
    return { error: 'El límite no puede ser negativo.' }
  }

  const { error } = await supabase
    .from('food_credit_accounts')
    .upsert(
      {
        athlete_id: athleteId,
        credit_limit: newLimit,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'athlete_id' }
    )

  if (error) return { error: error.message }

  revalidatePath('/admin/cantina')
  return { success: true }
}

// 3. Registrar Abono Manual Directo (Efectivo en mano en Cantina)
export async function recordManualFoodPayment(
  athleteId: string,
  amount: number,
  method: string,
  notes?: string
) {
  await checkAdminPermission('view_finances')
  const supabase = getServiceSupabase()

  if (amount <= 0) {
    return { error: 'El monto debe ser mayor a cero.' }
  }

  // Obtener cuenta de crédito
  let { data: account } = await supabase
    .from('food_credit_accounts')
    .select('id, balance')
    .eq('athlete_id', athleteId)
    .single()

  if (!account) {
    const { data: newAcc } = await supabase
      .from('food_credit_accounts')
      .insert([{ athlete_id: athleteId, credit_limit: 50.00, balance: 0.00 }])
      .select('id, balance')
      .single()
    account = newAcc
  }

  // Registrar pago como 'Completado' inmediatamente
  const { error: payErr } = await supabase
    .from('food_payments')
    .insert([{
      athlete_id: athleteId,
      account_id: account?.id || null,
      amount: Number(amount.toFixed(2)),
      method: method || 'Efectivo en Dólares',
      status: 'Completado',
      registered_by: 'admin',
      admin_notes: notes || 'Abono directo registrado por administración en cantina',
      verified_at: new Date().toISOString()
    }])

  if (payErr) {
    return { error: 'Error al registrar abono: ' + payErr.message }
  }

  // Reducir saldo deudor
  if (account) {
    const currentBal = Number(account.balance || 0)
    const newBal = Math.max(0, Number((currentBal - amount).toFixed(2)))
    await supabase
      .from('food_credit_accounts')
      .update({
        balance: newBal,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id)
  }

  revalidatePath('/admin/cantina')
  revalidatePath('/portal/dashboard')
  revalidatePath('/portal/dashboard/cantina')

  return { success: true }
}

// 4. Aprobar Pago de Cantina (Reportado por el Atleta)
export async function approveFoodPayment(paymentId: string) {
  await checkAdminPermission('view_finances')
  const supabase = getServiceSupabase()

  const { data: payment, error: fetchErr } = await supabase
    .from('food_payments')
    .select('*, food_credit_accounts(id, balance)')
    .eq('id', paymentId)
    .single()

  if (fetchErr || !payment) {
    return { error: 'Pago no encontrado: ' + (fetchErr?.message || '') }
  }

  if (payment.status === 'Completado') {
    return { error: 'Este pago ya fue aprobado previamente.' }
  }

  // Actualizar estado del pago
  const { error: updateErr } = await supabase
    .from('food_payments')
    .update({
      status: 'Completado',
      verified_at: new Date().toISOString()
    })
    .eq('id', paymentId)

  if (updateErr) {
    return { error: updateErr.message }
  }

  // Descontar del balance deudor
  const accountId = payment.account_id || (payment.food_credit_accounts as any)?.id
  const currentBalance = Number((payment.food_credit_accounts as any)?.balance || 0)
  const paymentAmount = Number(payment.amount || 0)

  if (accountId) {
    const newBalance = Math.max(0, Number((currentBalance - paymentAmount).toFixed(2)))
    await supabase
      .from('food_credit_accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
  }

  revalidatePath('/admin/cantina')
  revalidatePath('/portal/dashboard')
  revalidatePath('/portal/dashboard/cantina')

  return { success: true }
}

// 5. Rechazar Pago de Cantina
export async function rejectFoodPayment(paymentId: string, reason: string) {
  await checkAdminPermission('view_finances')
  const supabase = getServiceSupabase()

  if (!reason.trim()) {
    return { error: 'Debes indicar el motivo del rechazo.' }
  }

  const { error } = await supabase
    .from('food_payments')
    .update({
      status: 'Rechazado',
      admin_notes: reason.trim(),
      verified_at: new Date().toISOString()
    })
    .eq('id', paymentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/cantina')
  revalidatePath('/portal/dashboard/cantina')

  return { success: true }
}

// 6. Catálogo: Crear Producto de Cantina
export async function createFoodProduct(formData: FormData) {
  await checkAdminPermission('manage_catalog')
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  const category_id = formData.get('category_id') as string

  if (!name || isNaN(price) || price < 0) {
    return { error: 'Nombre y precio válido son obligatorios.' }
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('food_products')
    .insert([{
      name: name.trim(),
      description: description?.trim() || null,
      price: Number(price.toFixed(2)),
      category_id: category_id || null,
      is_available: true
    }])

  if (error) return { error: error.message }

  revalidatePath('/admin/cantina')
  return { success: true }
}

// 7. Catálogo: Actualizar Producto de Cantina
export async function updateFoodProduct(formData: FormData) {
  await checkAdminPermission('manage_catalog')
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  const category_id = formData.get('category_id') as string

  if (!id || !name || isNaN(price) || price < 0) {
    return { error: 'Datos de producto inválidos.' }
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('food_products')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      price: Number(price.toFixed(2)),
      category_id: category_id || null
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/cantina')
  return { success: true }
}

// 8. Catálogo: Toggle Disponibilidad
export async function toggleFoodProduct(productId: string, currentStatus: boolean) {
  await checkAdminPermission('manage_catalog')
  const supabase = getServiceSupabase()

  const { error } = await supabase
    .from('food_products')
    .update({ is_available: !currentStatus })
    .eq('id', productId)

  if (error) return { error: error.message }

  revalidatePath('/admin/cantina')
  return { success: true }
}

// 9. Catálogo: Eliminar Producto
export async function deleteFoodProduct(productId: string) {
  await checkAdminPermission('manage_catalog')
  const supabase = getServiceSupabase()

  const { error } = await supabase
    .from('food_products')
    .delete()
    .eq('id', productId)

  if (error) return { error: error.message }

  revalidatePath('/admin/cantina')
  return { success: true }
}

// 10. Catálogo: Crear Categoría de Comida
export async function createFoodCategory(name: string) {
  await checkAdminPermission('manage_catalog')
  if (!name?.trim()) return { error: 'El nombre es obligatorio.' }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('food_categories')
    .insert([{ name: name.trim() }])

  if (error) return { error: error.message }

  revalidatePath('/admin/cantina')
  return { success: true }
}
