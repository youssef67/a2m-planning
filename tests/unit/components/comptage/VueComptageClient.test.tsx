import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VueComptageClient } from '@/components/features/comptage/VueComptageClient'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  usePathname: () => '/planning/comptage',
  useSearchParams: () => new URLSearchParams()
}))

const createOuvrier = (id: number, nom: string, prenom: string, type: 'SALARIE' | 'SOUS_TRAITANT', affectations: Array<{
  date: Date
  periode: 'JOURNEE' | 'MATIN' | 'APRES_MIDI'
  statutPresence: 'TRAVAIL' | 'CONGE_PAYE' | 'MALADIE' | 'ABSENCE' | 'FORMATION'
  chantier: { id: number } | null
}> = []) => ({
  id,
  nom,
  prenom,
  type,
  statut: 'ACTIF' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  affectations
})

describe('VueComptageClient', () => {
  describe('En-tête', () => {
    it('affiche le compteur des ouvriers salariés', () => {
      const ouvriers = [
        createOuvrier(1, 'Dupont', 'Jean', 'SALARIE'),
        createOuvrier(2, 'Martin', 'Pierre', 'SALARIE')
      ]

      render(<VueComptageClient ouvriers={ouvriers} annee={2026} />)

      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText(/ouvriers actifs/)).toBeInTheDocument()
    })

    it('affiche le compteur des sous-traitants quand présents', () => {
      const ouvriers = [
        createOuvrier(1, 'Dupont', 'Jean', 'SALARIE'),
        createOuvrier(2, 'Durand', 'Marie', 'SOUS_TRAITANT')
      ]

      render(<VueComptageClient ouvriers={ouvriers} annee={2026} />)

      // The text is split across multiple elements, so we check the container
      const header = screen.getByText(/ouvriers actifs/).closest('div')
      expect(header?.textContent).toContain('sous-traitant')
    })

    it('cache le compteur sous-traitants quand 0', () => {
      const ouvriers = [createOuvrier(1, 'Dupont', 'Jean', 'SALARIE')]

      render(<VueComptageClient ouvriers={ouvriers} annee={2026} />)

      expect(screen.queryByText(/sous-traitant/)).not.toBeInTheDocument()
    })
  })

  describe('Tableau', () => {
    it('affiche tous les ouvriers en lignes', () => {
      const ouvriers = [
        createOuvrier(1, 'Dupont', 'Jean', 'SALARIE'),
        createOuvrier(2, 'Martin', 'Pierre', 'SALARIE')
      ]

      render(<VueComptageClient ouvriers={ouvriers} annee={2026} />)

      expect(screen.getByText('Dupont Jean')).toBeInTheDocument()
      expect(screen.getByText('Martin Pierre')).toBeInTheDocument()
    })

    it('affiche les 12 mois en colonnes', () => {
      render(<VueComptageClient ouvriers={[]} annee={2026} />)

      expect(screen.getByText('Jan')).toBeInTheDocument()
      expect(screen.getByText('Fév')).toBeInTheDocument()
      expect(screen.getByText('Déc')).toBeInTheDocument()
    })

    it('distingue visuellement les sous-traitants avec 🔧', () => {
      const ouvriers = [createOuvrier(1, 'Durand', 'Marie', 'SOUS_TRAITANT')]

      render(<VueComptageClient ouvriers={ouvriers} annee={2026} />)

      expect(screen.getByText('🔧')).toBeInTheDocument()
    })

    it('affiche un message quand aucun ouvrier actif', () => {
      render(<VueComptageClient ouvriers={[]} annee={2026} />)

      expect(screen.getByText('Aucun ouvrier actif')).toBeInTheDocument()
    })
  })

  describe('Calcul des statistiques', () => {
    it('calcule les jours travaillés correctement', () => {
      const ouvriers = [
        createOuvrier(1, 'Dupont', 'Jean', 'SALARIE', [
          { date: new Date('2026-01-15'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } },
          { date: new Date('2026-01-16'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } }
        ])
      ]

      render(<VueComptageClient ouvriers={ouvriers} annee={2026} />)

      // Should show 2 days worked in January
      expect(screen.getByText('2j')).toBeInTheDocument()
    })
  })

  describe('Légende', () => {
    it('affiche la légende des couleurs', () => {
      render(<VueComptageClient ouvriers={[]} annee={2026} />)

      expect(screen.getByText(/j = jours travaillés/)).toBeInTheDocument()
      expect(screen.getByText(/c = congés/)).toBeInTheDocument()
      expect(screen.getByText(/a = absences/)).toBeInTheDocument()
    })
  })
})
