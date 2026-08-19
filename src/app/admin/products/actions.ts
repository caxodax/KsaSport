'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  
  // Extraer múltiples categorías si el usuario selecciona varias (usando un select multiple o checkboxes)
  // Como en NextJS formData.getAll funciona si hay múltiples inputs con el mismo nombre.
  const categories = formData.getAll('categories') as string[]
  
  // Si envían "Global", limpiamos el arreglo para que sea un producto global
  const finalCategories = categories.includes('Global') || categories.length === 0 
    ? [] 
    : categories;

  const supabase = getServiceSupabase()
  
  const { error } = await supabase
    .from('products')
    .insert([{ 
      name, 
      description, 
      price, 
      categories: finalCategories
    }])

  if (error) {
    console.error('Error creating product:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
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
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  
  const categories = formData.getAll('categories') as string[]
  const finalCategories = categories.includes('Global') || categories.length === 0 
    ? [] 
    : categories;

  const supabase = getServiceSupabase()
  
  const { error } = await supabase
    .from('products')
    .update({ 
      name, 
      description, 
      price, 
      categories: finalCategories
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating product:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  return { success: true }
}
