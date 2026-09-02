import { getServiceSupabase } from '@/lib/supabase';
import { CircleDollarSign, TrendingUp, CreditCard, ShoppingCart, BarChart3, Receipt, ChevronUp, Users } from 'lucide-react';

export const revalidate = 0;

export default async function LedgerPage() {
  const supabase = getServiceSupabase();

  // Fetch ALL completed payments
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, method, created_at, products(name), athletes(name, cedula)')
    .eq('status', 'Completado');

  // Fetch all active installment products (to show debt)
  const { data: installmentProducts } = await supabase
    .from('products')
    .select('id, name, price, requires_opt_in')
    .eq('is_active', true)
    .eq('allows_installments', true);

  // Fetch payments for active installment products to calculate pending debt
  const { data: installmentPayments } = await supabase
    .from('payments')
    .select('product_id, athlete_id, amount, status')
    .in('status', ['Completado', 'Pendiente']);

  // Fetch all opt-ins to calculate expected revenue for tournaments
  const { data: allOptIns } = await supabase
    .from('athlete_product_opt_ins')
    .select('product_id, athlete_id');

  // --- Metrics Calculation ---
  let totalRevenue = 0;
  const methodMap = new Map<string, { count: number, total: number }>();
  const productMap = new Map<string, { count: number, total: number }>();
  let highestTicket = 0;
  let lowestTicket = Infinity;

  if (payments && payments.length > 0) {
    payments.forEach(pay => {
      const amount = Number(pay.amount);
      totalRevenue += amount;
      
      if (amount > highestTicket) highestTicket = amount;
      if (amount < lowestTicket) lowestTicket = amount;

      // Method Breakdown
      const method = pay.method || 'No Especificado';
      if (!methodMap.has(method)) methodMap.set(method, { count: 0, total: 0 });
      const mEntry = methodMap.get(method)!;
      mEntry.count += 1;
      mEntry.total += amount;

      // Product Breakdown
      const prodName = (pay.products as any)?.name || 'Producto Eliminado / Desconocido';
      if (!productMap.has(prodName)) productMap.set(prodName, { count: 0, total: 0 });
      const pEntry = productMap.get(prodName)!;
      pEntry.count += 1;
      pEntry.total += amount;
    });
  } else {
    lowestTicket = 0;
  }

  const transactionCount = payments?.length || 0;
  const averageTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  // Sorting
  const sortedMethods = Array.from(methodMap.entries()).sort((a, b) => b[1].total - a[1].total);
  const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1].total - a[1].total);
  
  // --- Calcular Abonos Activos por Producto ---
  const installmentSummary = (installmentProducts || []).map(prod => {
    const pmt = installmentPayments?.filter(p => p.product_id === prod.id) || [];
    let expectedAthleteCount = 0;

    if (prod.requires_opt_in) {
      // Para torneos, la deuda esperada se basa SOLO en los inscritos explícitamente
      const optIns = allOptIns?.filter(o => o.product_id === prod.id) || [];
      expectedAthleteCount = optIns.length;
    } else {
      // Para mensualidades (sin opt-in explícito), se asume que todos los que han pagado algo son los esperados
      // En un futuro se puede cruzar con la tabla athletes si se requiere para todos.
      const athleteIds = new Set(pmt.map(p => p.athlete_id));
      expectedAthleteCount = athleteIds.size;
    }

    const totalFacturado = expectedAthleteCount * Number(prod.price);
    
    // Solo los pagos Completados suman al ingreso recibido
    const pagosValidados = pmt.filter(p => p.status === 'Completado');
    const totalAbonado = pagosValidados.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const saldoPendiente = Math.max(0, totalFacturado - totalAbonado);
    return {
      id: prod.id, name: prod.name, price: Number(prod.price),
      athleteCount: expectedAthleteCount, totalFacturado, totalAbonado, saldoPendiente
    };
  }).filter(p => p.athleteCount > 0);

  return (
    <div className="p-4 sm:p-8 bg-gray-50/50 min-h-screen">
      {/* Encabezado Analítico */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <div className="p-2.5 bg-green-100 rounded-xl">
            <BarChart3 className="w-8 h-8 text-green-700" />
          </div>
          Reportes Financieros (Libro Mayor)
        </h2>
        <p className="text-gray-500 mt-2 text-lg">
          Análisis de ingresos reales validados en la plataforma.
        </p>
      </div>

      {/* Tarjetas KPI Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI: Ingreso Total */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-3xl p-6 shadow-xl shadow-green-900/20 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20">
            <CircleDollarSign className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-green-100 font-bold uppercase tracking-wider text-sm mb-1">Ingreso Total Validado</p>
            <h3 className="text-4xl font-black tracking-tight">${totalRevenue.toFixed(2)}</h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md">
                <TrendingUp className="w-3 h-3" /> Histórico
              </span>
            </div>
          </div>
        </div>

        {/* KPI: Transacciones */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Total Transacciones</p>
            <h3 className="text-3xl font-black text-gray-900">{transactionCount}</h3>
          </div>
        </div>

        {/* KPI: Ticket Promedio */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Ticket Promedio</p>
            <h3 className="text-3xl font-black text-gray-900">${averageTicket.toFixed(2)}</h3>
          </div>
        </div>

        {/* KPI: Productos Activos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 rounded-2xl">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Productos Vendidos</p>
            <h3 className="text-3xl font-black text-gray-900">{sortedProducts.length}</h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Gráfico/Lista: Por Método de Pago */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            Ingresos por Método
          </h3>
          <div className="space-y-6">
            {sortedMethods.map(([method, data]) => {
              const percentage = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;
              return (
                <div key={method}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-gray-700">{method}</span>
                    <span className="font-black text-gray-900">${data.total.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">{data.count} pagos ({percentage.toFixed(1)}%)</p>
                </div>
              );
            })}
            {sortedMethods.length === 0 && (
              <p className="text-center text-gray-400 py-8">No hay transacciones.</p>
            )}
          </div>
        </div>

        {/* Libro Mayor Completo (Desglose por Producto) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-400" />
              Libro Mayor por Producto (Mejores Ventas)
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Producto / Concepto</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">Transacciones</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Ingreso ($)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {sortedProducts.map(([product, data]) => (
                  <tr key={product} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{product}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                        {data.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-black text-green-700 text-base">${data.total.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
                {sortedProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                      No hay ingresos registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>

      {/* Deudas y Abonos Activos */}
      {installmentSummary.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                Seguimiento de Abonos y Deudas
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Progreso de cobranza para productos que permiten cuotas (Mensualidades, etc).
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Producto</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">Atletas</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Facturado</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-green-600 uppercase tracking-widest">Abonado</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-red-600 uppercase tracking-widest">Pendiente</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">Cobranza</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {installmentSummary.map(prod => {
                  const pct = prod.totalFacturado > 0 ? Math.min(100, (prod.totalAbonado / prod.totalFacturado) * 100) : 0;
                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-5">
                        <span className="font-bold text-gray-900">{prod.name}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm font-bold text-gray-600">{prod.athleteCount}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-bold text-gray-500">${prod.totalFacturado.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-black text-green-700">${prod.totalAbonado.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-black text-red-700">${prod.saldoPendiente.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div className={`h-3 rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-xs font-black text-gray-700 w-9 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
