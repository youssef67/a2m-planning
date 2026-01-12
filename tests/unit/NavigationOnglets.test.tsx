import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}))

import { usePathname } from 'next/navigation'
import { NavigationOnglets } from '@/components/features/planning/NavigationOnglets'

describe('NavigationOnglets', () => {
  it('should render two tabs: Vue Chantier and Vue Ouvrier', () => {
    vi.mocked(usePathname).mockReturnValue('/planning/chantier')

    render(<NavigationOnglets />)

    expect(screen.getByText('Vue Chantier')).toBeInTheDocument()
    expect(screen.getByText('Vue Ouvrier')).toBeInTheDocument()
  })

  it('should highlight Vue Chantier tab when on /planning/chantier', () => {
    vi.mocked(usePathname).mockReturnValue('/planning/chantier')

    render(<NavigationOnglets />)

    const chantierTab = screen.getByText('Vue Chantier')
    const ouvrierTab = screen.getByText('Vue Ouvrier')

    expect(chantierTab).toHaveClass('border-blue-500', 'text-blue-600', 'bg-blue-50')
    expect(ouvrierTab).toHaveClass('border-transparent', 'text-gray-500')
  })

  it('should highlight Vue Ouvrier tab when on /planning/ouvrier', () => {
    vi.mocked(usePathname).mockReturnValue('/planning/ouvrier')

    render(<NavigationOnglets />)

    const chantierTab = screen.getByText('Vue Chantier')
    const ouvrierTab = screen.getByText('Vue Ouvrier')

    expect(ouvrierTab).toHaveClass('border-blue-500', 'text-blue-600', 'bg-blue-50')
    expect(chantierTab).toHaveClass('border-transparent', 'text-gray-500')
  })

  it('should have correct href links', () => {
    vi.mocked(usePathname).mockReturnValue('/planning/chantier')

    render(<NavigationOnglets />)

    const chantierLink = screen.getByRole('link', { name: 'Vue Chantier' })
    const ouvrierLink = screen.getByRole('link', { name: 'Vue Ouvrier' })

    expect(chantierLink).toHaveAttribute('href', '/planning/chantier')
    expect(ouvrierLink).toHaveAttribute('href', '/planning/ouvrier')
  })

  it('should set aria-current on active tab', () => {
    vi.mocked(usePathname).mockReturnValue('/planning/ouvrier')

    render(<NavigationOnglets />)

    const chantierTab = screen.getByText('Vue Chantier')
    const ouvrierTab = screen.getByText('Vue Ouvrier')

    expect(ouvrierTab).toHaveAttribute('aria-current', 'page')
    expect(chantierTab).not.toHaveAttribute('aria-current')
  })

  it('should have navigation label for accessibility', () => {
    vi.mocked(usePathname).mockReturnValue('/planning/chantier')

    render(<NavigationOnglets />)

    const nav = screen.getByRole('navigation', { name: 'Navigation planning' })
    expect(nav).toBeInTheDocument()
  })
})
