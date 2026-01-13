import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BoutonCopier } from '@/components/features/comptage/BoutonCopier'
import type { OuvrierPourExport } from '@/lib/export-utils'
import type { Ouvrier } from '@/generated/prisma/client'

// Mock du hook useToast
const mockShowToast = vi.fn()
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast })
}))

describe('BoutonCopier', () => {
  const createOuvrier = (overrides: Partial<Ouvrier> = {}): Ouvrier => ({
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    type: 'SALARIE',
    actif: true,
    dateCreation: new Date(),
    dateModification: new Date(),
    ...overrides
  })

  const emptyStats = {
    joursTravailles: 0,
    conges: 0,
    absences: 0
  }

  const mockData: OuvrierPourExport[] = [
    {
      ouvrier: createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean' }),
      stats: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, emptyStats]))
    }
  ]

  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  afterEach(() => {
    Object.assign(navigator, {
      clipboard: originalClipboard
    })
  })

  it('affiche le bouton avec l\'icône et le texte "Copier"', () => {
    render(<BoutonCopier data={mockData} annee={2026} />)

    expect(screen.getByRole('button', { name: /copier/i })).toBeInTheDocument()
    expect(screen.getByText('Copier')).toBeInTheDocument()
  })

  it('appelle navigator.clipboard.writeText au clic', async () => {
    render(<BoutonCopier data={mockData} annee={2026} />)

    const button = screen.getByRole('button', { name: /copier/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  it('copie le contenu formaté au format tabulé', async () => {
    render(<BoutonCopier data={mockData} annee={2026} />)

    const button = screen.getByRole('button', { name: /copier/i })
    fireEvent.click(button)

    await waitFor(() => {
      const callArg = (navigator.clipboard.writeText as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]
      expect(callArg).toContain('Ouvrier')
      expect(callArg).toContain('Dupont Jean')
      expect(callArg).toContain('\t')
    })
  })

  it('affiche un toast de succès après la copie', async () => {
    render(<BoutonCopier data={mockData} annee={2026} />)

    const button = screen.getByRole('button', { name: /copier/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Copié !', 'success')
    })
  })

  it('affiche "Copié" après le clic', async () => {
    render(<BoutonCopier data={mockData} annee={2026} />)

    const button = screen.getByRole('button', { name: /copier/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Copié')).toBeInTheDocument()
    })
  })

  it('a la classe no-print pour ne pas s\'imprimer', () => {
    render(<BoutonCopier data={mockData} annee={2026} />)

    const button = screen.getByRole('button', { name: /copier/i })
    expect(button).toHaveClass('no-print')
  })
})
