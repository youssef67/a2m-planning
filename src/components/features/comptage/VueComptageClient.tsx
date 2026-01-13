'use client'

import { useMemo } from 'react'
import type { Ouvrier, Periode, StatutPresence } from '@/generated/prisma/client'
import { SelecteurAnnee } from './SelecteurAnnee'
import { CelluleComptage } from './CelluleComptage'
import { calculerStatistiquesAnnee, type AffectationComptage } from '@/lib/comptage'

type OuvrierAvecAffectations = Ouvrier & {
  affectations: Array<{
    date: Date
    periode: Periode
    statutPresence: StatutPresence
    chantier: { id: number } | null
  }>
}

interface VueComptageClientProps {
  ouvriers: OuvrierAvecAffectations[]
  annee: number
}

const MOIS_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
]

export function VueComptageClient({ ouvriers, annee }: VueComptageClientProps) {
  const ouvriersSalaries = ouvriers.filter((o) => o.type === 'SALARIE')
  const ouvriersSTT = ouvriers.filter((o) => o.type === 'SOUS_TRAITANT')

  const statsParOuvrier = useMemo(() => {
    const result: Record<number, ReturnType<typeof calculerStatistiquesAnnee>> = {}
    for (const ouvrier of ouvriers) {
      const affectations: AffectationComptage[] = ouvrier.affectations.map((a) => ({
        date: new Date(a.date),
        periode: a.periode,
        statutPresence: a.statutPresence,
        chantier: a.chantier
      }))
      result[ouvrier.id] = calculerStatistiquesAnnee(affectations, annee)
    }
    return result
  }, [ouvriers, annee])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{ouvriersSalaries.length}</span> ouvriers actifs
          {ouvriersSTT.length > 0 && (
            <>
              {' | '}
              <span className="font-medium">{ouvriersSTT.length}</span> sous-traitants
            </>
          )}
        </div>
        <SelecteurAnnee annee={annee} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]"
              >
                Ouvrier
              </th>
              {MOIS_LABELS.map((mois, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]"
                >
                  {mois}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ouvriers.map((ouvrier) => {
              const stats = statsParOuvrier[ouvrier.id]
              const isSousTraitant = ouvrier.type === 'SOUS_TRAITANT'

              return (
                <tr key={ouvrier.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap border-r border-gray-100">
                    <span className="text-sm font-medium text-gray-900">
                      {ouvrier.nom} {ouvrier.prenom}
                    </span>
                    {isSousTraitant && (
                      <span className="ml-2" title="Sous-traitant">
                        🔧
                      </span>
                    )}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mois) => (
                    <td
                      key={mois}
                      className="px-3 py-2 text-center whitespace-nowrap"
                    >
                      <CelluleComptage stats={stats[mois]} />
                    </td>
                  ))}
                </tr>
              )
            })}
            {ouvriers.length === 0 && (
              <tr>
                <td
                  colSpan={13}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Aucun ouvrier actif
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500 px-2">
        j = jours travaillés | <span className="text-blue-600">c = congés</span> | <span className="text-red-600">a = absences</span>
      </div>
    </div>
  )
}
