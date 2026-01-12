'use client'

import { useActionState } from 'react'
import type { Ouvrier } from '@/generated/prisma/client'
import { archiverOuvrier, restaurerOuvrier } from '@/actions/ouvriers'

type ActionState = { error?: string; success?: boolean } | null

interface OuvrierListItemProps {
  ouvrier: Ouvrier
  onEdit: (ouvrier: Ouvrier) => void
  isArchived?: boolean
}

export function OuvrierListItem({ ouvrier, onEdit, isArchived = false }: OuvrierListItemProps) {
  const action = isArchived ? restaurerOuvrier : archiverOuvrier

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      if (!isArchived) {
        const confirmed = window.confirm(`Voulez-vous vraiment archiver ${ouvrier.prenom} ${ouvrier.nom} ?`)
        if (!confirmed) return null
      }
      return await action(formData)
    },
    null
  )

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3">
        <div>
          <p className="font-medium text-gray-900">
            {ouvrier.prenom} {ouvrier.nom}
            {ouvrier.type === 'SOUS_TRAITANT' && (
              <span className="ml-2" title="Sous-traitant">🔧</span>
            )}
          </p>
          <p className="text-sm text-gray-500">
            {ouvrier.type === 'SALARIE' ? 'Salarié' : 'Sous-traitant'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {state?.error && (
          <span className="text-sm text-red-600">{state.error}</span>
        )}

        {!isArchived && (
          <button
            type="button"
            onClick={() => onEdit(ouvrier)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Modifier
          </button>
        )}

        <form action={formAction}>
          <input type="hidden" name="id" value={ouvrier.id} />
          <button
            type="submit"
            disabled={isPending}
            className={`px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
              isArchived
                ? 'text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 focus:ring-green-500'
                : 'text-red-700 bg-red-50 border border-red-300 hover:bg-red-100 focus:ring-red-500'
            }`}
          >
            {isPending ? '...' : isArchived ? 'Restaurer' : 'Archiver'}
          </button>
        </form>
      </div>
    </div>
  )
}
