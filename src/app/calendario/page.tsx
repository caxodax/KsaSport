import { getServiceSupabase } from '@/lib/supabase'
import CalendarView from './CalendarView'

export const revalidate = 60 // Revalidación cada 60 segundos

export const metadata = {
  title: 'Calendario Oficial de Ligas Activas | Kasa Sports',
  description: 'Consulta los partidos, horarios y sedes oficiales de cada jornada. Rol de juegos y fixture descargable en PDF.',
}

export default async function PublicCalendarPage() {
  const supabase = getServiceSupabase()
  const { data: settings } = await supabase
    .from('club_settings')
    .select('*')
    .eq('id', 1)
    .single()

  return <CalendarView settings={settings || {}} />
}
