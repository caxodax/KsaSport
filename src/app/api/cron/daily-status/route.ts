import { getServiceSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { syncRates } from '@/lib/exchangeRate'

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

    // 3. Obtener configuración de días de gracia (general y por disciplina)
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

    // 4. Buscar atletas activas en competencia (sin convenio de alianza comercial)
    const { data: athletes, error: fetchError } = await supabase
      .from('athletes')
      .select('id, name, status, paid_until, teams(category)')
      .in('status', ['Solvente', 'Moroso'])
      .or('has_alliance.is.null,has_alliance.eq.false')

    if (fetchError) {
      console.error('Error fetching athletes in daily-status:', fetchError)
      return NextResponse.json({ error: 'Error fetching athletes' }, { status: 500 })
    }

    const now = new Date()
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

          // El mes a pagar es el siguiente al solvente (1-indexed).
          // En constructor Date(año, mes_index, dia, hora...):
          // Pasar pMonth corresponde exactamente al índice del mes siguiente (ej. pMonth = 10 -> Noviembre).
          // Si effGrace es 0, dia 0 corresponde al último día del mes pagado a las 23:59:59.
          const graceDeadline = new Date(pYear, pMonth, effGrace, 23, 59, 59, 999)

          if (now > graceDeadline) {
            isExpired = true
          }
        }
      }

      // Si venció el periodo de gracia y está Solvente -> marcar Moroso
      if (isExpired && athlete.status === 'Solvente') {
        toMorosoIds.push(athlete.id)
        toMorosoNames.push(athlete.name)
      } 
      // Si todavía está en periodo de gracia o solvente pero está Moroso -> corregir a Solvente
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

    // Restaurar a Solvente si están dentro del lapso de gracia
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
      message: 'Daily status sync completed',
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
