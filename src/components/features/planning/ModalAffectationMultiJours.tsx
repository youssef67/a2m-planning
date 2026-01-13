'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Periode } from '@/generated/prisma/client'

const PERIODE_OPTIONS: { value: Periode; label: string }[] = [
  { value: 'JOURNEE', label: 'Journée complète' },
  { value: 'MATIN', label: 'Matin' },
  { value: 'APRES_MIDI', label: 'Après-midi' }
]

export interface ConflitAffectation {
  ouvrierId: number
  ouvrierNom: string
  date: Date
  chantierActuel: string
  periodeActuelle: Periode
}

export interface JourSelection {
  date: Date
  label: string
  checked: boolean
}

export interface ModalAffectationMultiJoursProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (jours: Date[], periode: Periode) => Promise<void>
  titre: string
  semaineDebut: Date
  renderContent?: (joursSelectionnes: Date[]) => ReactNode
  conflits?: ConflitAffectation[]
  isLoading?: boolean
}

export function ModalAffectationMultiJours({
  isOpen,
  onClose,
  onConfirm,
  titre,
  semaineDebut,
  renderContent,
  conflits = [],
  isLoading = false
}: ModalAffectationMultiJoursProps) {
  const [periode, setPeriode] = useState<Periode>('JOURNEE')
  const [joursSelectionnes, setJoursSelectionnes] = useState<boolean[]>(
    Array(7).fill(false)
  )

  // Générer les 7 jours de la semaine
  const joursSemaine = useMemo(() => {
    const lundiSemaine = startOfWeek(semaineDebut, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(lundiSemaine, i)
      return {
        date,
        label: format(date, 'EEE d', { locale: fr }),
        checked: joursSelectionnes[i]
      }
    })
  }, [semaineDebut, joursSelectionnes])

  // Vérifier si tous les jours sont sélectionnés
  const tousSelectionnes = joursSelectionnes.every(Boolean)
  const aucunSelectionne = joursSelectionnes.every((j) => !j)

  const handleToggleJour = (index: number) => {
    setJoursSelectionnes((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  const handleToutSelectionner = () => {
    setJoursSelectionnes(Array(7).fill(!tousSelectionnes))
  }

  const handleConfirm = async () => {
    const joursChoisis = joursSemaine
      .filter((_, i) => joursSelectionnes[i])
      .map((j) => j.date)

    if (joursChoisis.length === 0) return

    await onConfirm(joursChoisis, periode)
  }

  const handleClose = () => {
    setJoursSelectionnes(Array(7).fill(false))
    setPeriode('JOURNEE')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{titre}</h2>

          {/* Contenu personnalisé (liste ouvriers ou chantiers) */}
          {renderContent && (
            <div className="mb-4">
              {renderContent(
                joursSemaine
                  .filter((_, i) => joursSelectionnes[i])
                  .map((j) => j.date)
              )}
            </div>
          )}

          {/* Sélection des jours */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Jours de la semaine
              </span>
              <button
                type="button"
                onClick={handleToutSelectionner}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {tousSelectionnes ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {joursSemaine.map((jour, index) => (
                <label
                  key={jour.date.toISOString()}
                  className="flex flex-col items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={joursSelectionnes[index]}
                    onChange={() => handleToggleJour(index)}
                    className="sr-only peer"
                  />
                  <span
                    className={`
                      w-full py-2 px-1 text-center text-xs rounded-md transition-colors
                      min-h-[44px] flex items-center justify-center
                      ${
                        joursSelectionnes[index]
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {jour.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sélection de la période */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value as Periode)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {PERIODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Avertissement conflits */}
          {conflits.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Conflits détectés ({conflits.length})
                  </p>
                  <ul className="mt-1 text-xs text-yellow-700 space-y-1">
                    {conflits.slice(0, 5).map((conflit, i) => (
                      <li key={i}>
                        {conflit.ouvrierNom} - {format(conflit.date, 'd MMM', { locale: fr })} ({conflit.chantierActuel})
                      </li>
                    ))}
                    {conflits.length > 5 && (
                      <li>...et {conflits.length - 5} autre(s)</li>
                    )}
                  </ul>
                  <p className="mt-2 text-xs text-yellow-600">
                    Les affectations existantes seront écrasées.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || aucunSelectionne}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Création...' : 'Valider'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
