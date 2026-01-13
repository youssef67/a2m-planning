import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoutonImprimer } from '@/components/features/comptage/BoutonImprimer'

describe('BoutonImprimer', () => {
  const originalPrint = window.print

  beforeEach(() => {
    window.print = vi.fn()
  })

  afterEach(() => {
    window.print = originalPrint
  })

  it('affiche le bouton avec l\'icône et le texte "Imprimer"', () => {
    render(<BoutonImprimer />)

    expect(screen.getByRole('button', { name: /imprimer/i })).toBeInTheDocument()
    expect(screen.getByText('Imprimer')).toBeInTheDocument()
  })

  it('appelle window.print() au clic', () => {
    render(<BoutonImprimer />)

    const button = screen.getByRole('button', { name: /imprimer/i })
    fireEvent.click(button)

    expect(window.print).toHaveBeenCalled()
  })

  it('a la classe no-print pour ne pas s\'imprimer', () => {
    render(<BoutonImprimer />)

    const button = screen.getByRole('button', { name: /imprimer/i })
    expect(button).toHaveClass('no-print')
  })

  it('a un aria-label descriptif', () => {
    render(<BoutonImprimer />)

    const button = screen.getByRole('button', { name: /imprimer le tableau/i })
    expect(button).toBeInTheDocument()
  })
})
