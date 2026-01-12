'use client'

import { useState, useCallback } from 'react'
import type { Ouvrier } from '@/generated/prisma/client'
import { OuvrierForm } from './OuvrierForm'
import { OuvrierListItem } from './OuvrierListItem'

interface OuvriersClientProps {
  ouvriersActifs: Ouvrier[]
  ouvriersArchives: Ouvrier[]
}

export function OuvriersClient({ ouvriersActifs, ouvriersArchives }: OuvriersClientProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOuvrier, setEditingOuvrier] = useState<Ouvrier | null>(null)

  const ouvriers = showArchived ? ouvriersArchives : ouvriersActifs

  const openCreateModal = useCallback(() => {
    setEditingOuvrier(null)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((ouvrier: Ouvrier) => {
    setEditingOuvrier(ouvrier)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingOuvrier(null)
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ouvriers</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Voir les archivés
          </label>
          {!showArchived && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Ajouter un ouvrier
            </button>
          )}
        </div>
      </div>

      {/* Liste des ouvriers */}
      {ouvriers.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {showArchived ? 'Aucun ouvrier archivé' : 'Aucun ouvrier actif'}
        </p>
      ) : (
        <div className="space-y-3">
          {ouvriers.map((ouvrier) => (
            <OuvrierListItem
              key={ouvrier.id}
              ouvrier={ouvrier}
              onEdit={openEditModal}
              isArchived={showArchived}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={closeModal}
            />

            {/* Modal panel */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingOuvrier ? 'Modifier l\'ouvrier' : 'Ajouter un ouvrier'}
              </h2>
              <OuvrierForm
                ouvrier={editingOuvrier}
                onSuccess={closeModal}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
