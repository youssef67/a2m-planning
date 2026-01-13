'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface SelecteurAnneeProps {
  annee: number
}

const ANNEE_DEBUT = 2024

function getAnneesDisponibles(): number[] {
  const anneeActuelle = new Date().getFullYear()
  const annees: number[] = []
  for (let a = ANNEE_DEBUT; a <= anneeActuelle; a++) {
    annees.push(a)
  }
  return annees
}

export function SelecteurAnnee({ annee }: SelecteurAnneeProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nouvelleAnnee = e.target.value
      const params = new URLSearchParams(searchParams.toString())
      params.set('annee', nouvelleAnnee)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const anneesDisponibles = getAnneesDisponibles()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="selecteur-annee" className="text-sm font-medium text-gray-700">
        Année :
      </label>
      <select
        id="selecteur-annee"
        value={annee}
        onChange={handleChange}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {anneesDisponibles.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  )
}
