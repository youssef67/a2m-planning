import { clsx } from 'clsx'
import type { StatutPresence } from '@/generated/prisma/client'

interface BadgeStatutPresenceProps {
  statut: StatutPresence
  className?: string
}

const statutConfig: Record<StatutPresence, { label: string; className: string }> = {
  TRAVAIL: {
    label: 'T',
    className: 'bg-blue-100 text-blue-800'
  },
  CONGE_PAYE: {
    label: 'CP',
    className: 'bg-green-100 text-green-800'
  },
  MALADIE: {
    label: 'M',
    className: 'bg-red-100 text-red-800'
  },
  ABSENCE: {
    label: 'A',
    className: 'bg-gray-100 text-gray-800'
  },
  FORMATION: {
    label: 'F',
    className: 'bg-purple-100 text-purple-800'
  }
}

export function BadgeStatutPresence({ statut, className }: BadgeStatutPresenceProps) {
  const config = statutConfig[statut]

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded',
        config.className,
        className
      )}
      title={getStatutLabel(statut)}
    >
      {config.label}
    </span>
  )
}

function getStatutLabel(statut: StatutPresence): string {
  const labels: Record<StatutPresence, string> = {
    TRAVAIL: 'Travail',
    CONGE_PAYE: 'Congé payé',
    MALADIE: 'Maladie',
    ABSENCE: 'Absence',
    FORMATION: 'Formation'
  }
  return labels[statut]
}
