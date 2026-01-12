'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { ChevronDown, Users } from 'lucide-react'
import type { TypeOuvrier } from '@/generated/prisma/client'

interface OuvrierListItem {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

interface ListeOuvriersProps {
  ouvriers: OuvrierListItem[]
  selectedOuvrierId: number | null
}

export function ListeOuvriers({ ouvriers, selectedOuvrierId }: ListeOuvriersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const selectedOuvrier = ouvriers.find((o) => o.id === selectedOuvrierId)

  const handleSelect = (ouvrierId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('ouvrier', String(ouvrierId))
    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">
              {selectedOuvrier
                ? `${selectedOuvrier.prenom} ${selectedOuvrier.nom}`
                : 'Sélectionner un ouvrier'}
            </span>
            {selectedOuvrier?.type === 'SOUS_TRAITANT' && (
              <span title="Sous-traitant">🔧</span>
            )}
          </div>
          <ChevronDown
            className={clsx(
              'w-5 h-5 text-gray-500 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-[calc(100%-2rem)] mx-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {ouvriers.map((ouvrier) => (
              <button
                key={ouvrier.id}
                onClick={() => handleSelect(ouvrier.id)}
                className={clsx(
                  'w-full px-4 py-3 text-left flex items-center gap-2 hover:bg-gray-50',
                  ouvrier.id === selectedOuvrierId && 'bg-blue-50'
                )}
              >
                <span className="font-medium text-gray-900">
                  {ouvrier.prenom} {ouvrier.nom}
                </span>
                {ouvrier.type === 'SOUS_TRAITANT' && (
                  <span title="Sous-traitant">🔧</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden sm:block w-64 flex-shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            Ouvriers ({ouvriers.length})
          </h2>
        </div>
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {ouvriers.map((ouvrier) => (
            <button
              key={ouvrier.id}
              onClick={() => handleSelect(ouvrier.id)}
              className={clsx(
                'w-full px-4 py-3 text-left flex items-center gap-2 border-b border-gray-100 hover:bg-gray-50 transition-colors',
                ouvrier.id === selectedOuvrierId && 'bg-blue-50 border-l-4 border-l-blue-500'
              )}
            >
              <span className="font-medium text-gray-900">
                {ouvrier.prenom} {ouvrier.nom}
              </span>
              {ouvrier.type === 'SOUS_TRAITANT' && (
                <span title="Sous-traitant">🔧</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
