import { Users, Wrench, Plus, CalendarOff, Printer } from 'lucide-react'
import type { TypeOuvrier } from '@/generated/prisma/client'

interface PlanningOuvrierHeaderProps {
  ouvriers: Array<{ type: TypeOuvrier }>
  onOpenAffectationModal?: () => void
  onOpenIndisponibiliteModal?: () => void
  onPrintAll?: () => void
}

export function PlanningOuvrierHeader({ ouvriers, onOpenAffectationModal, onOpenIndisponibiliteModal, onPrintAll }: PlanningOuvrierHeaderProps) {
  const stats = {
    salaries: ouvriers.filter((o) => o.type === 'SALARIE').length,
    sousTraitants: ouvriers.filter((o) => o.type === 'SOUS_TRAITANT').length
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Users className="w-4 h-4" />
        <span className="font-medium">{stats.salaries} ouvriers actifs</span>
      </div>
      <div className="h-4 w-px bg-gray-300" />
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Wrench className="w-4 h-4" />
        <span className="font-medium">{stats.sousTraitants} sous-traitants</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenAffectationModal}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="Nouvelle affectation multi-jours"
          title="Affectation multi-ouvriers"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onOpenIndisponibiliteModal}
          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
          aria-label="Nouvelle indisponibilité"
          title="Indisponibilité multi-ouvriers"
        >
          <CalendarOff className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onPrintAll}
          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          aria-label="Tout imprimer"
          title="Imprimer tous les plannings"
        >
          <Printer className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
