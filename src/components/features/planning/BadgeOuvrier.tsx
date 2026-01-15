import { clsx } from 'clsx'
import { BadgePeriode } from './BadgePeriode'
import type { Periode, TypeOuvrier } from '@/generated/prisma/client'

interface BadgeOuvrierProps {
  ouvrier: {
    id: number
    nom: string
    prenom: string
    type: TypeOuvrier
  }
  periode: Periode
  onClick?: () => void
  className?: string
}

function formatNom(prenom: string, nom: string): string {
  const prenomAbrege = prenom.length > 10 ? `${prenom.charAt(0)}.` : prenom
  return `${prenomAbrege} ${nom}`
}

export function BadgeOuvrier({ ouvrier, periode, onClick, className }: BadgeOuvrierProps) {
  const isSousTraitant = ouvrier.type === 'SOUS_TRAITANT'
  const nomComplet = formatNom(ouvrier.prenom, ouvrier.nom)

  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm h-full',
        'bg-gray-50 border border-gray-200',
        onClick && 'cursor-pointer hover:bg-gray-100 transition-colors',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {isSousTraitant && <span aria-label="Sous-traitant">🔧</span>}
      <span className="text-gray-800">{nomComplet}</span>
      <BadgePeriode periode={periode} />
    </div>
  )
}
