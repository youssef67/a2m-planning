'use client'

import { useActionState } from 'react'
import { useEffect, useRef, useState } from 'react'
import { changerStatutChantier } from '@/actions/chantiers'
import type { Chantier, StatutChantier } from '@/generated/prisma/client'

type FormState = { error?: string; success?: boolean } | null

interface ChantierStatutModalProps {
  chantier: Chantier
  targetStatut: StatutChantier
  onClose: () => void
}

const statutLabels: Record<StatutChantier, string> = {
  ACTIF: 'Actif',
  EN_PAUSE: 'En pause',
  TERMINE: 'Terminé'
}

export function ChantierStatutModal({ chantier, targetStatut, onClose }: ChantierStatutModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [confirmed, setConfirmed] = useState(false)

  const isTerminer = targetStatut === 'TERMINE'
  const isEnPause = targetStatut === 'EN_PAUSE'

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const result = await changerStatutChantier(formData)
      return result
    },
    null
  )

  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state?.success, onClose])

  // For "Terminer" action, show confirmation first
  if (isTerminer && !confirmed) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la terminaison
            </h2>
            <p className="text-gray-600 mb-6">
              Voulez-vous vraiment marquer le chantier &quot;{chantier.nom}&quot; comme terminé ?
              <br />
              <span className="text-sm text-gray-500">Cette action est irréversible.</span>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                className="flex-1 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Confirmer
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isTerminer
              ? 'Terminer le chantier'
              : isEnPause
                ? 'Mettre en pause'
                : 'Réactiver le chantier'}
          </h2>

          <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={chantier.id} />
            <input type="hidden" name="statut" value={targetStatut} />

            <p className="text-gray-600">
              Chantier: <span className="font-medium">{chantier.nom}</span>
            </p>
            <p className="text-gray-600">
              Nouveau statut: <span className="font-medium">{statutLabels[targetStatut]}</span>
            </p>

            {isEnPause && (
              <div>
                <label htmlFor="raisonPause" className="block text-sm font-medium text-gray-700">
                  Raison de la pause (optionnel)
                </label>
                <textarea
                  id="raisonPause"
                  name="raisonPause"
                  rows={3}
                  maxLength={500}
                  placeholder="Entrez la raison de la pause..."
                  className="mt-1 input-field"
                />
              </div>
            )}

            {state?.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  isTerminer
                    ? 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                    : isEnPause
                      ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {isPending ? 'En cours...' : 'Confirmer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
