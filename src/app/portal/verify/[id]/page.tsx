import { getServiceSupabase } from '@/lib/supabase'
import { CheckCircle2, AlertOctagon, Trophy, Calendar, ShieldCheck, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCedula } from '@/lib/cedula'
import { formatLocalDate } from '@/lib/dateUtils'
import BrandLogo from '@/components/ui/BrandLogo'

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
      .select('logo_url')
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

  const statusTitle = isInactivo ? 'Inactiva' : isSolvente ? 'Habilitada' : 'Restringida';
  const statusSubtitle = isInactivo
    ? 'Ficha inactiva en el sistema'
    : isSolvente
    ? 'Autorizada para jugar en jornada oficial'
    : 'Cuota pendiente o falta de solvencia';

  const statusHeaderBg = isInactivo 
    ? 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-800' 
    : isSolvente 
    ? 'bg-gradient-to-b from-emerald-600 via-emerald-600 to-emerald-700' 
    : 'bg-gradient-to-b from-rose-600 via-red-600 to-red-700';

  const pageBg = isInactivo 
    ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-black' 
    : isSolvente 
    ? 'bg-gradient-to-b from-emerald-700 via-emerald-900 to-slate-950' 
    : 'bg-gradient-to-b from-rose-700 via-red-950 to-slate-950';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 py-8 font-sans ${pageBg} relative selection:bg-kasa-dorado selection:text-kasa-vinotinto`}>
      
      {/* Decorative Background Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-white opacity-[0.04] rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-black opacity-30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/20">
        
        {/* Status Header: Generous padding to prevent ANY overlap with the athlete avatar */}
        <div className={`pt-5 pb-18 px-5 flex flex-col items-center justify-center text-white ${statusHeaderBg} relative`}>
          
          {/* Top Branding & Verification Indicator */}
          <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-white/20 text-white">
            <div className="flex items-center gap-2">
              <BrandLogo src={settings?.logo_url} size="xs" variant="badge" />
              <span className="font-extrabold text-xs tracking-wider">KASA SPORTS</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full ${isSolvente ? 'bg-emerald-300 animate-pulse' : 'bg-rose-300'}`} />
              <span>Credencial Digital</span>
            </div>
          </div>

          {/* Status Icon & Title */}
          <div className="flex flex-col items-center text-center">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-2.5 shadow-inner">
              {isSolvente ? (
                <CheckCircle2 className="w-8 h-8 text-white drop-shadow-xs" />
              ) : (
                <AlertOctagon className="w-8 h-8 text-white drop-shadow-xs" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest drop-shadow-xs leading-none">
              {statusTitle}
            </h1>

            <p className="text-xs text-white/90 font-semibold tracking-wide mt-2">
              {statusSubtitle}
            </p>
          </div>
        </div>

        {/* Floating Avatar: Cleanly positioned below the header text with zero overlap */}
        <div className="relative -mt-12 flex justify-center z-20">
          <div className="relative w-24 h-24 rounded-full bg-white p-1 shadow-xl ring-4 ring-black/5">
            <div className="w-full h-full rounded-full overflow-hidden relative bg-gray-100">
              {athlete.avatar_url ? (
                <img 
                  src={athlete.avatar_url} 
                  alt={athlete.name} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-950 via-kasa-vinotinto to-amber-600 flex items-center justify-center text-white font-black text-2xl select-none">
                  {athlete.name?.slice(0, 2).toUpperCase() || 'KS'}
                </div>
              )}
            </div>

            {/* Micro-escudo oficial de equipo acoplado */}
            {team?.logo_url && (
              <div 
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white p-0.5 shadow-lg ring-2 ring-kasa-dorado border border-white overflow-hidden flex items-center justify-center z-10"
                title={team?.name}
              >
                <img 
                  src={team.logo_url} 
                  alt={team?.name} 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Athlete Info */}
        <div className="px-6 pt-3 pb-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">
            {athlete.name}
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            C.I. {formatCedula(athlete.cedula)}
          </p>

          {/* Badge de equipo y categoría */}
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 text-xs px-3.5 py-1.5 rounded-full font-bold mb-5 border border-gray-200/80 shadow-2xs">
            {team?.logo_url ? (
              <img 
                src={team.logo_url} 
                alt="" 
                className="w-4 h-4 rounded-full object-cover shrink-0" 
              />
            ) : (
              <Trophy className="w-3.5 h-3.5 text-kasa-dorado-dark shrink-0" />
            )}
            <span>{team?.name || 'Sin equipo asignado'}</span>
            {team?.category && (
              <span className="text-gray-400 font-semibold text-[11px] pl-1.5 border-l border-gray-300">
                {team.category}
              </span>
            )}
          </div>

          {/* Vigencia / Solvencia Card */}
          {isInactivo ? (
            <div className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-3 mb-5 text-center">
              <span className="text-xs font-bold text-gray-700">Ficha Inactiva</span>
              <p className="text-[11px] text-gray-500 mt-0.5">Contacte a la administración del torneo</p>
            </div>
          ) : athlete.paid_until ? (
            <div className={`w-full rounded-2xl p-3 mb-5 flex items-center justify-between border ${
              isSolvente 
                ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900' 
                : 'bg-rose-50/80 border-rose-200/80 text-rose-900'
            }`}>
              <div className="flex items-center gap-2.5 text-left">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isSolvente ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isSolvente ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isSolvente ? 'Solvencia Vigente' : 'Solvencia Vencida'}
                  </p>
                  <p className="text-xs font-black">
                    {formatLocalDate(athlete.paid_until, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isSolvente ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
              }`}>
                {isSolvente ? 'Al Día' : 'Pendiente'}
              </span>
            </div>
          ) : isSolvente ? (
            <div className="w-full bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 mb-5 flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Estado de Ficha</p>
                  <p className="text-xs font-black text-emerald-950">Solvente en Temporada 2026</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-950">
                Al Día
              </span>
            </div>
          ) : null}

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-2 gap-2.5 mb-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">AVG (Promedio)</span>
              <span className="text-2xl font-black text-amber-600">
                {athlete.stats_avg ? Number(athlete.stats_avg).toFixed(3).replace('0.', '.') : '.000'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">HITS (Conectados)</span>
              <span className="text-2xl font-black text-slate-900">{athlete.stats_hits || 0}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">CI (Impulsadas)</span>
              <span className="text-2xl font-black text-slate-900">{athlete.stats_rbi || 0}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">CA (Anotadas)</span>
              <span className="text-2xl font-black text-slate-900">{athlete.stats_runs || 0}</span>
            </div>
          </div>
        </div>

        {/* Footer Brand */}
        <div className="bg-slate-50/90 py-3.5 px-6 text-center border-t border-gray-100">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <BrandLogo src={settings?.logo_url} size="xs" variant="badge" />
            <span className="text-xs font-black tracking-wider text-gray-800">KASA SPORTS SYSTEM</span>
          </div>
          <p className="text-[10px] text-gray-400 font-mono">
            Ficha Oficial Verificada • ID: {athlete.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Volver al inicio link */}
      <Link
        href="/"
        className="relative z-10 mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-xs transition-all border border-white/10 shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver a KsaSport</span>
      </Link>
    </div>
  )
}
