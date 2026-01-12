'use client'

import { useState } from 'react'
import { GrillePlanningOuvrier } from './GrillePlanningOuvrier'
import { DialogIndisponibilite } from './DialogIndisponibilite'
import type { Ouvrier, Affectation, Chantier, Periode, StatutPresence, StatutChantier } from '@/generated/prisma/client'

type AffectationData = Pick<Affectation, 'id' | 'date' | 'periode' | 'statutPresence'> & {
  chantier: Pick<Chantier, 'id' | 'nom' | 'statut'> | null
}

type OuvrierWithAffectations = Pick<Ouvrier, 'id' | 'nom' | 'prenom' | 'type'> & {
  affectations: AffectationData[]
}

interface VueOuvrierClientProps {
  ouvrier: OuvrierWithAffectations
  joursSemaine: Date[]
  allOuvriers: Pick<Ouvrier, 'id' | 'nom' | 'prenom'>[]
}

type DialogMode = 'create' | 'edit'

interface DialogState {
  isOpen: boolean
  mode: DialogMode
  indisponibilite?: {
    id: number
    ouvrierId: number
    date: Date
    periode: Periode
    statutPresence: StatutPresence
  }
}

export function VueOuvrierClient({
  ouvrier,
  joursSemaine,
  allOuvriers
}: VueOuvrierClientProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    mode: 'create'
  })

  const openCreateDialog = () => {
    setDialogState({
      isOpen: true,
      mode: 'create'
    })
  }

  const openEditDialog = (affectation: {
    id: number
    date: Date
    periode: Periode
    statutPresence: StatutPresence
    chantier: { id: number; nom: string; statut: StatutChantier } | null
  }) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      indisponibilite: {
        id: affectation.id,
        ouvrierId: ouvrier.id,
        date: new Date(affectation.date),
        periode: affectation.periode,
        statutPresence: affectation.statutPresence
      }
    })
  }

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      mode: 'create'
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {ouvrier.nom} {ouvrier.prenom}
        </h2>
        <button
          type="button"
          onClick={openCreateDialog}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Marquer indisponible
        </button>
      </div>

      <GrillePlanningOuvrier
        ouvrier={ouvrier}
        joursSemaine={joursSemaine}
        onClickIndisponibilite={openEditDialog}
      />

      <DialogIndisponibilite
        mode={dialogState.mode}
        ouvriers={allOuvriers}
        defaultOuvrierId={ouvrier.id}
        indisponibilite={dialogState.indisponibilite}
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
      />
    </div>
  )
}
