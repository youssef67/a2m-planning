import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanningOuvrierHeader } from '@/components/features/planning/PlanningOuvrierHeader'
import type { TypeOuvrier } from '@/generated/prisma/client'

describe('PlanningOuvrierHeader', () => {
  it('affiche le bon nombre de salariés', () => {
    const ouvriers: Array<{ type: TypeOuvrier }> = [
      { type: 'SALARIE' },
      { type: 'SALARIE' },
      { type: 'SALARIE' },
      { type: 'SOUS_TRAITANT' }
    ]

    render(<PlanningOuvrierHeader ouvriers={ouvriers} />)

    expect(screen.getByText('3 ouvriers actifs')).toBeInTheDocument()
  })

  it('affiche le bon nombre de sous-traitants', () => {
    const ouvriers: Array<{ type: TypeOuvrier }> = [
      { type: 'SALARIE' },
      { type: 'SOUS_TRAITANT' },
      { type: 'SOUS_TRAITANT' }
    ]

    render(<PlanningOuvrierHeader ouvriers={ouvriers} />)

    expect(screen.getByText('2 sous-traitants')).toBeInTheDocument()
  })

  it('affiche zéro quand il n\'y a pas d\'ouvriers', () => {
    const ouvriers: Array<{ type: TypeOuvrier }> = []

    render(<PlanningOuvrierHeader ouvriers={ouvriers} />)

    expect(screen.getByText('0 ouvriers actifs')).toBeInTheDocument()
    expect(screen.getByText('0 sous-traitants')).toBeInTheDocument()
  })

  it('distingue correctement salariés et sous-traitants', () => {
    const ouvriers: Array<{ type: TypeOuvrier }> = [
      { type: 'SALARIE' },
      { type: 'SALARIE' },
      { type: 'SOUS_TRAITANT' },
      { type: 'SOUS_TRAITANT' },
      { type: 'SOUS_TRAITANT' },
      { type: 'SALARIE' }
    ]

    render(<PlanningOuvrierHeader ouvriers={ouvriers} />)

    expect(screen.getByText('3 ouvriers actifs')).toBeInTheDocument()
    expect(screen.getByText('3 sous-traitants')).toBeInTheDocument()
  })
})
