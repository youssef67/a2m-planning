'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Ouvrier } from '@/generated/prisma/client'
import { archiverOuvrier, restaurerOuvrier } from '@/actions/ouvriers'
import { ModalConfirmation } from '@/components/ui/ModalConfirmation'
import { useToast } from '@/components/ui/Toast'

interface OuvrierListItemProps {
  ouvrier: Ouvrier
  onEdit: (ouvrier: Ouvrier) => void
  isArchived?: boolean
}

export function OuvrierListItem({ ouvrier, onEdit, isArchived = false }: OuvrierListItemProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleArchiveClick = () => {
    if (isArchived) {
      // Restaurer directement sans confirmation
      executeAction()
    } else {
      // Demander confirmation pour archiver
      setShowConfirm(true)
    }
  }

  const executeAction = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', ouvrier.id.toString())

      const action = isArchived ? restaurerOuvrier : archiverOuvrier
      const result = await action(formData)

      if (result?.error) {
        setError(result.error)
        showToast(result.error, 'error')
      } else {
        showToast(isArchived ? 'Ouvrier restauré' : 'Ouvrier archivé', 'success')
        router.refresh()
      }
      setShowConfirm(false)
    })
  }

  const handleConfirm = () => {
    executeAction()
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  return (
    <>
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
          {error && (
            <span className="text-sm text-red-600">{error}</span>
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

          <button
            type="button"
            onClick={handleArchiveClick}
            disabled={isPending}
            className={`px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
              isArchived
                ? 'text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 focus:ring-green-500'
                : 'text-red-700 bg-red-50 border border-red-300 hover:bg-red-100 focus:ring-red-500'
            }`}
          >
            {isPending ? '...' : isArchived ? 'Restaurer' : 'Archiver'}
          </button>
        </div>
      </div>

      <ModalConfirmation
        isOpen={showConfirm}
        title="Archiver cet ouvrier ?"
        message={`Voulez-vous vraiment archiver ${ouvrier.prenom} ${ouvrier.nom} ? L'ouvrier ne sera plus visible dans les listes mais pourra être restauré.`}
        confirmLabel="Archiver"
        cancelLabel="Annuler"
        variant="warning"
        isLoading={isPending}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
