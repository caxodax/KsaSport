import { getServiceSupabase } from '@/lib/supabase'
import { Wallet, Clock, Check, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import PaymentRow, { PaymentCard } from './PaymentRow'
import { checkAdminPermission } from '@/lib/auth-admin'
import DateRangeFilter from '../DateRangeFilter'
import { parseDateRange } from '@/lib/dateRange'
import ExportPaymentsButton from './ExportPaymentsButton'
import { PaymentsExportData } from '@/lib/exportExcel'

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

  const completedCount = completedPayments.length;
  const pendingCount = pendingPayments.length;
  const rejectedCount = rejectedPayments.length;

  const completedTotal = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const rejectedTotal = rejectedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const grandTotalAmount = completedTotal + pendingTotal + rejectedTotal;

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
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Finanzas y Pagos</h2>
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
          <Calendar className="w-4 h-4 text-kasa-dorado" />
          <span>Filtrar período de reportes:</span>
        </div>
        <div className="w-full lg:w-auto">
          <DateRangeFilter />
        </div>
      </div>

      {/* 3. Resumen Superior (Tarjetas KPI Equilibradas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-yellow-50 rounded-xl shrink-0">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Por Revisar</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-black text-gray-900">{pendingCount}</h3>
              <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200">
                ${pendingTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Validados</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-black text-gray-900">{completedCount}</h3>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                ${completedTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl shrink-0">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Rechazados</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-black text-gray-900">{rejectedCount}</h3>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                ${rejectedTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* Lista de Pagos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-kasa-gris flex items-center gap-2">
              <Wallet className="w-6 h-6 text-kasa-dorado" />
              Historial de Reportes
            </h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {payments?.length || 0} Total
            </span>
          </div>

          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
            {payments && payments.length > 0 ? (
              payments.map((p) => (
                <PaymentCard key={p.id} payment={p as any} />
              ))
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl">
                <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900">Bandeja Limpia</h3>
                <p className="text-sm text-gray-500 mt-1">No hay pagos reportados en este momento.</p>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (Tabla Ampliada) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Atleta</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Concepto y Fecha</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Método y Ref.</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {payments && payments.length > 0 ? (
                  payments.map((p) => (
                    <PaymentRow key={p.id} payment={p as any} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <Check className="mx-auto h-16 w-16 text-green-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">Bandeja Limpia</h3>
                      <p className="mt-1 text-base text-gray-500">
                        No hay pagos reportados en este momento.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}
