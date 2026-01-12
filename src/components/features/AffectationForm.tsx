'use client'

import { useActionState } from 'react'
import { useEffect, useRef } from 'react'
import { creerAffectation } from '@/actions/affectations'
import type { Ouvrier } from '@/generated/prisma/client'

type FormState = { error?: string; success?: boolean } | null

interface AffectationFormProps {
  chantierId: number
  date?: string
  ouvriers: Pick<Ouvrier, 'id' | 'nom' | 'prenom' | 'type'>[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function AffectationForm({
  chantierId,
  date,
  ouvriers,
  onSuccess,
  onCancel
}: AffectationFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
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

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="chantierId" value={chantierId} />

      <div>
        <label htmlFor="ouvrierId" className="block text-sm font-medium text-gray-700">
          Ouvrier
        </label>
        <select
          id="ouvrierId"
          name="ouvrierId"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Sélectionner un ouvrier</option>
          {ouvriers.map((ouvrier) => (
            <option key={ouvrier.id} value={ouvrier.id}>
              {ouvrier.nom} {ouvrier.prenom} ({ouvrier.type === 'SALARIE' ? 'Salarié' : 'Sous-traitant'})
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
