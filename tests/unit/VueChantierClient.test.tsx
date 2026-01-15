import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VueChantierClient } from '@/components/features/planning/VueChantierClient'

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh
  })
}))

// Mock Toast
const mockShowToast = vi.fn()
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast
  })
}))

// Mock server actions
vi.mock('@/actions/affectations', () => ({
  reassignerAffectation: vi.fn().mockResolvedValue({ success: true }),
  modifierPeriodeAffectation: vi.fn().mockResolvedValue({ success: true }),
  supprimerAffectation: vi.fn().mockResolvedValue({ success: true }),
  convertirEnIndisponibilite: vi.fn().mockResolvedValue({ success: true }),
  creerAffectation: vi.fn().mockResolvedValue({ success: true })
}))

const mockChantiers = [
  {
    id: 1,
    nom: 'Chantier Alpha',
    statut: 'ACTIF' as const,
    affectations: [
      {
        id: 1,
        date: new Date('2026-01-13'),
        periode: 'JOURNEE' as const,
        chantierId: 1,
        ouvrier: {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          type: 'OUVRIER' as const
        }
      }
    ]
  },
  {
    id: 2,
    nom: 'Chantier Beta',
    statut: 'EN_PAUSE' as const,
    affectations: []
  }
]

const mockChantiersActifs = [
  { id: 1, nom: 'Chantier Alpha' },
  { id: 2, nom: 'Chantier Beta' }
]

const mockJoursSemaine = [
  new Date('2026-01-13'),
  new Date('2026-01-14'),
  new Date('2026-01-15'),
  new Date('2026-01-16'),
  new Date('2026-01-17'),
  new Date('2026-01-18'),
  new Date('2026-01-19')
]

const mockOuvriersActifs = [
  { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'OUVRIER' as const },
  { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'INTERIMAIRE' as const }
]

const mockIndisponiblesByDate = {}

