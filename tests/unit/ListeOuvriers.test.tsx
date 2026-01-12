import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockPush = vi.fn()

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useSearchParams: () => new URLSearchParams('semaine=2026-01-06'),
  usePathname: () => '/planning/ouvrier'
}))

import { ListeOuvriers } from '@/components/features/planning/ListeOuvriers'

const mockOuvriers = [
  { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' as const },
  { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SOUS_TRAITANT' as const },
  { id: 3, nom: 'Bernard', prenom: 'Marie', type: 'SALARIE' as const }
]

describe('ListeOuvriers', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render all ouvriers in the list', () => {
    render(<ListeOuvriers ouvriers={mockOuvriers} selectedOuvrierId={null} />)

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument()
    expect(screen.getByText('Marie Bernard')).toBeInTheDocument()
  })

  it('should highlight selected ouvrier', () => {
    render(<ListeOuvriers ouvriers={mockOuvriers} selectedOuvrierId={1} />)

    // Find the desktop button for Dupont
    const buttons = screen.getAllByRole('button', { name: /Jean Dupont/i })
    const desktopButton = buttons.find(btn => btn.closest('.hidden.sm\\:block'))

    expect(desktopButton).toHaveClass('bg-blue-50')
  })

  it('should show sous-traitant indicator for SOUS_TRAITANT type', () => {
    render(<ListeOuvriers ouvriers={mockOuvriers} selectedOuvrierId={null} />)

    // Should have wrench emoji for Martin (sous-traitant)
    const martinButtons = screen.getAllByText('Pierre Martin')
    const martinWithWrench = martinButtons.find(
      (el) => el.parentElement?.textContent?.includes('🔧')
    )
    expect(martinWithWrench).toBeInTheDocument()
  })

  it('should not show sous-traitant indicator for SALARIE type', () => {
    render(
      <ListeOuvriers
        ouvriers={[{ id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }]}
        selectedOuvrierId={null}
      />
    )

    const buttons = screen.getAllByText('Jean Dupont')
    buttons.forEach((el) => {
      expect(el.parentElement?.textContent).not.toContain('🔧')
    })
  })

  it('should navigate with ouvrier param when clicking on desktop button', () => {
    render(<ListeOuvriers ouvriers={mockOuvriers} selectedOuvrierId={null} />)

    // Find all Dupont buttons and click the desktop one
    const buttons = screen.getAllByRole('button', { name: /Jean Dupont/i })
    const desktopButton = buttons.find(btn => btn.closest('.hidden.sm\\:block'))

    if (desktopButton) {
      fireEvent.click(desktopButton)
      expect(mockPush).toHaveBeenCalledWith('/planning/ouvrier?semaine=2026-01-06&ouvrier=1')
    }
  })

  it('should display ouvrier count in header', () => {
    render(<ListeOuvriers ouvriers={mockOuvriers} selectedOuvrierId={null} />)

    expect(screen.getByText('Ouvriers (3)')).toBeInTheDocument()
  })
})
