import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DialogIndisponibilite } from '@/components/features/planning/DialogIndisponibilite'

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh
  })
}))

// Mock server actions
vi.mock('@/actions/affectations', () => ({
  creerIndisponibilite: vi.fn(),
  modifierIndisponibilite: vi.fn(),
  supprimerIndisponibilite: vi.fn()
}))

// Mock du hook useToast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() })
}))

const mockOuvriers = [
  { id: 1, nom: 'Dupont', prenom: 'Jean' },
  { id: 2, nom: 'Martin', prenom: 'Pierre' }
]

describe('DialogIndisponibilite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefresh.mockClear()
  })

  it('should not render when isOpen is false', () => {
    render(
      <DialogIndisponibilite
        mode="create"
        ouvriers={mockOuvriers}
        isOpen={false}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText('Marquer indisponible')).not.toBeInTheDocument()
  })

  it('should render dialog in create mode', () => {
    render(
      <DialogIndisponibilite
        mode="create"
        ouvriers={mockOuvriers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Marquer indisponible')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument()
  })

  it('should render dialog in edit mode with different title', () => {
    const indisponibilite = {
      id: 1,
      ouvrierId: 1,
      date: new Date('2026-01-15'),
      periode: 'JOURNEE' as const,
      statutPresence: 'CONGE_PAYE' as const
    }

    render(
      <DialogIndisponibilite
        mode="edit"
        ouvriers={mockOuvriers}
        indisponibilite={indisponibilite}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText("Modifier l'indisponibilité")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  })

  it('should show delete button in edit mode', () => {
    const indisponibilite = {
      id: 1,
      ouvrierId: 1,
      date: new Date('2026-01-15'),
      periode: 'JOURNEE' as const,
      statutPresence: 'CONGE_PAYE' as const
    }

    render(
      <DialogIndisponibilite
        mode="edit"
        ouvriers={mockOuvriers}
        indisponibilite={indisponibilite}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Supprimer cette indisponibilité' })).toBeInTheDocument()
  })

  it('should NOT show delete button in create mode', () => {
    render(
      <DialogIndisponibilite
        mode="create"
        ouvriers={mockOuvriers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText('Supprimer cette indisponibilité')).not.toBeInTheDocument()
  })

  it('should pre-fill ouvrierId when defaultOuvrierId is provided', () => {
    render(
      <DialogIndisponibilite
        mode="create"
        ouvriers={mockOuvriers}
        defaultOuvrierId={2}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const select = screen.getByLabelText('Ouvrier') as HTMLSelectElement
    expect(select.value).toBe('2')
  })

  it('should render form fields', () => {
    render(
      <DialogIndisponibilite
        mode="create"
        ouvriers={mockOuvriers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Ouvrier')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Statut')).toBeInTheDocument()
    expect(screen.getByText('Journée complète')).toBeInTheDocument()
  })

  it('should render cancel button', () => {
    render(
      <DialogIndisponibilite
        mode="create"
        ouvriers={mockOuvriers}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
  })
})
