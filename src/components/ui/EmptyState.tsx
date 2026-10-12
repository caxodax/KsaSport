'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  badgeText?: string
  className?: string
}

/**
 * EmptyState: Componente estándar para estados vacíos de alta gama (Impeccable & UI/UX Pro Max).
 * Proporciona claridad visual, evita sensación de "pantalla rota" y ofrece llamados a la acción claros.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  badgeText,
  className = '',
}: EmptyStateProps) {
  const getButtonClass = (variant: EmptyStateAction['variant'] = 'primary') => {
    switch (variant) {
      case 'primary':
        return 'bg-kasa-vinotinto hover:bg-[#430b15] text-white shadow-md hover:shadow-lg shadow-kasa-vinotinto/20 active:scale-95'
      case 'secondary':
        return 'bg-kasa-dorado hover:bg-yellow-400 text-kasa-vinotinto font-black shadow-md shadow-kasa-dorado/20 active:scale-95'
      case 'outline':
      default:
        return 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-95 shadow-2xs'
    }
  }

  const renderAction = (act: EmptyStateAction) => {
    const baseClass = `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${getButtonClass(
      act.variant
    )}`

    if (act.href) {
      return (
        <Link key={act.label} href={act.href} className={baseClass}>
          {act.label}
        </Link>
      )
    }

    return (
      <button key={act.label} type="button" onClick={act.onClick} className={baseClass}>
        {act.label}
      </button>
    )
  }

  return (
    <div
      className={`rounded-3xl border border-dashed border-slate-200 bg-white/60 backdrop-blur-xs p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      {badgeText && (
        <span className="text-[10px] font-black uppercase tracking-wider text-kasa-dorado bg-kasa-vinotinto/10 px-3 py-1 rounded-full mb-4 border border-kasa-vinotinto/10">
          {badgeText}
        </span>
      )}

      {/* Ícono dentro de un halo refinado */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60 border border-slate-200/80 flex items-center justify-center text-slate-500 shadow-inner mb-4 transition-transform duration-300 hover:scale-105">
        <Icon className="w-7 h-7 text-kasa-vinotinto" />
      </div>

      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
          {action && renderAction(action)}
          {secondaryAction && renderAction(secondaryAction)}
        </div>
      )}
    </div>
  )
}
