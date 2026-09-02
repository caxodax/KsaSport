import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import { CheckCircle2, AlertCircle, ShoppingCart, Activity, ShieldCheck, User, Calendar, LogOut } from 'lucide-react'
import Link from 'next/link'
import { logout } from '../actions'
import QRModal from '@/components/portal/QRModal'
import AvatarUpload from '@/components/portal/AvatarUpload'
import OptInCard from '@/components/portal/OptInCard'
import TransactionHistory from '@/components/portal/TransactionHistory'

export const revalidate = 0;

export default async function PortalDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/portal/login')
  }

  const adminSupabase = getServiceSupabase()
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id, name, cedula, status, avatar_url, paid_until, stats_avg, stats_hits, stats_rbi, stats_runs, has_alliance, teams(name)')
    .eq('user_id', session.user.id)
    .single()

  if (!athlete) {
    redirect('/portal/link-profile')
  }

  // Obtener últimos pagos
  const { data: payments } = await adminSupabase
    .from('payments')
    .select('*, products(name, price, allows_installments)')
    .eq('athlete_id', athlete.id)
    .order('created_at', { ascending: false })

  // Obtener exoneraciones
  const { data: athleteExemptions } = await adminSupabase
    .from('athlete_exemptions')
    .select('product_id')
    .eq('athlete_id', athlete.id)

  const exemptIds = new Set(athleteExemptions?.map(e => e.product_id) || [])

  // Calcular deudas activas (productos con abonos parciales)
  const activeDebts: any[] = []
  if (payments) {
    const productPayments = new Map<string, { totalPaid: number, product: any }>()
    payments.forEach(pay => {
      if (pay.status === 'Completado' || pay.status === 'Pendiente') {
        const prod = pay.products as any
        if (prod && prod.allows_installments) {
          const current = productPayments.get(pay.product_id) || { totalPaid: 0, product: { ...prod, id: pay.product_id } }
          current.totalPaid += Number(pay.amount)
          productPayments.set(pay.product_id, current)
        }
      }
    })

    productPayments.forEach(val => {
      if (exemptIds.has(val.product.id)) return
      const remaining = Number(val.product.price) - val.totalPaid
      if (remaining > 0) {
        activeDebts.push({
          id: val.product.id,
          name: val.product.name,
          total: Number(val.product.price),
          paid: val.totalPaid,
          remaining: remaining
        })
      }
    })
  }

  // Opt-ins (Invitaciones a torneos)
  const { data: optInProducts } = await adminSupabase
    .from('products')
    .select('id, name, price, description')
    .eq('is_active', true)
    .eq('requires_opt_in', true)

  const { data: athleteOptIns } = await adminSupabase
    .from('athlete_product_opt_ins')
    .select('product_id')
    .eq('athlete_id', athlete.id)

  const optedInIds = new Set(athleteOptIns?.map(o => o.product_id) || [])
  const pendingInvitations = optInProducts?.filter(p => !optedInIds.has(p.id)) || []

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* HEADER / HERO SECTION (Modern Glassmorphism) */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-kasa-vinotinto via-red-950 to-black z-0"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex justify-end p-4">
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full transition-all border border-white/10">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </form>
        </div>

        <div className="relative z-10 px-6 pb-8 md:px-10 md:pb-10 pt-2 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          
          <div className="shrink-0 relative">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full shadow-2xl overflow-hidden ring-4 ring-white/10">
              <AvatarUpload athleteId={athlete.id} currentAvatar={athlete.avatar_url} />
            </div>
            {athlete.has_alliance && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-kasa-dorado text-kasa-vinotinto text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-lg border border-yellow-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Alianza
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md mb-2">
              {athlete.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
              <span className="text-white/80 font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/10">
                C.I: {athlete.cedula}
              </span>
              <span className="text-kasa-dorado font-bold bg-kasa-dorado/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-kasa-dorado/30">
                {/* @ts-ignore */}
                {athlete.teams?.name || 'Sin asignar'}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 flex-col sm:flex-row items-center w-full md:w-auto">
            <QRModal 
              athleteId={athlete.id} 
              status={athlete.status} 
              triggerClassName="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-bold py-3 px-6 rounded-2xl transition-all shadow-xl"
            />
            <Link href="/portal/dashboard/pagos" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-kasa-dorado to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-kasa-vinotinto font-black py-3 px-6 rounded-2xl transition-all shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-0.5">
              <ShoppingCart className="w-5 h-5" />
              PAGAR
            </Link>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (Estado y Estadísticas) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Tarjeta Estatus Deportivo/Financiero */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`absolute top-0 w-full h-1.5 ${athlete.status === 'Solvente' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            
            {athlete.status === 'Solvente' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-1">Solvente</h3>
                <p className="text-sm text-green-600 font-medium">Luz verde para jugar.</p>
                {athlete.paid_until && (
                  <div className="mt-4 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Válido hasta: {new Date(athlete.paid_until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-1">Morosidad</h3>
                <p className="text-sm text-red-600 font-medium">Participación restringida.</p>
                {athlete.paid_until && (
                  <div className="mt-4 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Vencido desde: {new Date(athlete.paid_until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tarjeta de Estadísticas Dinámica */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-kasa-dorado" />
              Estadísticas de Temporada
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Promedio</p>
                <p className="text-3xl font-black text-kasa-dorado">{athlete.stats_avg ? Number(athlete.stats_avg).toFixed(3).replace('0.', '.') : '.000'}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hits</p>
                <p className="text-3xl font-black text-gray-900">{athlete.stats_hits || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impulsadas</p>
                <p className="text-3xl font-black text-gray-900">{athlete.stats_rbi || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Anotadas</p>
                <p className="text-3xl font-black text-gray-900">{athlete.stats_runs || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (Transacciones, Opt-ins y Deudas) */}
        <div className="lg:col-span-2 space-y-6">
          
          {pendingInvitations.length > 0 && (
            <div className="flex flex-col gap-4">
              {pendingInvitations.map(invitation => (
                <OptInCard key={invitation.id} athleteId={athlete.id} product={invitation} />
              ))}
            </div>
          )}

          {activeDebts.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 pl-8">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Deudas Activas (Abonos)
                </h3>
              </div>
              <div className="divide-y divide-gray-100 p-4 sm:p-6 pl-8 space-y-4">
                {activeDebts.map((debt, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-red-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900">{debt.name}</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Costo Total: ${debt.total.toFixed(2)}</p>
                      </div>
                      <span className="bg-red-50 text-red-700 text-xs font-black px-3 py-1 rounded-full border border-red-100">
                        Resta: ${debt.remaining.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${Math.min(100, (debt.paid / debt.total) * 100)}%` }}>
                        <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600 font-bold">Abonado: ${debt.paid.toFixed(2)}</span>
                      <span className="text-gray-400 font-medium">Progreso: {Math.round((debt.paid / debt.total) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Componente Cliente de Historial Paginado */}
          <div className="h-auto md:h-auto">
             <TransactionHistory payments={payments || []} />
          </div>

        </div>
      </div>
    </div>
  )
}
