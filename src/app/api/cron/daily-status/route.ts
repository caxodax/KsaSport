import { getServiceSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Verificación básica de seguridad para Cron Jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Si hay un secreto configurado, exigimos que venga en el header
    // (Útil para proteger la ruta en producción)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceSupabase()

    // 2. Obtener fecha de hoy a la medianoche (para comparar con paid_until)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Formato YYYY-MM-DD para consultar Supabase
    const todayStr = today.toISOString().split('T')[0]

    // 3. Buscar atletas que están Solventes pero su fecha de pago ya venció
    const { data: expiredAthletes, error: fetchError } = await supabase
      .from('athletes')
      .select('id, name, paid_until')
      .eq('status', 'Solvente')
      .not('paid_until', 'is', null)
      .lt('paid_until', todayStr)

    if (fetchError) {
      console.error('Error fetching expired athletes:', fetchError)
      return NextResponse.json({ error: 'Error fetching athletes' }, { status: 500 })
    }

    if (!expiredAthletes || expiredAthletes.length === 0) {
      return NextResponse.json({ message: 'No athletes to update today.', updatedCount: 0 })
    }

    // 4. Actualizar el estatus de esas atletas a 'Moroso'
    const expiredIds = expiredAthletes.map(a => a.id)
    
    const { error: updateError } = await supabase
      .from('athletes')
      .update({ status: 'Moroso' })
      .in('id', expiredIds)

    if (updateError) {
      console.error('Error updating athletes:', updateError)
      return NextResponse.json({ error: 'Error updating athletes' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Athletes updated successfully', 
      updatedCount: expiredIds.length,
      athletes: expiredAthletes.map(a => a.name)
    })
    
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
