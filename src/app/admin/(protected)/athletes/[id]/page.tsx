import { getServiceSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, CreditCard, ShieldCheck, Activity, Trophy, MessageCircle, ExternalLink, Receipt } from 'lucide-react'
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
    .select('*, teams(name, category)')
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

  // 7. Totales Financieros
  const totalFacturado = statement.reduce((sum, item) => sum + item.facturado, 0)
  const totalPagado = statement.reduce((sum, item) => sum + item.pagado, 0)
  const saldoTotal = statement.reduce((sum, item) => sum + item.saldo, 0)

  // 8. Variables de Estatus y Ribbon
  const isSolvente = athlete.status === 'Solvente'
  const isMoroso = athlete.status === 'Moroso'
  const ribbonBorder = isSolvente 
    ? 'border-l-[6px] border-l-emerald-500' 
    : isMoroso 
    ? 'border-l-[6px] border-l-rose-500' 
    : 'border-l-[6px] border-l-slate-400'

  // Helper de iniciales para avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Helper para URL de WhatsApp
  const formatWhatsAppUrl = (phone: string, name: string) => {
    const digits = phone.replace(/\D/g, '')
    const cleanPhone = digits.startsWith('0') ? '58' + digits.slice(1) : digits.startsWith('58') ? digits : '58' + digits
    const msg = encodeURIComponent(`Hola ${name}, te contactamos desde la administración de KsaSport.`)
    return `https://wa.me/${cleanPhone}?text=${msg}`
  }

  return (
    <div className="min-h-full bg-slate-100/70 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Botón Volver al Directorio */}
        <div className="flex items-center justify-between">
          <Link 
            href="/admin/athletes" 
            className="inline-flex items-center gap-2 text-xs font-black text-slate-600 hover:text-gray-900 transition-all bg-white px-4 py-2.5 rounded-2xl shadow-2xs border border-slate-200/90 hover:border-slate-300 hover:shadow-xs group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver al Directorio de Atletas</span>
          </Link>
        </div>

        {/* HEADER: Perfil 360 del Atleta con Ribbon Semántico */}
        <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 ${ribbonBorder} shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] relative overflow-hidden`}>
          {athlete.has_alliance && (
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-black px-4 py-2 rounded-bl-2xl shadow-sm uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Talento Alianza
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
            {/* Avatar con Aro, Relieve y Micro-indicador de Estatus */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white bg-gradient-to-br from-rose-50 via-red-50 to-amber-50 flex items-center justify-center overflow-hidden shrink-0 shadow-lg ring-1 ring-slate-200">
              {athlete.avatar_url ? (
                <img src={athlete.avatar_url} alt={athlete.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-kasa-vinotinto tracking-wider">
                  {getInitials(athlete.name)}
                </span>
              )}
              <span 
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  isSolvente ? 'bg-emerald-500' : isMoroso ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                }`}
                title={`Estatus: ${athlete.status}`}
              />
            </div>
            
            {/* Información Principal y Badges */}
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight truncate">
                  {athlete.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                  <span className="text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-xl text-xs border border-slate-200/80 shadow-2xs">
                    C.I: {athlete.cedula}
                  </span>

                  <span className="text-kasa-vinotinto font-black bg-red-50 px-3 py-1 rounded-xl text-xs border border-red-200/80 shadow-2xs flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    {/* @ts-ignore */}
                    <span>{athlete.teams?.name || 'Sin equipo asignado'}</span>
                    {/* @ts-ignore */}
                    {athlete.teams?.category && (
                      <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                        • {athlete.teams.category}
                      </span>
                    )}
                  </span>

                  {athlete.position && (
                    <span className="inline-block font-mono text-xs font-black text-white bg-gray-950 px-2.5 py-1 rounded-xl border border-gray-800 shadow-xs tracking-wider">
                      Pos: {athlete.position}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Estatus Financiero y Botón de WhatsApp */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border shadow-2xs ${
                  isSolvente 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : isMoroso 
                    ? 'bg-rose-50 text-rose-800 border-rose-300' 
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isSolvente ? 'bg-emerald-500' : isMoroso ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <div>
                    <p className="text-[9px] uppercase font-black tracking-wider opacity-75 leading-none">Estatus Financiero</p>
                    <p className="font-black text-xs mt-0.5">{athlete.status}</p>
                  </div>
                </div>

                {athlete.paid_until && (
                  <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider leading-none">
                        {isSolvente ? 'Válido Hasta' : 'Pendiente Desde'}
                      </p>
                      <p className="font-bold text-gray-900 text-xs mt-0.5">
                        {new Date(athlete.paid_until).toLocaleDateString('es-ES', { month: 'short', year: 'numeric', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botón WhatsApp */}
                {athlete.phone ? (
                  <a
                    href={formatWhatsAppUrl(athlete.phone, athlete.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 ml-auto sm:ml-0"
                    title={`Abrir chat de WhatsApp con ${athlete.phone}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp ({athlete.phone})</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">
                    Sin teléfono registrado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CUERPO PRINCIPAL: 2 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Alianzas y Rendimiento */}
          <div className="space-y-6">
            {athlete.has_alliance ? (
              <ExemptionManager 
                athleteId={athlete.id} 
                products={products || []} 
                initialExemptions={exemptionIds} 
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] text-center">
                <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="font-black text-gray-900 text-base">Sin Alianza Comercial</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                  Esta jugadora no goza de estatus de alianza comercial. Para activar exoneraciones de cuotas, edita su ficha en el roster y marca la casilla &quot;Alianza Comercial&quot;.
                </p>
              </div>
            )}
            
            {/* Rendimiento Deportivo */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                  Métricas de Campo
                </span>
              </div>
              <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-kasa-vinotinto" />
                Rendimiento Deportivo
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50/80 p-3.5 rounded-2xl border border-sky-200/80 shadow-2xs">
                  <p className="text-[10px] font-black text-sky-800 uppercase tracking-wider">AVG</p>
                  <p className="text-2xl font-mono font-black text-sky-950 mt-0.5">{athlete.stats_avg ?? '-'}</p>
                </div>
                <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-200/80 shadow-2xs">
                  <p className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">HITS</p>
                  <p className="text-2xl font-mono font-black text-indigo-950 mt-0.5">{athlete.stats_hits ?? '-'}</p>
                </div>
                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80 shadow-2xs">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">CI (RBI)</p>
                  <p className="text-2xl font-mono font-black text-amber-950 mt-0.5">{athlete.stats_rbi ?? '-'}</p>
                </div>
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">CA (RUNS)</p>
                  <p className="text-2xl font-mono font-black text-emerald-950 mt-0.5">{athlete.stats_runs ?? '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Finanzas */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Estado de Cuenta */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-kasa-vinotinto" />
                  Estado de Cuenta
                </h3>

                {/* Resumen financiero integrado y limpio */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                    Facturado: <strong className="text-gray-900 font-mono">${totalFacturado.toFixed(2)}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
                    Abonado: <strong className="font-mono">${totalPagado.toFixed(2)}</strong>
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg border shadow-2xs ${
                    saldoTotal > 0 
                      ? 'bg-rose-50 border-rose-200 text-rose-800' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    Saldo: <strong className="font-mono">${saldoTotal.toFixed(2)}</strong> {saldoTotal === 0 && '• Al día'}
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200">
                      <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Concepto</th>
                      <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Facturado</th>
                      <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Abonado</th>
                      <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {statement.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 font-bold text-gray-900 text-sm">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.isExempt && (
                              <span className="bg-amber-100/80 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider shadow-2xs">
                                🤝 Exonerado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-slate-600 font-mono text-sm">
                          ${item.facturado.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-emerald-700 font-mono text-sm">
                          ${item.pagado.toFixed(2)}
                        </td>
                        <td className={`py-4 px-6 text-right font-black font-mono text-sm ${item.saldo > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                          ${item.saldo.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {statement.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-gray-700">No hay obligaciones financieras activas</p>
                          <p className="text-xs text-slate-400 mt-0.5">La atleta no posee compromisos de pago vigentes.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial de Pagos */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-kasa-vinotinto" />
                    Historial de Reportes
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Pagos y transacciones reportadas por la jugadora.</p>
                </div>
                <span className="text-xs font-black text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  {payments?.length || 0} {payments?.length === 1 ? 'pago' : 'pagos'}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200">
                      <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Fecha y Método</th>
                      <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Monto / Concepto</th>
                      <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payments?.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-bold text-gray-900 text-sm">
                            {new Date(pay.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs font-semibold text-slate-400 mt-0.5">
                            {pay.method || 'Método no especificado'} {pay.reference ? `• Ref #${pay.reference}` : ''}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-mono font-black text-gray-900 text-sm">${Number(pay.amount).toFixed(2)}</div>
                          <div className="text-xs text-slate-500 font-medium">{(pay.products as any)?.name || 'Cuota'}</div>
                          {pay.receipt_url && (
                            <a 
                              href={pay.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-kasa-vinotinto hover:underline mt-1"
                            >
                              Ver Comprobante <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full border shadow-2xs ${
                            pay.status === 'Completado' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            pay.status === 'Rechazado' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                            'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              pay.status === 'Completado' ? 'bg-emerald-500' :
                              pay.status === 'Rechazado' ? 'bg-rose-500' :
                              'bg-amber-500'
                            }`} />
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!payments || payments.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-10 text-center">
                          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-gray-700">No hay pagos registrados</p>
                          <p className="text-xs text-slate-400 mt-0.5">Aún no se han reportado transferencias o abonos.</p>
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
    </div>
  )
}
