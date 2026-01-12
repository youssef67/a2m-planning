import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BadgeStatutPresence } from '@/components/features/planning/BadgeStatutPresence'

describe('BadgeStatutPresence', () => {
  it('should display "T" for TRAVAIL status with blue color', () => {
    render(<BadgeStatutPresence statut="TRAVAIL" />)

    const badge = screen.getByText('T')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('should display "CP" for CONGE_PAYE status with green color', () => {
    render(<BadgeStatutPresence statut="CONGE_PAYE" />)

    const badge = screen.getByText('CP')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should display "M" for MALADIE status with red color', () => {
    render(<BadgeStatutPresence statut="MALADIE" />)

    const badge = screen.getByText('M')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('should display "A" for ABSENCE status with gray color', () => {
    render(<BadgeStatutPresence statut="ABSENCE" />)

    const badge = screen.getByText('A')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('should display "F" for FORMATION status with purple color', () => {
    render(<BadgeStatutPresence statut="FORMATION" />)

    const badge = screen.getByText('F')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800')
  })

  it('should apply custom className', () => {
    render(<BadgeStatutPresence statut="TRAVAIL" className="custom-class" />)

    const badge = screen.getByText('T')
    expect(badge).toHaveClass('custom-class')
  })

  it('should have title attribute with full status label', () => {
    render(<BadgeStatutPresence statut="CONGE_PAYE" />)

    const badge = screen.getByText('CP')
    expect(badge).toHaveAttribute('title', 'Congé payé')
  })
})
