import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  describe('Bouton Indisponibilité (Story 2.16)', () => {
    it('affiche le bouton Indisponibilité dans l\'en-tête (AC: 1)', () => {
      const ouvriers: Array<{ type: TypeOuvrier }> = [{ type: 'SALARIE' }]

      render(<PlanningOuvrierHeader ouvriers={ouvriers} />)

      const boutonIndispo = screen.getByRole('button', { name: /indisponibilité/i })
      expect(boutonIndispo).toBeInTheDocument()
    })

    it('le bouton Indisponibilité a un style distinct du bouton + (AC: 12)', () => {
      const ouvriers: Array<{ type: TypeOuvrier }> = [{ type: 'SALARIE' }]

      render(<PlanningOuvrierHeader ouvriers={ouvriers} />)

      const boutonPlus = screen.getByRole('button', { name: /affectation/i })
      const boutonIndispo = screen.getByRole('button', { name: /indisponibilité/i })

      // Les deux boutons doivent être présents et distincts
      expect(boutonPlus).toBeInTheDocument()
      expect(boutonIndispo).toBeInTheDocument()
      expect(boutonPlus).not.toBe(boutonIndispo)

      // Vérifier que le bouton indispo a une couleur différente (orange vs blue)
      expect(boutonIndispo.className).toContain('orange')
    })

    it('déclenche onOpenIndisponibiliteModal au clic sur le bouton Indisponibilité', () => {
      const ouvriers: Array<{ type: TypeOuvrier }> = [{ type: 'SALARIE' }]
      const mockOnOpenIndispo = vi.fn()

      render(
        <PlanningOuvrierHeader
          ouvriers={ouvriers}
          onOpenIndisponibiliteModal={mockOnOpenIndispo}
        />
      )

      const boutonIndispo = screen.getByRole('button', { name: /indisponibilité/i })
      fireEvent.click(boutonIndispo)

      expect(mockOnOpenIndispo).toHaveBeenCalledTimes(1)
    })

    it('les deux boutons coexistent et fonctionnent indépendamment', () => {
      const ouvriers: Array<{ type: TypeOuvrier }> = [{ type: 'SALARIE' }]
      const mockOnOpenAffectation = vi.fn()
      const mockOnOpenIndispo = vi.fn()

      render(
        <PlanningOuvrierHeader
          ouvriers={ouvriers}
          onOpenAffectationModal={mockOnOpenAffectation}
          onOpenIndisponibiliteModal={mockOnOpenIndispo}
        />
      )

      const boutonPlus = screen.getByRole('button', { name: /affectation/i })
      const boutonIndispo = screen.getByRole('button', { name: /indisponibilité/i })

      fireEvent.click(boutonPlus)
      expect(mockOnOpenAffectation).toHaveBeenCalledTimes(1)
      expect(mockOnOpenIndispo).not.toHaveBeenCalled()

      fireEvent.click(boutonIndispo)
      expect(mockOnOpenIndispo).toHaveBeenCalledTimes(1)
    })
  })

  describe('Bouton Tout imprimer (Story 2.17)', () => {
    it('affiche le bouton "Tout imprimer" dans l\'en-tête (AC: 1)', () => {
      const ouvriers: Array<{ type: TypeOuvrier }> = [{ type: 'SALARIE' }]

      render(<PlanningOuvrierHeader ouvriers={ouvriers} />)

      const boutonPrint = screen.getByRole('button', { name: /imprimer/i })
      expect(boutonPrint).toBeInTheDocument()
    })

    it('le bouton Tout imprimer a un style vert distinct', () => {
      const ouvriers: Array<{ type: TypeOuvrier }> = [{ type: 'SALARIE' }]

      render(<PlanningOuvrierHeader ouvriers={ouvriers} />)

      const boutonPrint = screen.getByRole('button', { name: /imprimer/i })
      expect(boutonPrint.className).toContain('green')
    })

    it('déclenche onPrintAll au clic sur le bouton Tout imprimer (AC: 3)', () => {
      const ouvriers: Array<{ type: TypeOuvrier }> = [{ type: 'SALARIE' }]
      const mockOnPrintAll = vi.fn()

      render(
        <PlanningOuvrierHeader
          ouvriers={ouvriers}
          onPrintAll={mockOnPrintAll}
        />
      )

      const boutonPrint = screen.getByRole('button', { name: /imprimer/i })
      fireEvent.click(boutonPrint)

      expect(mockOnPrintAll).toHaveBeenCalledTimes(1)
    })

    it('les trois boutons coexistent et fonctionnent indépendamment', () => {
      const ouvriers: Array<{ type: TypeOuvrier }> = [{ type: 'SALARIE' }]
      const mockOnOpenAffectation = vi.fn()
      const mockOnOpenIndispo = vi.fn()
      const mockOnPrintAll = vi.fn()

      render(
        <PlanningOuvrierHeader
          ouvriers={ouvriers}
          onOpenAffectationModal={mockOnOpenAffectation}
          onOpenIndisponibiliteModal={mockOnOpenIndispo}
          onPrintAll={mockOnPrintAll}
        />
      )

      const boutonPlus = screen.getByRole('button', { name: /affectation/i })
      const boutonIndispo = screen.getByRole('button', { name: /indisponibilité/i })
      const boutonPrint = screen.getByRole('button', { name: /imprimer/i })

      fireEvent.click(boutonPlus)
      expect(mockOnOpenAffectation).toHaveBeenCalledTimes(1)
      expect(mockOnOpenIndispo).not.toHaveBeenCalled()
      expect(mockOnPrintAll).not.toHaveBeenCalled()

      fireEvent.click(boutonIndispo)
      expect(mockOnOpenIndispo).toHaveBeenCalledTimes(1)
      expect(mockOnPrintAll).not.toHaveBeenCalled()

      fireEvent.click(boutonPrint)
      expect(mockOnPrintAll).toHaveBeenCalledTimes(1)
    })
  })
})
