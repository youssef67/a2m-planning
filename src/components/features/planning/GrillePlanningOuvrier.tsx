import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clsx } from 'clsx'
import type { Periode, StatutPresence, StatutChantier } from '@/generated/prisma/client'
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
  affectations: AffectationData[]
}

interface GrillePlanningOuvrierProps {
  ouvrier: OuvrierWithAffectations
  joursSemaine: Date[]
  onClickIndisponibilite?: (affectation: AffectationData) => void
}

export function GrillePlanningOuvrier({ ouvrier, joursSemaine, onClickIndisponibilite }: GrillePlanningOuvrierProps) {
  const getAffectationsForDay = (day: Date) => {
    return ouvrier.affectations.filter((a) => isSameDay(new Date(a.date), day))
  }

  const today = new Date()

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">
          {ouvrier.prenom} {ouvrier.nom}
        </h2>
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden sm:grid sm:grid-cols-7 divide-x divide-gray-200">
        {joursSemaine.map((jour) => {
          const affectations = getAffectationsForDay(jour)
          const isToday = isSameDay(jour, today)

          return (
            <div key={jour.toISOString()} className="min-h-[120px]">
              <div
                className={clsx(
                  'px-2 py-2 text-center border-b border-gray-200 text-sm',
                  isToday ? 'bg-blue-50' : 'bg-gray-50'
                )}
              >
                <div className="font-medium text-gray-900 capitalize">
                  {format(jour, 'EEE', { locale: fr })}
                </div>
                <div className={clsx('text-xs', isToday ? 'text-blue-600 font-semibold' : 'text-gray-500')}>
                  {format(jour, 'd MMM', { locale: fr })}
                </div>
              </div>

              <div className="p-2 space-y-2">
                {affectations.length > 0 ? (
                  affectations.map((affectation) => (
                    <CarteAffectationOuvrier
                      key={affectation.id}
                      affectation={affectation}
                      onClick={affectation.chantier === null && onClickIndisponibilite
                        ? () => onClickIndisponibilite(affectation)
                        : undefined}
                    />
                  ))
                ) : (
                  <div className="text-xs text-gray-400 text-center py-4">
                    —
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: Stacked day view */}
      <div className="sm:hidden divide-y divide-gray-200">
        {joursSemaine.map((jour) => {
          const affectations = getAffectationsForDay(jour)
          const isToday = isSameDay(jour, today)

          return (
            <div key={jour.toISOString()} className="p-3">
              <div
                className={clsx(
                  'text-sm font-medium mb-2 capitalize',
                  isToday ? 'text-blue-600' : 'text-gray-900'
                )}
              >
                {format(jour, 'EEEE d MMM', { locale: fr })}
                {isToday && <span className="ml-2 text-xs">(aujourd&apos;hui)</span>}
              </div>

              {affectations.length > 0 ? (
                <div className="space-y-2">
                  {affectations.map((affectation) => (
                    <CarteAffectationOuvrier
                      key={affectation.id}
                      affectation={affectation}
                      onClick={affectation.chantier === null && onClickIndisponibilite
                        ? () => onClickIndisponibilite(affectation)
                        : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Pas d&apos;affectation</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
