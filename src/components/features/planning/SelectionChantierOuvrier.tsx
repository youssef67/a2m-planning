'use client'

import { useState, useMemo } from 'react'
import { Search, Building2 } from 'lucide-react'
import type { StatutChantier } from '@/generated/prisma/client'

interface Chantier {
  id: number
  nom: string
  statut: StatutChantier
}

interface SelectionChantierOuvrierProps {
  chantiers: Chantier[]
  selectedId: number | null
  onSelectionChange: (id: number | null) => void
}

export function SelectionChantierOuvrier({
  chantiers,
  selectedId,
  onSelectionChange
}: SelectionChantierOuvrierProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filter only active chantiers (ACTIF status only, not EN_PAUSE)
  const chantiersActifs = useMemo(() => {
    return chantiers.filter((c) => c.statut === 'ACTIF')
  }, [chantiers])

  const filteredChantiers = useMemo(() => {
    if (!searchTerm.trim()) return chantiersActifs

    const term = searchTerm.toLowerCase().trim()
    return chantiersActifs.filter((c) => c.nom.toLowerCase().includes(term))
  }, [chantiersActifs, searchTerm])

  const selectedChantier = chantiersActifs.find((c) => c.id === selectedId)

  const handleSelect = (id: number) => {
    onSelectionChange(id)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Chantier</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className={selectedChantier ? 'text-gray-900' : 'text-gray-500'}>
            {selectedChantier ? selectedChantier.nom : 'Sélectionner un chantier'}
          </span>
          <svg
            className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            {/* Search field */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un chantier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Chantier list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredChantiers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'Aucun chantier trouvé' : 'Aucun chantier actif disponible'}
                </div>
              ) : (
                filteredChantiers.map((chantier) => (
                  <button
                    key={chantier.id}
                    type="button"
                    onClick={() => handleSelect(chantier.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      selectedId === chantier.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{chantier.nom}</span>
                    {selectedId === chantier.id && (
                      <svg
                        className="ml-auto h-4 w-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
