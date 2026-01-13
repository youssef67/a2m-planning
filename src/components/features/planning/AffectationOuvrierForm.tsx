'use client'

import { useActionState } from 'react'
import { useEffect, useRef } from 'react'
import { creerAffectation, verifierConflitAffectation } from '@/actions/affectations'
import type { StatutChantier, Periode } from '@/generated/prisma/client'
import type { OptimisticAffectationAdd } from './VueOuvrierListeClient'
import type { ConflitPeriode } from '@/lib/affectations'

type FormState = { error?: string; success?: boolean } | null

interface ChantierOption {
  id: number
  nom: string
  statut: StatutChantier
}

interface AffectationOuvrierFormProps {
  ouvrierId: number
  date?: string
  chantiers: ChantierOption[]
  onSuccess?: () => void
  onCancel?: () => void
  onOptimisticAdd?: (affectation: OptimisticAffectationAdd) => void
  onConflict?: (conflit: ConflitPeriode, nouvellePeriode: Periode) => void
}

export function AffectationOuvrierForm({
  ouvrierId,
  date,
  chantiers,
  onSuccess,
  onCancel,
  onOptimisticAdd,
  onConflict
}: AffectationOuvrierFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const dateValue = formData.get('date') as string
      const periode = (formData.get('periode') as Periode) || 'JOURNEE'

      // Vérifier les conflits de période avant création
      if (onConflict && dateValue && periode) {
        const { conflit } = await verifierConflitAffectation(ouvrierId, dateValue, periode)
        if (conflit) {
          onConflict(conflit, periode)
          return null // Ne pas créer, le conflit sera géré par le parent
        }
      }

      // Trigger optimistic update before server action
      if (onOptimisticAdd) {
        const chantierId = Number(formData.get('chantierId'))
        const chantier = chantiers.find((c) => c.id === chantierId)

        if (chantier) {
          onOptimisticAdd({
            id: -Date.now(), // Temporary negative ID for optimistic entry
            date: new Date(dateValue),
            periode,
            statutPresence: 'TRAVAIL',
            chantier: {
              id: chantier.id,
              nom: chantier.nom,
              statut: chantier.statut
            },
            isOptimistic: true
          })
        }
      }

      const result = await creerAffectation(formData)
      return result
    },
    null
  )

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      onSuccess?.()
    }
  }, [state?.success, onSuccess])

  const today = new Date().toISOString().split('T')[0]

  // Filter and sort chantiers: ACTIF first, then EN_PAUSE, exclude TERMINE
  const chantiersDisponibles = chantiers
    .filter((c) => c.statut !== 'TERMINE')
    .sort((a, b) => {
      if (a.statut === 'ACTIF' && b.statut !== 'ACTIF') return -1
      if (a.statut !== 'ACTIF' && b.statut === 'ACTIF') return 1
      return a.nom.localeCompare(b.nom)
    })

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="ouvrierId" value={ouvrierId} />

      <div>
        <label htmlFor="chantierId" className="block text-sm font-medium text-gray-700">
          Chantier
        </label>
        <select
          id="chantierId"
          name="chantierId"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Sélectionner un chantier</option>
          {chantiersDisponibles.map((chantier) => (
            <option key={chantier.id} value={chantier.id}>
              {chantier.nom}
              {chantier.statut === 'EN_PAUSE' ? ' (en pause)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          defaultValue={date ?? today}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">Période</legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="periode"
              value="JOURNEE"
              defaultChecked
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Journée complète</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="periode"
              value="MATIN"
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Matin</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="periode"
              value="APRES_MIDI"
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Après-midi</span>
          </label>
        </div>
      </fieldset>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'En cours...' : 'Créer'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
