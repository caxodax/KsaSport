'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  await checkAdminPermission('manage_catalog')
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  const allows_installments = formData.get('allows_installments') === 'on' || formData.get('allows_installments') === 'true'
  const requires_opt_in = formData.get('requires_opt_in') === 'on' || formData.get('requires_opt_in') === 'true'
  
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const rate_type = (formData.get('rate_type') as string) || 'USD'
  const parent_product_id = (formData.get('parent_product_id') as string) || null
  
  // Extraer múltiples categorías si el usuario selecciona varias (usando un select multiple o checkboxes)
  // Como en NextJS formData.getAll funciona si hay múltiples inputs con el mismo nombre.
  const categories = formData.getAll('categories') as string[]
  
  // Si envían "Global", limpiamos el arreglo para que sea un producto global
  const finalCategories = categories.includes('Global') || categories.length === 0 
    ? [] 
    : categories;

  const supabase = getServiceSupabase()
  
  // Si hay producto padre, aseguramos el tag en la descripción por redundancia
  let finalDescription = description || ''
  if (parent_product_id && !finalDescription.includes('[parent_product_id:')) {
    finalDescription = finalDescription.trim() 
      ? `${finalDescription.trim()}\n[parent_product_id: ${parent_product_id}]`
      : `[parent_product_id: ${parent_product_id}]`
  }

  const payload: any = { 
    name, 
    description: finalDescription, 
    price, 
    rate_type,
    categories: finalCategories,
    allows_installments,
    requires_opt_in,
    start_date: start_date ? new Date(start_date).toISOString() : null,
    end_date: end_date ? new Date(end_date).toISOString() : null
  }

  if (parent_product_id) {
    payload.parent_product_id = parent_product_id
  }

  let { error } = await supabase.from('products').insert([payload])

  // Fallback si la columna parent_product_id aún no existe en Postgres
  if (error && error.code === '42703' && payload.parent_product_id) {
    delete payload.parent_product_id
    const retry = await supabase.from('products').insert([payload])
    error = retry.error
  }

  if (error) {
    console.error('Error creating product:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  await checkAdminPermission('manage_catalog')
  const supabase = getServiceSupabase()
  
  const { error } = await supabase
    .from('products')
    .update({ is_active: !currentStatus })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function deleteProduct(id: string) {
  await checkAdminPermission('manage_catalog')
  const supabase = getServiceSupabase()
  
  // Si el producto ya tiene pagos asociados, fallará por la llave foránea (que es lo ideal para no romper la contabilidad).
  // Si queremos permitir borrar y que los pagos queden con product_id nulo, la migración lo permite (ON DELETE SET NULL).
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function updateProduct(formData: FormData) {
  await checkAdminPermission('manage_catalog')
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  const allows_installments = formData.get('allows_installments') === 'on' || formData.get('allows_installments') === 'true'
  const requires_opt_in = formData.get('requires_opt_in') === 'on' || formData.get('requires_opt_in') === 'true'
  
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const rate_type = (formData.get('rate_type') as string) || 'USD'
  const parent_product_id = (formData.get('parent_product_id') as string) || null

  const categories = formData.getAll('categories') as string[]
  const finalCategories = categories.includes('Global') || categories.length === 0 
    ? [] 
    : categories;

  const supabase = getServiceSupabase()
  
  // Limpiar tags previos de parent_product_id en la descripción si cambia
  let cleanDesc = (description || '').replace(/\[parent_product_id:\s*[a-f0-9\-]+\]/gi, '').trim()
  if (parent_product_id) {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[parent_product_id: ${parent_product_id}]` : `[parent_product_id: ${parent_product_id}]`
  }

  const payload: any = { 
    name, 
    description: cleanDesc, 
    price, 
    rate_type,
    categories: finalCategories,
    allows_installments,
    requires_opt_in,
    start_date: start_date ? new Date(start_date).toISOString() : null,
    end_date: end_date ? new Date(end_date).toISOString() : null
  }

  if (parent_product_id !== undefined) {
    payload.parent_product_id = parent_product_id
  }

  let { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)

  // Fallback si la columna parent_product_id aún no existe en Postgres
  if (error && error.code === '42703' && payload.parent_product_id !== undefined) {
    delete payload.parent_product_id
    const retry = await supabase.from('products').update(payload).eq('id', id)
    error = retry.error
  }

  if (error) {
    console.error('Error updating product:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  return { success: true }
}
