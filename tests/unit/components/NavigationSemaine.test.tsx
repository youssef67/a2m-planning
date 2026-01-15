import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NavigationSemaine } from '@/components/features/planning/NavigationSemaine'

// Mock useSemaine hook
vi.mock('@/hooks/useSemaine', () => ({
  useSemaine: () => ({
    semaineCourante: new Date('2026-01-13'),
    finSemaine: new Date('2026-01-19'),
    allerSemainePrecedente: vi.fn(),
    allerSemaineSuivante: vi.fn(),
    allerADate: vi.fn(),
    allerAujourdhui: vi.fn()
  })
}))

describe('NavigationSemaine', () => {
  const originalPrint = window.print

  beforeEach(() => {
    window.print = vi.fn()
  })

  afterEach(() => {
    window.print = originalPrint
  })

  it('affiche la plage de dates de la semaine', () => {
    render(<NavigationSemaine />)

    expect(screen.getByText(/13 - 19 janv. 2026/i)).toBeInTheDocument()
  })

  it('affiche le bouton Aujourd\'hui', () => {
    render(<NavigationSemaine />)

    expect(screen.getByRole('button', { name: /aujourd'hui/i })).toBeInTheDocument()
  })

  it('affiche le bouton imprimer avec l\'icône Printer', () => {
    render(<NavigationSemaine />)

    const printButton = screen.getByRole('button', { name: /imprimer le planning/i })
    expect(printButton).toBeInTheDocument()
  })

  it('appelle window.print() au clic sur le bouton imprimer', () => {
    render(<NavigationSemaine />)

    const printButton = screen.getByRole('button', { name: /imprimer le planning/i })
    fireEvent.click(printButton)

    expect(window.print).toHaveBeenCalled()
  })

  it('le bouton imprimer a la classe no-print', () => {
    render(<NavigationSemaine />)

    const printButton = screen.getByRole('button', { name: /imprimer le planning/i })
    expect(printButton).toHaveClass('no-print')
  })

  it('affiche le texte "Imprimer" en écran large', () => {
    render(<NavigationSemaine />)

    expect(screen.getByText('Imprimer')).toBeInTheDocument()
  })

  it('affiche les boutons de navigation semaine', () => {
    render(<NavigationSemaine />)

    expect(screen.getByRole('button', { name: /semaine précédente/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /semaine suivante/i })).toBeInTheDocument()
  })

  it('affiche le sélecteur de date', () => {
    render(<NavigationSemaine />)

    expect(screen.getByLabelText(/sélectionner une date/i)).toBeInTheDocument()
  })
})
