'use client'

import { useState, useMemo } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import type { TypeOuvrier } from '@/generated/prisma/client'

interface Ouvrier {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

// Record<dateISO, Record<ouvrierId, raison>>
type IndisponibilitesMap = Record<string, Record<number, string>>

interface SelectionOuvriersChantierProps {
  ouvriers: Ouvrier[]
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
  joursSelectionnes?: Date[]
  indisponibilites?: IndisponibilitesMap
}

const TYPE_LABELS: Record<TypeOuvrier, string> = {
  SALARIE: 'Salarié',
  SOUS_TRAITANT: 'Sous-traitant'
}

export function SelectionOuvriersChantier({
  ouvriers,
  selectedIds,
  onSelectionChange,
  joursSelectionnes = [],
  indisponibilites = {}
}: SelectionOuvriersChantierProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOuvriers = useMemo(() => {
    if (!searchTerm.trim()) return ouvriers

    const term = searchTerm.toLowerCase().trim()
    return ouvriers.filter(
      (o) =>
        o.nom.toLowerCase().includes(term) ||
        o.prenom.toLowerCase().includes(term) ||
        `${o.prenom} ${o.nom}`.toLowerCase().includes(term)
    )
  }, [ouvriers, searchTerm])

  // Calculer les indisponibilités par ouvrier pour les jours sélectionnés
  const indisponibilitesParOuvrier = useMemo(() => {
    const result: Record<number, string[]> = {}

    for (const jour of joursSelectionnes) {
      const dateKey = format(jour, 'yyyy-MM-dd')
      const indisposDuJour = indisponibilites[dateKey]

      if (indisposDuJour) {
        for (const [ouvrierIdStr, raison] of Object.entries(indisposDuJour)) {
          const ouvrierId = parseInt(ouvrierIdStr, 10)
          if (!result[ouvrierId]) {
            result[ouvrierId] = []
          }
          result[ouvrierId].push(raison)
        }
      }
    }

    return result
  }, [joursSelectionnes, indisponibilites])

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const handleSelectAll = () => {
    const filteredIds = filteredOuvriers.map((o) => o.id)
    const allSelected = filteredIds.every((id) => selectedIds.includes(id))

    if (allSelected) {
      // Désélectionner tous les ouvriers filtrés
      onSelectionChange(selectedIds.filter((id) => !filteredIds.includes(id)))
    } else {
      // Sélectionner tous les ouvriers filtrés
      const newSelection = new Set([...selectedIds, ...filteredIds])
      onSelectionChange(Array.from(newSelection))
    }
  }

  const filteredSelectedCount = filteredOuvriers.filter((o) =>
    selectedIds.includes(o.id)
  ).length
  const allFiltersSelected =
    filteredOuvriers.length > 0 && filteredSelectedCount === filteredOuvriers.length

  return (
    <div className="space-y-3">
      {/* Champ de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un ouvrier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Header avec sélection globale */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {selectedIds.length} ouvrier{selectedIds.length > 1 ? 's' : ''} sélectionné
          {selectedIds.length > 1 ? 's' : ''}
        </span>
        {filteredOuvriers.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-800"
          >
            {allFiltersSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        )}
      </div>

      {/* Liste des ouvriers */}
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
        {filteredOuvriers.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {searchTerm ? 'Aucun ouvrier trouvé' : 'Aucun ouvrier disponible'}
          </div>
        ) : (
          filteredOuvriers.map((ouvrier) => {
            const isSelected = selectedIds.includes(ouvrier.id)
            const indispos = indisponibilitesParOuvrier[ouvrier.id]
            const hasIndisponibilite = indispos && indispos.length > 0

            return (
              <label
                key={ouvrier.id}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(ouvrier.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {ouvrier.prenom} {ouvrier.nom}
                    </span>
                    {hasIndisponibilite && (
                      <span
                        title={`Indisponible: ${[...new Set(indispos)].join(', ')}`}
                        className="flex-shrink-0"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {TYPE_LABELS[ouvrier.type]}
                    {hasIndisponibilite && (
                      <span className="text-amber-600 ml-1">
                        ({indispos.length} indispo.)
                      </span>
                    )}
                  </div>
                </div>
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}
