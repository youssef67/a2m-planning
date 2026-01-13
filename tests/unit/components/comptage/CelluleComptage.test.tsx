import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CelluleComptage } from '@/components/features/comptage/CelluleComptage'

describe('CelluleComptage', () => {
  it('affiche les jours travaillés', () => {
    render(<CelluleComptage stats={{ joursTravailles: 20, conges: 0, absences: 0 }} />)

    expect(screen.getByText('20j')).toBeInTheDocument()
  })

  it('affiche les congés en bleu', () => {
    render(<CelluleComptage stats={{ joursTravailles: 0, conges: 5, absences: 0 }} />)

    const conges = screen.getByText('5c')
    expect(conges).toBeInTheDocument()
    expect(conges).toHaveClass('text-blue-600')
  })

  it('affiche les absences en rouge', () => {
    render(<CelluleComptage stats={{ joursTravailles: 0, conges: 0, absences: 2 }} />)

    const absences = screen.getByText('2a')
    expect(absences).toBeInTheDocument()
    expect(absences).toHaveClass('text-red-600')
  })

  it('affiche les demi-journées avec décimale', () => {
    render(<CelluleComptage stats={{ joursTravailles: 18.5, conges: 0.5, absences: 1 }} />)

    expect(screen.getByText('18.5j')).toBeInTheDocument()
    expect(screen.getByText('0.5c')).toBeInTheDocument()
    expect(screen.getByText('1a')).toBeInTheDocument()
  })

  it('affiche les valeurs entières sans décimale', () => {
    render(<CelluleComptage stats={{ joursTravailles: 20, conges: 2, absences: 1 }} />)

    expect(screen.getByText('20j')).toBeInTheDocument()
    expect(screen.getByText('2c')).toBeInTheDocument()
    expect(screen.getByText('1a')).toBeInTheDocument()
  })

  it('affiche 0 pour les valeurs nulles', () => {
    render(<CelluleComptage stats={{ joursTravailles: 0, conges: 0, absences: 0 }} />)

    expect(screen.getByText('0j')).toBeInTheDocument()
    expect(screen.getByText('0c')).toBeInTheDocument()
    expect(screen.getByText('0a')).toBeInTheDocument()
  })
})
