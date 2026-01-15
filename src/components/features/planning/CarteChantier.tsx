import { clsx } from 'clsx'
import { format } from 'date-fns'
import { BadgeOuvrier } from './BadgeOuvrier'
import type { StatutChantier, Periode, TypeOuvrier } from '@/generated/prisma/client'

interface Affectation {
  id: number
  date: Date
  periode: Periode
  ouvrier: {
    id: number
    nom: string
    prenom: string
    type: TypeOuvrier
  }
}

interface ChantierData {
  id: number
  nom: string
  statut: StatutChantier
  affectations: Affectation[]
}

interface CarteChantierProps {
  chantier: ChantierData
  joursSemaine: Date[]
}

function groupAffectationsByDay(
  affectations: Affectation[],
  joursSemaine: Date[]
): Map<string, Affectation[]> {
  const map = new Map<string, Affectation[]>()

  joursSemaine.forEach((jour) => {
    const key = format(jour, 'yyyy-MM-dd')
    map.set(key, [])
  })

  affectations.forEach((affectation) => {
    const key = format(new Date(affectation.date), 'yyyy-MM-dd')
    const existing = map.get(key)
    if (existing) {
      existing.push(affectation)
    }
  })

  return map
}

export function CarteChantier({ chantier, joursSemaine }: CarteChantierProps) {
  const isEnPause = chantier.statut === 'EN_PAUSE'
  const affectationsByDay = groupAffectationsByDay(chantier.affectations, joursSemaine)

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border shadow-sm overflow-hidden',
        isEnPause ? 'opacity-60 border-gray-300' : 'border-gray-200'
      )}
    >
      <div
        className={clsx(
          'px-4 py-3 border-b',
          isEnPause ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'
        )}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{chantier.nom}</h3>
          {isEnPause && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
              En pause
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 divide-x divide-gray-200">
        {joursSemaine.map((jour) => {
          const key = format(jour, 'yyyy-MM-dd')
          const affectations = affectationsByDay.get(key) || []

          return (
            <div key={key} className="min-h-[80px] p-2 flex flex-col">
              <div className="flex flex-col gap-1 flex-1">
                {affectations.map((affectation) => (
                  <div key={affectation.id} className="flex-1 flex">
                    <BadgeOuvrier
                      ouvrier={affectation.ouvrier}
                      periode={affectation.periode}
                      className="w-full"
                    />
                  </div>
                ))}
                {affectations.length === 0 && (
                  <span className="text-xs text-gray-400 italic flex-1 flex items-center justify-center">-</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
