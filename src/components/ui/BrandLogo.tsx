'use client'

import { useState } from 'react'

interface BrandLogoProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'badge' | 'badge-dark' | 'plain';
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

const DEFAULT_LOGO = '/images/ksasport-logo.png'

const SIZE_MAP = {
  xs: { container: 'w-7 h-7 rounded-lg p-0.5', img: 'w-5 h-5' },
  sm: { container: 'w-9 h-9 rounded-xl p-1', img: 'w-6 h-6' },
  md: { container: 'w-11 h-11 rounded-xl p-1.5', img: 'w-8 h-8' },
  lg: { container: 'w-14 h-14 rounded-2xl p-2', img: 'w-10 h-10' },
  xl: { container: 'w-20 h-20 rounded-2xl p-2.5', img: 'w-14 h-14' },
  '2xl': { container: 'w-28 h-28 rounded-3xl p-3', img: 'w-20 h-20' },
}

export default function BrandLogo({
  src,
  alt = 'KSA Sports',
  size = 'sm',
  variant = 'plain',
  className = '',
  imgClassName = '',
}: BrandLogoProps) {
  const initialSource = src?.trim() || DEFAULT_LOGO
  const [imgSrc, setImgSrc] = useState<string>(initialSource)
  const [hasError, setHasError] = useState(false)

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm

  const handleError = () => {
    if (!hasError && imgSrc !== DEFAULT_LOGO) {
      setHasError(true)
      setImgSrc(DEFAULT_LOGO)
    }
  }

  // Si es plain, solo renderizamos la imagen con las clases de tamaño correspondientes
  if (variant === 'plain') {
    return (
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        className={`object-contain select-none transition-transform duration-200 ${
          size === 'xs' ? 'w-6 h-6' :
          size === 'sm' ? 'w-8 h-8' :
          size === 'md' ? 'w-10 h-10' :
          size === 'lg' ? 'w-14 h-14' :
          size === 'xl' ? 'w-20 h-20' :
          size === '2xl' ? 'w-28 h-28' : 'w-8 h-8'
        } ${imgClassName} ${className}`}
        loading="eager"
      />
    )
  }

  // Variantes con contenedor Badge estilizado para fondos oscuros o vinotinto
  const badgeClasses = variant === 'badge-dark'
    ? 'bg-slate-900/90 border border-kasa-dorado/30 shadow-sm'
    : 'bg-white border border-slate-200/80 shadow-xs backdrop-blur-xs'

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 ${sizeConfig.container} ${badgeClasses} ${className}`}
    >
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        className={`object-contain select-none ${sizeConfig.img} ${imgClassName}`}
        loading="eager"
      />
    </div>
  )
}
