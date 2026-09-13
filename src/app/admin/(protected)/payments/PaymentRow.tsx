'use client'

import { Check, X, Clock, FileText } from 'lucide-react'
import { approvePayment, rejectPayment } from './actions'
import { useState } from 'react'
import { formatCedula } from '@/lib/cedula'

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
  rate_type?: string
  exchange_rate?: number
  usdt_promedio?: number
  transferred_amount?: number
  payment_currency?: string
  date_rate?: string
  athletes: {
    name: string
    cedula: string
  }
}

function ReceiptModal({ url, payment, onClose }: { url: string | null, payment: Payment, onClose: () => void }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-gray-900">Comprobante de Pago</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Barra superior de cotejo rápido */}
        <div className="bg-slate-900 text-white p-3 px-4 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono flex-wrap">
            <span className="text-slate-400">Ref:</span>
            <span className="font-bold text-amber-400 text-sm">{payment.reference_number || 'S/R'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Declarado:</span>
            <span className="font-bold text-white text-sm">
              {payment.payment_currency === 'VES' 
                ? `Bs. ${Number(payment.transferred_amount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` 
                : `$${Number(payment.amount).toFixed(2)}`}
            </span>
            {payment.payment_currency === 'VES' && payment.exchange_rate && (
              <span className="text-emerald-400 text-xs">
                (${Number(payment.amount).toFixed(2)} {payment.rate_type || 'USD'} @ {Number(payment.exchange_rate).toFixed(2)} Bs.)
              </span>
            )}
            {payment.usdt_promedio && (
              <span className="text-teal-300 text-xs font-mono">
                [USDT Prom: Bs. {Number(payment.usdt_promedio).toFixed(2)}]
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Fecha Tasa: {payment.date_rate || new Date(payment.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
          <img src={url} alt="Comprobante" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function PaymentRow({ payment }: { payment: Payment }) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
    <>
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
              <div className="text-xs text-gray-500">CI: {payment.athletes?.cedula ? formatCedula(payment.athletes.cedula) : 'N/A'}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 font-medium">{payment.concept}</div>
          <div className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 font-medium">{payment.method}</div>
          <div className="text-xs text-gray-500">Ref: {payment.reference_number || 'N/A'}</div>
          {payment.receipt_url && (
            <div className="mt-1 flex flex-col gap-1">
              {payment.receipt_url.split(',').map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setPreviewUrl(url.trim())}
                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline text-left cursor-pointer"
                >
                  <FileText className="w-3 h-3" /> Comprobante {payment.receipt_url!.split(',').length > 1 ? idx + 1 : ''}
                </button>
              ))}
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-bold text-kasa-vinotinto">
            ${Number(payment.amount).toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">{payment.rate_type || 'USD'}</span>
          </div>
          {payment.payment_currency === 'VES' && payment.transferred_amount ? (
            <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">
              Bs. {Number(payment.transferred_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </div>
          ) : null}
          {payment.exchange_rate && Number(payment.exchange_rate) > 1 ? (
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              @ {Number(payment.exchange_rate).toFixed(2)} Bs. • {payment.date_rate || new Date(payment.created_at).toLocaleDateString()}
            </div>
          ) : null}
          {payment.usdt_promedio ? (
            <div className="text-[10px] text-teal-600 font-mono mt-0.5">
              USDT P2P: Bs. {Number(payment.usdt_promedio).toFixed(2)}
            </div>
          ) : null}
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
                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                title="Aprobar Pago"
              >
                <Check className="w-5 h-5" />
              </button>
              <button 
                onClick={handleReject}
                disabled={loading}
                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                title="Rechazar Pago"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Procesado</span>
          )}
        </td>
      </tr>
      <ReceiptModal url={previewUrl} payment={payment} onClose={() => setPreviewUrl(null)} />
    </>
  )
}

export function PaymentCard({ payment }: { payment: Payment }) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
    <>
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
              <span className="text-xs text-gray-500">CI: {payment.athletes?.cedula ? formatCedula(payment.athletes.cedula) : 'N/A'}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-kasa-vinotinto">
              ${Number(payment.amount).toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">{payment.rate_type || 'USD'}</span>
            </div>
            {payment.payment_currency === 'VES' && payment.transferred_amount ? (
              <div className="text-xs font-mono font-bold text-slate-700">
                Bs. {Number(payment.transferred_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </div>
            ) : null}
            <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full mt-1 ${
              payment.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
              payment.status === 'Completado' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {payment.status}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
          <p><span className="font-semibold text-gray-700">Concepto:</span> {payment.concept}</p>
          <p><span className="font-semibold text-gray-700">Método:</span> {payment.method}</p>
          <p><span className="font-semibold text-gray-700">Referencia:</span> {payment.reference_number || 'N/A'}</p>
          {payment.exchange_rate && Number(payment.exchange_rate) > 1 && (
            <p className="text-slate-600">
              <span className="font-semibold text-gray-700">Tasa Aplicada:</span>{' '}
              Bs. {Number(payment.exchange_rate).toFixed(2)} / {payment.rate_type || 'USD'}
              <span className="text-[11px] text-slate-400 ml-1 font-mono">({payment.date_rate || 'Fecha de pago'})</span>
            </p>
          )}
          {payment.usdt_promedio && (
            <p className="text-slate-600 text-xs">
              <span className="font-semibold text-teal-700">USDT Promedio (P2P):</span>{' '}
              Bs. {Number(payment.usdt_promedio).toFixed(2)}
            </p>
          )}
          {payment.receipt_url && (
            <div className="mt-2 flex flex-wrap gap-2">
              {payment.receipt_url.split(',').map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setPreviewUrl(url.trim())}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                >
                  <FileText className="w-3 h-3" /> Comprobante {payment.receipt_url!.split(',').length > 1 ? idx + 1 : ''}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 pt-1 border-t border-gray-200 text-xs text-slate-500">
            <span className="font-semibold text-gray-700">Fecha:</span> {new Date(payment.created_at).toLocaleString()}
          </p>
        </div>
        
        {payment.status === 'Pendiente' && (
          <div className="flex gap-2 mt-2">
            <button 
              onClick={handleReject}
              disabled={loading}
              className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
            >
              Rechazar
            </button>
            <button 
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 py-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
            >
              Aprobar
            </button>
          </div>
        )}
      </div>
      <ReceiptModal url={previewUrl} payment={payment} onClose={() => setPreviewUrl(null)} />
    </>
  )
}
