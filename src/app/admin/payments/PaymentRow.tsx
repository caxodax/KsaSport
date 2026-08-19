'use client'

import { Check, X, Clock, FileText } from 'lucide-react'
import { approvePayment, rejectPayment } from './actions'
import { useState } from 'react'

type Payment = {
  id: string
  athlete_id: string
  amount: number
  method: string
  concept: string
  status: string
  reference_number: string
  receipt_url?: string | null
  created_at: string
  athletes: {
    name: string
    cedula: string
  }
}

export default function PaymentRow({ payment }: { payment: Payment }) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (!confirm('¿Aprobar este pago?')) return;
    setLoading(true)
    await approvePayment(payment.id, payment.athlete_id, payment.concept)
    setLoading(false)
  }

  const handleReject = async () => {
    if (!confirm('¿Rechazar este pago?')) return;
    setLoading(true)
    await rejectPayment(payment.id)
    setLoading(false)
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            payment.status === 'Pendiente' ? 'bg-yellow-50' : 
            payment.status === 'Completado' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {payment.status === 'Pendiente' ? <Clock className="w-5 h-5 text-yellow-600" /> :
             payment.status === 'Completado' ? <Check className="w-5 h-5 text-green-600" /> :
             <X className="w-5 h-5 text-red-600" />}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{payment.athletes?.name || 'Atleta Desconocido'}</div>
            <div className="text-xs text-gray-500">CI: {payment.athletes?.cedula || 'N/A'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-medium">{payment.concept}</div>
        <div className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-gray-900">{payment.method}</div>
        <div className="text-xs text-gray-500">Ref: {payment.reference_number || 'N/A'}</div>
        {payment.receipt_url && (
          <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-1">
            <FileText className="w-3 h-3" /> Ver Comprobante
          </a>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-kasa-vinotinto">${Number(payment.amount).toFixed(2)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          payment.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
          payment.status === 'Completado' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {payment.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {payment.status === 'Pendiente' ? (
          <div className="flex justify-end gap-2">
            <button 
              onClick={handleApprove}
              disabled={loading}
              className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
              title="Aprobar Pago"
            >
              <Check className="w-5 h-5" />
            </button>
            <button 
              onClick={handleReject}
              disabled={loading}
              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              title="Rechazar Pago"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">Procesado</span>
        )}
      </td>
    </tr>
  )
}

export function PaymentCard({ payment }: { payment: Payment }) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (!confirm('¿Aprobar este pago?')) return;
    setLoading(true)
    await approvePayment(payment.id, payment.athlete_id, payment.concept)
    setLoading(false)
  }

  const handleReject = async () => {
    if (!confirm('¿Rechazar este pago?')) return;
    setLoading(true)
    await rejectPayment(payment.id)
    setLoading(false)
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            payment.status === 'Pendiente' ? 'bg-yellow-50' : 
            payment.status === 'Completado' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {payment.status === 'Pendiente' ? <Clock className="w-5 h-5 text-yellow-600" /> :
             payment.status === 'Completado' ? <Check className="w-5 h-5 text-green-600" /> :
             <X className="w-5 h-5 text-red-600" />}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{payment.athletes?.name || 'Desconocido'}</h4>
            <span className="text-xs text-gray-500">CI: {payment.athletes?.cedula || 'N/A'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-kasa-vinotinto">${Number(payment.amount).toFixed(2)}</div>
          <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full mt-1 ${
            payment.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
            payment.status === 'Completado' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {payment.status}
          </span>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg text-sm">
        <p><span className="font-semibold text-gray-700">Concepto:</span> {payment.concept}</p>
        <p><span className="font-semibold text-gray-700">Método:</span> {payment.method}</p>
        <p><span className="font-semibold text-gray-700">Referencia:</span> {payment.reference_number || 'N/A'}</p>
        {payment.receipt_url && (
          <p className="mt-2">
            <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
              <FileText className="w-3 h-3" /> Ver Comprobante Subido
            </a>
          </p>
        )}
        <p className="mt-2"><span className="font-semibold text-gray-700">Fecha:</span> {new Date(payment.created_at).toLocaleString()}</p>
      </div>
      
      {payment.status === 'Pendiente' && (
        <div className="flex gap-2 mt-2">
          <button 
            onClick={handleReject}
            disabled={loading}
            className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            Rechazar
          </button>
          <button 
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 py-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            Aprobar
          </button>
        </div>
      )}
    </div>
  )
}
