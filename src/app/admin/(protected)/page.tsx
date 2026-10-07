import { getServiceSupabase } from '@/lib/supabase';
import { 
  Users, AlertCircle, CircleDollarSign, TrendingUp, 
  Calendar, Tag, Layers, CheckCircle2, Clock, X
} from 'lucide-react';
import Link from 'next/link';
import DashboardFilters from './DashboardFilters';
import Pagination from './Pagination';
import DateRangeFilter from './DateRangeFilter';
import { parseDateRange } from '@/lib/dateRange';
import { cleanCedula, formatCedula } from '@/lib/cedula';
import { ProductFilterItem } from './MultiSelectProductFilter';

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

  // Filtros de Productos
  const productsParam = typeof resolvedParams.products === 'string' ? resolvedParams.products : '';
  const selectedProductIds = productsParam ? productsParam.split(',').filter(Boolean) : [];
  const paymentStatusFilter = typeof resolvedParams.payment_status === 'string' ? resolvedParams.payment_status : '';
  const isProductMode = selectedProductIds.length > 0;
  
  const page = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1;
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { startDate, endDate, formattedRange } = parseDateRange(resolvedParams);

  const paginationParams: Record<string, string> = {};
  Object.entries(resolvedParams).forEach(([k, v]) => {
    if (typeof v === 'string') paginationParams[k] = v;
  });

  // Catálogos para los selectores
  const { data: teamsData } = await supabase.from('teams').select('id, name').order('name');
  const { data: categoriesData } = await supabase.from('categories').select('*').order('name');
  const { data: allProductsData } = await supabase
    .from('products')
    .select('id, name, price, categories')
    .eq('is_active', true)
    .order('name');

  // Obtenemos los productos seleccionados si está en modo producto
  const selectedProducts = isProductMode
    ? (allProductsData || []).filter((p) => selectedProductIds.includes(p.id))
    : [];

  // ========== UNIVERSO COMPLETO DE ATLETAS ACTIVAS PARA ANÁLISIS ==========
  const allAthletesSelect = categoryFilter
    ? 'id, name, cedula, status, paid_until, team_id, has_alliance, teams!inner(id, name, category)'
    : 'id, name, cedula, status, paid_until, team_id, has_alliance, teams(id, name, category)';

  let allAthletesQuery = supabase
    .from('athletes')
    .select(allAthletesSelect)
    .in('status', ['Solvente', 'Moroso']);

  if (teamFilter) allAthletesQuery = allAthletesQuery.eq('team_id', teamFilter);
  if (categoryFilter) allAthletesQuery = allAthletesQuery.eq('teams.category', categoryFilter);
  const { data: allAthletes } = await allAthletesQuery;

  // ========== VARIABLES DE KPIS ==========
  let montoSolvente = 0;
  let montoMorosidad = 0;
  let totalSolventesMes = 0;
  let totalMorososMes = 0;
  let totalPendingReview = 0;
  let totalPoblacion = (allAthletes || []).length;

  // Mapas para asociar el estatus de producto a cada atleta
  const athleteProductMap = new Map<
    string,
    { status: 'paid' | 'unpaid' | 'pending'; paidAmount: number; targetAmount: number }
  >();

  const paidAthleteIds: string[] = [];
  const unpaidAthleteIds: string[] = [];
  const pendingAthleteIds: string[] = [];

  // Desglose para la tabla secundaria
  interface BreakdownRow {
    title: string;
    subtitle?: string;
    price: number;
    total: number;
    solventes: number;
    morosos: number;
    recibido: number;
    pendiente: number;
    esperado: number;
  }
  let breakdownRows: BreakdownRow[] = [];

  if (isProductMode) {
    // =========================================================================
    // MODO PRODUCTOS ESPECÍFICOS / SEMANALES (EXECUTIVE PRODUCT ANALYTICS)
    // =========================================================================

    // 1. Consultar todos los pagos para los productos seleccionados en el rango de fechas
    const { data: productPayments } = await supabase
      .from('payments')
      .select('id, athlete_id, product_id, amount, status, created_at, reference_number')
      .in('product_id', selectedProductIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // 2. Analizar cada atleta
    const productStatsMap = new Map<
      string,
      { name: string; category: string; price: number; solventes: number; morosos: number; recibido: number; pendiente: number }
    >();

    selectedProducts.forEach((p) => {
      productStatsMap.set(p.id, {
        name: p.name,
        category: p.categories && p.categories.length > 0 ? p.categories.join(', ') : 'Global',
        price: Number(p.price),
        solventes: 0,
        morosos: 0,
        recibido: 0,
        pendiente: 0,
      });
    });

    (allAthletes || []).forEach((athlete) => {
      const athleteCat = (athlete.teams as any)?.category || 'Sin categoría';

      // Productos seleccionados que aplican a la categoría de esta atleta
      const applicableProducts = selectedProducts.filter((p) => {
        if (!p.categories || p.categories.length === 0 || p.categories.includes('Global')) return true;
        return p.categories.includes(athleteCat);
      });

      // Si ningún producto seleccionado aplica a su categoría, no se le exige
      if (applicableProducts.length === 0) return;

      const targetPrice = applicableProducts.reduce((sum, p) => sum + Number(p.price), 0);

      // Pagos de esta atleta para los productos aplicables
      const athleteCompletedPayments = (productPayments || []).filter(
        (pay) => pay.athlete_id === athlete.id && pay.status === 'Completado' && applicableProducts.some((p) => p.id === pay.product_id)
      );

      const athletePendingPayments = (productPayments || []).filter(
        (pay) => pay.athlete_id === athlete.id && pay.status === 'Pendiente' && applicableProducts.some((p) => p.id === pay.product_id)
      );

      if (athleteCompletedPayments.length > 0) {
        // Ha pagado
        const paidTotal = athleteCompletedPayments.reduce((sum, pay) => sum + Number(pay.amount), 0);
        montoSolvente += paidTotal;
        totalSolventesMes++;
        paidAthleteIds.push(athlete.id);

        athleteProductMap.set(athlete.id, {
          status: 'paid',
          paidAmount: paidTotal,
          targetAmount: targetPrice,
        });

        // Sumar al desglose de productos
        athleteCompletedPayments.forEach((pay) => {
          const pStat = productStatsMap.get(pay.product_id);
          if (pStat) {
            pStat.solventes++;
            pStat.recibido += Number(pay.amount);
          }
        });
      } else if (athletePendingPayments.length > 0) {
        // Tiene pago en revisión
        totalPendingReview++;
        pendingAthleteIds.push(athlete.id);

        athleteProductMap.set(athlete.id, {
          status: 'pending',
          paidAmount: 0,
          targetAmount: targetPrice,
        });
      } else {
        // Debe el producto (Morosa del producto)
        montoMorosidad += targetPrice;
        totalMorososMes++;
        unpaidAthleteIds.push(athlete.id);

        athleteProductMap.set(athlete.id, {
          status: 'unpaid',
          paidAmount: 0,
          targetAmount: targetPrice,
        });

        // Sumar a pendientes por producto
        applicableProducts.forEach((p) => {
          const pStat = productStatsMap.get(p.id);
          if (pStat) {
            pStat.morosos++;
            pStat.pendiente += Number(p.price);
          }
        });
      }
    });

    totalPoblacion = paidAthleteIds.length + unpaidAthleteIds.length + pendingAthleteIds.length;

    breakdownRows = Array.from(productStatsMap.values()).map((p) => ({
      title: p.name,
      subtitle: p.category,
      price: p.price,
      total: p.solventes + p.morosos,
      solventes: p.solventes,
      morosos: p.morosos,
      recibido: p.recibido,
      pendiente: p.pendiente,
      esperado: p.recibido + p.pendiente,
    }));

  } else {
    // =========================================================================
    // MODO GENERAL / MENSUALIDAD (COMPORTAMIENTO POR DEFECTO)
    // =========================================================================

    const { data: mensualidades } = await supabase
      .from('products')
      .select('id, name, price, categories, start_date, end_date')
      .ilike('name', '%mensualidad%')
      .or(`and(start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()}),start_date.is.null`);

    const { data: allExemptions } = await supabase
      .from('athlete_exemptions')
      .select('athlete_id, product_id');

    const { data: settings } = await supabase
      .from('club_settings')
      .select('grace_period_days, penalty_amount')
      .single();

    const gracePeriodDays = settings?.grace_period_days ?? 5;
    const penaltyAmount = settings?.penalty_amount ?? 5.00;

    const categoryPenaltyMap = new Map<string, { grace_period_days: number; penalty_amount: number }>();
    categoriesData?.forEach((c) => {
      if (c.name) {
        categoryPenaltyMap.set(c.name.trim(), {
          grace_period_days: c.grace_period_days !== null && c.grace_period_days !== undefined ? Number(c.grace_period_days) : gracePeriodDays,
          penalty_amount: c.penalty_amount !== null && c.penalty_amount !== undefined ? Number(c.penalty_amount) : penaltyAmount,
        });
      }
    });

    const getMensualidadProduct = (cat: string) => {
      if (!mensualidades) return null;
      for (const m of mensualidades) {
        if (!m.categories || m.categories.length === 0) return m;
        if (m.categories.includes(cat)) return m;
      }
      return null;
    };

    const categoryBreakdown = new Map<
      string,
      { solventes: number; morosos: number; price: number; recibido: number; pendiente: number }
    >();

    const today = new Date();

    (allAthletes || []).forEach((a) => {
      const cat = (a.teams as any)?.category || 'Sin categoría';
      const product = getMensualidadProduct(cat);
      const price = product ? Number(product.price) : 0;

      if (!categoryBreakdown.has(cat)) {
        categoryBreakdown.set(cat, { solventes: 0, morosos: 0, price, recibido: 0, pendiente: 0 });
      }
      const entry = categoryBreakdown.get(cat)!;

      const isExempt = product && allExemptions?.some((e) => e.athlete_id === a.id && e.product_id === product.id);
      if (isExempt) return;

      let paidForPeriod = false;
      if (a.paid_until) {
        const paidDate = new Date(a.paid_until);
        if (
          paidDate >= startDate ||
          paidDate.getFullYear() > startDate.getFullYear() ||
          (paidDate.getFullYear() === startDate.getFullYear() && paidDate.getMonth() >= startDate.getMonth())
        ) {
          paidForPeriod = true;
        }
      } else if (a.status === 'Solvente') {
        if (
          today >= startDate ||
          today.getFullYear() > startDate.getFullYear() ||
          (today.getFullYear() === startDate.getFullYear() && today.getMonth() >= startDate.getMonth())
        ) {
          paidForPeriod = true;
        }
      }

      if (paidForPeriod) {
        montoSolvente += price;
        entry.solventes++;
        entry.recibido += price;
        totalSolventesMes++;
      } else {
        let appliedPenalty = 0;
        const catRules = categoryPenaltyMap.get(cat.trim());
        const catGrace = catRules?.grace_period_days ?? gracePeriodDays;
        const catPenalty = catRules?.penalty_amount ?? penaltyAmount;
        const targetDeadline = new Date(startDate.getFullYear(), startDate.getMonth(), catGrace, 23, 59, 59, 999);

        if (today > targetDeadline) {
          appliedPenalty = catPenalty;
        }

        const totalOwedForMonth = price + appliedPenalty;
        montoMorosidad += totalOwedForMonth;
        entry.morosos++;
        entry.pendiente += totalOwedForMonth;
        totalMorososMes++;
      }
    });

    breakdownRows = Array.from(categoryBreakdown.entries()).map(([cat, data]) => ({
      title: cat,
      price: data.price,
      total: data.solventes + data.morosos,
      solventes: data.solventes,
      morosos: data.morosos,
      recibido: data.recibido,
      pendiente: data.pendiente,
      esperado: data.recibido + data.pendiente,
    }));
  }

  const ingresoEsperado = montoSolvente + montoMorosidad;
  const porcentajeCobranza = ingresoEsperado > 0 ? Math.round((montoSolvente / ingresoEsperado) * 100) : 0;

  // =========================================================================
  // CONSULTA PAGINADA DE ATLETAS PARA LA TABLA
  // =========================================================================
  const athletesSelect = categoryFilter
    ? 'id, name, cedula, status, team_id, teams!inner(id, name, category)'
    : 'id, name, cedula, status, team_id, teams(id, name, category)';

  let athletesQuery = supabase
    .from('athletes')
    .select(athletesSelect, { count: 'exact' });

  // Filtros de texto y equipo
  if (query) {
    const cleanQ = cleanCedula(query);
    if (cleanQ && cleanQ !== query) {
      athletesQuery = athletesQuery.or(`name.ilike.%${query}%,cedula.ilike.%${cleanQ}%,cedula.ilike.%${query}%`);
    } else {
      athletesQuery = athletesQuery.or(`name.ilike.%${query}%,cedula.ilike.%${query}%`);
    }
  }
  if (teamFilter) {
    athletesQuery = athletesQuery.eq('team_id', teamFilter);
  }
  if (categoryFilter) {
    athletesQuery = athletesQuery.eq('teams.category', categoryFilter);
  }

  // Filtrado de IDs según el modo de producto
  if (isProductMode) {
    if (paymentStatusFilter === 'paid') {
      athletesQuery = athletesQuery.in('id', paidAthleteIds.length > 0 ? paidAthleteIds : ['00000000-0000-0000-0000-000000000000']);
    } else if (paymentStatusFilter === 'unpaid') {
      athletesQuery = athletesQuery.in('id', unpaidAthleteIds.length > 0 ? unpaidAthleteIds : ['00000000-0000-0000-0000-000000000000']);
    } else if (paymentStatusFilter === 'pending') {
      athletesQuery = athletesQuery.in('id', pendingAthleteIds.length > 0 ? pendingAthleteIds : ['00000000-0000-0000-0000-000000000000']);
    } else {
      // Todos los evaluados en este producto
      const allProductAthleteIds = [...paidAthleteIds, ...unpaidAthleteIds, ...pendingAthleteIds];
      athletesQuery = athletesQuery.in('id', allProductAthleteIds.length > 0 ? allProductAthleteIds : ['00000000-0000-0000-0000-000000000000']);
    }
  } else {
    if (statusFilter) {
      athletesQuery = athletesQuery.eq('status', statusFilter);
    }
  }

  const { data: athletes, error, count } = await athletesQuery
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 0;
  if (error) console.error('Error fetching athletes:', error);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full min-w-0">
      
      {/* Title & Date Range */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-wide text-gray-900">
              Panel de Control
            </h1>
            {isProductMode && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
                Auditoría por Producto
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm">
              {isProductMode 
                ? 'Control en vivo de cobro y atletas para los productos seleccionados.' 
                : 'Resumen financiero y estatus de atletas en tiempo real.'}
            </p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-vinotinto-light/20 text-kasa-vinotinto border border-vinotinto-light/30 rounded-full text-xs font-bold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-kasa-vinotinto" />
              {formattedRange}
            </span>
          </div>
        </div>
        <div className="w-full lg:w-auto">
          <DateRangeFilter />
        </div>
      </div>

      {/* Banner de Contexto cuando hay filtro de productos activo */}
      {isProductMode && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-400/30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <Tag className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Auditoría de Productos: {selectedProducts.map((p) => p.name).join(', ')}
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {totalSolventesMes} atletas pagaron • {totalMorososMes} atletas faltan por pagar • {porcentajeCobranza}% de efectividad de cobranza
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              ${montoSolvente.toFixed(2)} de ${ingresoEsperado.toFixed(2)} Recaudado
            </span>
            <Link
              href="/admin"
              className="px-2.5 py-1 text-xs font-bold bg-white text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              title="Restablecer vista a mensualidad general"
            >
              <X className="w-3 h-3" /> Quitar filtro
            </Link>
          </div>
        </div>
      )}

      {/* KPIs de Atletas (Big number / Small label) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        
        {/* KPI 1: Solventes / Pagaron */}
        <div className="bg-white overflow-hidden shadow-xs hover:shadow-md transition-all rounded-2xl border border-gray-100 relative p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl"></div>
          <div className="flex items-start justify-between">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {isProductMode ? 'Pagaron el Producto' : 'Solventes'}
              </dt>
              <dd className="text-4xl sm:text-5xl font-display tracking-wide text-gray-900 mt-1">
                {totalSolventesMes}
              </dd>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-2">
                {isProductMode ? 'Habilitadas para el juego' : 'Al día con su cuota'}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <CircleDollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* KPI 2: Morosidad / Faltan por Pagar */}
        <div className="bg-white overflow-hidden shadow-xs hover:shadow-md transition-all rounded-2xl border border-gray-100 relative p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 rounded-l-2xl"></div>
          <div className="flex items-start justify-between">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {isProductMode ? 'Faltan por Pagar' : 'Morosidad Activa'}
              </dt>
              <dd className="text-4xl sm:text-5xl font-display tracking-wide text-gray-900 mt-1">
                {totalMorososMes}
              </dd>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md inline-block mt-2">
                {isProductMode ? 'Deuda de la jornada' : 'Cuotas pendientes'}
              </span>
            </div>
            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* KPI 3: Total Población Roster */}
        <div className="bg-white overflow-hidden shadow-xs hover:shadow-md transition-all rounded-2xl border border-gray-100 relative p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400 rounded-l-2xl"></div>
          <div className="flex items-start justify-between">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {isProductMode ? 'Roster Evaluado' : 'Total en Roster'}
              </dt>
              <dd className="text-4xl sm:text-5xl font-display tracking-wide text-gray-900 mt-1">
                {totalPoblacion}
              </dd>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-2">
                {isProductMode ? 'Atletas de la categoría' : 'Atletas registrados'}
              </span>
            </div>
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Financieros (Big number / Small label) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        
        {/* Recaudado */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-white overflow-hidden shadow-xs hover:shadow-md transition-all rounded-2xl border border-emerald-200/80 relative p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 rounded-l-2xl"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">Ingreso Recibido</p>
              <p className="text-4xl sm:text-5xl font-display tracking-wide text-emerald-900 mt-1">
                ${montoSolvente.toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-emerald-700 mt-1.5">
                {totalSolventesMes} {isProductMode ? 'pagaron el producto' : 'atletas solventes'}
              </p>
            </div>
            <div className="p-3 bg-emerald-100/80 rounded-2xl text-emerald-700">
              <CircleDollarSign className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Por Cobrar */}
        <div className="bg-gradient-to-br from-red-50/70 to-white overflow-hidden shadow-xs hover:shadow-md transition-all rounded-2xl border border-red-200/80 relative p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 rounded-l-2xl"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-red-700 uppercase tracking-widest">
                {isProductMode ? 'Monto por Cobrar' : 'Morosidad Pendiente'}
              </p>
              <p className="text-4xl sm:text-5xl font-display tracking-wide text-red-900 mt-1">
                ${montoMorosidad.toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-red-700 mt-1.5">
                {totalMorososMes} {isProductMode ? 'faltan por pagar' : 'atletas en mora'}
              </p>
            </div>
            <div className="p-3 bg-red-100/80 rounded-2xl text-red-700">
              <AlertCircle className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Ingreso Esperado */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-white overflow-hidden shadow-xs hover:shadow-md transition-all rounded-2xl border border-indigo-200/80 relative p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 rounded-l-2xl"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">Ingreso Esperado</p>
              <p className="text-4xl sm:text-5xl font-display tracking-wide text-indigo-900 mt-1">
                ${ingresoEsperado.toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-indigo-700 mt-1.5">
                {porcentajeCobranza}% de cobro efectivo
              </p>
            </div>
            <div className="p-3 bg-indigo-100/80 rounded-2xl text-indigo-700">
              <TrendingUp className="h-7 w-7" />
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de Cobranza (Por Producto o por Categoría) */}
      {breakdownRows.length > 0 && (
        <div className="bg-white shadow-xs border border-gray-100 rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-kasa-vinotinto" />
              <span>
                {isProductMode ? 'Desglose por Producto Semanal' : 'Desglose por Categoría (Mensualidad)'}
              </span>
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {breakdownRows.length} {isProductMode ? 'Productos' : 'Categorías'}
            </span>
          </div>

          {/* Móvil */}
          <div className="md:hidden p-4 space-y-3">
            {breakdownRows.map((row) => (
              <div key={row.title} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{row.title}</h4>
                  {row.subtitle && (
                    <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded">
                      {row.subtitle}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Precio:</span> <span className="font-bold text-gray-900">${row.price.toFixed(2)}</span></div>
                  <div><span className="text-gray-500">Atletas:</span> <span className="font-bold text-gray-900">{row.total}</span></div>
                  <div><span className="text-emerald-700 font-bold">Recibido: ${row.recibido.toFixed(2)}</span></div>
                  <div><span className="text-red-700 font-bold">Pendiente: ${row.pendiente.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {isProductMode ? 'Producto' : 'Categoría'}
                  </th>
                  {isProductMode && (
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                  )}
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Atletas</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider">Solventes</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-red-700 uppercase tracking-wider">Morosos</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider">Recibido</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-red-700 uppercase tracking-wider">Pendiente</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">Esperado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {breakdownRows.map((row) => (
                  <tr key={row.title} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-bold text-gray-900 text-sm">{row.title}</td>
                    {isProductMode && (
                      <td className="px-6 py-3 text-xs text-gray-600 font-medium">{row.subtitle || 'Global'}</td>
                    )}
                    <td className="px-6 py-3 text-center text-sm text-gray-700">{row.total}</td>
                    <td className="px-6 py-3 text-center text-sm font-bold text-gray-900">${row.price.toFixed(2)}</td>
                    <td className="px-6 py-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {row.solventes}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                        {row.morosos}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-emerald-700">${row.recibido.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-red-700">${row.pendiente.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-indigo-700">${row.esperado.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sección Principal de Atletas y Nómina de Cobranza */}
      <div className="bg-white shadow-xs border border-gray-100 rounded-2xl overflow-hidden mt-4">
        
        {/* Header de la Tabla */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isProductMode ? 'Nómina de Cobranza por Producto' : 'Estatus de Atletas'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isProductMode 
                ? 'Lista individual de jugadoras con su estatus de pago para los productos seleccionados.' 
                : 'Población activa de deportistas registrados en el club.'}
            </p>
          </div>
          <span className="bg-white border border-gray-200 text-gray-800 px-4 py-1.5 rounded-full text-xs font-black shadow-2xs">
            {count || 0} Resultados
          </span>
        </div>

        {/* Barra de Filtros */}
        <div className="p-4 bg-gray-50/40 border-b border-gray-100">
          <DashboardFilters 
            teams={teamsData || []} 
            categories={categoriesData || []} 
            products={(allProductsData as ProductFilterItem[]) || []}
          />
        </div>

        {/* VISTA MÓVIL (Tarjetas Táctiles) */}
        <div className="md:hidden flex flex-col p-3 gap-3 bg-gray-50/30">
          {athletes && athletes.length > 0 ? (
            athletes.map((athlete) => {
              const productInfo = isProductMode ? athleteProductMap.get(athlete.id) : null;
              const athleteTeam = (Array.isArray(athlete.teams) ? athlete.teams[0] : athlete.teams) as { name?: string; category?: string } | null;

              return (
                <div 
                  key={athlete.id} 
                  className={`bg-white p-4 rounded-xl shadow-xs border-l-4 ${
                    isProductMode
                      ? productInfo?.status === 'paid'
                        ? 'border-emerald-500'
                        : productInfo?.status === 'pending'
                        ? 'border-amber-500'
                        : 'border-red-500'
                      : athlete.status === 'Solvente'
                      ? 'border-emerald-500'
                      : athlete.status === 'Moroso'
                      ? 'border-red-500'
                      : 'border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base leading-tight">
                        {athlete.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500 font-medium">
                          C.I. {formatCedula(athlete.cedula)}
                        </p>
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {athleteTeam?.name || 'Sin equipo'}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Estatus Contextual */}
                    {isProductMode ? (
                      <span className={`px-2.5 py-1 inline-flex text-[11px] font-black rounded-full border shadow-2xs ${
                        productInfo?.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : productInfo?.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {productInfo?.status === 'paid' && `✅ Pagó ($${productInfo.paidAmount.toFixed(2)})`}
                        {productInfo?.status === 'pending' && '⏳ En Revisión'}
                        {productInfo?.status === 'unpaid' && `❌ Debe ($${productInfo.targetAmount.toFixed(2)})`}
                        {!productInfo && 'Sin Datos'}
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 inline-flex text-[10px] uppercase font-bold rounded-full border ${
                        athlete.status === 'Solvente'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : athlete.status === 'Moroso'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {athlete.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-8 bg-white rounded-xl border border-gray-100">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No se encontraron atletas para los filtros seleccionados.</p>
            </div>
          )}
        </div>

        {/* VISTA DESKTOP (Tabla Completa de Nómina) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Atleta
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Equipo / Categoría
                </th>
                {isProductMode ? (
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Estatus del Producto ({selectedProducts.length})
                  </th>
                ) : (
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Estatus General
                  </th>
                )}
                {isProductMode && (
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Estatus General
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {athletes && athletes.length > 0 ? (
                athletes.map((athlete) => {
                  const productInfo = isProductMode ? athleteProductMap.get(athlete.id) : null;
                  const athleteTeam = (Array.isArray(athlete.teams) ? athlete.teams[0] : athlete.teams) as { name?: string; category?: string } | null;

                  return (
                    <tr key={athlete.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{athlete.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 font-mono font-bold">
                          {formatCedula(athlete.cedula)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          {athleteTeam?.name ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              <span className="font-bold">{athleteTeam.name}</span>
                              {athleteTeam.category && (
                                <span className="text-gray-400 font-normal">({athleteTeam.category})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">Sin equipo</span>
                          )}
                        </div>
                      </td>

                      {/* Columna Estatus de Producto si está activo */}
                      {isProductMode ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3.5 py-1.5 inline-flex text-xs font-black rounded-full border shadow-2xs ${
                              productInfo?.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : productInfo?.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                              {productInfo?.status === 'paid' && `✅ Pagó ($${productInfo.paidAmount.toFixed(2)})`}
                              {productInfo?.status === 'pending' && '⏳ En Revisión'}
                              {productInfo?.status === 'unpaid' && `❌ Sin Pago ($${productInfo.targetAmount.toFixed(2)})`}
                              {!productInfo && 'Sin Datos'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full border ${
                              athlete.status === 'Solvente'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : athlete.status === 'Moroso'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {athlete.status}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-4 py-1.5 inline-flex text-xs font-bold rounded-full border shadow-2xs ${
                            athlete.status === 'Solvente'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : athlete.status === 'Moroso'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {athlete.status === 'Solvente' && <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 self-center"></span>}
                            {athlete.status === 'Moroso' && <span className="w-2 h-2 rounded-full bg-red-500 mr-2 self-center"></span>}
                            {athlete.status}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isProductMode ? 5 : 4} className="px-8 py-16 text-center">
                    <Users className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No hay resultados</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No se encontraron atletas para los filtros seleccionados. Intenta ajustar la búsqueda.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <Pagination currentPage={page} totalPages={totalPages} searchParams={paginationParams} />
          </div>
        )}

      </div>

    </div>
  );
}
