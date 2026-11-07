import { getServiceSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { syncRates } from '@/lib/exchangeRate'
import { isPaymentLate } from '@/lib/dateUtils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Verificación estricta de seguridad para Cron Jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Se exige obligatoriamente un secreto de cron válido
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Sincronizar tasas oficiales del Banco Central de Venezuela (BCV)
    let rateSyncInfo: any = null
    try {
      rateSyncInfo = await syncRates()
    } catch (rateErr) {
      console.error('Error sincronizando tasas BCV en daily-status:', rateErr)
    }

    const supabase = getServiceSupabase()

    // 3. Ejecutar actualización atómica vía RPC de PostgreSQL (Misma función del cron pg_cron)
    try {
      const { data: dbResult, error: rpcError } = await supabase.rpc('fn_actualizar_morosidad_diaria')
      if (!rpcError && dbResult) {
        return NextResponse.json({
          message: 'Daily status sync completed via PostgreSQL RPC',
          dbResult,
          rateSync: rateSyncInfo?.result || null
        })
      }
      if (rpcError) {
        console.warn('RPC fn_actualizar_morosidad_diaria no disponible o con error, usando fallback TS:', rpcError.message)
      }
    } catch (rpcEx) {
      console.warn('Excepción llamando a RPC, continuando con fallback TS:', rpcEx)
    }

    // 4. Fallback TypeScript con hora oficial de Venezuela (America/Caracas UTC-4)
    const [{ data: settingsData }, { data: categoriesData }] = await Promise.all([
      supabase.from('club_settings').select('grace_period_days').eq('id', 1).maybeSingle(),
      supabase.from('categories').select('name, grace_period_days')
    ])

    const defaultGrace = settingsData?.grace_period_days ?? 5
    const categoryGraceMap = new Map<string, number>()
    categoriesData?.forEach(c => {
      if (c.name && c.grace_period_days !== null && c.grace_period_days !== undefined) {
        categoryGraceMap.set(c.name.trim().toLowerCase(), Number(c.grace_period_days))
      }
    })

    const { data: athletes, error: fetchError } = await supabase
      .from('athletes')
      .select('id, name, status, paid_until, teams(category)')
      .in('status', ['Solvente', 'Moroso'])
      .or('has_alliance.is.null,has_alliance.eq.false')

    if (fetchError) {
      console.error('Error fetching athletes in daily-status fallback:', fetchError)
      return NextResponse.json({ error: 'Error fetching athletes' }, { status: 500 })
    }

    const toMorosoIds: string[] = []
    const toMorosoNames: string[] = []
    const toSolventeIds: string[] = []
    const toSolventeNames: string[] = []

    for (const athlete of athletes || []) {
      let isExpired = false

      if (!athlete.paid_until) {
        isExpired = true
      } else {
        const parts = athlete.paid_until.split('T')[0].split('-').map(Number)
        const pYear = parts[0]
        const pMonth = parts[1] // 1 a 12 (mes solvente)

        if (isNaN(pYear) || isNaN(pMonth)) {
          isExpired = true
        } else {
          const categoryName = (athlete.teams as any)?.category?.trim()?.toLowerCase()
          const effGrace = (categoryName && categoryGraceMap.has(categoryName))
            ? categoryGraceMap.get(categoryName)!
            : defaultGrace

          // El mes a pagar es el siguiente al solvente (1-indexed)
          const nextMonth = pMonth === 12 ? 1 : pMonth + 1
          const nextYear = pMonth === 12 ? pYear + 1 : pYear

          if (isPaymentLate(null, nextYear, nextMonth, effGrace)) {
            isExpired = true
          }
        }
      }

      // Si venció el periodo de gracia y está Solvente -> marcar Moroso
      if (isExpired && athlete.status === 'Solvente') {
        toMorosoIds.push(athlete.id)
        toMorosoNames.push(athlete.name)
      } 
      // Si todavía está en periodo regular y solvente pero está Moroso -> corregir a Solvente
      else if (!isExpired && athlete.status === 'Moroso') {
        toSolventeIds.push(athlete.id)
        toSolventeNames.push(athlete.name)
      }
    }

    // Actualizar a Moroso si corresponde
    if (toMorosoIds.length > 0) {
      const { error: morosoErr } = await supabase
        .from('athletes')
        .update({ status: 'Moroso' })
        .in('id', toMorosoIds)

      if (morosoErr) {
        console.error('Error updating athletes to Moroso:', morosoErr)
      }
    }

    // Restaurar a Solvente si están dentro del lapso regular
    if (toSolventeIds.length > 0) {
      const { error: solventeErr } = await supabase
        .from('athletes')
        .update({ status: 'Solvente' })
        .in('id', toSolventeIds)

      if (solventeErr) {
        console.error('Error updating athletes to Solvente:', solventeErr)
      }
    }

    return NextResponse.json({
      message: 'Daily status sync completed via TS fallback',
      updatedToMorosoCount: toMorosoIds.length,
      updatedToSolventeCount: toSolventeIds.length,
      athletesToMoroso: toMorosoNames,
      athletesToSolvente: toSolventeNames,
      rateSync: rateSyncInfo?.result || null
    })


  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
