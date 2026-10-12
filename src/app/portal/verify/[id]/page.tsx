import { getServiceSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import PublicVerifyView from '@/components/portal/PublicVerifyView'

export const revalidate = 0;

export default async function VerifyAthletePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const adminSupabase = getServiceSupabase();
  
  const [athleteRes, settingsRes] = await Promise.all([
    adminSupabase
      .from('athletes')
      .select('*, teams(id, name, logo_url, category)')
      .eq('id', params.id)
      .single(),
    adminSupabase
      .from('club_settings')
      .select('logo_url, whatsapp_number')
      .eq('id', 1)
      .single()
  ]);

  const athlete = athleteRes.data;
  const settings = settingsRes.data;

  if (!athlete) {
    notFound();
  }

  type TeamData = {
    id?: string;
    name?: string;
    logo_url?: string | null;
    category?: string | null;
  } | null;

  const team: TeamData = Array.isArray(athlete.teams)
    ? ((athlete.teams[0] || null) as TeamData)
    : ((athlete.teams || null) as TeamData);

  const isSolvente = athlete.status === 'Solvente';
  const isInactivo = athlete.status === 'Inactivo';

  const pageBg = isInactivo 
    ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-black' 
    : isSolvente 
    ? 'bg-gradient-to-b from-emerald-800 via-emerald-950 to-slate-950' 
    : 'bg-gradient-to-b from-rose-800 via-red-950 to-slate-950';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 py-8 font-sans ${pageBg} relative selection:bg-kasa-dorado selection:text-kasa-vinotinto w-full overflow-x-hidden`}>
      {/* Luces atmosféricas de estadio de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-white opacity-[0.05] rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-black opacity-40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <PublicVerifyView
          athlete={athlete}
          team={team}
          settings={settings}
        />
      </div>
    </div>
  )
}
