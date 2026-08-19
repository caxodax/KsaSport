import { getServiceSupabase } from '@/lib/supabase'
import { Wallet, Clock } from 'lucide-react'
import PaymentRow, { PaymentCard } from './PaymentRow'

export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = getServiceSupabase()
  
  // Obtener pagos con datos de la atleta (inner join)
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
    .order('status', { ascending: false }) // 'Pendiente' va antes que 'Completado'/'Rechazado' alfabéticamente
    .order('created_at', { ascending: false })

  const pendingCount = payments?.filter(p => p.status === 'Pendiente').length || 0

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Finanzas y Pagos</h2>
        <p className="text-gray-500 mt-1">Bandeja de entrada para revisión y aprobación de pagos reportados.</p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Resumen Superior */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Por Revisar</p>
              <h3 className="text-2xl font-bold text-gray-900">{pendingCount}</h3>
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
    </div>
  )
}
