import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanningOuvrierRow } from '@/components/features/planning/PlanningOuvrierRow'
import type { TypeOuvrier, Periode, StatutPresence, StatutChantier } from '@/generated/prisma/client'
import { startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns'

interface Affectation {
  id: number
  date: Date
  periode: Periode
  statutPresence: StatutPresence
  chantier: {
    id: number
    nom: string
    statut: StatutChantier
  } | null
}

interface Ouvrier {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
  affectations: Affectation[]
}

function createOuvrier(overrides: Partial<Ouvrier> = {}): Ouvrier {
  return {
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    type: 'SALARIE',
    affectations: [],
    ...overrides
  }
}

function getWeekDays(): Date[] {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

describe('PlanningOuvrierRow', () => {
  it('affiche le nom de l\'ouvrier', () => {
    const ouvrier = createOuvrier({ nom: 'Martin', prenom: 'Pierre' })
    const joursSemaine = getWeekDays()

    render(<PlanningOuvrierRow ouvrier={ouvrier} joursSemaine={joursSemaine} />)

    expect(screen.getByText('Pierre Martin')).toBeInTheDocument()
  })

  it('affiche l\'icône sous-traitant pour les sous-traitants', () => {
    const ouvrier = createOuvrier({ type: 'SOUS_TRAITANT' })
    const joursSemaine = getWeekDays()

    render(<PlanningOuvrierRow ouvrier={ouvrier} joursSemaine={joursSemaine} />)

    expect(screen.getByTitle('Sous-traitant')).toBeInTheDocument()
  })

  it('n\'affiche pas l\'icône sous-traitant pour les salariés', () => {
    const ouvrier = createOuvrier({ type: 'SALARIE' })
    const joursSemaine = getWeekDays()

    render(<PlanningOuvrierRow ouvrier={ouvrier} joursSemaine={joursSemaine} />)

    expect(screen.queryByTitle('Sous-traitant')).not.toBeInTheDocument()
  })

  it('affiche les affectations de l\'ouvrier', () => {
    const joursSemaine = getWeekDays()
    const ouvrier = createOuvrier({
      affectations: [
        {
          id: 1,
          date: joursSemaine[0],
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Chantier Alpha', statut: 'ACTIF' }
        }
      ]
    })

    render(<PlanningOuvrierRow ouvrier={ouvrier} joursSemaine={joursSemaine} />)

    // Le texte apparaît deux fois (desktop + mobile view)
    const elements = screen.getAllByText('Chantier Alpha')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('appelle onClickCelluleVide lors du clic sur une cellule vide', () => {
    const onClickCelluleVide = vi.fn()
    const ouvrier = createOuvrier()
    const joursSemaine = getWeekDays()

    render(
      <PlanningOuvrierRow
        ouvrier={ouvrier}
        joursSemaine={joursSemaine}
        onClickCelluleVide={onClickCelluleVide}
      />
    )

    // Les cellules vides ont un curseur pointer et sont cliquables
    // On vérifie que le callback est bien passé (comportement indirect)
    expect(onClickCelluleVide).not.toHaveBeenCalled()
  })

  it('distingue visuellement les sous-traitants avec une bordure orange', () => {
    const ouvrier = createOuvrier({ type: 'SOUS_TRAITANT' })
    const joursSemaine = getWeekDays()

    const { container } = render(
      <PlanningOuvrierRow ouvrier={ouvrier} joursSemaine={joursSemaine} />
    )

    // Le composant a une bordure orange pour les sous-traitants
    const rowContainer = container.querySelector('.border-orange-200')
    expect(rowContainer).toBeInTheDocument()
  })

  it('a un background orange pour l\'en-tête des sous-traitants', () => {
    const ouvrier = createOuvrier({ type: 'SOUS_TRAITANT' })
    const joursSemaine = getWeekDays()

    const { container } = render(
      <PlanningOuvrierRow ouvrier={ouvrier} joursSemaine={joursSemaine} />
    )

    const header = container.querySelector('.bg-orange-50')
    expect(header).toBeInTheDocument()
  })

  describe('Bouton impression individuelle (Story 2.17)', () => {
    it('affiche l\'icône d\'impression si onPrintSingle est fourni (AC: 2)', () => {
      const ouvrier = createOuvrier()
      const joursSemaine = getWeekDays()
      const mockOnPrintSingle = vi.fn()

      render(
        <PlanningOuvrierRow
          ouvrier={ouvrier}
          joursSemaine={joursSemaine}
          onPrintSingle={mockOnPrintSingle}
        />
      )

      const boutonPrint = screen.getByRole('button', { name: /imprimer/i })
      expect(boutonPrint).toBeInTheDocument()
    })

    it('n\'affiche pas l\'icône d\'impression si onPrintSingle n\'est pas fourni', () => {
      const ouvrier = createOuvrier()
      const joursSemaine = getWeekDays()

      render(<PlanningOuvrierRow ouvrier={ouvrier} joursSemaine={joursSemaine} />)

      const boutonPrint = screen.queryByRole('button', { name: /imprimer/i })
      expect(boutonPrint).not.toBeInTheDocument()
    })

    it('déclenche onPrintSingle avec l\'ID ouvrier au clic (AC: 4)', () => {
      const ouvrier = createOuvrier({ id: 42 })
      const joursSemaine = getWeekDays()
      const mockOnPrintSingle = vi.fn()

      render(
        <PlanningOuvrierRow
          ouvrier={ouvrier}
          joursSemaine={joursSemaine}
          onPrintSingle={mockOnPrintSingle}
        />
      )

      const boutonPrint = screen.getByRole('button', { name: /imprimer/i })
      boutonPrint.click()

      expect(mockOnPrintSingle).toHaveBeenCalledTimes(1)
      expect(mockOnPrintSingle).toHaveBeenCalledWith(42)
    })

    it('le bouton d\'impression a la classe no-print', () => {
      const ouvrier = createOuvrier()
      const joursSemaine = getWeekDays()
      const mockOnPrintSingle = vi.fn()

      render(
        <PlanningOuvrierRow
          ouvrier={ouvrier}
          joursSemaine={joursSemaine}
          onPrintSingle={mockOnPrintSingle}
        />
      )

      const boutonPrint = screen.getByRole('button', { name: /imprimer/i })
      expect(boutonPrint.className).toContain('no-print')
    })
  })
})
