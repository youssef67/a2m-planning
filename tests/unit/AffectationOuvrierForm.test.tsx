import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AffectationOuvrierForm } from '@/components/features/planning/AffectationOuvrierForm'

// Mock server actions
vi.mock('@/actions/affectations', () => ({
  creerAffectation: vi.fn()
}))

const mockChantiers = [
  { id: 1, nom: 'Chantier Alpha', statut: 'ACTIF' as const },
  { id: 2, nom: 'Chantier Beta', statut: 'EN_PAUSE' as const },
  { id: 3, nom: 'Chantier Gamma', statut: 'TERMINE' as const }
]

describe('AffectationOuvrierForm', () => {
  it('should render chantier select field', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
      />
    )

    expect(screen.getByLabelText('Chantier')).toBeInTheDocument()
  })

  it('should render date input field', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
      />
    )

    expect(screen.getByLabelText('Date')).toBeInTheDocument()
  })

  it('should render periode radio buttons', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
      />
    )

    expect(screen.getByLabelText('Journée complète')).toBeInTheDocument()
    expect(screen.getByLabelText('Matin')).toBeInTheDocument()
    expect(screen.getByLabelText('Après-midi')).toBeInTheDocument()
  })

  it('should have Journée selected by default', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
      />
    )

    const journeeRadio = screen.getByLabelText('Journée complète') as HTMLInputElement
    expect(journeeRadio.checked).toBe(true)
  })

  it('should display ACTIF chantiers in dropdown', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
      />
    )

    expect(screen.getByText('Chantier Alpha')).toBeInTheDocument()
  })

  it('should display EN_PAUSE chantiers with label in dropdown', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
      />
    )

    expect(screen.getByText('Chantier Beta (en pause)')).toBeInTheDocument()
  })

  it('should NOT display TERMINE chantiers in dropdown', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
      />
    )

    expect(screen.queryByText('Chantier Gamma')).not.toBeInTheDocument()
  })

  it('should pre-fill date when provided', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
        date="2026-01-15"
      />
    )

    const dateInput = screen.getByLabelText('Date') as HTMLInputElement
    expect(dateInput.value).toBe('2026-01-15')
  })

  it('should render submit button with "Créer" text', () => {
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
      />
    )

    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument()
  })

  it('should render cancel button when onCancel is provided', () => {
    const onCancel = vi.fn()
    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={mockChantiers}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
  })

  it('should include hidden ouvrierId field', () => {
    const { container } = render(
      <AffectationOuvrierForm
        ouvrierId={42}
        chantiers={mockChantiers}
      />
    )

    const hiddenInput = container.querySelector('input[name="ouvrierId"]') as HTMLInputElement
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput.value).toBe('42')
    expect(hiddenInput.type).toBe('hidden')
  })

  it('should sort chantiers with ACTIF first', () => {
    const chantiersUnsorted = [
      { id: 1, nom: 'Zulu Chantier', statut: 'EN_PAUSE' as const },
      { id: 2, nom: 'Alpha Chantier', statut: 'ACTIF' as const }
    ]

    render(
      <AffectationOuvrierForm
        ouvrierId={1}
        chantiers={chantiersUnsorted}
      />
    )

    const select = screen.getByLabelText('Chantier')
    const options = select.querySelectorAll('option')

    // First option is placeholder, second should be ACTIF chantier
    expect(options[1].textContent).toBe('Alpha Chantier')
    expect(options[2].textContent).toBe('Zulu Chantier (en pause)')
  })
})
