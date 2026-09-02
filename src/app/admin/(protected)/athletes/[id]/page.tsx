import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, CreditCard, ShieldCheck, Activity, Trophy } from 'lucide-react'
import ExemptionManager from './ExemptionManager'

export const revalidate = 0

export default async function AthleteProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const supabase = getServiceSupabase()

  // 1. Fetch Athlete Data
  const { data: athlete, error } = await supabase
    .from('athletes')
    .select('*, teams(name)')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !athlete) {
    notFound()
  }

  // 2. Fetch Active Products (for Exemption Manager)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, allows_installments, requires_opt_in')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // 3. Fetch current exemptions
  const { data: exemptions } = await supabase
    .from('athlete_exemptions')
    .select('product_id')
    .eq('athlete_id', athlete.id)

  const exemptionIds = exemptions?.map(e => e.product_id) || []
  const exemptionSet = new Set(exemptionIds)

  // 4. Fetch opt-ins (Tournaments)
  const { data: optIns } = await supabase
    .from('athlete_product_opt_ins')
    .select('product_id')
    .eq('athlete_id', athlete.id)
  
  const optInIds = new Set(optIns?.map(o => o.product_id) || [])

  // 5. Fetch all payments from this athlete
  const { data: payments } = await supabase
    .from('payments')
    .select('*, products(name)')
    .eq('athlete_id', athlete.id)
    .order('created_at', { ascending: false })

  // 6. Calcular Estado de Cuenta Financiero
  const statement = []
  
  for (const product of (products || [])) {
    // Si es producto con opt-in y la jugadora NO opt-in, ignorar
    if (product.requires_opt_in && !optInIds.has(product.id)) {
      continue
    }
    
    // Si la jugadora está exonerada, su deuda es 0
    const isExempt = exemptionSet.has(product.id)
    
    // Calcular pagos válidos
    const productPayments = payments?.filter(p => p.product_id === product.id) || []
    const pagado = productPayments
      .filter(p => p.status === 'Completado')
      .reduce((sum, p) => sum + Number(p.amount), 0)
      
    const facturado = isExempt ? 0 : Number(product.price)
    
    // Solo mostramos en el Estado de Cuenta si es un producto a cuotas (meses/ligas)
    // o si han pagado algo
    if (product.allows_installments || productPayments.length > 0) {
      statement.push({
        id: product.id,
        name: product.name,
        facturado,
        pagado,
        saldo: Math.max(0, facturado - pagado),
        isExempt
      })
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Botón Volver */}
      <Link href="/admin/athletes" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
        <ArrowLeft className="w-4 h-4" />
        Volver al Directorio
      </Link>

      {/* HEADER: Perfil del Atleta */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        {athlete.has_alliance && (
          <div className="absolute top-0 right-0 bg-kasa-dorado text-kasa-vinotinto text-xs font-black px-4 py-2 rounded-bl-2xl shadow-sm uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Talento Alianza
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
          {/* Avatar Area */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-50 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {athlete.avatar_url ? (
              <img src={athlete.avatar_url} alt={athlete.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 md:w-16 md:h-16 text-gray-300" />
            )}
          </div>
          
          {/* Info Area */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight">{athlete.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full text-sm">C.I: {athlete.cedula}</span>
                <span className="text-kasa-vinotinto font-bold bg-kasa-vinotinto/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {/* @ts-ignore */}
                  {athlete.teams?.name || 'Sin equipo asignado'}
                </span>
                {athlete.position && (
                  <span className="text-gray-700 font-bold bg-gray-100 px-3 py-1 rounded-full text-sm">
                    Pos: {athlete.position}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <Activity className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Estatus Financiero</p>
                  <p className={`font-black text-sm ${athlete.status === 'Solvente' ? 'text-green-600' : athlete.status === 'Moroso' ? 'text-red-600' : 'text-gray-600'}`}>
                    {athlete.status}
                  </p>
                </div>
              </div>
              
              {athlete.paid_until && (
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{athlete.status === 'Solvente' ? 'Solvente Hasta' : 'Moroso Desde'}</p>
                    <p className="font-bold text-gray-900 text-sm">{new Date(athlete.paid_until).toLocaleDateString('es-ES', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Alianzas y Estadísticas */}
        <div className="space-y-6">
          {athlete.has_alliance ? (
            <ExemptionManager 
              athleteId={athlete.id} 
              products={products || []} 
              initialExemptions={exemptionIds} 
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <h3 className="font-bold text-gray-900">Sin Alianza Comercial</h3>
              <p className="text-sm text-gray-500 mt-2">
                Esta jugadora no goza de estatus de alianza comercial. Para activar exoneraciones, edita su perfil y marca la casilla "Alianza Comercial".
              </p>
            </div>
          )}
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Rendimiento Deportivo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">AVG</p>
                <p className="text-2xl font-black text-blue-900">{athlete.stats_avg ?? '-'}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">HITS</p>
                <p className="text-2xl font-black text-indigo-900">{athlete.stats_hits ?? '-'}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">CI</p>
                <p className="text-2xl font-black text-orange-900">{athlete.stats_rbi ?? '-'}</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">CA</p>
                <p className="text-2xl font-black text-teal-900">{athlete.stats_runs ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Finanzas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Estado de Cuenta */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                Estado de Cuenta
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Concepto</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Facturado</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Abonado</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {statement.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">
                        {item.name}
                        {item.isExempt && (
                          <span className="ml-2 bg-kasa-dorado/10 text-kasa-dorado text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                            Exonerado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-600">
                        ${item.facturado.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-green-600">
                        ${item.pagado.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-gray-900">
                        ${item.saldo.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {statement.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">
                        No hay obligaciones financieras activas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historial de Pagos */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-black text-gray-900 text-lg">Historial de Reportes</h3>
              <p className="text-sm text-gray-500 mt-1">Últimos pagos reportados por la jugadora.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Fecha</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Monto / Concepto</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments?.map(pay => (
                    <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          {new Date(pay.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="text-xs text-gray-500">{pay.method}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-black text-gray-900">${Number(pay.amount).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{(pay.products as any)?.name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          pay.status === 'Completado' ? 'bg-green-100 text-green-800' :
                          pay.status === 'Rechazado' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!payments || payments.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-400 font-medium">
                        No hay pagos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
