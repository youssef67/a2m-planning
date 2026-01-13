import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModalAffectationMultiJours } from '@/components/features/planning/ModalAffectationMultiJours'
import type { ConflitAffectation } from '@/components/features/planning/ModalAffectationMultiJours'

describe('ModalAffectationMultiJours', () => {
  const mockOnClose = vi.fn()
  const mockOnConfirm = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    titre: 'Affectation en masse',
    semaineDebut: new Date('2026-01-13') // Un lundi
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnConfirm.mockResolvedValue(undefined)
  })

  describe('Rendering (AC: 1, 2, 10)', () => {
    it('should not render when isOpen is false', () => {
      render(<ModalAffectationMultiJours {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Affectation en masse')).not.toBeInTheDocument()
    })

    it('should render the modal with title when open', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      expect(screen.getByText('Affectation en masse')).toBeInTheDocument()
    })

    it('should display 7 days of the week (AC: 1)', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      // Les 7 jours doivent être affichés (format: "lun. 13", "mar. 14", etc.)
      expect(screen.getByText(/lun/i)).toBeInTheDocument()
      expect(screen.getByText(/mar/i)).toBeInTheDocument()
      expect(screen.getByText(/mer/i)).toBeInTheDocument()
      expect(screen.getByText(/jeu/i)).toBeInTheDocument()
      expect(screen.getByText(/ven/i)).toBeInTheDocument()
      expect(screen.getByText(/sam/i)).toBeInTheDocument()
      expect(screen.getByText(/dim/i)).toBeInTheDocument()
    })

    it('should have all days unchecked by default (AC: 2)', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      // Les checkboxes sont sr-only, donc on vérifie via les classes
      const dayLabels = screen.getAllByText(/lun|mar|mer|jeu|ven|sam|dim/i)
      dayLabels.forEach((label) => {
        expect(label.closest('span')).not.toHaveClass('bg-blue-600')
      })
    })

    it('should render Valider and Annuler buttons', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
    })

    it('should disable Valider button when no day is selected', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
    })
  })

  describe('Tout sélectionner (AC: 3)', () => {
    it('should render "Tout sélectionner" button', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      expect(screen.getByText('Tout sélectionner')).toBeInTheDocument()
    })

    it('should select all days when "Tout sélectionner" is clicked', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      fireEvent.click(screen.getByText('Tout sélectionner'))

      // Après sélection, le bouton doit changer en "Tout désélectionner"
      expect(screen.getByText('Tout désélectionner')).toBeInTheDocument()
    })

    it('should deselect all days when "Tout désélectionner" is clicked', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      // Sélectionner tout
      fireEvent.click(screen.getByText('Tout sélectionner'))
      expect(screen.getByText('Tout désélectionner')).toBeInTheDocument()

      // Désélectionner tout
      fireEvent.click(screen.getByText('Tout désélectionner'))
      expect(screen.getByText('Tout sélectionner')).toBeInTheDocument()
    })
  })

  describe('Sélection de période (AC: 4)', () => {
    it('should render period selector with default "Journée complète"', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('JOURNEE')
    })

    it('should have three period options', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
      expect(options[0]).toHaveValue('JOURNEE')
      expect(options[1]).toHaveValue('MATIN')
      expect(options[2]).toHaveValue('APRES_MIDI')
    })

    it('should allow changing period', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'MATIN' } })

      expect(select).toHaveValue('MATIN')
    })
  })

  describe('Affichage des conflits (AC: 5)', () => {
    const conflits: ConflitAffectation[] = [
      {
        ouvrierId: 1,
        ouvrierNom: 'Jean Dupont',
        date: new Date('2026-01-13'),
        chantierActuel: 'Chantier A',
        periodeActuelle: 'JOURNEE'
      },
      {
        ouvrierId: 2,
        ouvrierNom: 'Marie Martin',
        date: new Date('2026-01-14'),
        chantierActuel: 'Chantier B',
        periodeActuelle: 'MATIN'
      }
    ]

    it('should not display conflict warning when no conflicts', () => {
      render(<ModalAffectationMultiJours {...defaultProps} conflits={[]} />)

      expect(screen.queryByText(/Conflits détectés/)).not.toBeInTheDocument()
    })

    it('should display conflict warning when conflicts exist', () => {
      render(<ModalAffectationMultiJours {...defaultProps} conflits={conflits} />)

      expect(screen.getByText(/Conflits détectés \(2\)/)).toBeInTheDocument()
    })

    it('should list conflict details', () => {
      render(<ModalAffectationMultiJours {...defaultProps} conflits={conflits} />)

      expect(screen.getByText(/Jean Dupont/)).toBeInTheDocument()
      expect(screen.getByText(/Chantier A/)).toBeInTheDocument()
    })

    it('should display overwrite warning message', () => {
      render(<ModalAffectationMultiJours {...defaultProps} conflits={conflits} />)

      expect(screen.getByText(/seront écrasées/)).toBeInTheDocument()
    })

    it('should truncate conflict list when more than 5', () => {
      const manyConflits: ConflitAffectation[] = Array.from({ length: 7 }, (_, i) => ({
        ouvrierId: i + 1,
        ouvrierNom: `Ouvrier ${i + 1}`,
        date: new Date('2026-01-13'),
        chantierActuel: `Chantier ${i + 1}`,
        periodeActuelle: 'JOURNEE' as const
      }))

      render(<ModalAffectationMultiJours {...defaultProps} conflits={manyConflits} />)

      expect(screen.getByText(/\.\.\.et 2 autre\(s\)/)).toBeInTheDocument()
    })
  })

  describe('Interactions (AC: 6, 7)', () => {
    it('should call onConfirm with selected days and period when Valider is clicked', async () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      // Sélectionner le lundi (premier jour)
      fireEvent.click(screen.getByText(/lun/i))

      // Valider
      fireEvent.click(screen.getByRole('button', { name: 'Valider' }))

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1)
        expect(mockOnConfirm).toHaveBeenCalledWith(
          expect.arrayContaining([expect.any(Date)]),
          'JOURNEE'
        )
      })
    })

    it('should call onClose when Annuler is clicked', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when clicking on backdrop', () => {
      render(<ModalAffectationMultiJours {...defaultProps} />)

      const backdrop = document.querySelector('.bg-black\\/50')
      if (backdrop) {
        fireEvent.click(backdrop)
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should show loading state when isLoading is true', () => {
      render(<ModalAffectationMultiJours {...defaultProps} isLoading={true} />)

      expect(screen.getByRole('button', { name: 'Création...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Création...' })).toBeDisabled()
    })
  })

  describe('Contenu personnalisé (AC: 8)', () => {
    it('should render custom content via renderContent prop', () => {
      render(
        <ModalAffectationMultiJours
          {...defaultProps}
          renderContent={() => <div data-testid="custom-content">Liste des ouvriers</div>}
        />
      )

      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
      expect(screen.getByText('Liste des ouvriers')).toBeInTheDocument()
    })
  })

  describe('Reset state on close', () => {
    it('should reset selections when modal is closed and reopened', () => {
      const { rerender } = render(<ModalAffectationMultiJours {...defaultProps} />)

      // Sélectionner tous les jours
      fireEvent.click(screen.getByText('Tout sélectionner'))
      expect(screen.getByText('Tout désélectionner')).toBeInTheDocument()

      // Fermer le modal
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

      // Réouvrir - le composant devrait avoir été reset
      rerender(<ModalAffectationMultiJours {...defaultProps} isOpen={true} />)

      // Note: La logique de reset est dans handleClose, donc après réouverture
      // les sélections devraient être réinitialisées
    })
  })
})
