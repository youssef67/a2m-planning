import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}))

import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/layout/Navigation'

describe('Navigation', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/planning/chantier')
  })

  describe('Desktop Navigation', () => {
    it('should render all navigation links', () => {
      render(<Navigation />)

      expect(screen.getByText('Planning')).toBeInTheDocument()
      expect(screen.getByText('Chantiers')).toBeInTheDocument()
      expect(screen.getByText('Ouvriers')).toBeInTheDocument()
    })

    it('should have correct href for each link', () => {
      render(<Navigation />)

      const planningLink = screen.getByRole('link', { name: /Planning/i })
      const chantiersLink = screen.getByRole('link', { name: /Chantiers/i })
      const ouvriersLink = screen.getByRole('link', { name: /Ouvriers/i })

      expect(planningLink).toHaveAttribute('href', '/planning/chantier')
      expect(chantiersLink).toHaveAttribute('href', '/chantiers')
      expect(ouvriersLink).toHaveAttribute('href', '/ouvriers')
    })

    it('should highlight Planning link when on /planning/chantier', () => {
      vi.mocked(usePathname).mockReturnValue('/planning/chantier')

      render(<Navigation />)

      const planningLinks = screen.getAllByText('Planning')
      // Desktop link (first one in DOM)
      const desktopPlanningLink = planningLinks[0].closest('a')

      expect(desktopPlanningLink).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should highlight Planning link when on /planning/ouvrier', () => {
      vi.mocked(usePathname).mockReturnValue('/planning/ouvrier')

      render(<Navigation />)

      const planningLinks = screen.getAllByText('Planning')
      const desktopPlanningLink = planningLinks[0].closest('a')

      expect(desktopPlanningLink).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should highlight Chantiers link when on /chantiers', () => {
      vi.mocked(usePathname).mockReturnValue('/chantiers')

      render(<Navigation />)

      const chantiersLinks = screen.getAllByText('Chantiers')
      const desktopChantiersLink = chantiersLinks[0].closest('a')

      expect(desktopChantiersLink).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should highlight Ouvriers link when on /ouvriers', () => {
      vi.mocked(usePathname).mockReturnValue('/ouvriers')

      render(<Navigation />)

      const ouvriersLinks = screen.getAllByText('Ouvriers')
      const desktopOuvriersLink = ouvriersLinks[0].closest('a')

      expect(desktopOuvriersLink).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should not highlight inactive links', () => {
      vi.mocked(usePathname).mockReturnValue('/planning/chantier')

      render(<Navigation />)

      const chantiersLinks = screen.getAllByText('Chantiers')
      const desktopChantiersLink = chantiersLinks[0].closest('a')

      expect(desktopChantiersLink).toHaveClass('text-gray-600')
      expect(desktopChantiersLink).not.toHaveClass('bg-blue-100')
    })
  })

  describe('Mobile Navigation', () => {
    it('should render hamburger menu button', () => {
      render(<Navigation />)

      const menuButton = screen.getByLabelText('Ouvrir le menu')
      expect(menuButton).toBeInTheDocument()
    })

    it('should open mobile menu when hamburger button is clicked', () => {
      render(<Navigation />)

      const menuButton = screen.getByLabelText('Ouvrir le menu')
      fireEvent.click(menuButton)

      // After opening, the button label should change
      expect(screen.getByLabelText('Fermer le menu')).toBeInTheDocument()
    })

    it('should close mobile menu when close button is clicked', () => {
      render(<Navigation />)

      // Open menu
      const openButton = screen.getByLabelText('Ouvrir le menu')
      fireEvent.click(openButton)

      // Close menu
      const closeButton = screen.getByLabelText('Fermer le menu')
      fireEvent.click(closeButton)

      // Menu should be closed, open button should be visible again
      expect(screen.getByLabelText('Ouvrir le menu')).toBeInTheDocument()
    })

    it('should close mobile menu after clicking a navigation link', () => {
      render(<Navigation />)

      // Open menu
      const openButton = screen.getByLabelText('Ouvrir le menu')
      fireEvent.click(openButton)

      // Click a navigation link in the mobile menu (there are duplicate links)
      const chantiersLinks = screen.getAllByText('Chantiers')
      // Mobile links appear in the dropdown menu
      const mobileChantierLink = chantiersLinks[1]
      fireEvent.click(mobileChantierLink)

      // Menu should be closed
      expect(screen.getByLabelText('Ouvrir le menu')).toBeInTheDocument()
    })

    it('should show active style in mobile menu', () => {
      vi.mocked(usePathname).mockReturnValue('/chantiers')

      render(<Navigation />)

      // Open mobile menu
      const openButton = screen.getByLabelText('Ouvrir le menu')
      fireEvent.click(openButton)

      const chantiersLinks = screen.getAllByText('Chantiers')
      // Mobile link (second one in dropdown)
      const mobileChantiersLink = chantiersLinks[1].closest('a')

      expect(mobileChantiersLink).toHaveClass('bg-blue-50', 'text-blue-700', 'border-l-4', 'border-blue-700')
    })
  })
})
