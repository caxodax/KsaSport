import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, ShieldCheck } from 'lucide-react'

export const revalidate = 0;

export default async function GatewayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login')
  }

  const adminSupabase = getServiceSupabase()

  // 1. Verificar si es Atleta
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // 2. Verificar si es Admin/Staff
  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select('role_id')
    .eq('id', user.id)
    .single()

  // Lógica de Redirección Automática
  if (athlete && !adminUser) {
    redirect('/portal/dashboard')
  }

  if (adminUser && !athlete) {
    redirect('/admin')
  }

  if (!athlete && !adminUser) {
    redirect('/portal/link-profile')
  }

  // SI TIENE AMBOS: Renderizamos la pantalla de selección
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Encabezado */}
        <div className="bg-kasa-vinotinto p-8 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">¡Bienvenido de vuelta!</h1>
          <p className="text-white/80">Hemos detectado que tienes múltiples perfiles. ¿Cómo deseas ingresar hoy?</p>
        </div>

        {/* Opciones */}
        <div className="p-8 grid md:grid-cols-2 gap-6">
          
          {/* Opción Portal de Jugadora */}
          <Link href="/portal/dashboard" className="group relative bg-white border-2 border-gray-100 hover:border-kasa-dorado rounded-2xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-kasa-vinotinto rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Portal de Atleta</h3>
            <p className="text-gray-500 text-sm">Ingresa para ver tu estatus financiero, reportar pagos y gestionar tu perfil deportivo.</p>
            <div className="mt-6 text-sm font-bold text-kasa-vinotinto opacity-0 group-hover:opacity-100 transition-opacity">
              Ingresar como Atleta &rarr;
            </div>
          </Link>

          {/* Opción Panel Administrativo */}
          <Link href="/admin" className="group relative bg-white border-2 border-gray-100 hover:border-blue-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Panel Administrativo</h3>
            <p className="text-gray-500 text-sm">Ingresa a la bóveda administrativa para gestionar tu equipo, aprobar pagos y ver estadísticas.</p>
            <div className="mt-6 text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Ingresar como Mánager &rarr;
            </div>
          </Link>

        </div>
        
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-400 border-t border-gray-100">
          Kasa Sports - Sistema de Gestión Inteligente
        </div>
      </div>
    </div>
  )
}
