'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet, ShoppingBag, CalendarDays } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/portal/dashboard', label: 'Inicio', icon: Home, exact: true },
  { href: '/portal/dashboard/pagos', label: 'Pagos', icon: Wallet },
  { href: '/portal/dashboard/cantina', label: 'Cantina', icon: ShoppingBag },
  { href: '/calendario', label: 'Juegos', icon: CalendarDays },
]

/**
 * AthleteBottomNav: Barra de navegación inferior flotante nativa para smartphones.
 * - Diseñada según la "Thumb Zone" ergonómica para móviles.
 * - Soporte nativo para Safe Areas en iPhone (Home Indicator).
 * - Estética Glassmorphism con acento Vinotinto KSA y Dorado.
 */
export default function AthleteBottomNav() {
  const pathname = usePathname()

  // Solo mostrar en rutas autenticadas del portal de atletas
  const isDashboardRoute = pathname?.startsWith('/portal/dashboard')
  if (!isDashboardRoute) return null

  return (
    <nav 
      aria-label="Navegación móvil del atleta"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-3 pt-2 pb-[max(0.6rem,calc(env(safe-area-inset-bottom)+0.25rem))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname?.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'text-kasa-vinotinto font-bold' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-colors duration-200 ${
                isActive ? 'bg-kasa-vinotinto/10 text-kasa-vinotinto' : ''
              }`}>
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-kasa-vinotinto' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-kasa-dorado" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${
                isActive ? 'text-kasa-vinotinto font-extrabold' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
