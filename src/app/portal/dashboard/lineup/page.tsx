import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Target, Users, User, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase';
import LineupClientWrapper from '@/app/admin/(protected)/lineup/LineupClientWrapper';

export const revalidate = 0;

export default async function AthleteLineupPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminSupabase = getServiceSupabase();

  // 1. Obtener perfil de la atleta autenticada
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id, name, cedula, avatar_url, team_id, position, batting_order, teams(id, name, category, logo_url)')
    .eq('user_id', user.id)
    .single();

  if (!athlete) {
    redirect('/portal/link-profile');
  }

  const teamData = Array.isArray(athlete.teams) ? athlete.teams[0] : athlete.teams;
  const teamName = teamData?.name || 'Tu Equipo';
  const teamCategory = teamData?.category || 'Kickingball';

  // Si no tiene equipo asignado
  if (!athlete.team_id) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-kasa-vinotinto bg-white px-3 py-1.5 rounded-xl border border-gray-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Portal
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Aún no tienes equipo asignado</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Para consultar la alineación y el orden al bate oficial, debes estar asignada a un equipo en el sistema. Comunícate con tu mánager o cuerpo técnico para la asignación.
          </p>
        </div>
      </div>
    );
  }

  // 2. Cargar roster oficial del equipo de la atleta
  const { data: teammates } = await adminSupabase
    .from('athletes')
    .select('id, name, position, stats_avg, phone, batting_order, avatar_url')
    .eq('team_id', athlete.team_id)
    .neq('status', 'Inactivo')
    .order('name');

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-3 sm:p-6 lg:p-8 space-y-5 flex flex-col">
      {/* Botón Volver y Cabecera de Equipo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-kasa-vinotinto bg-white px-3.5 py-2 rounded-xl border border-gray-200 transition-all shadow-2xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Portal
          </Link>
          <span className="text-xs bg-red-50 text-kasa-vinotinto font-bold px-2.5 py-1 rounded-full border border-red-100">
            {teamCategory}
          </span>
        </div>

        {/* Resumen táctico personal */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-gray-200 shadow-2xs rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] text-gray-500 font-medium">Tu Posición:</span>
            <span className="text-xs font-bold text-gray-900">
              {athlete.position || 'En Banca'}
            </span>
          </div>

          <div className="bg-white border border-gray-200 shadow-2xs rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] text-gray-500 font-medium">Turno al Bate:</span>
            <span className="text-xs font-bold text-gray-900">
              {athlete.batting_order ? `${athlete.batting_order}° Turno` : 'Sin asignar'}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Oficial del Equipo */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 rounded-2xl p-5 text-white shadow-sm border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-kasa-dorado flex items-center justify-center font-black text-xl shrink-0 border border-white/10">
            {teamData?.logo_url ? (
              <img src={teamData.logo_url} alt={teamName} className="w-10 h-10 object-contain rounded-xl" />
            ) : (
              teamName.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Lineup Oficial: {teamName}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-kasa-dorado" />
              Alineación táctica defensiva y ofensiva oficial de solo lectura.
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-300 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl font-bold self-start sm:self-auto">
          {teammates?.length || 0} Jugadoras en Roster
        </div>
      </div>

      {/* Contenedor Interactivo del Lineup (Solo Lectura) */}
      <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[620px]">
        <LineupClientWrapper
          athletes={teammates || []}
          readOnly={true}
          currentAthleteId={athlete.id}
        />
      </div>
    </div>
  );
}
