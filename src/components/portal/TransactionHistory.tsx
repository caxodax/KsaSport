'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react'

type Payment = {
  id: string
  concept?: string
  created_at: string
  reference_number?: string
  amount: number | string
  status: string
  products?: { name?: string }
}

export default function TransactionHistory({ payments }: { payments: Payment[] }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(payments.length / itemsPerPage)

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPayments = payments.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-gray-400" />
          Historial de Transacciones
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100 flex-1">
        {payments && payments.length > 0 ? (
          currentPayments.map((payment) => (
            <div key={payment.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <div>
                <p className="font-bold text-sm text-gray-900 group-hover:text-kasa-vinotinto transition-colors">
                  {payment.concept || payment.products?.name || 'Pago'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(payment.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} 
                  <span className="mx-1.5 opacity-50">•</span> 
                  Ref: <span className="font-mono">{payment.reference_number || 'N/A'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm text-gray-900">${Number(payment.amount).toFixed(2)}</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-widest
                  ${payment.status === 'Completado' ? 'bg-green-100 text-green-700' : 
                    payment.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-red-100 text-red-700'}`}>
                  {payment.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
            <Receipt className="w-12 h-12 text-gray-200 mb-3" />
            <p className="font-medium text-gray-900">Sin Movimientos</p>
            <p className="text-sm mt-1">No tienes transacciones registradas.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-kasa-vinotinto disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-kasa-vinotinto disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
