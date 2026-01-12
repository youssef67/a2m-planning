'use client'

import { useActionState } from 'react'
import { useEffect, useRef } from 'react'
import { creerIndisponibilite, modifierIndisponibilite } from '@/actions/affectations'
import type { Ouvrier, Affectation } from '@/generated/prisma/client'

type FormState = { error?: string; success?: boolean } | null

interface FormulaireIndisponibiliteProps {
  ouvriers: Pick<Ouvrier, 'id' | 'nom' | 'prenom'>[]
  defaultOuvrierId?: number
  defaultDate?: string
  indisponibilite?: Pick<Affectation, 'id' | 'ouvrierId' | 'date' | 'periode' | 'statutPresence'>
  onSuccess?: () => void
  onCancel?: () => void
}

const STATUTS = [
  { value: 'CONGE_PAYE', label: 'Congé payé' },
  { value: 'MALADIE', label: 'Maladie' },
  { value: 'ABSENCE', label: 'Absence' },
  { value: 'FORMATION', label: 'Formation' }
] as const

export function FormulaireIndisponibilite({
  ouvriers,
  defaultOuvrierId,
  defaultDate,
  indisponibilite,
  onSuccess,
  onCancel
}: FormulaireIndisponibiliteProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = !!indisponibilite

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      if (isEditMode && indisponibilite) {
        return await modifierIndisponibilite(indisponibilite.id, formData)
      }
      return await creerIndisponibilite(formData)
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
  const defaultDateValue = indisponibilite
    ? new Date(indisponibilite.date).toISOString().split('T')[0]
    : defaultDate ?? today

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="ouvrierId" className="block text-sm font-medium text-gray-700">
          Ouvrier
        </label>
        <select
          id="ouvrierId"
          name="ouvrierId"
          required
          disabled={isEditMode}
          defaultValue={indisponibilite?.ouvrierId ?? defaultOuvrierId ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Sélectionner un ouvrier</option>
          {ouvriers.map((ouvrier) => (
            <option key={ouvrier.id} value={ouvrier.id}>
              {ouvrier.nom} {ouvrier.prenom}
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
          defaultValue={defaultDateValue}
          required
          disabled={isEditMode}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              defaultChecked={!indisponibilite || indisponibilite.periode === 'JOURNEE'}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Journée complète</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="periode"
              value="MATIN"
              defaultChecked={indisponibilite?.periode === 'MATIN'}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Matin</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="periode"
              value="APRES_MIDI"
              defaultChecked={indisponibilite?.periode === 'APRES_MIDI'}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Après-midi</span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="statutPresence" className="block text-sm font-medium text-gray-700">
          Statut
        </label>
        <select
          id="statutPresence"
          name="statutPresence"
          required
          defaultValue={indisponibilite?.statutPresence ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Sélectionner un statut</option>
          {STATUTS.map((statut) => (
            <option key={statut.value} value={statut.value}>
              {statut.label}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'En cours...' : isEditMode ? 'Modifier' : 'Créer'}
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
