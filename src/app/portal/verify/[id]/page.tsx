import { getServiceSupabase } from '@/lib/supabase'
import { CheckCircle2, AlertOctagon, Trophy, Camera } from 'lucide-react'
import { notFound } from 'next/navigation'

export const revalidate = 0;

export default async function VerifyAthletePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const adminSupabase = getServiceSupabase();
  
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('*, teams(name)')
    .eq('id', params.id)
    .single();

  if (!athlete) {
    notFound();
  }

  const isSolvente = athlete.status === 'Solvente';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans
      ${isSolvente ? 'bg-green-600' : 'bg-red-700'}`}>
      
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-white opacity-[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-black opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        
        {/* Status Header */}
        <div className={`py-6 flex flex-col items-center justify-center text-white
          ${isSolvente ? 'bg-green-500' : 'bg-red-600'}`}>
          {isSolvente ? (
            <CheckCircle2 className="w-16 h-16 mb-2 drop-shadow-md" />
          ) : (
            <AlertOctagon className="w-16 h-16 mb-2 drop-shadow-md" />
          )}
          <h1 className="text-3xl font-black uppercase tracking-widest drop-shadow-md">
            {isSolvente ? 'Habilitada' : 'Restringida'}
          </h1>
        </div>

        {/* Athlete Info */}
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center relative">
          
          {/* Floating Avatar */}
          <div className="absolute -top-12 w-24 h-24 bg-white rounded-full p-1 shadow-xl">
            {athlete.avatar_url ? (
              <img src={athlete.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Camera className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="mt-12 w-full">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{athlete.name}</h2>
            <p className="text-gray-500 font-medium mb-4">C.I: {athlete.cedula}</p>
            
            <div className="inline-block bg-gray-100 text-gray-800 text-sm px-4 py-1.5 rounded-full font-bold mb-8">
              {/* @ts-ignore */}
              {athlete.teams?.name || 'Sin equipo asignado'}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">AVG</span>
                <span className="text-2xl font-black text-kasa-dorado">
                  {athlete.stats_avg ? Number(athlete.stats_avg).toFixed(3).replace('0.', '.') : '.000'}
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">HITS</span>
                <span className="text-2xl font-black text-gray-900">{athlete.stats_hits || 0}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">CI</span>
                <span className="text-2xl font-black text-gray-900">{athlete.stats_rbi || 0}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">CA</span>
                <span className="text-2xl font-black text-gray-900">{athlete.stats_runs || 0}</span>
              </div>
            </div>

            {/* Paid Until */}
            {athlete.paid_until && (
              <div className={`text-sm font-semibold rounded-xl p-3 
                ${isSolvente ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isSolvente ? 'Válido hasta:' : 'Vencido desde:'} <br/>
                {new Date(athlete.paid_until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>

        </div>
        
        {/* Footer Brand */}
        <div className="bg-gray-50 py-4 text-center border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3 text-kasa-dorado" /> Kasa Sports System
          </p>
        </div>
      </div>
      
    </div>
  )
}
