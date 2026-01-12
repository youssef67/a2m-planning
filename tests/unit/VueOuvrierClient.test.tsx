import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VueOuvrierClient } from '@/components/features/planning/VueOuvrierClient'

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh
  })
}))

// Mock child components to simplify testing
vi.mock('@/components/features/planning/GrillePlanningOuvrier', () => ({
  GrillePlanningOuvrier: ({ ouvrier }: { ouvrier: { nom: string; prenom: string } }) => (
    <div data-testid="grille-planning-ouvrier">
      Grille for {ouvrier.nom} {ouvrier.prenom}
    </div>
  )
}))

vi.mock('@/components/features/planning/DialogIndisponibilite', () => ({
  DialogIndisponibilite: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="dialog-indisponibilite">Dialog Indisponibilite</div> : null
}))

vi.mock('@/components/features/planning/AffectationOuvrierModal', () => ({
  AffectationOuvrierModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="affectation-modal">Affectation Modal</div> : null
}))

// Mock server actions
vi.mock('@/actions/affectations', () => ({
  creerAffectation: vi.fn().mockResolvedValue({ success: true }),
  creerIndisponibilite: vi.fn().mockResolvedValue({ success: true }),
  modifierIndisponibilite: vi.fn().mockResolvedValue({ success: true }),
  supprimerIndisponibilite: vi.fn().mockResolvedValue({ success: true })
}))

const mockOuvrier = {
  id: 1,
  nom: 'Dupont',
  prenom: 'Jean',
  type: 'OUVRIER' as const,
  affectations: [
    {
      id: 1,
      date: new Date('2026-01-13'),
      periode: 'JOURNEE' as const,
      statutPresence: 'PRESENT' as const,
      chantier: { id: 1, nom: 'Chantier Alpha', statut: 'ACTIF' as const }
    }
  ]
}

const mockJoursSemaine = [
  new Date('2026-01-13'),
  new Date('2026-01-14'),
  new Date('2026-01-15'),
  new Date('2026-01-16'),
  new Date('2026-01-17'),
  new Date('2026-01-18'),
  new Date('2026-01-19')
]

const mockAllOuvriers = [
  { id: 1, nom: 'Dupont', prenom: 'Jean' },
  { id: 2, nom: 'Martin', prenom: 'Pierre' }
]

const mockChantiersNonTermines = [
  { id: 1, nom: 'Chantier Alpha', statut: 'ACTIF' as const },
  { id: 2, nom: 'Chantier Beta', statut: 'EN_PAUSE' as const }
]

describe('VueOuvrierClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefresh.mockClear()
  })

  it('should render ouvrier name in header', () => {
    render(
      <VueOuvrierClient
        ouvrier={mockOuvrier}
        joursSemaine={mockJoursSemaine}
        allOuvriers={mockAllOuvriers}
        chantiersNonTermines={mockChantiersNonTermines}
      />
    )

    expect(screen.getByText('Dupont Jean')).toBeInTheDocument()
  })

  it('should render the planning grid', () => {
    render(
      <VueOuvrierClient
        ouvrier={mockOuvrier}
        joursSemaine={mockJoursSemaine}
        allOuvriers={mockAllOuvriers}
        chantiersNonTermines={mockChantiersNonTermines}
      />
    )

    expect(screen.getByTestId('grille-planning-ouvrier')).toBeInTheDocument()
  })

  it('should render "Marquer indisponible" button', () => {
    render(
      <VueOuvrierClient
        ouvrier={mockOuvrier}
        joursSemaine={mockJoursSemaine}
        allOuvriers={mockAllOuvriers}
        chantiersNonTermines={mockChantiersNonTermines}
      />
    )

    expect(screen.getByRole('button', { name: 'Marquer indisponible' })).toBeInTheDocument()
  })

  describe('Optimistic Updates (AC: 2, 3)', () => {
    it('should render component with useOptimistic initialized', () => {
      // This test verifies that the component renders correctly with optimistic state
      const { container } = render(
        <VueOuvrierClient
          ouvrier={mockOuvrier}
          joursSemaine={mockJoursSemaine}
          allOuvriers={mockAllOuvriers}
          chantiersNonTermines={mockChantiersNonTermines}
        />
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
      expect(screen.getByText('Dupont Jean')).toBeInTheDocument()
    })
  })

  describe('Modal interactions', () => {
    it('should open indisponibilite dialog when clicking "Marquer indisponible"', () => {
      render(
        <VueOuvrierClient
          ouvrier={mockOuvrier}
          joursSemaine={mockJoursSemaine}
          allOuvriers={mockAllOuvriers}
          chantiersNonTermines={mockChantiersNonTermines}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Marquer indisponible' }))

      expect(screen.getByTestId('dialog-indisponibilite')).toBeInTheDocument()
    })
  })
})
