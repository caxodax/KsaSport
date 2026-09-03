'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

export default function MonthSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const monthParam = searchParams.get('month')
  
  // Parse month param or use current month
  let currentDate = new Date()
  if (monthParam) {
    const [year, month] = monthParam.split('-')
    if (year && month) {
      currentDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    }
  }

  const navigateToMonth = (offset: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + offset)
    
    const newYear = newDate.getFullYear()
    const newMonth = String(newDate.getMonth() + 1).padStart(2, '0')
    const newMonthParam = `${newYear}-${newMonth}`

    const params = new URLSearchParams(searchParams.toString())
    params.set('month', newMonthParam)
    // Cuando cambiamos de mes, reseteamos a la página 1 si existe el parámetro page
    if (params.has('page')) params.set('page', '1')

    router.push(`${pathname}?${params.toString()}`)
  }

  const resetToCurrent = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('month')
    if (params.has('page')) params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const formattedMonth = new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' }).format(currentDate)
  // Capitalize first letter
  const displayMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-sm p-1">
      <button 
        onClick={() => navigateToMonth(-1)}
        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-kasa-vinotinto"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div 
        className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
        onClick={resetToCurrent}
        title="Volver al mes actual"
      >
        <Calendar className="w-4 h-4 text-kasa-dorado" />
        <span className="font-bold text-gray-700 min-w-[140px] text-center text-sm select-none">
          {displayMonth}
        </span>
      </div>

      <button 
        onClick={() => navigateToMonth(1)}
        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-kasa-vinotinto"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
