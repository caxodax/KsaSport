import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import { CheckCircle2, AlertCircle, ShoppingCart, Activity } from 'lucide-react'
import Link from 'next/link'
import { logout } from '../actions'
import QRModal from '@/components/portal/QRModal'
import AvatarUpload from '@/components/portal/AvatarUpload'
import OptInCard from '@/components/portal/OptInCard'

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
    .select('id, name, cedula, status, avatar_url, paid_until, stats_avg, stats_hits, stats_rbi, stats_runs, teams(name)')
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

  // Calcular deudas activas (productos con abonos parciales)
  // Agrupamos los pagos aprobados/pendientes por producto
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

  // Obtener productos que requieren opt-in y cruzar con los opt-ins actuales
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
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <form action={logout}>
          <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">
            Cerrar Sesión
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Columna Izquierda: Tarjeta de Perfil y Estatus */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
            <AvatarUpload athleteId={athlete.id} currentAvatar={athlete.avatar_url} />
            <div className="flex flex-col flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-1">{athlete.name}</h2>
              <p className="text-sm font-medium text-gray-500 mb-3">C.I: {athlete.cedula}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-kasa-vinotinto/10 text-kasa-vinotinto text-xs px-3 py-1.5 rounded-full font-bold">
                  {/* @ts-ignore */}
                  {athlete.teams?.name || 'Sin asignar'}
                </span>
              </div>
              
              <div className="w-full mt-auto">
                <QRModal athleteId={athlete.id} status={athlete.status} />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-6 text-center ${
            athlete.status === 'Solvente' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            {athlete.status === 'Solvente' ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-800">Solvente</h3>
                {athlete.paid_until && (
                  <p className="text-sm font-bold text-green-700 mt-2 bg-green-100 py-1.5 px-3 rounded-full inline-block">
                    Válido hasta: {new Date(athlete.paid_until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p className="text-sm text-green-600 mt-3">Estás al día con tus pagos. Tienes luz verde para jugar.</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-red-800">Morosidad</h3>
                {athlete.paid_until && (
                  <p className="text-sm font-bold text-red-700 mt-2 bg-red-100 py-1.5 px-3 rounded-full inline-block">
                    Vencido desde: {new Date(athlete.paid_until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p className="text-sm text-red-600 mt-3">Tienes deudas pendientes. Tu participación en juegos está restringida.</p>
                <Link href="/portal/dashboard/pagos" className="mt-4 inline-block bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full shadow-md">
                  Ir a Pagar
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Columna Derecha: Acciones e Historial */}
        <div className="lg:col-span-2 space-y-6">
          
          {pendingInvitations.length > 0 && (
            <div className="flex flex-col gap-4">
              {pendingInvitations.map(invitation => (
                <OptInCard key={invitation.id} athleteId={athlete.id} product={invitation} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/portal/dashboard/pagos" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-kasa-dorado hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Centro de Pagos</h3>
                <p className="text-sm text-gray-500">Mensualidades, Clínicas, Uniformes</p>
              </div>
            </Link>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mis Estadísticas</h3>
                  <p className="text-sm text-gray-500">Rendimiento de temporada</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AVG</p>
                  <p className="text-xl font-black text-kasa-dorado">{athlete.stats_avg ? Number(athlete.stats_avg).toFixed(3).replace('0.', '.') : '.000'}</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">HITS</p>
                  <p className="text-xl font-black text-gray-900">{athlete.stats_hits || 0}</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">CI</p>
                  <p className="text-xl font-black text-gray-900">{athlete.stats_rbi || 0}</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">CA</p>
                  <p className="text-xl font-black text-gray-900">{athlete.stats_runs || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {activeDebts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Abonos Activos (Deudas)</h3>
              </div>
              <div className="divide-y divide-gray-100 p-4 sm:p-6 space-y-4">
                {activeDebts.map((debt, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-900">{debt.name}</h4>
                      <span className="text-sm font-bold text-kasa-vinotinto">Total: ${debt.total.toFixed(2)}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (debt.paid / debt.total) * 100)}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700 font-bold">Abonado: ${debt.paid.toFixed(2)}</span>
                      <span className="text-red-600 font-bold">Resta: ${debt.remaining.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Link href="/portal/dashboard/pagos" className="text-sm text-blue-600 hover:underline font-medium">
                    Ir al Centro de Pagos para abonar
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Historial de Transacciones</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {payments && payments.length > 0 ? (
                payments.map((payment) => (
                  <div key={payment.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{payment.concept}</p>
                      <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString()} • Ref: {payment.reference_number || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">${payment.amount}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1
                        ${payment.status === 'Completado' ? 'bg-green-100 text-green-700' : 
                          payment.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No tienes transacciones registradas.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
