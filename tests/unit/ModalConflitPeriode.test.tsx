import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModalConflitPeriode } from '@/components/features/planning/ModalConflitPeriode'
import type { ConflitPeriode } from '@/lib/affectations'

describe('ModalConflitPeriode', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  const baseConflit: ConflitPeriode = {
    affectationExistante: {
      id: 1,
      date: new Date('2026-01-15'),
      periode: 'JOURNEE',
      chantier: {
        id: 1,
        nom: 'Chantier Test'
      }
    },
    typeConflit: 'JOURNEE_VERS_PARTIEL'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the modal with title', () => {
      render(
        <ModalConflitPeriode
          conflit={baseConflit}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Conflit de période')).toBeInTheDocument()
    })

    it('should render Modifier and Annuler buttons', () => {
      render(
        <ModalConflitPeriode
          conflit={baseConflit}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
    })

    it('should show loading state when isLoading is true', () => {
      render(
        <ModalConflitPeriode
          conflit={baseConflit}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      expect(screen.getByRole('button', { name: 'Modification...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Modification...' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    })
  })

  describe('Messages contextuels (AC: 2)', () => {
    it('should show correct message for JOURNEE → MATIN', () => {
      render(
        <ModalConflitPeriode
          conflit={{
            ...baseConflit,
            affectationExistante: { ...baseConflit.affectationExistante, periode: 'JOURNEE' },
            typeConflit: 'JOURNEE_VERS_PARTIEL'
          }}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/déjà affecté pour/)).toBeInTheDocument()
      expect(screen.getByText(/la journée/)).toBeInTheDocument()
      expect(screen.getByText(/Chantier Test/)).toBeInTheDocument()
      expect(screen.getByText(/le matin/)).toBeInTheDocument()
    })

    it('should show correct message for JOURNEE → APRES_MIDI', () => {
      render(
        <ModalConflitPeriode
          conflit={{
            ...baseConflit,
            affectationExistante: { ...baseConflit.affectationExistante, periode: 'JOURNEE' },
            typeConflit: 'JOURNEE_VERS_PARTIEL'
          }}
          nouvellePeriode="APRES_MIDI"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/l'après-midi/)).toBeInTheDocument()
    })

    it('should show correct message for MATIN → JOURNEE', () => {
      render(
        <ModalConflitPeriode
          conflit={{
            ...baseConflit,
            affectationExistante: { ...baseConflit.affectationExistante, periode: 'MATIN' },
            typeConflit: 'PARTIEL_VERS_JOURNEE'
          }}
          nouvellePeriode="JOURNEE"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/déjà affecté le matin/)).toBeInTheDocument()
      expect(screen.getByText(/la journée entière/)).toBeInTheDocument()
    })

    it('should show correct message for APRES_MIDI → JOURNEE', () => {
      render(
        <ModalConflitPeriode
          conflit={{
            ...baseConflit,
            affectationExistante: { ...baseConflit.affectationExistante, periode: 'APRES_MIDI' },
            typeConflit: 'PARTIEL_VERS_JOURNEE'
          }}
          nouvellePeriode="JOURNEE"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/déjà affecté l'après-midi/)).toBeInTheDocument()
    })

    it('should display chantier name in the message', () => {
      render(
        <ModalConflitPeriode
          conflit={{
            ...baseConflit,
            affectationExistante: {
              ...baseConflit.affectationExistante,
              chantier: { id: 2, nom: 'Mon Super Chantier' }
            }
          }}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/Mon Super Chantier/)).toBeInTheDocument()
    })
  })

  describe('Interactions (AC: 3, 4)', () => {
    it('should call onConfirm when Modifier button is clicked', () => {
      render(
        <ModalConflitPeriode
          conflit={baseConflit}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('should call onCancel when Annuler button is clicked', () => {
      render(
        <ModalConflitPeriode
          conflit={baseConflit}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should call onCancel when clicking on backdrop', () => {
      render(
        <ModalConflitPeriode
          conflit={baseConflit}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // The backdrop is the fixed inset-0 div with bg-black/50
      const backdrop = document.querySelector('.bg-black\\/50')
      if (backdrop) {
        fireEvent.click(backdrop)
      }

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should not call any handler when buttons are disabled', () => {
      render(
        <ModalConflitPeriode
          conflit={baseConflit}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Modification...' }))
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

      expect(mockOnConfirm).not.toHaveBeenCalled()
      expect(mockOnCancel).not.toHaveBeenCalled()
    })
  })

  describe('Visual elements', () => {
    it('should display warning icon', () => {
      render(
        <ModalConflitPeriode
          conflit={baseConflit}
          nouvellePeriode="MATIN"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // Check for the warning icon container
      const iconContainer = document.querySelector('.bg-yellow-100')
      expect(iconContainer).toBeInTheDocument()
    })
  })
})
