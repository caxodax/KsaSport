import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import ProductDashboard from './ProductDashboard'

export const revalidate = 0

export default async function ProductsPage() {
  await checkAdminPermission('manage_catalog')
  const supabase = getServiceSupabase()
  
  // Fetch Products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch Categories for the selector
  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .order('name')

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <ProductDashboard
        initialProducts={(products as any) || []}
        categories={categories || []}
      />
    </div>
  )
}

