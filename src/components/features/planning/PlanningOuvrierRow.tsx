'use client'

import { memo } from 'react'
import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clsx } from 'clsx'
import { Printer } from 'lucide-react'
import type { Periode, StatutPresence, StatutChantier, TypeOuvrier } from '@/generated/prisma/client'
import { CarteAffectationOuvrier } from './CarteAffectationOuvrier'

interface AffectationData {
  id: number
  date: Date
  periode: Periode
  statutPresence: StatutPresence
  chantier: {
    id: number
    nom: string
    statut: StatutChantier
  } | null
}

interface OuvrierWithAffectations {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
  affectations: AffectationData[]
}

interface PlanningOuvrierRowProps {
  ouvrier: OuvrierWithAffectations
  joursSemaine: Date[]
  onClickIndisponibilite?: (ouvrier: OuvrierWithAffectations, affectation: AffectationData) => void
  onClickAffectation?: (ouvrier: OuvrierWithAffectations, affectation: AffectationData, event: React.MouseEvent) => void
  onClickCelluleVide?: (ouvrierId: number, ouvrierNom: string, date: Date) => void
  onPrintSingle?: (ouvrierId: number) => void
}

export const PlanningOuvrierRow = memo(function PlanningOuvrierRow({
  ouvrier,
  joursSemaine,
  onClickIndisponibilite,
  onClickAffectation,
  onClickCelluleVide,
  onPrintSingle
}: PlanningOuvrierRowProps) {
  const isSousTraitant = ouvrier.type === 'SOUS_TRAITANT'

  const getAffectationsForDay = (day: Date) => {
    return ouvrier.affectations.filter((a) => isSameDay(new Date(a.date), day))
  }

  const canAddAffectation = (affectations: AffectationData[]) => {
    return !affectations.some((a) => a.periode === 'JOURNEE')
  }

  const handleCellClick = (day: Date, affectations: AffectationData[]) => {
    if (onClickCelluleVide && canAddAffectation(affectations)) {
      onClickCelluleVide(ouvrier.id, `${ouvrier.prenom} ${ouvrier.nom}`, day)
    }
  }

  return (
    <div className={clsx(
      'bg-white rounded-lg border shadow-sm overflow-hidden',
      isSousTraitant && 'border-orange-200'
    )}>
      {/* Header with ouvrier name */}
      <div className={clsx(
        'px-4 py-2 border-b flex items-center gap-2',
        isSousTraitant ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
      )}>
        <h3 className="font-semibold text-gray-900">
          {ouvrier.prenom} {ouvrier.nom}
        </h3>
        {isSousTraitant && (
          <span title="Sous-traitant" className="text-orange-600">🔧</span>
        )}
        {onPrintSingle && (
          <button
            type="button"
            onClick={() => onPrintSingle(ouvrier.id)}
            className="ml-auto p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors no-print"
            aria-label={`Imprimer le planning de ${ouvrier.prenom} ${ouvrier.nom}`}
            title="Imprimer ce planning"
          >
            <Printer className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden sm:grid sm:grid-cols-7 divide-x divide-gray-200">
        {joursSemaine.map((jour) => {
          const affectations = getAffectationsForDay(jour)
          const canAdd = canAddAffectation(affectations)

          return (
            <div
              key={jour.toISOString()}
              className={clsx(
                'min-h-[60px] p-2 relative',
                canAdd && onClickCelluleVide && 'cursor-pointer hover:bg-gray-50 transition-colors'
              )}
              onClick={() => handleCellClick(jour, affectations)}
            >
              {affectations.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {affectations.map((affectation) => (
                    <div
                      key={affectation.id}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CarteAffectationOuvrier
                        affectation={affectation}
                        className="w-full"
                        onClick={
                          affectation.chantier === null && onClickIndisponibilite
                            ? () => onClickIndisponibilite(ouvrier, affectation)
                            : affectation.chantier !== null && onClickAffectation
                              ? (e) => e && onClickAffectation(ouvrier, affectation, e)
                              : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-2">
                  —
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: Compact stacked view */}
      <div className="sm:hidden divide-y divide-gray-200">
        {joursSemaine.map((jour) => {
          const affectations = getAffectationsForDay(jour)
          const canAdd = canAddAffectation(affectations)

          if (affectations.length === 0 && !canAdd) return null

          return (
            <div
              key={jour.toISOString()}
              className={clsx(
                'p-3',
                canAdd && onClickCelluleVide && 'cursor-pointer active:bg-gray-50'
              )}
              onClick={() => handleCellClick(jour, affectations)}
            >
              <div className="text-xs text-gray-500 mb-1">
                {format(jour, 'EEE d', { locale: fr })}
              </div>
              {affectations.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {affectations.map((affectation) => (
                    <div
                      key={affectation.id}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CarteAffectationOuvrier
                        affectation={affectation}
                        className="w-full"
                        onClick={
                          affectation.chantier === null && onClickIndisponibilite
                            ? () => onClickIndisponibilite(ouvrier, affectation)
                            : affectation.chantier !== null && onClickAffectation
                              ? (e) => e && onClickAffectation(ouvrier, affectation, e)
                              : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400">Disponible</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
