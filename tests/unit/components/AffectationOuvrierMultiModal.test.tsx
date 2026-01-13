import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AffectationOuvrierMultiModal } from '@/components/features/planning/AffectationOuvrierMultiModal'
import type { StatutChantier, TypeOuvrier } from '@/generated/prisma/client'

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}))

// Mock useToast
const mockShowToast = vi.fn()
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast
  })
}))

// Mock creerAffectationsEnMasse
vi.mock('@/actions/affectations', () => ({
  creerAffectationsEnMasse: vi.fn(() => Promise.resolve({ success: true, count: 2 }))
}))

interface Chantier {
  id: number
  nom: string
  statut: StatutChantier
}

interface Ouvrier {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

function createChantiers(): Chantier[] {
  return [
    { id: 1, nom: 'Chantier Alpha', statut: 'ACTIF' },
    { id: 2, nom: 'Chantier Beta', statut: 'ACTIF' }
  ]
}

function createOuvriers(): Ouvrier[] {
  return [
    { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' },
    { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SOUS_TRAITANT' }
  ]
}

describe('AffectationOuvrierMultiModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ne rend rien quand isOpen est false', () => {
    const { container } = render(
      <AffectationOuvrierMultiModal
        isOpen={false}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('affiche le titre "Nouvelle affectation"', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    expect(screen.getByText('Nouvelle affectation')).toBeInTheDocument()
  })

  it('affiche le sélecteur de chantier', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    expect(screen.getByText('Chantier')).toBeInTheDocument()
    expect(screen.getByText('Sélectionner un chantier')).toBeInTheDocument()
  })

  it('affiche la liste des ouvriers', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument()
  })

  it('affiche la sélection des jours de la semaine', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    expect(screen.getByText('Jours de la semaine')).toBeInTheDocument()
    // Il y a plusieurs "Tout sélectionner" (un pour les jours, un pour les ouvriers)
    const toutSelectionnerButtons = screen.getAllByText('Tout sélectionner')
    expect(toutSelectionnerButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('affiche le sélecteur de période', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    expect(screen.getByText('Période')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Journée complète')).toBeInTheDocument()
  })

  it('affiche les boutons Valider et Annuler', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    expect(screen.getByText('Valider')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()
  })

  it('appelle onClose lors du clic sur Annuler', () => {
    const onClose = vi.fn()

    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={onClose}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    fireEvent.click(screen.getByText('Annuler'))

    expect(onClose).toHaveBeenCalled()
  })

  it('désactive le bouton Valider quand aucun jour n\'est sélectionné', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    // Le bouton est désactivé par défaut car aucun jour n'est sélectionné
    const validateButton = screen.getByRole('button', { name: 'Valider' })
    expect(validateButton).toBeDisabled()
  })

  it('contient tous les éléments du formulaire', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    // Vérifier la présence de tous les éléments du formulaire
    expect(screen.getByText('Nouvelle affectation')).toBeInTheDocument()
    expect(screen.getByText('Chantier')).toBeInTheDocument()
    expect(screen.getByText('Ouvriers')).toBeInTheDocument()
    expect(screen.getByText('Jours de la semaine')).toBeInTheDocument()
    expect(screen.getByText('Période')).toBeInTheDocument()
  })

  it('le bouton Valider est désactivé si aucun jour n\'est sélectionné', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    const validateButton = screen.getByText('Valider')
    expect(validateButton).toBeDisabled()
  })

  it('affiche le label "Ouvriers"', () => {
    render(
      <AffectationOuvrierMultiModal
        isOpen={true}
        onClose={vi.fn()}
        chantiers={createChantiers()}
        ouvriers={createOuvriers()}
        semaineDebut={new Date('2024-01-15')}
      />
    )

    expect(screen.getByText('Ouvriers')).toBeInTheDocument()
  })
})
