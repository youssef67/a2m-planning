'use client'

import { useActionState } from 'react'
import { useEffect, useRef } from 'react'
import { creerOuvrier, modifierOuvrier } from '@/actions/ouvriers'
import { useToast } from '@/components/ui/Toast'
import type { Ouvrier } from '@/generated/prisma/client'

type FormState = { error?: string; success?: boolean } | null

interface OuvrierFormProps {
  ouvrier?: Ouvrier | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function OuvrierForm({ ouvrier, onSuccess, onCancel }: OuvrierFormProps) {
  const isEdit = !!ouvrier
  const formRef = useRef<HTMLFormElement>(null)
  const { showToast } = useToast()

  const action = isEdit ? modifierOuvrier : creerOuvrier

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const result = await action(formData)
      return result
    },
    null
  )

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      showToast(isEdit ? 'Ouvrier modifié avec succès' : 'Ouvrier créé avec succès', 'success')
      onSuccess?.()
    }
  }, [state?.success, onSuccess, showToast, isEdit])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={ouvrier.id} />}

      <div>
        <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
          Nom
        </label>
        <input
          type="text"
          id="nom"
          name="nom"
          defaultValue={ouvrier?.nom ?? ''}
          placeholder="Entrez le nom"
          required
          maxLength={100}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
          Prénom
        </label>
        <input
          type="text"
          id="prenom"
          name="prenom"
          defaultValue={ouvrier?.prenom ?? ''}
          placeholder="Entrez le prénom"
          required
          maxLength={100}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={ouvrier?.type ?? 'SALARIE'}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="SALARIE">Salarié</option>
          <option value="SOUS_TRAITANT">Sous-traitant</option>
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
          {isPending ? 'En cours...' : isEdit ? 'Modifier' : 'Créer'}
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
