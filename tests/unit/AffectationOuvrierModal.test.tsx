import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AffectationOuvrierModal } from '@/components/features/planning/AffectationOuvrierModal'

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh
  })
}))

// Mock server actions
vi.mock('@/actions/affectations', () => ({
  creerAffectation: vi.fn()
}))

const mockChantiers = [
  { id: 1, nom: 'Chantier Alpha', statut: 'ACTIF' as const },
  { id: 2, nom: 'Chantier Beta', statut: 'EN_PAUSE' as const }
]

describe('AffectationOuvrierModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefresh.mockClear()
  })

  it('should not render when isOpen is false', () => {
    render(
      <AffectationOuvrierModal
        ouvrierId={1}
        ouvrierNom="Jean Dupont"
        chantiers={mockChantiers}
        isOpen={false}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText('Ajouter une affectation')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <AffectationOuvrierModal
        ouvrierId={1}
        ouvrierNom="Jean Dupont"
        chantiers={mockChantiers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Ajouter une affectation')).toBeInTheDocument()
  })

  it('should display ouvrier name in header', () => {
    render(
      <AffectationOuvrierModal
        ouvrierId={1}
        ouvrierNom="Jean Dupont"
        chantiers={mockChantiers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
  })

  it('should render AffectationOuvrierForm inside modal', () => {
    render(
      <AffectationOuvrierModal
        ouvrierId={1}
        ouvrierNom="Jean Dupont"
        chantiers={mockChantiers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // Form elements should be present
    expect(screen.getByLabelText('Chantier')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument()
  })

  it('should pass date prop to form when provided', () => {
    render(
      <AffectationOuvrierModal
        ouvrierId={1}
        ouvrierNom="Jean Dupont"
        date="2026-01-20"
        chantiers={mockChantiers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const dateInput = screen.getByLabelText('Date') as HTMLInputElement
    expect(dateInput.value).toBe('2026-01-20')
  })

  it('should render cancel button', () => {
    render(
      <AffectationOuvrierModal
        ouvrierId={1}
        ouvrierNom="Jean Dupont"
        chantiers={mockChantiers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
  })

  it('should render backdrop overlay', () => {
    const { container } = render(
      <AffectationOuvrierModal
        ouvrierId={1}
        ouvrierNom="Jean Dupont"
        chantiers={mockChantiers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const backdrop = container.querySelector('.bg-black\\/50')
    expect(backdrop).toBeInTheDocument()
  })
})
