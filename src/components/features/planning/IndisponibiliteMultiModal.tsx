'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Search, AlertTriangle } from 'lucide-react'
import { creerIndisponibilitesEnMasse, verifierConflitsIndisponibilite } from '@/actions/affectations'
import { useToast } from '@/components/ui/Toast'
import type { Periode, StatutPresence, TypeOuvrier } from '@/generated/prisma/client'

interface Ouvrier {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

interface ConflitAffectation {
  ouvrierId: number
  ouvrierNom: string
  date: Date
  chantierActuel: string
  periodeActuelle: string
}

interface IndisponibiliteMultiModalProps {
  isOpen: boolean
  onClose: () => void
  ouvriers: Ouvrier[]
  semaineDebut: Date
  onRefresh?: () => void
}

const PERIODE_OPTIONS: { value: Periode; label: string }[] = [
  { value: 'JOURNEE', label: 'Journée complète' },
  { value: 'MATIN', label: 'Matin' },
  { value: 'APRES_MIDI', label: 'Après-midi' }
]

const STATUT_OPTIONS: { value: StatutPresence; label: string }[] = [
  { value: 'CONGE_PAYE', label: 'Congé payé' },
  { value: 'MALADIE', label: 'Maladie' },
  { value: 'ABSENCE', label: 'Absence' },
  { value: 'FORMATION', label: 'Formation' }
]

const TYPE_LABELS: Record<TypeOuvrier, string> = {
  SALARIE: 'Salarié',
  SOUS_TRAITANT: 'Sous-traitant'
}

export function IndisponibiliteMultiModal({
  isOpen,
  onClose,
  ouvriers,
  semaineDebut,
  onRefresh
}: IndisponibiliteMultiModalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [selectedOuvrierIds, setSelectedOuvrierIds] = useState<number[]>([])
  const [joursSelectionnes, setJoursSelectionnes] = useState<boolean[]>(Array(7).fill(false))
  const [periode, setPeriode] = useState<Periode>('JOURNEE')
  const [statutPresence, setStatutPresence] = useState<StatutPresence>('ABSENCE')
  const [searchTerm, setSearchTerm] = useState('')
  const [conflits, setConflits] = useState<ConflitAffectation[]>([])
  const [isCheckingConflits, setIsCheckingConflits] = useState(false)

  // Generate week days
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

  // Filter ouvriers by search
  const filteredOuvriers = useMemo(() => {
    if (!searchTerm.trim()) return ouvriers

    const term = searchTerm.toLowerCase().trim()
    return ouvriers.filter(
      (o) =>
        o.nom.toLowerCase().includes(term) ||
        o.prenom.toLowerCase().includes(term) ||
        `${o.prenom} ${o.nom}`.toLowerCase().includes(term)
    )
  }, [ouvriers, searchTerm])

  // Check if all days are selected
  const tousJoursSelectionnes = joursSelectionnes.every(Boolean)
  const aucunJourSelectionne = joursSelectionnes.every((j) => !j)

  // Check if all filtered ouvriers are selected
  const filteredSelectedCount = filteredOuvriers.filter((o) => selectedOuvrierIds.includes(o.id)).length
  const tousOuvriersSelectionnes = filteredOuvriers.length > 0 && filteredSelectedCount === filteredOuvriers.length

  const handleToggleJour = (index: number) => {
    setJoursSelectionnes((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
    setConflits([])
  }

  const handleToutSelectionnerJours = () => {
    setJoursSelectionnes(Array(7).fill(!tousJoursSelectionnes))
    setConflits([])
  }

  const handleToggleOuvrier = (id: number) => {
    if (selectedOuvrierIds.includes(id)) {
      setSelectedOuvrierIds(selectedOuvrierIds.filter((selectedId) => selectedId !== id))
    } else {
      setSelectedOuvrierIds([...selectedOuvrierIds, id])
    }
    setConflits([])
  }

  const handleToutSelectionnerOuvriers = () => {
    const filteredIds = filteredOuvriers.map((o) => o.id)
    if (tousOuvriersSelectionnes) {
      setSelectedOuvrierIds(selectedOuvrierIds.filter((id) => !filteredIds.includes(id)))
    } else {
      const newSelection = new Set([...selectedOuvrierIds, ...filteredIds])
      setSelectedOuvrierIds(Array.from(newSelection))
    }
    setConflits([])
  }

  const handleCheckConflits = async () => {
    if (selectedOuvrierIds.length === 0 || aucunJourSelectionne) return

    setIsCheckingConflits(true)
    try {
      const selectedDates = joursSemaine
        .filter((_, i) => joursSelectionnes[i])
        .map((j) => format(j.date, 'yyyy-MM-dd'))

      const result = await verifierConflitsIndisponibilite({
        ouvrierIds: selectedOuvrierIds,
        dates: selectedDates,
        periode
      })

      setConflits(result.conflits || [])
    } catch (error) {
      console.error('Erreur vérification conflits:', error)
    } finally {
      setIsCheckingConflits(false)
    }
  }

  const handleConfirm = async () => {
    if (selectedOuvrierIds.length === 0 || aucunJourSelectionne) return

    const selectedDates = joursSemaine
      .filter((_, i) => joursSelectionnes[i])
      .map((j) => format(j.date, 'yyyy-MM-dd'))

    startTransition(async () => {
      const result = await creerIndisponibilitesEnMasse({
        ouvrierIds: selectedOuvrierIds,
        dates: selectedDates,
        periode,
        statutPresence,
        ecraserConflits: true
      })

      if ('error' in result && result.error) {
        showToast(result.error, 'error')
      } else if ('success' in result) {
        const message = result.conflitsEcrases && result.conflitsEcrases > 0
          ? `${result.count} indisponibilité(s) créée(s), ${result.conflitsEcrases} affectation(s) écrasée(s)`
          : `${result.count} indisponibilité(s) créée(s)`
        showToast(message, 'success')
        handleClose()
        router.refresh()
        onRefresh?.()
      }
    })
  }

  const handleClose = () => {
    setSelectedOuvrierIds([])
    setJoursSelectionnes(Array(7).fill(false))
    setPeriode('JOURNEE')
    setStatutPresence('ABSENCE')
    setSearchTerm('')
    setConflits([])
    onClose()
  }

  if (!isOpen) return null

  const canSubmit = selectedOuvrierIds.length > 0 && !aucunJourSelectionne && !isPending

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity z-40"
          onClick={handleClose}
        />
        <div className="relative z-50 bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nouvelle indisponibilité
          </h2>

          {/* Sélection des ouvriers */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ouvriers
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un ouvrier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">
                {selectedOuvrierIds.length} ouvrier{selectedOuvrierIds.length > 1 ? 's' : ''} sélectionné
                {selectedOuvrierIds.length > 1 ? 's' : ''}
              </span>
              {filteredOuvriers.length > 0 && (
                <button
                  type="button"
                  onClick={handleToutSelectionnerOuvriers}
                  className="text-orange-600 hover:text-orange-800"
                >
                  {tousOuvriersSelectionnes ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>

            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
              {filteredOuvriers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'Aucun ouvrier trouvé' : 'Aucun ouvrier disponible'}
                </div>
              ) : (
                filteredOuvriers.map((ouvrier) => {
                  const isSelected = selectedOuvrierIds.includes(ouvrier.id)

                  return (
                    <label
                      key={ouvrier.id}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleOuvrier(ouvrier.id)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {ouvrier.prenom} {ouvrier.nom}
                          </span>
                          {ouvrier.type === 'SOUS_TRAITANT' && (
                            <span className="text-gray-400">🔧</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {TYPE_LABELS[ouvrier.type]}
                        </div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* Sélection des jours */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Jours de la semaine
              </span>
              <button
                type="button"
                onClick={handleToutSelectionnerJours}
                className="text-sm text-orange-600 hover:text-orange-800"
              >
                {tousJoursSelectionnes ? 'Tout désélectionner' : 'Tout sélectionner'}
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
                          ? 'bg-orange-600 text-white'
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
            <div className="flex gap-4">
              {PERIODE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="periode"
                    value={option.value}
                    checked={periode === option.value}
                    onChange={(e) => {
                      setPeriode(e.target.value as Periode)
                      setConflits([])
                    }}
                    className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sélection du motif */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUT_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="statutPresence"
                    value={option.value}
                    checked={statutPresence === option.value}
                    onChange={(e) => setStatutPresence(e.target.value as StatutPresence)}
                    className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Avertissement conflits */}
          {conflits.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {conflits.length} affectation(s) seront écrasées
                  </p>
                  <ul className="mt-1 text-xs text-yellow-700 space-y-1">
                    {conflits.slice(0, 5).map((conflit, i) => (
                      <li key={i}>
                        {conflit.ouvrierNom} - {format(new Date(conflit.date), 'd MMM', { locale: fr })} ({conflit.chantierActuel})
                      </li>
                    ))}
                    {conflits.length > 5 && (
                      <li>...et {conflits.length - 5} autre(s)</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Bouton vérifier les conflits */}
          {canSubmit && conflits.length === 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleCheckConflits}
                disabled={isCheckingConflits}
                className="text-sm text-orange-600 hover:text-orange-800 disabled:opacity-50"
              >
                {isCheckingConflits ? 'Vérification...' : 'Vérifier les conflits'}
              </button>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Création...' : 'Valider'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
