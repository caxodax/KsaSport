import { getServiceSupabase } from '@/lib/supabase';
import { Users, AlertCircle, CircleDollarSign, TrendingUp, Wallet } from 'lucide-react';
import DashboardFilters from './DashboardFilters';
import Pagination from './Pagination';

export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = getServiceSupabase();
  const resolvedParams = await searchParams;

  const query = typeof resolvedParams.query === 'string' ? resolvedParams.query : '';
  const teamFilter = typeof resolvedParams.team === 'string' ? resolvedParams.team : '';
  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : '';
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : '';
  
  const page = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1;
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Consulta de Atletas con Filtros y Paginación (para la tabla)
  let athletesQuery = supabase
    .from('athletes')
    .select('id, name, cedula, status, team_id, teams!inner(id, name, category)', { count: 'exact' });

  if (query) {
    athletesQuery = athletesQuery.or(`name.ilike.%${query}%,cedula.ilike.%${query}%`);
  }
  if (teamFilter) {
    athletesQuery = athletesQuery.eq('team_id', teamFilter);
  }
  if (categoryFilter) {
    athletesQuery = athletesQuery.eq('teams.category', categoryFilter);
  }
  if (statusFilter) {
    athletesQuery = athletesQuery.eq('status', statusFilter);
  }

  const { data: athletes, error, count } = await athletesQuery
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  const { data: teamsData } = await supabase.from('teams').select('id, name').order('name');
  const { data: categoriesData } = await supabase.from('categories').select('name').order('name');
  
  if (error) console.error('Error fetching athletes:', error);

  const solventes = athletes?.filter(a => a.status === 'Solvente').length || 0;
  const morosos = athletes?.filter(a => a.status === 'Moroso').length || 0;

  // ========== ANÁLISIS FINANCIERO ==========
  // 1. Todos los atletas activos (sin paginación) para KPIs
  let allAthletesQuery = supabase
    .from('athletes')
    .select('id, status, paid_until, team_id, teams!inner(category)')
    .in('status', ['Solvente', 'Moroso']);
  if (teamFilter) allAthletesQuery = allAthletesQuery.eq('team_id', teamFilter);
  if (categoryFilter) allAthletesQuery = allAthletesQuery.eq('teams.category', categoryFilter);
  const { data: allAthletes } = await allAthletesQuery;

  // 2. Productos de mensualidad activos
  const { data: mensualidades } = await supabase
    .from('products')
    .select('id, name, price, categories')
    .eq('is_active', true)
    .ilike('name', '%mensualidad%');

  // 3. Productos con abonos activos
  const { data: installmentProducts } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('is_active', true)
    .eq('allows_installments', true);

  // 4. Pagos de productos con abonos (todos los completados/pendientes)
  const { data: installmentPayments } = await supabase
    .from('payments')
    .select('product_id, athlete_id, amount, status')
    .in('status', ['Completado', 'Pendiente']);

  // --- Calcular KPIs de Mensualidad ---
  // Función: dado un atleta con categoría X, buscar el producto mensualidad que aplique
  const getMensualidadPrice = (category: string): number => {
    if (!mensualidades) return 0;
    for (const m of mensualidades) {
      if (!m.categories || m.categories.length === 0) return Number(m.price); // Global
      if (m.categories.includes(category)) return Number(m.price);
    }
    return 0;
  };

  let montoSolvente = 0;
  let montoMorosidad = 0;
  const categoryBreakdown = new Map<string, { solventes: number, morosos: number, price: number, recibido: number, pendiente: number }>();

  const today = new Date();

  allAthletes?.forEach(a => {
    const cat = (a.teams as any)?.category || 'Sin categoría';
    const price = getMensualidadPrice(cat);
    
    if (!categoryBreakdown.has(cat)) {
      categoryBreakdown.set(cat, { solventes: 0, morosos: 0, price, recibido: 0, pendiente: 0 });
    }
    const entry = categoryBreakdown.get(cat)!;

    if (a.status === 'Solvente') {
      montoSolvente += price;
      entry.solventes++;
      entry.recibido += price;
    } else if (a.status === 'Moroso') {
      let monthsOwed = 1;
      if (a.paid_until) {
        const paidDate = new Date(a.paid_until);
        const yearDiff = today.getFullYear() - paidDate.getFullYear();
        const monthDiff = today.getMonth() - paidDate.getMonth();
        const calculatedMonths = (yearDiff * 12) + monthDiff;
        if (calculatedMonths >= 1) {
          monthsOwed = calculatedMonths;
        }
      }

      const totalOwed = price * monthsOwed;
      montoMorosidad += totalOwed;
      entry.morosos++;
      entry.pendiente += totalOwed;
    }
  });

  const ingresoEsperado = montoSolvente + montoMorosidad;
  const categoryRows = Array.from(categoryBreakdown.entries()).map(([cat, data]) => ({
    category: cat, ...data, total: data.solventes + data.morosos, esperado: data.recibido + data.pendiente
  }));

  // --- Calcular Abonos Activos por Producto ---
  const installmentSummary = (installmentProducts || []).map(prod => {
    const payments = installmentPayments?.filter(p => p.product_id === prod.id) || [];
    const athleteIds = new Set(payments.map(p => p.athlete_id));
    const totalFacturado = athleteIds.size * Number(prod.price);
    
    // Solo los pagos Completados suman al ingreso recibido
    const pagosValidados = payments.filter(p => p.status === 'Completado');
    const totalAbonado = pagosValidados.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const saldoPendiente = Math.max(0, totalFacturado - totalAbonado);
    return {
      id: prod.id, name: prod.name, price: Number(prod.price),
      athleteCount: athleteIds.size, totalFacturado, totalAbonado, saldoPendiente
    };
  }).filter(p => p.athleteCount > 0);

  // --- Libro Mayor: Ingresos Totales por Producto (Todos) ---
  const { data: allValidPayments } = await supabase
    .from('payments')
    .select('product_id, amount, products(name)')
    .eq('status', 'Completado');

  const ledgerBreakdown = new Map<string, { name: string, count: number, total: number }>();
  if (allValidPayments) {
    allValidPayments.forEach(pay => {
      const prodName = (pay.products as any)?.name || 'Producto Eliminado / Desconocido';
      const pId = pay.product_id;
      
      if (!ledgerBreakdown.has(pId)) {
        ledgerBreakdown.set(pId, { name: prodName, count: 0, total: 0 });
      }
      
      const entry = ledgerBreakdown.get(pId)!;
      entry.count += 1;
      entry.total += Number(pay.amount);
    });
  }
  
  const ledgerRows = Array.from(ledgerBreakdown.values()).sort((a, b) => b.total - a.total);
  const totalHistoricoValidado = ledgerRows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="p-4 sm:p-8">
      {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Panel de Control</h2>
          <p className="text-gray-500 mt-1">Resumen financiero y estatus de atletas en tiempo real.</p>
        </div>

        {/* KPIs de Atletas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                  <CircleDollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Solventes</dt>
                  <dd className="text-2xl font-bold text-gray-900">{solventes}</dd>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Morosidad Activa</dt>
                  <dd className="text-2xl font-bold text-gray-900">{morosos}</dd>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gray-400"></div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total en Roster</dt>
                  <dd className="text-2xl font-bold text-gray-900">{count || 0}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Financieros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-green-200 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-600"></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Ingreso Recibido</p>
                  <p className="text-3xl font-black text-green-800 mt-1">${montoSolvente.toFixed(2)}</p>
                  <p className="text-[11px] text-green-600 mt-1">{allAthletes?.filter(a => a.status === 'Solvente').length || 0} atletas al día</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CircleDollarSign className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-red-200 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Morosidad Pendiente</p>
                  <p className="text-3xl font-black text-red-800 mt-1">${montoMorosidad.toFixed(2)}</p>
                  <p className="text-[11px] text-red-600 mt-1">{allAthletes?.filter(a => a.status === 'Moroso').length || 0} atletas en mora</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-7 w-7 text-red-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-indigo-200 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Ingreso Esperado</p>
                  <p className="text-3xl font-black text-indigo-800 mt-1">${ingresoEsperado.toFixed(2)}</p>
                  <p className="text-[11px] text-indigo-600 mt-1">Solvente + Morosidad</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <TrendingUp className="h-7 w-7 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desglose por Categoría */}
        {categoryRows.length > 0 && (
          <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">Desglose por Categoría (Mensualidad)</h3>
            </div>
            {/* Móvil */}
            <div className="md:hidden p-4 space-y-3">
              {categoryRows.map(row => (
                <div key={row.category} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">{row.category}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Precio:</span> <span className="font-bold">${row.price.toFixed(2)}</span></div>
                    <div><span className="text-gray-500">Atletas:</span> <span className="font-bold">{row.total}</span></div>
                    <div><span className="text-green-600 font-bold">Recibido: ${row.recibido.toFixed(2)}</span></div>
                    <div><span className="text-red-600 font-bold">Pendiente: ${row.pendiente.toFixed(2)}</span></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Atletas</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Precio</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Solventes</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Morosos</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-green-600 uppercase">Recibido</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-red-600 uppercase">Pendiente</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-indigo-600 uppercase">Esperado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {categoryRows.map(row => (
                    <tr key={row.category} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-bold text-gray-900">{row.category}</td>
                      <td className="px-6 py-3 text-center text-sm text-gray-700">{row.total}</td>
                      <td className="px-6 py-3 text-center text-sm font-bold text-gray-700">${row.price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-center"><span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{row.solventes}</span></td>
                      <td className="px-6 py-3 text-center"><span className="bg-red-50 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{row.morosos}</span></td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-green-700">${row.recibido.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-red-700">${row.pendiente.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-indigo-700">${row.esperado.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Abonos Activos por Producto */}
        {installmentSummary.length > 0 && (
          <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-kasa-dorado" />
                Abonos Activos por Producto
              </h3>
            </div>
            {/* Móvil */}
            <div className="md:hidden p-4 space-y-3">
              {installmentSummary.map(prod => (
                <div key={prod.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">{prod.name}</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${prod.totalFacturado > 0 ? Math.min(100, (prod.totalAbonado / prod.totalFacturado) * 100) : 0}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Atletas:</span> <span className="font-bold">{prod.athleteCount}</span></div>
                    <div><span className="text-gray-500">Facturado:</span> <span className="font-bold">${prod.totalFacturado.toFixed(2)}</span></div>
                    <div><span className="text-green-600 font-bold">Abonado: ${prod.totalAbonado.toFixed(2)}</span></div>
                    <div><span className="text-red-600 font-bold">Resta: ${prod.saldoPendiente.toFixed(2)}</span></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Atletas</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Facturado</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-green-600 uppercase">Total Abonado</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-red-600 uppercase">Saldo Pendiente</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Progreso</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {installmentSummary.map(prod => {
                    const pct = prod.totalFacturado > 0 ? Math.min(100, (prod.totalAbonado / prod.totalFacturado) * 100) : 0;
                    return (
                      <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-bold text-gray-900">{prod.name}</td>
                        <td className="px-6 py-3 text-center text-sm text-gray-700">{prod.athleteCount}</td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-gray-700">${prod.totalFacturado.toFixed(2)}</td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-green-700">${prod.totalAbonado.toFixed(2)}</td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-red-700">${prod.saldoPendiente.toFixed(2)}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-gray-600 w-10 text-right">{pct.toFixed(0)}%</span>
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

        {/* Libro Mayor: Ingresos Totales por Producto */}
        {ledgerRows.length > 0 && (
          <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-green-600" />
                Libro Mayor: Ingresos por Producto (Todos)
              </h3>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                Total Validado: ${totalHistoricoValidado.toFixed(2)}
              </span>
            </div>
            
            {/* Móvil */}
            <div className="md:hidden p-4 space-y-3">
              {ledgerRows.map(row => (
                <div key={row.name} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{row.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{row.count} {row.count === 1 ? 'transacción' : 'transacciones'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-green-700">${row.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto / Concepto</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Transacciones Validadas</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-green-600 uppercase">Ingreso Total ($)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {ledgerRows.map(row => (
                    <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{row.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {row.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-700">${row.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Fila de Totales */}
                  <tr className="bg-green-50/50 border-t-2 border-green-100">
                    <td className="px-6 py-4 font-black text-gray-900 text-right uppercase text-xs" colSpan={2}>
                      Total Histórico Validado
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-black text-green-800">
                      ${totalHistoricoValidado.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estatus de Atletas */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden mt-2">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800">Estatus de Atletas</h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {count || 0} Resultados
            </span>
          </div>

          <div className="p-4 bg-gray-50/50 border-b border-gray-100">
             <DashboardFilters 
                teams={teamsData || []} 
                categories={categoriesData || []} 
             />
          </div>

          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="md:hidden flex flex-col p-3 gap-3 bg-gray-50/30">
            {athletes && athletes.length > 0 ? (
              athletes.map((athlete) => (
                <div key={athlete.id} className={`bg-white p-3.5 rounded-lg shadow-sm border-l-4 ${athlete.status === 'Solvente' ? 'border-green-500' : athlete.status === 'Moroso' ? 'border-red-500' : 'border-gray-400'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base leading-tight">{athlete.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{athlete.cedula}</p>
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {/* @ts-ignore */}
                          {athlete.teams?.name || 'Sin equipo'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 inline-flex text-[10px] uppercase font-bold rounded-full border
                      ${athlete.status === 'Solvente' ? 'bg-green-50 text-green-700 border-green-200' : 
                        athlete.status === 'Moroso' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {athlete.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 bg-white rounded-xl border border-gray-100">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Sin Atletas</p>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (Tabla Ampliada) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Atleta</th>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Cédula</th>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Equipo</th>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Estatus</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {athletes && athletes.length > 0 ? (
                  athletes.map((athlete) => (
                    <tr key={athlete.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-base font-bold text-gray-900">{athlete.name}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-medium">{athlete.cedula}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {/* @ts-ignore */}
                          {athlete.teams?.name ? <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800">{athlete.teams.name}</span> : 'Sin equipo'}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`px-4 py-1.5 inline-flex text-sm font-bold rounded-full border shadow-sm
                          ${athlete.status === 'Solvente' ? 'bg-green-50 text-green-700 border-green-200' : 
                            athlete.status === 'Moroso' ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {athlete.status === 'Solvente' && <span className="w-2 h-2 rounded-full bg-green-500 mr-2 self-center"></span>}
                          {athlete.status === 'Moroso' && <span className="w-2 h-2 rounded-full bg-red-500 mr-2 self-center"></span>}
                          {athlete.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center">
                      <Users className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">No hay resultados</h3>
                      <p className="mt-1 text-base text-gray-500">
                        Intenta ajustar los filtros de búsqueda.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            searchParams={resolvedParams as Record<string, string>} 
          />
        )}
    </div>
  );
}
