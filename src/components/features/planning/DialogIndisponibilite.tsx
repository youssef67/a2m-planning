'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FormulaireIndisponibilite } from './FormulaireIndisponibilite'
import { supprimerIndisponibilite } from '@/actions/affectations'
import type { Ouvrier, Affectation } from '@/generated/prisma/client'

interface DialogIndisponibiliteProps {
  mode: 'create' | 'edit'
  ouvriers: Pick<Ouvrier, 'id' | 'nom' | 'prenom'>[]
  defaultOuvrierId?: number
  defaultDate?: string
  indisponibilite?: Pick<Affectation, 'id' | 'ouvrierId' | 'date' | 'periode' | 'statutPresence'>
  isOpen: boolean
  onClose: () => void
}

export function DialogIndisponibilite({
  mode,
  ouvriers,
  defaultOuvrierId,
  defaultDate,
  indisponibilite,
  isOpen,
  onClose
}: DialogIndisponibiliteProps) {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const handleSuccess = () => {
    setShowSuccess(true)
    // Force refresh to sync with server
    router.refresh()
    setTimeout(() => {
      setShowSuccess(false)
      onClose()
    }, 1500)
  }

  const handleDelete = () => {
    if (!indisponibilite) return

    startTransition(async () => {
      const result = await supprimerIndisponibilite(indisponibilite.id)
      if (result.error) {
        setDeleteError(result.error)
        setShowDeleteConfirm(false)
      } else {
        router.refresh()
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
        }, 1500)
      }
    })
  }

  const title = mode === 'create' ? 'Marquer indisponible' : "Modifier l'indisponibilité"
  const successMessage = mode === 'create' ? 'Indisponibilité créée' : 'Indisponibilité modifiée'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">
                {successMessage}
              </p>
            </div>
          ) : showDeleteConfirm ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
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
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer cette indisponibilité ?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {title}
              </h2>

              {deleteError && (
                <p className="text-sm text-red-600 mb-4">{deleteError}</p>
              )}

              <FormulaireIndisponibilite
                ouvriers={ouvriers}
                defaultOuvrierId={defaultOuvrierId}
                defaultDate={defaultDate}
                indisponibilite={mode === 'edit' ? indisponibilite : undefined}
                onSuccess={handleSuccess}
                onCancel={onClose}
              />

              {mode === 'edit' && indisponibilite && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-4 w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Supprimer cette indisponibilité
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
