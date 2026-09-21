'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface BottomSheetModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  maxWidth?: string // e.g. "max-w-md", "max-w-lg", "max-w-xl"
  customHeader?: React.ReactNode
  hideHeader?: boolean
  className?: string
}

export default function BottomSheetModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  customHeader,
  hideHeader = false,
  className = ''
}: BottomSheetModalProps) {
  // Bloquear scroll de fondo cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Modal / Bottom Sheet */}
      <div
        className={`relative z-10 w-full ${maxWidth} bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Barra tirador para gestos en móvil (Drag handle) */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Encabezado */}
        {!hideHeader && (
          <>
            {customHeader ? (
              customHeader
            ) : (
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="text-base sm:text-lg font-black text-gray-900">
                  {title}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Contenido con scroll independiente */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}

