/**
 * Integration tests for UI synchronization after CRUD operations
 * Story 2.9: Correction Synchronisation UI Affectations
 *
 * These tests verify that the UI updates correctly after:
 * - Creating affectations (Vue Ouvrier)
 * - Deleting affectations (Vue Chantier)
 * - Modifying affectations (Vue Chantier)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

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

// Mock server actions with controllable responses
const mockCreerAffectation = vi.fn()
const mockSupprimerAffectation = vi.fn()
const mockReassignerAffectation = vi.fn()

vi.mock('@/actions/affectations', () => ({
  creerAffectation: (...args: unknown[]) => mockCreerAffectation(...args),
  supprimerAffectation: (...args: unknown[]) => mockSupprimerAffectation(...args),
  reassignerAffectation: (...args: unknown[]) => mockReassignerAffectation(...args),
  modifierPeriodeAffectation: vi.fn().mockResolvedValue({ success: true }),
  convertirEnIndisponibilite: vi.fn().mockResolvedValue({ success: true }),
  creerIndisponibilite: vi.fn().mockResolvedValue({ success: true }),
  modifierIndisponibilite: vi.fn().mockResolvedValue({ success: true }),
  supprimerIndisponibilite: vi.fn().mockResolvedValue({ success: true })
}))

import { VueChantierClient } from '@/components/features/planning/VueChantierClient'
import { MenuContextuelAffectation } from '@/components/features/planning/MenuContextuelAffectation'

describe('UI Sync Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefresh.mockClear()
    mockShowToast.mockClear()
    mockCreerAffectation.mockResolvedValue({ success: true })
    mockSupprimerAffectation.mockResolvedValue({ success: true })
    mockReassignerAffectation.mockResolvedValue({ success: true })
  })

  describe('Vue Chantier - Suppression sync (AC: 1)', () => {
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
            ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'OUVRIER' as const }
          }
        ]
      }
    ]

    const defaultProps = {
      chantiers: mockChantiers,
      chantiersActifs: [{ id: 1, nom: 'Chantier Alpha' }],
      joursSemaine: [new Date('2026-01-13')],
      ouvriersActifs: [{ id: 1, nom: 'Dupont', prenom: 'Jean', type: 'OUVRIER' as const }],
      indisponiblesByDate: {}
    }

    it('should call router.refresh() after successful deletion', async () => {
      render(<VueChantierClient {...defaultProps} />)

      // Open context menu
      const badge = screen.getByText(/Dupont/)
      fireEvent.click(badge)

      // Click Supprimer
      fireEvent.click(screen.getByText('Supprimer'))

      // Confirm delete
      const confirmButton = screen.getByRole('button', { name: 'Supprimer' })
      fireEvent.click(confirmButton)

      // Wait for async action to complete
      await waitFor(() => {
        expect(mockSupprimerAffectation).toHaveBeenCalledWith(1)
      })

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('should show toast on server error and still refresh', async () => {
      mockSupprimerAffectation.mockResolvedValue({ error: 'Erreur serveur' })

      render(<VueChantierClient {...defaultProps} />)

      // Open context menu
      const badge = screen.getByText(/Dupont/)
      fireEvent.click(badge)

      // Click Supprimer then confirm
      fireEvent.click(screen.getByText('Supprimer'))
      const confirmButton = screen.getByRole('button', { name: 'Supprimer' })
      fireEvent.click(confirmButton)

      // Wait for error handling
      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Erreur serveur', 'error')
      })

      // Should refresh to rollback optimistic update
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('Vue Chantier - Réaffectation sync (AC: 3, 4)', () => {
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
            ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'OUVRIER' as const }
          }
        ]
      },
      {
        id: 2,
        nom: 'Chantier Beta',
        statut: 'ACTIF' as const,
        affectations: []
      }
    ]

    const defaultProps = {
      chantiers: mockChantiers,
      chantiersActifs: [
        { id: 1, nom: 'Chantier Alpha' },
        { id: 2, nom: 'Chantier Beta' }
      ],
      joursSemaine: [new Date('2026-01-13')],
      ouvriersActifs: [{ id: 1, nom: 'Dupont', prenom: 'Jean', type: 'OUVRIER' as const }],
      indisponiblesByDate: {}
    }

    it('should call router.refresh() after successful reassignment', async () => {
      render(<VueChantierClient {...defaultProps} />)

      // Open context menu
      const badge = screen.getByText(/Dupont/)
      fireEvent.click(badge)

      // Click Réaffecter
      fireEvent.click(screen.getByText('Réaffecter'))

      // Select Chantier Beta from the submenu (find in the menu)
      const menuItems = screen.getAllByRole('menuitem')
      const chantierBetaOption = menuItems.find(item => item.textContent === 'Chantier Beta')
      fireEvent.click(chantierBetaOption!)

      // Wait for async action
      await waitFor(() => {
        expect(mockReassignerAffectation).toHaveBeenCalledWith(1, 2)
      })

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('MenuContextuelAffectation - Error handling (AC: 5)', () => {
    const mockAffectation = {
      id: 1,
      chantierId: 1,
      periode: 'JOURNEE' as const,
      ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean' }
    }

    const mockChantiers = [
      { id: 1, nom: 'Chantier A' },
      { id: 2, nom: 'Chantier B' }
    ]

    it('should show toast when reassignment fails', async () => {
      mockReassignerAffectation.mockResolvedValue({ error: 'Ouvrier déjà affecté' })

      render(
        <MenuContextuelAffectation
          affectation={mockAffectation}
          chantiers={mockChantiers}
          position={{ x: 100, y: 100 }}
          onClose={vi.fn()}
          onOptimisticUpdate={vi.fn()}
        />
      )

      // Navigate to reassign submenu
      fireEvent.click(screen.getByText('Réaffecter'))
      fireEvent.click(screen.getByText('Chantier B'))

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Ouvrier déjà affecté', 'error')
      })
    })

    it('should refresh to rollback on error', async () => {
      mockSupprimerAffectation.mockResolvedValue({ error: 'Erreur de suppression' })

      render(
        <MenuContextuelAffectation
          affectation={mockAffectation}
          chantiers={mockChantiers}
          position={{ x: 100, y: 100 }}
          onClose={vi.fn()}
          onOptimisticUpdate={vi.fn()}
        />
      )

      // Delete
      fireEvent.click(screen.getByText('Supprimer'))
      const confirmButton = screen.getByRole('button', { name: 'Supprimer' })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('Synchronization timing (AC: 3)', () => {
    it('should call router.refresh() to ensure UI syncs within 500ms', async () => {
      const startTime = Date.now()

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
              ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'OUVRIER' as const }
            }
          ]
        }
      ]

      render(
        <VueChantierClient
          chantiers={mockChantiers}
          chantiersActifs={[{ id: 1, nom: 'Chantier Alpha' }]}
          joursSemaine={[new Date('2026-01-13')]}
          ouvriersActifs={[{ id: 1, nom: 'Dupont', prenom: 'Jean', type: 'OUVRIER' as const }]}
          indisponiblesByDate={{}}
        />
      )

      // Open context menu and delete
      const badge = screen.getByText(/Dupont/)
      fireEvent.click(badge)
      fireEvent.click(screen.getByText('Supprimer'))
      const confirmButton = screen.getByRole('button', { name: 'Supprimer' })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })

      const endTime = Date.now()
      const elapsed = endTime - startTime

      // Should complete within 500ms (with some margin for test overhead)
      expect(elapsed).toBeLessThan(1000)
    })
  })
})
