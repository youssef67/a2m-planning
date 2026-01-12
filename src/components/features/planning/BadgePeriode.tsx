import { clsx } from 'clsx'
import type { Periode } from '@/generated/prisma/client'

interface BadgePeriodeProps {
  periode: Periode
  className?: string
}

const periodeConfig: Record<Periode, { label: string; className: string }> = {
  JOURNEE: {
    label: 'J',
    className: 'bg-blue-100 text-blue-800'
  },
  MATIN: {
    label: 'M',
    className: 'bg-yellow-100 text-yellow-800'
  },
  APRES_MIDI: {
    label: 'AM',
    className: 'bg-orange-100 text-orange-800'
  }
}

export function BadgePeriode({ periode, className }: BadgePeriodeProps) {
  const config = periodeConfig[periode]

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
