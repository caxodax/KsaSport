'use client'

import { useState, useMemo } from 'react'
import { Wallet, Clock, Check, CheckCircle2, XCircle, Search, X, ChevronLeft, ChevronRight, Ban } from 'lucide-react'
import PaymentRow, { PaymentCard } from './PaymentRow'

type PaymentItem = any

interface PaymentsClientViewProps {
  payments: PaymentItem[]
  pendingCount: number
  completedCount: number
  rejectedCount: number
  voidedCount?: number
  formattedPendingTotal: string
  formattedCompletedTotal: string
  formattedRejectedTotal: string
}

export default function PaymentsClientView({
  payments,
  pendingCount,
  completedCount,
  rejectedCount,
  voidedCount = 0,
  formattedPendingTotal,
  formattedCompletedTotal,
  formattedRejectedTotal,
}: PaymentsClientViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Pendiente' | 'Completado' | 'Rechazado' | 'Anulado'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const handleStatusChange = (status: 'all' | 'Pendiente' | 'Completado' | 'Rechazado' | 'Anulado') => {
    setSelectedStatus(status)
    setCurrentPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSelectedStatus('all')
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Filtrado reactivo en memoria con respuesta inmediata
  const filteredPayments = useMemo(() => {
    return (payments || []).filter((p) => {
      // Filtro de estatus
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false
      }

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const athlete = Array.isArray(p.athletes) ? p.athletes[0] : p.athletes
        const athleteName = athlete?.name?.toLowerCase() || ''
        const athleteCedula = athlete?.cedula?.toLowerCase() || ''
        const reference = p.reference_number?.toLowerCase() || ''
        const concept = p.concept?.toLowerCase() || ''
        const method = p.method?.toLowerCase() || ''

        const matches =
          athleteName.includes(query) ||
          athleteCedula.includes(query) ||
          reference.includes(query) ||
          concept.includes(query) ||
          method.includes(query)

        if (!matches) return false
      }

      return true
    })
  }, [payments, selectedStatus, searchQuery])

  // Cálculos de Paginación Reactiva
  const totalItems = filteredPayments.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | string)[] = [1]
    if (safeCurrentPage > 3) {
      pages.push('...')
    }
    const start = Math.max(2, safeCurrentPage - 1)
    const end = Math.min(totalPages - 1, safeCurrentPage + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    if (safeCurrentPage < totalPages - 2) {
      pages.push('...')
    }
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="space-y-6">
      {/* 1. Resumen Superior (Tarjetas KPI interactivas con transiciones de 200ms) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI: Por Revisar */}
        <button
          type="button"
          onClick={() => handleStatusChange(selectedStatus === 'Pendiente' ? 'all' : 'Pendiente')}
          className={`text-left p-5 rounded-2xl border shadow-xs transition-all duration-200 ease-out relative overflow-hidden cursor-pointer ${
            selectedStatus === 'Pendiente'
              ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/40 shadow-md scale-[1.01]'
              : 'bg-white border-gray-100 hover:border-amber-300 hover:shadow-sm'
          }`}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Por Revisar</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-4xl sm:text-5xl font-display tracking-wide text-gray-900">{pendingCount}</h3>
                <span className="text-sm font-display tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                  {formattedPendingTotal}
                </span>
              </div>
              <p className="text-[11px] font-medium text-amber-700 mt-1.5">
                {selectedStatus === 'Pendiente' ? '● Filtro activo' : 'Clic para filtrar pendientes'}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </button>

        {/* KPI: Validados */}
        <button
          type="button"
          onClick={() => handleStatusChange(selectedStatus === 'Completado' ? 'all' : 'Completado')}
          className={`text-left p-5 rounded-2xl border shadow-xs transition-all duration-200 ease-out relative overflow-hidden cursor-pointer ${
            selectedStatus === 'Completado'
              ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/40 shadow-md scale-[1.01]'
              : 'bg-white border-gray-100 hover:border-emerald-300 hover:shadow-sm'
          }`}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Validados</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-4xl sm:text-5xl font-display tracking-wide text-gray-900">{completedCount}</h3>
                <span className="text-sm font-display tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {formattedCompletedTotal}
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-700 mt-1.5">
                {selectedStatus === 'Completado' ? '● Filtro activo' : 'Clic para filtrar validados'}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </button>

        {/* KPI: Rechazados */}
        <button
          type="button"
          onClick={() => handleStatusChange(selectedStatus === 'Rechazado' ? 'all' : 'Rechazado')}
          className={`text-left p-5 rounded-2xl border shadow-xs transition-all duration-200 ease-out relative overflow-hidden cursor-pointer ${
            selectedStatus === 'Rechazado'
              ? 'bg-red-50/60 border-red-400 ring-2 ring-red-400/40 shadow-md scale-[1.01]'
              : 'bg-white border-gray-100 hover:border-red-300 hover:shadow-sm'
          }`}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 rounded-l-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Rechazados</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-4xl sm:text-5xl font-display tracking-wide text-gray-900">{rejectedCount}</h3>
                <span className="text-sm font-display tracking-wider text-red-800 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
                  {formattedRejectedTotal}
                </span>
              </div>
              <p className="text-[11px] font-medium text-red-700 mt-1.5">
                {selectedStatus === 'Rechazado' ? '● Filtro activo' : 'Clic para filtrar rechazados'}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-2xl text-red-600 shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </button>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Pestañas de Estatus */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleStatusChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ease-out whitespace-nowrap ${
              selectedStatus === 'all'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-slate-500 hover:text-gray-900'
            }`}
          >
            Todos ({payments.length})
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('Pendiente')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ease-out whitespace-nowrap ${
              selectedStatus === 'Pendiente'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-500 hover:text-amber-700'
            }`}
          >
            Por Revisar ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('Completado')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ease-out whitespace-nowrap ${
              selectedStatus === 'Completado'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            Validados ({completedCount})
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('Rechazado')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ease-out whitespace-nowrap ${
              selectedStatus === 'Rechazado'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-rose-700'
            }`}
          >
            Rechazados ({rejectedCount})
          </button>

          {(voidedCount > 0 || selectedStatus === 'Anulado') && (
            <button
              type="button"
              onClick={() => handleStatusChange('Anulado')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ease-out whitespace-nowrap ${
                selectedStatus === 'Anulado'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Anulados ({voidedCount})
            </button>
          )}
        </div>

        {/* Buscador reactivo */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por atleta, cédula o ref..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-semibold text-gray-900 rounded-xl border border-slate-200 focus:border-kasa-vinotinto outline-none focus:ring-2 focus:ring-red-100 transition-all duration-200 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Lista de Pagos con Transición Suave de 200ms */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-gray-50/50">
          <h3 className="text-lg sm:text-xl font-bold text-kasa-gris flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            Historial de Reportes
          </h3>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <span className="hidden sm:inline-block text-xs font-semibold text-gray-500">
                Pág {safeCurrentPage} de {totalPages}
              </span>
            )}
            <span className="bg-white border border-gray-200 text-gray-700 px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
              {totalItems} {totalItems === 1 ? 'Reporte' : 'Reportes'}
            </span>
          </div>
        </div>

        {/* Contenedor Animado con Key Reactivo */}
        <div key={`${selectedStatus}-${searchQuery}-${safeCurrentPage}-${pageSize}`} className="animate-tab-enter">
          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
            {paginatedPayments.length > 0 ? (
              paginatedPayments.map((p) => (
                <PaymentCard key={p.id} payment={p} />
              ))
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl">
                <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900">Bandeja Limpia</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery || selectedStatus !== 'all'
                    ? 'No hay pagos que coincidan con los filtros aplicados.'
                    : 'No hay pagos reportados en este momento.'}
                </p>
                {(searchQuery || selectedStatus !== 'all') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-kasa-vinotinto bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                )}
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
                {paginatedPayments.length > 0 ? (
                  paginatedPayments.map((p) => (
                    <PaymentRow key={p.id} payment={p} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <Check className="mx-auto h-16 w-16 text-green-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">Bandeja Limpia</h3>
                      <p className="mt-1 text-base text-gray-500">
                        {searchQuery || selectedStatus !== 'all'
                          ? 'No hay pagos que coincidan con los filtros aplicados.'
                          : 'No hay pagos reportados en este momento.'}
                      </p>
                      {(searchQuery || selectedStatus !== 'all') && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-bold text-kasa-vinotinto bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          Restablecer Filtros
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Controles de Paginación */}
        {totalItems > 0 && (
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Información de conteo y selector de tamaño */}
            <div className="flex items-center gap-3 text-slate-600 font-medium w-full sm:w-auto justify-between sm:justify-start">
              <span>
                Mostrando <strong className="text-gray-900 font-bold">{startIndex + 1}</strong>–
                <strong className="text-gray-900 font-bold">{endIndex}</strong> de{' '}
                <strong className="text-gray-900 font-bold">{totalItems}</strong> {totalItems === 1 ? 'pago' : 'pagos'}
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200">
                <span className="text-slate-400 text-[11px] font-bold">Por pág:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="bg-white border border-gray-200 text-gray-800 font-bold text-xs rounded-lg px-2 py-1 outline-none focus:border-kasa-vinotinto cursor-pointer shadow-2xs"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Navegación de páginas */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:text-kasa-vinotinto disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 shadow-2xs cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) =>
                    typeof page === 'number' ? (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[30px] h-7 px-2 rounded-lg font-black text-xs transition-all duration-150 cursor-pointer ${
                          safeCurrentPage === page
                            ? 'bg-kasa-vinotinto text-white shadow-2xs'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-kasa-vinotinto'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-slate-400 font-bold select-none">
                        ...
                      </span>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:text-kasa-vinotinto disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 shadow-2xs cursor-pointer"
                  title="Página siguiente"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
