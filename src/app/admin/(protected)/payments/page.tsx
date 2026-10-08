import { getServiceSupabase } from '@/lib/supabase'
import { Calendar } from 'lucide-react'
import { checkAdminPermission } from '@/lib/auth-admin'
import DateRangeFilter from '../DateRangeFilter'
import { parseDateRange } from '@/lib/dateRange'
import ExportPaymentsButton from './ExportPaymentsButton'
import PaymentsClientView from './PaymentsClientView'
import type { PaymentsExportData } from '@/lib/exportExcel'

export const revalidate = 0

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await checkAdminPermission('view_finances')
  const resolvedParams = await searchParams;
  const { startDate, endDate, formattedRange } = parseDateRange(resolvedParams);
  const supabase = getServiceSupabase()

  // Obtener pagos con datos de la atleta (inner join) en el rango de fechas seleccionado
  // Ordenamos para que los Pendientes salgan de primero, y luego por fecha más reciente
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      athletes (
        name,
        cedula
      )
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('status', { ascending: false }) // 'Pendiente' va antes que 'Completado'/'Rechazado' alfabéticamente
    .order('created_at', { ascending: false })

  const completedPayments = payments?.filter(p => p.status === 'Completado') || [];
  const pendingPayments = payments?.filter(p => p.status === 'Pendiente') || [];
  const rejectedPayments = payments?.filter(p => p.status === 'Rechazado') || [];
  const voidedPayments = payments?.filter(p => p.status === 'Anulado') || [];

  const completedCount = completedPayments.length;
  const pendingCount = pendingPayments.length;
  const rejectedCount = rejectedPayments.length;
  const voidedCount = voidedPayments.length;

  const completedTotal = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const rejectedTotal = rejectedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const grandTotalAmount = completedTotal + pendingTotal + rejectedTotal;

  const formatPaymentsTotal = (list: any[]) => {
    const usd = list.filter(p => (p.rate_type || 'USD') === 'USD').reduce((s, p) => s + Number(p.amount || 0), 0);
    const eur = list.filter(p => p.rate_type === 'EUR').reduce((s, p) => s + Number(p.amount || 0), 0);
    const parts: string[] = [];
    if (eur > 0) parts.push(`€${eur.toFixed(2)}`);
    if (usd > 0) parts.push(`$${usd.toFixed(2)}`);
    if (parts.length === 0) return '$0.00';
    return parts.join(' + ');
  };

  // Desglose por Método y Concepto
  const methodMap = new Map<string, { count: number; total: number }>();
  const conceptMap = new Map<string, { count: number; total: number }>();

  (payments || []).forEach(p => {
    const m = p.method || 'No Especificado';
    const c = p.concept || 'Sin Concepto';
    const amt = Number(p.amount) || 0;

    if (!methodMap.has(m)) methodMap.set(m, { count: 0, total: 0 });
    const mEntry = methodMap.get(m)!;
    mEntry.count++;
    mEntry.total += amt;

    if (!conceptMap.has(c)) conceptMap.set(c, { count: 0, total: 0 });
    const cEntry = conceptMap.get(c)!;
    cEntry.count++;
    cEntry.total += amt;
  });

  const sortedMethods = Array.from(methodMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, data]) => ({
      name,
      count: data.count,
      total: data.total,
      percentage: grandTotalAmount > 0 ? (data.total / grandTotalAmount) * 100 : 0,
    }));

  const sortedConcepts = Array.from(conceptMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, data]) => ({
      name,
      count: data.count,
      total: data.total,
      percentage: grandTotalAmount > 0 ? (data.total / grandTotalAmount) * 100 : 0,
    }));

  const exportPaymentsList = (payments || []).map(p => {
    const athleteObj = Array.isArray(p.athletes) ? p.athletes[0] : p.athletes;
    return {
      id: p.id,
      date: p.created_at,
      athleteName: athleteObj?.name || 'Atleta Desconocido',
      athleteCedula: athleteObj?.cedula || '',
      concept: p.concept || 'Sin Concepto',
      method: p.method || 'No Especificado',
      reference: p.reference_number || p.reference || '',
      amount: Number(p.amount) || 0,
      status: (p.status as any) || 'Pendiente',
      rateType: p.rate_type || 'USD',
      exchangeRate: p.exchange_rate ? Number(p.exchange_rate) : undefined,
      usdtPromedio: p.usdt_promedio ? Number(p.usdt_promedio) : undefined,
      transferredAmount: p.transferred_amount ? Number(p.transferred_amount) : undefined,
      paymentCurrency: p.payment_currency || 'USD',
      dateRate: p.date_rate || undefined
    };
  });

  const exportPayload: PaymentsExportData = {
    dateRangeStr: formattedRange,
    totalCount: payments?.length || 0,
    completedCount,
    pendingCount,
    rejectedCount,
    completedTotal,
    pendingTotal,
    rejectedTotal,
    methods: sortedMethods,
    concepts: sortedConcepts,
    payments: exportPaymentsList,
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* 1. Cabecera Principal con Título y Botón de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-wide text-gray-900">Finanzas y Pagos</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-gray-500 text-xs sm:text-sm">Bandeja de entrada para revisión y aprobación de pagos reportados.</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-vinotinto-light/20 text-kasa-vinotinto border border-vinotinto-light/30 rounded-full text-xs font-bold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-kasa-vinotinto" />
              {formattedRange}
            </span>
          </div>
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <ExportPaymentsButton data={exportPayload} />
        </div>
      </div>

      {/* 2. Barra de Filtros por Rango de Fechas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Filtrar período de reportes:</span>
        </div>
        <div className="w-full lg:w-auto">
          <DateRangeFilter />
        </div>
      </div>

      {/* 3. Vista Interactiva de Pagos (Filtros por estatus, búsqueda y transiciones de 200ms) */}
      <PaymentsClientView
        payments={payments || []}
        pendingCount={pendingCount}
        completedCount={completedCount}
        rejectedCount={rejectedCount}
        voidedCount={voidedCount}
        formattedPendingTotal={formatPaymentsTotal(pendingPayments)}
        formattedCompletedTotal={formatPaymentsTotal(completedPayments)}
        formattedRejectedTotal={formatPaymentsTotal(rejectedPayments)}
      />
    </div>
  )
}
