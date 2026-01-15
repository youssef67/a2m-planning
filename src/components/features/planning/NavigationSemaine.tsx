'use client'

import { ChevronLeft, ChevronRight, Calendar, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSemaine } from '@/hooks/useSemaine'

export function NavigationSemaine() {
  const {
    semaineCourante,
    finSemaine,
    allerSemainePrecedente,
    allerSemaineSuivante,
    allerADate,
    allerAujourdhui
  } = useSemaine()

  const formatRange = () => {
    const debut = format(semaineCourante, 'd', { locale: fr })
    const fin = format(finSemaine, 'd MMM yyyy', { locale: fr })

    if (semaineCourante.getMonth() === finSemaine.getMonth()) {
      return `${debut} - ${fin}`
    }

    return `${format(semaineCourante, 'd MMM', { locale: fr })} - ${fin}`
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value)
    if (!isNaN(date.getTime())) {
      allerADate(date)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={allerSemainePrecedente}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <span className="text-lg font-medium text-gray-900 min-w-[180px] text-center">
          {formatRange()}
        </span>

        <button
          onClick={allerSemaineSuivante}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Semaine suivante"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={allerAujourdhui}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Aujourd&apos;hui
        </button>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="date"
            onChange={handleDateChange}
            value={format(semaineCourante, 'yyyy-MM-dd')}
            className="pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Sélectionner une date"
          />
        </div>

        <button
          onClick={() => window.print()}
          className="no-print px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
          aria-label="Imprimer le planning"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimer</span>
        </button>
      </div>
    </div>
  )
}
