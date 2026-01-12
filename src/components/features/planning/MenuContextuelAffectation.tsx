'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import {
  reassignerAffectation,
  modifierPeriodeAffectation,
  supprimerAffectation,
  convertirEnIndisponibilite
} from '@/actions/affectations'
import type { Periode, StatutPresence } from '@/generated/prisma/client'

interface Chantier {
  id: number
  nom: string
}

interface AffectationData {
  id: number
  chantierId: number | null
  periode: Periode
  ouvrier: {
    id: number
    nom: string
    prenom: string
  }
}

interface MenuContextuelAffectationProps {
  affectation: AffectationData
  chantiers: Chantier[]
  position: { x: number; y: number }
  onClose: () => void
  onOptimisticUpdate?: (update: OptimisticUpdate) => void
}

export type OptimisticUpdate =
  | { type: 'reassign'; id: number; chantierId: number; chantierNom: string }
  | { type: 'delete'; id: number }
  | { type: 'periode'; id: number; periode: Periode }
  | { type: 'indisponibilite'; id: number; statutPresence: StatutPresence }

type MenuState = 'main' | 'reassign' | 'periode' | 'indisponibilite' | 'confirm-delete'

const PERIODES: { value: Periode; label: string }[] = [
  { value: 'JOURNEE', label: 'Journée' },
  { value: 'MATIN', label: 'Matin' },
  { value: 'APRES_MIDI', label: 'Après-midi' }
]

const STATUTS_INDISPONIBILITE: { value: StatutPresence; label: string }[] = [
  { value: 'CONGE_PAYE', label: 'Congé payé' },
  { value: 'MALADIE', label: 'Maladie' },
  { value: 'ABSENCE', label: 'Absence' },
  { value: 'FORMATION', label: 'Formation' }
]

export function MenuContextuelAffectation({
  affectation,
  chantiers,
  position,
  onClose,
  onOptimisticUpdate
}: MenuContextuelAffectationProps) {
  const [menuState, setMenuState] = useState<MenuState>('main')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Filter out current chantier from reassignment list
  const availableChantiers = chantiers.filter((c) => c.id !== affectation.chantierId)

  // Filter out current period from period list
  const availablePeriodes = PERIODES.filter((p) => p.value !== affectation.periode)

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('[data-menu-contextuel]')) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (menuState === 'main') {
          onClose()
        } else {
          setMenuState('main')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuState, onClose])

  const handleReassign = useCallback(
    (chantier: Chantier) => {
      setError(null)
      onOptimisticUpdate?.({
        type: 'reassign',
        id: affectation.id,
        chantierId: chantier.id,
        chantierNom: chantier.nom
      })
      onClose()

      startTransition(async () => {
        const result = await reassignerAffectation(affectation.id, chantier.id)
        if ('error' in result && result.error) {
          setError(result.error)
        }
      })
    },
    [affectation.id, onClose, onOptimisticUpdate]
  )

  const handleModifierPeriode = useCallback(
    (periode: Periode) => {
      setError(null)
      onOptimisticUpdate?.({ type: 'periode', id: affectation.id, periode })
      onClose()

      startTransition(async () => {
        const result = await modifierPeriodeAffectation(affectation.id, periode)
        if ('error' in result && result.error) {
          setError(result.error)
        }
      })
    },
    [affectation.id, onClose, onOptimisticUpdate]
  )

  const handleSupprimer = useCallback(() => {
    setError(null)
    onOptimisticUpdate?.({ type: 'delete', id: affectation.id })
    onClose()

    startTransition(async () => {
      const result = await supprimerAffectation(affectation.id)
      if ('error' in result && result.error) {
        setError(result.error)
      }
    })
  }, [affectation.id, onClose, onOptimisticUpdate])

  const handleConvertir = useCallback(
    (statutPresence: StatutPresence) => {
      setError(null)
      onOptimisticUpdate?.({ type: 'indisponibilite', id: affectation.id, statutPresence })
      onClose()

      startTransition(async () => {
        const result = await convertirEnIndisponibilite(affectation.id, statutPresence)
        if ('error' in result && result.error) {
          setError(result.error)
        }
      })
    },
    [affectation.id, onClose, onOptimisticUpdate]
  )

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 220),
    y: Math.min(position.y, window.innerHeight - 300)
  }

  return (
    <div
      data-menu-contextuel
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
      role="menu"
      aria-label="Menu d'actions pour l'affectation"
    >
      {isPending && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}

      {menuState === 'main' && (
        <>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => setMenuState('reassign')}
            role="menuitem"
          >
            <span>↔️</span>
            <span>Réaffecter</span>
            <span className="ml-auto text-gray-400">›</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => setMenuState('periode')}
            role="menuitem"
          >
            <span>🕐</span>
            <span>Modifier la période</span>
            <span className="ml-auto text-gray-400">›</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => setMenuState('indisponibilite')}
            role="menuitem"
          >
            <span>🚫</span>
            <span>Marquer indisponible</span>
            <span className="ml-auto text-gray-400">›</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            onClick={() => setMenuState('confirm-delete')}
            role="menuitem"
          >
            <span>🗑️</span>
            <span>Supprimer</span>
          </button>
        </>
      )}

      {menuState === 'reassign' && (
        <>
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => setMenuState('main')}
            role="menuitem"
          >
            <span>‹</span>
            <span>Retour</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          <div className="max-h-[200px] overflow-y-auto">
            {availableChantiers.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 italic">
                Aucun autre chantier disponible
              </div>
            ) : (
              availableChantiers.map((chantier) => (
                <button
                  key={chantier.id}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => handleReassign(chantier)}
                  role="menuitem"
                >
                  {chantier.nom}
                </button>
              ))
            )}
          </div>
        </>
      )}

      {menuState === 'periode' && (
        <>
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => setMenuState('main')}
            role="menuitem"
          >
            <span>‹</span>
            <span>Retour</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          {availablePeriodes.map((periode) => (
            <button
              key={periode.value}
              className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700"
              onClick={() => handleModifierPeriode(periode.value)}
              role="menuitem"
            >
              {periode.label}
            </button>
          ))}
        </>
      )}

      {menuState === 'indisponibilite' && (
        <>
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => setMenuState('main')}
            role="menuitem"
          >
            <span>‹</span>
            <span>Retour</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          {STATUTS_INDISPONIBILITE.map((statut) => (
            <button
              key={statut.value}
              className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 hover:text-orange-700"
              onClick={() => handleConvertir(statut.value)}
              role="menuitem"
            >
              {statut.label}
            </button>
          ))}
        </>
      )}

      {menuState === 'confirm-delete' && (
        <>
          <div className="px-4 py-3 text-sm text-gray-700">
            Supprimer cette affectation ?
          </div>
          <div className="flex gap-2 px-4 pb-3">
            <button
              className="flex-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              onClick={() => setMenuState('main')}
            >
              Annuler
            </button>
            <button
              className="flex-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
              onClick={handleSupprimer}
            >
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  )
}
