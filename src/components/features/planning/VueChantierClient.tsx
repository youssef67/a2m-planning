'use client'

import { useState, useCallback, useOptimistic, useRef } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MenuContextuelAffectation, type OptimisticUpdate } from './MenuContextuelAffectation'
import { BadgeOuvrier } from './BadgeOuvrier'
import { clsx } from 'clsx'
import type { StatutChantier, Periode, TypeOuvrier, StatutPresence } from '@/generated/prisma/client'

interface Affectation {
  id: number
  date: Date
  periode: Periode
  chantierId: number | null
  ouvrier: {
    id: number
    nom: string
    prenom: string
    type: TypeOuvrier
  }
}

interface Chantier {
  id: number
  nom: string
  statut: StatutChantier
  affectations: Affectation[]
}

interface ChantierActif {
  id: number
  nom: string
}

interface VueChantierClientProps {
  chantiers: Chantier[]
  chantiersActifs: ChantierActif[]
  joursSemaine: Date[]
}

interface MenuState {
  isOpen: boolean
  position: { x: number; y: number }
  affectation: Affectation | null
  chantierId: number
}

const joursAbrevies = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Flatten all affectations for optimistic updates
function flattenAffectations(chantiers: Chantier[]): Map<number, Affectation> {
  const map = new Map<number, Affectation>()
  chantiers.forEach((chantier) => {
    chantier.affectations.forEach((aff) => {
      // Ensure chantierId is set from the parent chantier
      map.set(aff.id, { ...aff, chantierId: aff.chantierId ?? chantier.id })
    })
  })
  return map
}

// Reconstruct chantiers from optimistic affectations map
function reconstructChantiers(
  originalChantiers: Chantier[],
  affectationsMap: Map<number, Affectation>
): Chantier[] {
  return originalChantiers.map((chantier) => ({
    ...chantier,
    affectations: Array.from(affectationsMap.values())
      .filter((aff) => aff.chantierId === chantier.id)
  }))
}

export function VueChantierClient({
  chantiers: initialChantiers,
  chantiersActifs,
  joursSemaine
}: VueChantierClientProps) {
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    affectation: null,
    chantierId: 0
  })

  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  // Optimistic state for affectations
  const [optimisticAffectations, updateOptimisticAffectations] = useOptimistic(
    flattenAffectations(initialChantiers),
    (state, update: OptimisticUpdate) => {
      const newState = new Map(state)

      switch (update.type) {
        case 'reassign': {
          const aff = state.get(update.id)
          if (aff) {
            newState.set(update.id, { ...aff, chantierId: update.chantierId })
          }
          break
        }
        case 'delete': {
          newState.delete(update.id)
          break
        }
        case 'periode': {
          const aff = state.get(update.id)
          if (aff) {
            newState.set(update.id, { ...aff, periode: update.periode })
          }
          break
        }
        case 'indisponibilite': {
          const aff = state.get(update.id)
          if (aff) {
            newState.set(update.id, { ...aff, chantierId: null })
          }
          break
        }
      }

      return newState
    }
  )

  const chantiers = reconstructChantiers(initialChantiers, optimisticAffectations)

  const handleAffectationClick = useCallback(
    (affectation: Affectation, chantierId: number, event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      setMenuState({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        affectation: { ...affectation, chantierId },
        chantierId
      })
    },
    []
  )

  const handleTouchStart = useCallback(
    (affectation: Affectation, chantierId: number, event: React.TouchEvent) => {
      const touch = event.touches[0]
      longPressTimer.current = setTimeout(() => {
        setMenuState({
          isOpen: true,
          position: { x: touch.clientX, y: touch.clientY },
          affectation: { ...affectation, chantierId },
          chantierId
        })
      }, 500)
    },
    []
  )

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleCloseMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isOpen: false, affectation: null }))
  }, [])

  const handleOptimisticUpdate = useCallback(
    (update: OptimisticUpdate) => {
      updateOptimisticAffectations(update)
    },
    [updateOptimisticAffectations]
  )

  if (chantiers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Aucun chantier actif ou en pause trouvé.</p>
        <p className="text-gray-400 text-sm mt-2">
          Créez un chantier pour commencer à planifier.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header row with days */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-200 bg-gray-50">
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

        {/* Chantier cards */}
        <div className="space-y-4 overflow-x-auto">
          {chantiers.map((chantier) => (
            <ChantierCard
              key={chantier.id}
              chantier={chantier}
              joursSemaine={joursSemaine}
              onAffectationClick={handleAffectationClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
          ))}
        </div>
      </div>

      {menuState.isOpen && menuState.affectation && (
        <MenuContextuelAffectation
          affectation={menuState.affectation}
          chantiers={chantiersActifs}
          position={menuState.position}
          onClose={handleCloseMenu}
          onOptimisticUpdate={handleOptimisticUpdate}
        />
      )}
    </>
  )
}

// Internal ChantierCard component with click handlers
interface ChantierCardProps {
  chantier: Chantier
  joursSemaine: Date[]
  onAffectationClick: (affectation: Affectation, chantierId: number, event: React.MouseEvent) => void
  onTouchStart: (affectation: Affectation, chantierId: number, event: React.TouchEvent) => void
  onTouchEnd: () => void
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

function ChantierCard({
  chantier,
  joursSemaine,
  onAffectationClick,
  onTouchStart,
  onTouchEnd
}: ChantierCardProps) {
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
            <div key={key} className="min-h-[80px] p-2">
              <div className="flex flex-col gap-1">
                {affectations.map((affectation) => (
                  <div
                    key={affectation.id}
                    onClick={(e) => onAffectationClick(affectation, chantier.id, e)}
                    onTouchStart={(e) => onTouchStart(affectation, chantier.id, e)}
                    onTouchEnd={onTouchEnd}
                    onTouchCancel={onTouchEnd}
                  >
                    <BadgeOuvrier
                      ouvrier={affectation.ouvrier}
                      periode={affectation.periode}
                      className="cursor-pointer hover:ring-2 hover:ring-blue-300"
                    />
                  </div>
                ))}
                {affectations.length === 0 && (
                  <span className="text-xs text-gray-400 italic">-</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
