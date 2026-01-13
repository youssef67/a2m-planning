import { memo } from 'react'
import type { StatistiquesMois } from '@/lib/comptage'

interface CelluleComptageProps {
  stats: StatistiquesMois
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function CelluleComptageInner({ stats }: CelluleComptageProps) {
  const { joursTravailles, conges, absences } = stats

  return (
    <div className="flex flex-col text-xs leading-tight py-1">
      <span className="text-gray-900">{formatNumber(joursTravailles)}j</span>
      <span className="text-blue-600">{formatNumber(conges)}c</span>
      <span className="text-red-600">{formatNumber(absences)}a</span>
    </div>
  )
}

export const CelluleComptage = memo(CelluleComptageInner)
