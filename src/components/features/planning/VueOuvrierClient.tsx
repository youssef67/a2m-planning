'use client'

import { useState, useCallback, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { GrillePlanningOuvrier } from './GrillePlanningOuvrier'
import { DialogIndisponibilite } from './DialogIndisponibilite'
import { AffectationOuvrierModal } from './AffectationOuvrierModal'
import { MenuContextuelAffectation, type OptimisticUpdate } from './MenuContextuelAffectation'
import type { Ouvrier, Affectation, Chantier, Periode, StatutPresence, StatutChantier } from '@/generated/prisma/client'

type AffectationData = Pick<Affectation, 'id' | 'date' | 'periode' | 'statutPresence'> & {
  chantier: Pick<Chantier, 'id' | 'nom' | 'statut'> | null
  isOptimistic?: boolean
}

export type OptimisticAffectationAdd = {
  id: number
  date: Date
  periode: Periode
  statutPresence: StatutPresence
  chantier: Pick<Chantier, 'id' | 'nom' | 'statut'>
  isOptimistic: true
}

type OptimisticAction =
  | { type: 'add'; affectation: OptimisticAffectationAdd }
  | OptimisticUpdate

type OuvrierWithAffectations = Pick<Ouvrier, 'id' | 'nom' | 'prenom' | 'type'> & {
  affectations: AffectationData[]
}

interface ChantierOption {
  id: number
  nom: string
  statut: StatutChantier
}

interface VueOuvrierClientProps {
  ouvrier: OuvrierWithAffectations
  joursSemaine: Date[]
  allOuvriers: Pick<Ouvrier, 'id' | 'nom' | 'prenom'>[]
  chantiersNonTermines: ChantierOption[]
}

type DialogMode = 'create' | 'edit'

interface ModalAffectationState {
  isOpen: boolean
  ouvrierId: number
  ouvrierNom: string
  date: string
}

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

interface MenuContextuelState {
  isOpen: boolean
  position: { x: number; y: number }
  affectation: {
    id: number
    chantierId: number | null
    periode: Periode
    ouvrier: {
      id: number
      nom: string
      prenom: string
    }
  } | null
}

export function VueOuvrierClient({
  ouvrier,
  joursSemaine,
  allOuvriers,
  chantiersNonTermines
}: VueOuvrierClientProps) {
  const router = useRouter()

  // Optimistic state for affectations
  const [optimisticAffectations, dispatchOptimistic] = useOptimistic(
    ouvrier.affectations,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [...state, action.affectation]
        case 'delete':
          return state.filter((a) => a.id !== action.id)
        case 'periode':
          return state.map((a) =>
            a.id === action.id ? { ...a, periode: action.periode } : a
          )
        case 'reassign':
          return state.map((a) =>
            a.id === action.id && a.chantier
              ? { ...a, chantier: { ...a.chantier, id: action.chantierId, nom: action.chantierNom } }
              : a
          )
        case 'indisponibilite':
          return state.map((a) =>
            a.id === action.id
              ? { ...a, chantier: null, statutPresence: action.statutPresence }
              : a
          )
      }
    }
  )

  // Create ouvrier with optimistic affectations
  const ouvrierWithOptimistic = {
    ...ouvrier,
    affectations: optimisticAffectations
  }

  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    mode: 'create'
  })

  const [modalAffectation, setModalAffectation] = useState<ModalAffectationState>({
    isOpen: false,
    ouvrierId: 0,
    ouvrierNom: '',
    date: ''
  })

  const [menuContextuel, setMenuContextuel] = useState<MenuContextuelState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    affectation: null
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

  const handleClickCelluleVide = useCallback(
    (ouvrierId: number, ouvrierNom: string, date: Date) => {
      setModalAffectation({
        isOpen: true,
        ouvrierId,
        ouvrierNom,
        date: format(date, 'yyyy-MM-dd')
      })
    },
    []
  )

  const closeModalAffectation = useCallback(() => {
    setModalAffectation((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handleOptimisticAdd = useCallback(
    (affectation: OptimisticAffectationAdd) => {
      dispatchOptimistic({ type: 'add', affectation })
    },
    [dispatchOptimistic]
  )

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  const handleClickAffectation = useCallback(
    (affectation: AffectationData, event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (affectation.chantier) {
        setMenuContextuel({
          isOpen: true,
          position: { x: event.clientX, y: event.clientY },
          affectation: {
            id: affectation.id,
            chantierId: affectation.chantier.id,
            periode: affectation.periode,
            ouvrier: {
              id: ouvrier.id,
              nom: ouvrier.nom,
              prenom: ouvrier.prenom
            }
          }
        })
      }
    },
    [ouvrier.id, ouvrier.nom, ouvrier.prenom]
  )

  const closeMenuContextuel = useCallback(() => {
    setMenuContextuel((prev) => ({ ...prev, isOpen: false, affectation: null }))
  }, [])

  const handleMenuOptimisticUpdate = useCallback(
    (update: OptimisticUpdate) => {
      dispatchOptimistic(update)
    },
    [dispatchOptimistic]
  )

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
        ouvrier={ouvrierWithOptimistic}
        joursSemaine={joursSemaine}
        onClickIndisponibilite={openEditDialog}
        onClickAffectation={handleClickAffectation}
        onClickCelluleVide={handleClickCelluleVide}
      />

      <DialogIndisponibilite
        mode={dialogState.mode}
        ouvriers={allOuvriers}
        defaultOuvrierId={ouvrier.id}
        indisponibilite={dialogState.indisponibilite}
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
      />

      <AffectationOuvrierModal
        ouvrierId={modalAffectation.ouvrierId}
        ouvrierNom={modalAffectation.ouvrierNom}
        date={modalAffectation.date}
        chantiers={chantiersNonTermines}
        isOpen={modalAffectation.isOpen}
        onClose={closeModalAffectation}
        onOptimisticAdd={handleOptimisticAdd}
        onRefresh={handleRefresh}
      />

      {menuContextuel.isOpen && menuContextuel.affectation && (
        <MenuContextuelAffectation
          affectation={menuContextuel.affectation}
          chantiers={chantiersNonTermines}
          position={menuContextuel.position}
          onClose={closeMenuContextuel}
          onOptimisticUpdate={handleMenuOptimisticUpdate}
        />
      )}
    </div>
  )
}
