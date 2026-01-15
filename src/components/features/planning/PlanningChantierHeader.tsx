import { Building2, Printer } from 'lucide-react'
import type { StatutChantier } from '@/generated/prisma/client'

interface PlanningChantierHeaderProps {
  chantiers: Array<{ statut: StatutChantier }>
  onPrintAll?: () => void
}

export function PlanningChantierHeader({ chantiers, onPrintAll }: PlanningChantierHeaderProps) {
  const stats = {
    actifs: chantiers.filter((c) => c.statut === 'ACTIF').length,
    enPause: chantiers.filter((c) => c.statut === 'EN_PAUSE').length
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Building2 className="w-4 h-4" />
        <span className="font-medium">{stats.actifs} chantiers actifs</span>
      </div>
      {stats.enPause > 0 && (
        <>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{stats.enPause} en pause</span>
          </div>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onPrintAll}
          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          aria-label="Tout imprimer"
          title="Imprimer tous les plannings chantier"
        >
          <Printer className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
