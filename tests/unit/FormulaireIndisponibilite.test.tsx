import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormulaireIndisponibilite } from '@/components/features/planning/FormulaireIndisponibilite'

// Mock server actions
vi.mock('@/actions/affectations', () => ({
  creerIndisponibilite: vi.fn(),
  modifierIndisponibilite: vi.fn()
}))

const mockOuvriers = [
  { id: 1, nom: 'Dupont', prenom: 'Jean' },
  { id: 2, nom: 'Martin', prenom: 'Pierre' }
]

describe('FormulaireIndisponibilite', () => {
  it('should render ouvrier select field', () => {
    render(<FormulaireIndisponibilite ouvriers={mockOuvriers} />)

    expect(screen.getByLabelText('Ouvrier')).toBeInTheDocument()
    expect(screen.getByText('Dupont Jean')).toBeInTheDocument()
    expect(screen.getByText('Martin Pierre')).toBeInTheDocument()
  })

  it('should render date input field', () => {
    render(<FormulaireIndisponibilite ouvriers={mockOuvriers} />)

    expect(screen.getByLabelText('Date')).toBeInTheDocument()
  })

  it('should render periode radio buttons', () => {
    render(<FormulaireIndisponibilite ouvriers={mockOuvriers} />)

    expect(screen.getByLabelText('Journée complète')).toBeInTheDocument()
    expect(screen.getByLabelText('Matin')).toBeInTheDocument()
    expect(screen.getByLabelText('Après-midi')).toBeInTheDocument()
  })

  it('should render statut select with all indisponibilité options', () => {
    render(<FormulaireIndisponibilite ouvriers={mockOuvriers} />)

    expect(screen.getByLabelText('Statut')).toBeInTheDocument()
    expect(screen.getByText('Congé payé')).toBeInTheDocument()
    expect(screen.getByText('Maladie')).toBeInTheDocument()
    expect(screen.getByText('Absence')).toBeInTheDocument()
    expect(screen.getByText('Formation')).toBeInTheDocument()
  })

  it('should NOT render TRAVAIL as a statut option', () => {
    render(<FormulaireIndisponibilite ouvriers={mockOuvriers} />)

    expect(screen.queryByText('Travail')).not.toBeInTheDocument()
  })

  it('should render submit button with "Créer" text in create mode', () => {
    render(<FormulaireIndisponibilite ouvriers={mockOuvriers} />)

    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument()
  })

  it('should render submit button with "Modifier" text in edit mode', () => {
    const indisponibilite = {
      id: 1,
      ouvrierId: 1,
      date: new Date('2026-01-15'),
      periode: 'JOURNEE' as const,
      statutPresence: 'CONGE_PAYE' as const
    }

    render(
      <FormulaireIndisponibilite
        ouvriers={mockOuvriers}
        indisponibilite={indisponibilite}
      />
    )

    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  })

  it('should pre-fill ouvrier when defaultOuvrierId is provided', () => {
    render(
      <FormulaireIndisponibilite
        ouvriers={mockOuvriers}
        defaultOuvrierId={2}
      />
    )

    const select = screen.getByLabelText('Ouvrier') as HTMLSelectElement
    expect(select.value).toBe('2')
  })

  it('should render cancel button when onCancel is provided', () => {
    const onCancel = vi.fn()
    render(
      <FormulaireIndisponibilite
        ouvriers={mockOuvriers}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
  })

  it('should disable ouvrier and date fields in edit mode', () => {
    const indisponibilite = {
      id: 1,
      ouvrierId: 1,
      date: new Date('2026-01-15'),
      periode: 'JOURNEE' as const,
      statutPresence: 'CONGE_PAYE' as const
    }

    render(
      <FormulaireIndisponibilite
        ouvriers={mockOuvriers}
        indisponibilite={indisponibilite}
      />
    )

    expect(screen.getByLabelText('Ouvrier')).toBeDisabled()
    expect(screen.getByLabelText('Date')).toBeDisabled()
  })
})
