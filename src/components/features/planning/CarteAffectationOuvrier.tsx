import { clsx } from 'clsx'
import type { Periode, StatutPresence, StatutChantier } from '@/generated/prisma/client'
import { BadgePeriode } from './BadgePeriode'
import { BadgeStatutPresence } from './BadgeStatutPresence'

interface AffectationData {
  id: number
  periode: Periode
  statutPresence: StatutPresence
  chantier: {
    id: number
    nom: string
    statut: StatutChantier
  } | null
}

interface CarteAffectationOuvrierProps {
  affectation: AffectationData
}

export function CarteAffectationOuvrier({ affectation }: CarteAffectationOuvrierProps) {
  const isUnavailable = affectation.statutPresence !== 'TRAVAIL'
  const chantierName = affectation.chantier?.nom ?? 'Indisponible'

  return (
    <div
      className={clsx(
        'p-2 rounded-lg border text-sm',
        isUnavailable
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={clsx(
            'font-medium truncate',
            isUnavailable ? 'text-gray-600' : 'text-gray-900'
          )}
          title={chantierName}
        >
          {chantierName}
        </span>
        <BadgePeriode periode={affectation.periode} />
      </div>

      {isUnavailable && (
        <div className="mt-1">
          <BadgeStatutPresence statut={affectation.statutPresence} />
        </div>
      )}
    </div>
  )
}
