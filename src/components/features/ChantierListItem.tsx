'use client'

import type { Chantier, StatutChantier } from '@/generated/prisma/client'

interface ChantierListItemProps {
  chantier: Chantier
  onEdit: (chantier: Chantier) => void
  onChangeStatut: (chantier: Chantier, statut: StatutChantier) => void
}

const statutBadgeClasses: Record<StatutChantier, string> = {
  ACTIF: 'bg-green-100 text-green-800',
  EN_PAUSE: 'bg-yellow-100 text-yellow-800',
  TERMINE: 'bg-gray-100 text-gray-500'
}

const statutLabels: Record<StatutChantier, string> = {
  ACTIF: 'Actif',
  EN_PAUSE: 'En pause',
  TERMINE: 'Terminé'
}

export function ChantierListItem({ chantier, onEdit, onChangeStatut }: ChantierListItemProps) {
  const isTermine = chantier.statut === 'TERMINE'
  const isActif = chantier.statut === 'ACTIF'
  const isEnPause = chantier.statut === 'EN_PAUSE'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-900">{chantier.nom}</p>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutBadgeClasses[chantier.statut]}`}
          >
            {statutLabels[chantier.statut]}
          </span>
        </div>
        {isEnPause && chantier.raisonPause && (
          <p className="mt-1 text-sm text-gray-500">
            Raison: {chantier.raisonPause}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {!isTermine && (
          <>
            <button
              type="button"
              onClick={() => onEdit(chantier)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Modifier
            </button>

            {isActif && (
              <button
                type="button"
                onClick={() => onChangeStatut(chantier, 'EN_PAUSE')}
                className="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Mettre en pause
              </button>
            )}

            {isEnPause && (
              <button
                type="button"
                onClick={() => onChangeStatut(chantier, 'ACTIF')}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Réactiver
              </button>
            )}

            <button
              type="button"
              onClick={() => onChangeStatut(chantier, 'TERMINE')}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Terminer
            </button>
          </>
        )}
      </div>
    </div>
  )
}
