'use client'

import { useState, useCallback, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PlanningOuvrierHeader } from './PlanningOuvrierHeader'
import { PlanningOuvrierRow } from './PlanningOuvrierRow'
import { DialogIndisponibilite } from './DialogIndisponibilite'
import { AffectationOuvrierModal } from './AffectationOuvrierModal'
import { AffectationOuvrierMultiModal } from './AffectationOuvrierMultiModal'
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
  | { type: 'add'; ouvrierId: number; affectation: OptimisticAffectationAdd }
  | { type: 'delete'; ouvrierId: number; id: number }
  | { type: 'periode'; ouvrierId: number; id: number; periode: Periode }
  | { type: 'reassign'; ouvrierId: number; id: number; chantierId: number; chantierNom: string }
  | { type: 'indisponibilite'; ouvrierId: number; id: number; statutPresence: StatutPresence }

type OuvrierWithAffectations = Pick<Ouvrier, 'id' | 'nom' | 'prenom' | 'type'> & {
  affectations: AffectationData[]
}

interface ChantierOption {
  id: number
  nom: string
  statut: StatutChantier
}

type IndisponibilitesMap = Record<string, Record<number, string>>

interface VueOuvrierListeClientProps {
  ouvriers: OuvrierWithAffectations[]
  joursSemaine: Date[]
  chantiersNonTermines: ChantierOption[]
  indisponiblesByDate?: IndisponibilitesMap
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
  defaultOuvrierId: number
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
  ouvrierId: number
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

const joursAbrevies = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function VueOuvrierListeClient({
  ouvriers: initialOuvriers,
  joursSemaine,
  chantiersNonTermines,
  indisponiblesByDate = {}
}: VueOuvrierListeClientProps) {
  const router = useRouter()

  // State for multi-affectation modal
  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false)

  // Optimistic state for all ouvriers
  const [optimisticOuvriers, dispatchOptimistic] = useOptimistic(
    initialOuvriers,
    (state, action: OptimisticAction) => {
      return state.map((ouvrier) => {
        if (ouvrier.id !== action.ouvrierId) return ouvrier

        switch (action.type) {
          case 'add':
            return { ...ouvrier, affectations: [...ouvrier.affectations, action.affectation] }
          case 'delete':
            return { ...ouvrier, affectations: ouvrier.affectations.filter((a) => a.id !== action.id) }
          case 'periode':
            return {
              ...ouvrier,
              affectations: ouvrier.affectations.map((a) =>
                a.id === action.id ? { ...a, periode: action.periode } : a
              )
            }
          case 'reassign':
            return {
              ...ouvrier,
              affectations: ouvrier.affectations.map((a) =>
                a.id === action.id && a.chantier
                  ? { ...a, chantier: { ...a.chantier, id: action.chantierId, nom: action.chantierNom } }
                  : a
              )
            }
          case 'indisponibilite':
            return {
              ...ouvrier,
              affectations: ouvrier.affectations.map((a) =>
                a.id === action.id ? { ...a, chantier: null, statutPresence: action.statutPresence } : a
              )
            }
        }
      })
    }
  )

  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    mode: 'create',
    defaultOuvrierId: initialOuvriers[0]?.id ?? 0
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
    ouvrierId: 0,
    affectation: null
  })

  const handleClickIndisponibilite = useCallback(
    (ouvrier: OuvrierWithAffectations, affectation: AffectationData) => {
      setDialogState({
        isOpen: true,
        mode: 'edit',
        defaultOuvrierId: ouvrier.id,
        indisponibilite: {
          id: affectation.id,
          ouvrierId: ouvrier.id,
          date: new Date(affectation.date),
          periode: affectation.periode,
          statutPresence: affectation.statutPresence
        }
      })
    },
    []
  )

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false
    }))
  }, [])

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
    (ouvrierId: number, affectation: OptimisticAffectationAdd) => {
      dispatchOptimistic({ type: 'add', ouvrierId, affectation })
    },
    [dispatchOptimistic]
  )

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  const handleClickAffectation = useCallback(
    (ouvrier: OuvrierWithAffectations, affectation: AffectationData, event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (affectation.chantier) {
        setMenuContextuel({
          isOpen: true,
          position: { x: event.clientX, y: event.clientY },
          ouvrierId: ouvrier.id,
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
    []
  )

  const closeMenuContextuel = useCallback(() => {
    setMenuContextuel((prev) => ({ ...prev, isOpen: false, affectation: null }))
  }, [])

  const handleMenuOptimisticUpdate = useCallback(
    (update: OptimisticUpdate) => {
      dispatchOptimistic({ ...update, ouvrierId: menuContextuel.ouvrierId } as OptimisticAction)
    },
    [dispatchOptimistic, menuContextuel.ouvrierId]
  )

  const handleOpenMultiModal = useCallback(() => {
    setIsMultiModalOpen(true)
  }, [])

  const handleCloseMultiModal = useCallback(() => {
    setIsMultiModalOpen(false)
  }, [])

  // Extract ouvriers for the modal (simplified version without affectations)
  const ouvriersActifs = initialOuvriers.map((o) => ({
    id: o.id,
    nom: o.nom,
    prenom: o.prenom,
    type: o.type
  }))

  if (optimisticOuvriers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Aucun ouvrier actif trouvé.</p>
        <p className="text-gray-400 text-sm mt-2">
          Créez un ouvrier pour commencer à planifier.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Header with stats and action button */}
      <PlanningOuvrierHeader
        ouvriers={initialOuvriers}
        onOpenAffectationModal={handleOpenMultiModal}
      />

      <div className="space-y-4">
        {/* Header row with days */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-7 divide-x divide-gray-200 bg-gray-50">
            {joursSemaine.map((jour, index) => (
              <div key={jour.toISOString()} className="px-2 py-3 text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {joursAbrevies[index]}
                </div>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  {format(jour, 'd MMM', { locale: fr })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ouvrier rows */}
        <div className="space-y-3">
          {optimisticOuvriers.map((ouvrier) => (
            <PlanningOuvrierRow
              key={ouvrier.id}
              ouvrier={ouvrier}
              joursSemaine={joursSemaine}
              onClickIndisponibilite={handleClickIndisponibilite}
              onClickAffectation={handleClickAffectation}
              onClickCelluleVide={handleClickCelluleVide}
            />
          ))}
        </div>
      </div>

      <DialogIndisponibilite
        mode={dialogState.mode}
        ouvriers={initialOuvriers.map((o) => ({
          id: o.id,
          nom: o.nom,
          prenom: o.prenom
        }))}
        defaultOuvrierId={dialogState.defaultOuvrierId}
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
        onOptimisticAdd={(affectation) => handleOptimisticAdd(modalAffectation.ouvrierId, affectation)}
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

      <AffectationOuvrierMultiModal
        isOpen={isMultiModalOpen}
        onClose={handleCloseMultiModal}
        chantiers={chantiersNonTermines}
        ouvriers={ouvriersActifs}
        semaineDebut={joursSemaine[0]}
        indisponibilites={indisponiblesByDate}
        onRefresh={handleRefresh}
      />
    </>
  )
}
