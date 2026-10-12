'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon } from 'lucide-react'

export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  alt: string
  fallbackSrc?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'auto'
  containerClassName?: string
  priority?: boolean
}

const ASPECT_MAP = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[16/9]',
  auto: '',
}

/**
 * OptimizedImage: Componente de imagen de alto rendimiento diseñado para Cloudflare R2 / WebP.
 * - Evita Cumulative Layout Shift (CLS) mediante ratio o contenedor fijo.
 * - Soporte nativo para decoding="async" y loading="lazy".
 * - Skeleton shimmer animado mientras descarga de la red.
 * - Fallback elegante ante URLs rotas o caídas de red.
 */
export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder-team.png',
  aspectRatio = 'auto',
  containerClassName = '',
  className = '',
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || undefined)

  useEffect(() => {
    setCurrentSrc(src || undefined)
    setIsLoaded(false)
    setHasError(false)
  }, [src])

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc)
      }
    }
  }

  const aspectClass = ASPECT_MAP[aspectRatio] || ''

  if (!currentSrc || (hasError && !fallbackSrc)) {
    return (
      <div 
        className={`relative flex items-center justify-center bg-slate-100 text-slate-400 overflow-hidden ${aspectClass} ${containerClassName}`}
        aria-label={alt}
      >
        <ImageIcon className="w-6 h-6 opacity-40" />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${aspectClass} ${containerClassName}`}>
      {/* Shimmer skeleton mientras carga */}
      {!isLoaded && (
        <div className="absolute inset-0 skeleton-shimmer z-10" />
      )}

      {/* Imagen renderizada de forma asíncrona */}
      <img
        src={currentSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  )
}
