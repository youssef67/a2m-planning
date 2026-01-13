'use client'

import { useActionState } from 'react'
import { useEffect, useRef } from 'react'
import { creerChantier, modifierChantier } from '@/actions/chantiers'
import { useToast } from '@/components/ui/Toast'
import type { Chantier } from '@/generated/prisma/client'

type FormState = { error?: string; success?: boolean } | null

interface ChantierFormProps {
  chantier?: Chantier | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function ChantierForm({ chantier, onSuccess, onCancel }: ChantierFormProps) {
  const isEdit = !!chantier
  const formRef = useRef<HTMLFormElement>(null)
  const { showToast } = useToast()

  const action = isEdit ? modifierChantier : creerChantier

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
      showToast(isEdit ? 'Chantier modifié avec succès' : 'Chantier créé avec succès', 'success')
      onSuccess?.()
    }
  }, [state?.success, onSuccess, showToast, isEdit])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={chantier.id} />}

      <div>
        <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
          Nom
        </label>
        <input
          type="text"
          id="nom"
          name="nom"
          defaultValue={chantier?.nom ?? ''}
          placeholder="Entrez le nom du chantier"
          required
          maxLength={200}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
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