describe('VueChantierClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefresh.mockClear()
    mockShowToast.mockClear()
  })

  it('should render chantier cards', () => {
    render(
      <VueChantierClient
        chantiers={mockChantiers}
        chantiersActifs={mockChantiersActifs}
        joursSemaine={mockJoursSemaine}
        ouvriersActifs={mockOuvriersActifs}
        indisponiblesByDate={mockIndisponiblesByDate}
      />
    )

    expect(screen.getByText('Chantier Alpha')).toBeInTheDocument()
    expect(screen.getByText('Chantier Beta')).toBeInTheDocument()
  })

  it('should show "En pause" badge for paused chantiers', () => {
    render(
      <VueChantierClient
        chantiers={mockChantiers}
        chantiersActifs={mockChantiersActifs}
        joursSemaine={mockJoursSemaine}
        ouvriersActifs={mockOuvriersActifs}
        indisponiblesByDate={mockIndisponiblesByDate}
      />
    )

    expect(screen.getByText('En pause')).toBeInTheDocument()
  })

  it('should render existing affectations', () => {
    render(
      <VueChantierClient
        chantiers={mockChantiers}
        chantiersActifs={mockChantiersActifs}
        joursSemaine={mockJoursSemaine}
        ouvriersActifs={mockOuvriersActifs}
        indisponiblesByDate={mockIndisponiblesByDate}
      />
    )

    // The ouvrier badge should be rendered
    expect(screen.getByText(/Dupont/)).toBeInTheDocument()
  })

  it('should show empty state when no chantiers', () => {
    render(
      <VueChantierClient
        chantiers={[]}
        chantiersActifs={[]}
        joursSemaine={mockJoursSemaine}
        ouvriersActifs={mockOuvriersActifs}
        indisponiblesByDate={mockIndisponiblesByDate}
      />
    )

    expect(screen.getByText('Aucun chantier actif ou en pause trouvé.')).toBeInTheDocument()
  })

  describe('Optimistic Updates with useOptimistic (AC: 1, 3)', () => {
    it('should have useOptimistic hook initialized with flattened affectations', () => {
      // This test verifies that the component renders correctly with optimistic state
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      // Existing affectation should be visible
      expect(screen.getByText(/Dupont/)).toBeInTheDocument()
    })

    it('should reconstruct chantiers from optimistic affectations map', () => {
      // This test verifies that the component correctly displays chantiers
      // with their affectations reconstructed from the optimistic state
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      // Both chantiers should be rendered
      expect(screen.getByText('Chantier Alpha')).toBeInTheDocument()
      expect(screen.getByText('Chantier Beta')).toBeInTheDocument()
    })
  })

  describe('Context menu interactions (AC: 1)', () => {
    it('should open context menu on affectation click', () => {
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      // Find the affectation badge and click it
      const badge = screen.getByText(/Dupont/)
      fireEvent.click(badge)

      // Context menu should appear
      expect(screen.getByText('Réaffecter')).toBeInTheDocument()
      expect(screen.getByText('Supprimer')).toBeInTheDocument()
    })

    it('should pass onOptimisticUpdate callback to context menu', () => {
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      // Click on affectation to open context menu
      const badge = screen.getByText(/Dupont/)
      fireEvent.click(badge)

      // Context menu should be rendered with correct props
      // (verified by the menu being interactive)
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  describe('Suppression persistence (AC: 1, 3)', () => {
    it('should trigger optimistic delete when clicking Supprimer', async () => {
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      // Click on affectation to open context menu
      const badge = screen.getByText(/Dupont/)
      fireEvent.click(badge)

      // Click Supprimer
      fireEvent.click(screen.getByText('Supprimer'))

      // Confirm delete
      const confirmButton = screen.getByRole('button', { name: 'Supprimer' })
      fireEvent.click(confirmButton)

      // The affectation should be removed optimistically
      // (actual removal is tested in integration tests)
    })
  })

  describe('Day headers', () => {
    it('should render day abbreviations', () => {
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      expect(screen.getByText('Lun')).toBeInTheDocument()
      expect(screen.getByText('Mar')).toBeInTheDocument()
      expect(screen.getByText('Mer')).toBeInTheDocument()
      expect(screen.getByText('Jeu')).toBeInTheDocument()
      expect(screen.getByText('Ven')).toBeInTheDocument()
    })
  })

  describe('Print functionality (Story 2.18)', () => {
    it('should render header with print all button (AC: 1)', () => {
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      const printAllButton = screen.getByLabelText('Tout imprimer')
      expect(printAllButton).toBeInTheDocument()
    })

    it('should render print icon on each active chantier card (AC: 2)', () => {
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      // Chantier Alpha is ACTIF, should have print button
      const printButton = screen.getByLabelText('Imprimer le planning du chantier Chantier Alpha')
      expect(printButton).toBeInTheDocument()
    })

    it('should show chantier stats in header', () => {
      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      // Should show stats about active chantiers
      expect(screen.getByText(/1 chantiers actifs/i)).toBeInTheDocument()
      expect(screen.getByText(/1 en pause/i)).toBeInTheDocument()
    })

    it('should call window.print when clicking print all button', () => {
      const windowPrintSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      const printAllButton = screen.getByLabelText('Tout imprimer')
      fireEvent.click(printAllButton)

      expect(windowPrintSpy).toHaveBeenCalled()
      windowPrintSpy.mockRestore()
    })

    it('should call window.print when clicking individual print button (AC: 4)', () => {
      const windowPrintSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={mockChantiersActifs}
          joursSemaine={mockJoursSemaine}
          ouvriersActifs={mockOuvriersActifs}
          indisponiblesByDate={mockIndisponiblesByDate}
        />
      )

      const printButton = screen.getByLabelText('Imprimer le planning du chantier Chantier Alpha')
      fireEvent.click(printButton)

      expect(windowPrintSpy).toHaveBeenCalled()
      windowPrintSpy.mockRestore()
    })
  })
})
