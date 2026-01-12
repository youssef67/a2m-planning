'use client'

import { useState, useCallback, useMemo } from 'react'
import type { Chantier, StatutChantier } from '@/generated/prisma/client'
import { ChantierForm } from './ChantierForm'
import { ChantierListItem } from './ChantierListItem'
import { ChantierStatutModal } from './ChantierStatutModal'

type FilterValue = StatutChantier | 'TOUS'

interface ChantiersClientProps {
  chantiers: Chantier[]
}

export function ChantiersClient({ chantiers }: ChantiersClientProps) {
  const [filter, setFilter] = useState<FilterValue>('ACTIF')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null)
  const [statutModalOpen, setStatutModalOpen] = useState(false)
  const [statutChantier, setStatutChantier] = useState<Chantier | null>(null)
  const [targetStatut, setTargetStatut] = useState<StatutChantier | null>(null)

  const filteredChantiers = useMemo(() => {
    if (filter === 'TOUS') return chantiers
    return chantiers.filter((c) => c.statut === filter)
  }, [chantiers, filter])

  const openCreateModal = useCallback(() => {
    setEditingChantier(null)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((chantier: Chantier) => {
    setEditingChantier(chantier)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingChantier(null)
  }, [])

  const openStatutModal = useCallback((chantier: Chantier, statut: StatutChantier) => {
    setStatutChantier(chantier)
    setTargetStatut(statut)
    setStatutModalOpen(true)
  }, [])

  const closeStatutModal = useCallback(() => {
    setStatutModalOpen(false)
    setStatutChantier(null)
    setTargetStatut(null)
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chantiers</h1>
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterValue)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ACTIF">Actifs</option>
            <option value="EN_PAUSE">En pause</option>
            <option value="TERMINE">Terminés</option>
            <option value="TOUS">Tous</option>
          </select>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Ajouter un chantier
          </button>
        </div>
      </div>

      {/* Liste des chantiers */}
      {filteredChantiers.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {filter === 'TOUS'
            ? 'Aucun chantier'
            : filter === 'ACTIF'
              ? 'Aucun chantier actif'
              : filter === 'EN_PAUSE'
                ? 'Aucun chantier en pause'
                : 'Aucun chantier terminé'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredChantiers.map((chantier) => (
            <ChantierListItem
              key={chantier.id}
              chantier={chantier}
              onEdit={openEditModal}
              onChangeStatut={openStatutModal}
            />
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={closeModal}
            />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingChantier ? 'Modifier le chantier' : 'Ajouter un chantier'}
              </h2>
              <ChantierForm
                chantier={editingChantier}
                onSuccess={closeModal}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Status Change */}
      {statutModalOpen && statutChantier && targetStatut && (
        <ChantierStatutModal
          chantier={statutChantier}
          targetStatut={targetStatut}
          onClose={closeStatutModal}
        />
      )}
    </div>
  )
}
