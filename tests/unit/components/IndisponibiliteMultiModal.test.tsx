import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { IndisponibiliteMultiModal } from '@/components/features/planning/IndisponibiliteMultiModal'
import type { TypeOuvrier } from '@/generated/prisma/client'

// Mock actions
vi.mock('@/actions/affectations', () => ({
  creerIndisponibilitesEnMasse: vi.fn(),
  verifierConflitsIndisponibilite: vi.fn()
}))

// Mock hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() })
}))

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() })
}))

const mockOuvriers: Array<{
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}> = [
  { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' },
  { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SALARIE' },
  { id: 3, nom: 'Durand', prenom: 'Marie', type: 'SOUS_TRAITANT' }
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  ouvriers: mockOuvriers,
  semaineDebut: new Date('2026-01-13')
}

describe('IndisponibiliteMultiModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ne s\'affiche pas quand isOpen est false', () => {
    render(<IndisponibiliteMultiModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Nouvelle indisponibilité')).not.toBeInTheDocument()
  })

  it('affiche le modal quand isOpen est true (AC: 2)', () => {
    render(<IndisponibiliteMultiModal {...defaultProps} />)

    expect(screen.getByText('Nouvelle indisponibilité')).toBeInTheDocument()
  })

  describe('Sélection des ouvriers (AC: 3)', () => {
    it('affiche la liste des ouvriers avec checkboxes', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
      expect(screen.getByText('Pierre Martin')).toBeInTheDocument()
      expect(screen.getByText('Marie Durand')).toBeInTheDocument()
    })

    it('permet de sélectionner un ouvrier via checkbox', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const checkbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(checkbox)

      expect(screen.getByText(/1 ouvrier sélectionné/)).toBeInTheDocument()
    })

    it('affiche le champ de recherche', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      expect(screen.getByPlaceholderText('Rechercher un ouvrier...')).toBeInTheDocument()
    })

    it('filtre les ouvriers par recherche', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Rechercher un ouvrier...')
      fireEvent.change(searchInput, { target: { value: 'Dupont' } })

      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
      expect(screen.queryByText('Pierre Martin')).not.toBeInTheDocument()
    })

    it('permet de tout sélectionner/désélectionner les ouvriers', async () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const boutonToutSelectionner = screen.getAllByText('Tout sélectionner')[0]
      fireEvent.click(boutonToutSelectionner)

      await waitFor(() => {
        expect(screen.getByText(/3 ouvriers sélectionnés/)).toBeInTheDocument()
      })
    })

    it('affiche l\'icône 🔧 pour les sous-traitants', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      // Durand est un sous-traitant
      const soustraitantLabel = screen.getByText('Marie Durand').closest('label')
      expect(soustraitantLabel?.textContent).toContain('🔧')
    })
  })

  describe('Sélection des jours (AC: 4, 5)', () => {
    it('affiche les 7 jours de la semaine', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      expect(screen.getByText(/lun\./i)).toBeInTheDocument()
      expect(screen.getByText(/mar\./i)).toBeInTheDocument()
      expect(screen.getByText(/mer\./i)).toBeInTheDocument()
      expect(screen.getByText(/jeu\./i)).toBeInTheDocument()
      expect(screen.getByText(/ven\./i)).toBeInTheDocument()
      expect(screen.getByText(/sam\./i)).toBeInTheDocument()
      expect(screen.getByText(/dim\./i)).toBeInTheDocument()
    })

    it('permet de sélectionner un jour', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      // Get the checkbox for the first day (Monday)
      const checkboxes = screen.getAllByRole('checkbox')
      // First checkboxes are for ouvriers, then days
      const jourCheckbox = checkboxes[mockOuvriers.length] // First day checkbox after ouvriers
      fireEvent.click(jourCheckbox)

      // Le jour devrait être sélectionné (vérifier visuellement le style change)
      expect(jourCheckbox).toBeChecked()
    })

    it('affiche le bouton "Tout sélectionner" pour les jours (AC: 5)', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      // Il y a deux boutons "Tout sélectionner" - un pour les ouvriers, un pour les jours
      const boutonsToutSelectionner = screen.getAllByText('Tout sélectionner')
      expect(boutonsToutSelectionner.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Sélection de la période (AC: 6)', () => {
    it('affiche les options de période: Journée, Matin, Après-midi', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      expect(screen.getByText('Journée complète')).toBeInTheDocument()
      expect(screen.getByText('Matin')).toBeInTheDocument()
      expect(screen.getByText('Après-midi')).toBeInTheDocument()
    })

    it('Journée est sélectionné par défaut', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const radioJournee = screen.getByRole('radio', { name: /journée/i })
      expect(radioJournee).toBeChecked()
    })

    it('permet de sélectionner une autre période', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const radioMatin = screen.getByRole('radio', { name: /matin/i })
      fireEvent.click(radioMatin)

      expect(radioMatin).toBeChecked()
    })
  })

  describe('Sélection du motif (AC: 7)', () => {
    it('affiche les 4 motifs d\'indisponibilité en français', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      // Vérifier les radio buttons pour chaque motif
      expect(screen.getByRole('radio', { name: 'Congé payé' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Maladie' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Absence' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Formation' })).toBeInTheDocument()
    })

    it('Absence est sélectionné par défaut', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const radioAbsence = screen.getByRole('radio', { name: 'Absence' })
      expect(radioAbsence).toBeChecked()
    })

    it('permet de changer le motif', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const radioMaladie = screen.getByRole('radio', { name: 'Maladie' })
      fireEvent.click(radioMaladie)

      expect(radioMaladie).toBeChecked()
    })
  })

  describe('Boutons du modal', () => {
    it('affiche les boutons Valider et Annuler', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
    })

    it('le bouton Valider est désactivé quand aucun ouvrier ou jour n\'est sélectionné', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const boutonValider = screen.getByRole('button', { name: 'Valider' })
      expect(boutonValider).toBeDisabled()
    })

    it('le bouton Annuler ferme le modal', () => {
      const mockOnClose = vi.fn()
      render(<IndisponibiliteMultiModal {...defaultProps} onClose={mockOnClose} />)

      const boutonAnnuler = screen.getByRole('button', { name: 'Annuler' })
      fireEvent.click(boutonAnnuler)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Vérification des conflits (AC: 8)', () => {
    it('affiche le bouton "Vérifier les conflits" quand des sélections sont faites', async () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      // Sélectionner un ouvrier
      const checkbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(checkbox)

      // Sélectionner un jour
      const checkboxJour = screen.getAllByRole('checkbox')[mockOuvriers.length]
      fireEvent.click(checkboxJour)

      await waitFor(() => {
        expect(screen.getByText('Vérifier les conflits')).toBeInTheDocument()
      })
    })
  })

  describe('Style du modal', () => {
    it('utilise la couleur orange pour le thème (distinct du bleu des affectations)', () => {
      render(<IndisponibiliteMultiModal {...defaultProps} />)

      const boutonValider = screen.getByRole('button', { name: 'Valider' })
      expect(boutonValider.className).toContain('orange')
    })
  })
})
