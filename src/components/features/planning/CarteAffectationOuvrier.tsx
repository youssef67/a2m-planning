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
  onClick?: () => void
}

export function CarteAffectationOuvrier({ affectation, onClick }: CarteAffectationOuvrierProps) {
  const isUnavailable = affectation.statutPresence !== 'TRAVAIL'
  const isIndisponibilite = affectation.chantier === null
  const chantierName = affectation.chantier?.nom ?? 'Indisponible'
  const isClickable = isIndisponibilite && onClick

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      className={clsx(
        'p-2 rounded-lg border text-sm',
        isUnavailable
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 shadow-sm',
        isClickable && 'cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors'
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
