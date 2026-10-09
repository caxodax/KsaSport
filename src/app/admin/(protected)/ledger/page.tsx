import { getServiceSupabase } from '@/lib/supabase';
import { CircleDollarSign, TrendingUp, CreditCard, ShoppingCart, BarChart3, Receipt, ChevronUp, Users, Calendar, Euro } from 'lucide-react';
import DateRangeFilter from '../DateRangeFilter';
import { parseDateRange } from '@/lib/dateRange';
import ExportLedgerButton from './ExportLedgerButton';
import InstallmentTrackingTable from './InstallmentTrackingTable';
import type { LedgerExportData } from '@/lib/exportExcel';
import { findParentProduct, getEffectiveOptInProductId } from '@/lib/productHierarchy';

export const revalidate = 0;

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const { startDate, endDate, formattedRange } = parseDateRange(resolvedParams);
  const supabase = getServiceSupabase();

  // Fetch ALL completed payments in the date range
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id, amount, method, reference_number, rate_type, exchange_rate, usdt_promedio, transferred_amount, payment_currency, date_rate, created_at, products(name), athletes(name, cedula)')
    .eq('status', 'Completado')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (paymentsError) {
    console.error('Error fetching completed payments for ledger:', paymentsError);
  }

  // Fetch all active installment products (to show debt)
  const { data: installmentProducts } = await supabase
    .from('products')
    .select('id, name, price, rate_type, requires_opt_in, description')
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
    .select('product_id, athlete_id, athletes(name)');

  // Fetch all exemptions to remove from expected revenue
  const { data: allExemptions } = await supabase
    .from('athlete_exemptions')
    .select('product_id, athlete_id');

  // --- Metrics Calculation ---
  let totalRevenue = 0;
  let usdRevenue = 0;
  let eurRevenue = 0;
  const methodMap = new Map<string, { count: number, total: number, rateType?: string }>();
  const productMap = new Map<string, { count: number, total: number, rateType?: string }>();
  let highestTicket = 0;
  let lowestTicket = Infinity;

  if (payments && payments.length > 0) {
    payments.forEach(pay => {
      const amount = Number(pay.amount);
      totalRevenue += amount;
      if (pay.rate_type === 'EUR') {
        eurRevenue += amount;
      } else {
        usdRevenue += amount;
      }
      
      if (amount > highestTicket) highestTicket = amount;
      if (amount < lowestTicket) lowestTicket = amount;

      // Method Breakdown
      const method = pay.method || 'No Especificado';
      if (!methodMap.has(method)) methodMap.set(method, { count: 0, total: 0, rateType: pay.rate_type });
      const mEntry = methodMap.get(method)!;
      mEntry.count += 1;
      mEntry.total += amount;

      // Product Breakdown
      const prodName = (pay.products as any)?.name || 'Producto Eliminado / Desconocido';
      if (!productMap.has(prodName)) productMap.set(prodName, { count: 0, total: 0, rateType: pay.rate_type });
      const pEntry = productMap.get(prodName)!;
      pEntry.count += 1;
      pEntry.total += amount;
    });
  } else {
    lowestTicket = 0;
  }

  const formatRevenueStr = () => {
    const parts: string[] = [];
    if (eurRevenue > 0) parts.push(`€${eurRevenue.toFixed(2)} EUR`);
    if (usdRevenue > 0) parts.push(`$${usdRevenue.toFixed(2)} USD`);
    if (parts.length === 0) return '€0.00 EUR';
    return parts.join(' + ');
  };

  const transactionCount = payments?.length || 0;
  const averageTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;
  const ticketSymbol = eurRevenue > 0 && usdRevenue === 0 ? '€' : '$';

  // Sorting
  const sortedMethods = Array.from(methodMap.entries()).sort((a, b) => b[1].total - a[1].total);
  const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1].total - a[1].total);
  
  // --- Calcular Abonos Activos por Producto ---
  const installmentSummary = (installmentProducts || []).map(prod => {
    const pmt = installmentPayments?.filter(p => p.product_id === prod.id) || [];
    let expectedAthleteCount = 0;
    const exemptionsForProduct = new Set(allExemptions?.filter(e => e.product_id === prod.id).map(e => e.athlete_id) || []);
    let enrolledAthletes: string[] = [];

    const effOptInId = getEffectiveOptInProductId(prod, installmentProducts || []);

    if (effOptInId) {
      // Para torneos o productos derivados, la deuda esperada se basa SOLO en los inscritos explícitamente en el torneo
      const optIns = allOptIns?.filter(o => o.product_id === effOptInId) || [];
      // Excluir a los exonerados (del producto o del padre)
      const validOptIns = optIns.filter(o => !exemptionsForProduct.has(o.athlete_id));
      expectedAthleteCount = validOptIns.length;
      enrolledAthletes = validOptIns.map(o => (o.athletes as any)?.name).filter(Boolean);
    } else {
      // Para mensualidades (sin opt-in explícito), se asume que todos los que han pagado algo son los esperados
      // Excluyendo a los exonerados
      const athleteIds = new Set(pmt.map(p => p.athlete_id));
      exemptionsForProduct.forEach(id => athleteIds.delete(id));
      expectedAthleteCount = athleteIds.size;
    }

    const totalFacturado = expectedAthleteCount * Number(prod.price);
    
    // Solo los pagos Completados suman al ingreso recibido
    const pagosValidados = pmt.filter(p => p.status === 'Completado');
    const totalAbonado = pagosValidados.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const saldoPendiente = Math.max(0, totalFacturado - totalAbonado);
    const rateType = prod.rate_type || 'USD';
    const currencySymbol = rateType === 'EUR' ? '€' : '$';

    return {
      id: prod.id, name: prod.name, price: Number(prod.price),
      rateType,
      currencySymbol,
      enrolledAthletes,
      athleteCount: expectedAthleteCount, totalFacturado, totalAbonado, saldoPendiente
    };
  });

  // Preparar payload para exportación a Excel
  const exportPayload: LedgerExportData = {
    dateRangeStr: formattedRange,
    totalRevenue,
    transactionCount,
    averageTicket,
    productsSold: sortedProducts.length,
    methods: sortedMethods.map(([method, data]) => ({
      name: method,
      count: data.count,
      total: data.total,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
    })),
    products: sortedProducts.map(([prodName, data]) => ({
      name: prodName,
      count: data.count,
      total: data.total,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
    })),
    installments: installmentSummary.map(inst => ({
      name: inst.name,
      athleteCount: inst.athleteCount,
      totalFacturado: inst.totalFacturado,
      totalAbonado: inst.totalAbonado,
      saldoPendiente: inst.saldoPendiente,
      percent: inst.totalFacturado > 0 ? Math.min(100, (inst.totalAbonado / inst.totalFacturado) * 100) : 0,
    })),
    transactions: (payments || []).map(p => {
      const athleteObj = Array.isArray(p.athletes) ? p.athletes[0] : p.athletes;
      const prodObj = Array.isArray(p.products) ? p.products[0] : p.products;
      return {
        id: p.id,
        date: p.created_at,
        athleteName: athleteObj?.name || 'Público General',
        athleteCedula: athleteObj?.cedula || '',
        productName: prodObj?.name || 'Sin Concepto',
        method: p.method || 'No especificado',
        reference: p.reference_number || '',
        amount: Number(p.amount) || 0,
        rateType: p.rate_type || 'USD',
        exchangeRate: p.exchange_rate ? Number(p.exchange_rate) : undefined,
        usdtPromedio: p.usdt_promedio ? Number(p.usdt_promedio) : undefined,
        transferredAmount: p.transferred_amount ? Number(p.transferred_amount) : undefined,
        paymentCurrency: p.payment_currency || 'USD',
        dateRate: p.date_rate || undefined
      };
    }),
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 bg-slate-50/60 min-h-screen space-y-5">
      {/* 1. Encabezado Analítico y Filtro Rápido */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
              Reportes Financieros (Libro Mayor)
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">Período:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-bold">
                <Calendar className="w-3 h-3 text-slate-500" />
                {formattedRange}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <DateRangeFilter />
          <ExportLedgerButton data={exportPayload} />
        </div>
      </div>

      {/* 2. Tarjetas KPI Equilibradas (Grid 2x2 en móvil, 4 en desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Ingreso Total */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Ingreso Total</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-emerald-950 font-mono tracking-tight">
              {formatRevenueStr()}
            </h3>
            <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Validado en sistema</p>
          </div>
        </div>

        {/* KPI 2: Transacciones */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Transacciones</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-mono tracking-tight">
              {transactionCount}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Pagos completados</p>
          </div>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ticket Promedio</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-mono tracking-tight">
              {ticketSymbol}{averageTicket.toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Monto medio por pago</p>
          </div>
        </div>

        {/* KPI 4: Conceptos Vendidos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Conceptos</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-mono tracking-tight">
              {sortedProducts.length}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Productos con cobro</p>
          </div>
        </div>
      </div>

      {/* 3. Desglose de Métodos y Libro Mayor por Producto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Métodos de Pago */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-4 sm:p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>Ingresos por Método</span>
            </h3>
            <div className="space-y-3">
              {sortedMethods.map(([method, data]) => {
                const percentage = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 truncate pr-2">{method}</span>
                      <span className="font-mono font-black text-gray-900 shrink-0">
                        {data.rateType === 'EUR' ? '€' : '$'}{data.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-700" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono w-10 text-right shrink-0">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {sortedMethods.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  Sin transacciones en este período.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Libro Mayor por Producto */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              <span>Desglose por Concepto / Producto</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-4 sm:px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-4 py-3 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider">Transacciones</th>
                  <th className="px-4 sm:px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">Ingreso</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {sortedProducts.map(([product, data]) => (
                  <tr key={product} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 sm:px-5 py-3 text-xs font-bold text-gray-900">
                      {product}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                        {data.count}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      <span className="font-mono font-black text-emerald-700 text-xs sm:text-sm">
                        {data.rateType === 'EUR' ? '€' : '$'}{data.total.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                {sortedProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400">
                      No se registraron ventas en el período seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Seguimiento de Abonos y Deudas */}
      {installmentSummary.length > 0 && (
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Seguimiento de Abonos y Cobranzas</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de cuotas y saldos pendientes por categoría o liga deportiva.
              </p>
            </div>
          </div>
          
          <InstallmentTrackingTable items={installmentSummary} />
        </div>
      )}

    </div>
  );
}
