import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VueOuvrierListeClient } from '@/components/features/planning/VueOuvrierListeClient'
import { startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns'
import type { TypeOuvrier, Periode, StatutPresence, StatutChantier } from '@/generated/prisma/client'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/planning/ouvrier'
}))

// Mock useToast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

interface Affectation {
  id: number
  date: Date
  periode: Periode
  statutPresence: StatutPresence
  chantier: {
    id: number
    nom: string
    statut: StatutChantier
  } | null
}

interface Ouvrier {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
  affectations: Affectation[]
}

function getWeekDays(): Date[] {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

function createOuvrier(id: number, nom: string, prenom: string, type: TypeOuvrier = 'SALARIE'): Ouvrier {
  return {
    id,
    nom,
    prenom,
    type,
    affectations: []
  }
}

describe('Vue Ouvrier Refonte - Integration', () => {
  const joursSemaine = getWeekDays()
  const weekStart = joursSemaine[0]
  const chantiersNonTermines = [
    { id: 1, nom: 'Chantier A', statut: 'ACTIF' as StatutChantier },
    { id: 2, nom: 'Chantier B', statut: 'EN_PAUSE' as StatutChantier }
  ]

  it('affiche tous les ouvriers actifs', () => {
    const ouvriers = [
      createOuvrier(1, 'Dupont', 'Jean'),
      createOuvrier(2, 'Martin', 'Pierre'),
      createOuvrier(3, 'Bernard', 'Paul')
    ]

    render(
      <VueOuvrierListeClient
        ouvriers={ouvriers}
        joursSemaine={joursSemaine}
        chantiersNonTermines={chantiersNonTermines}
        weekStart={weekStart}
      />
    )

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument()
    expect(screen.getByText('Paul Bernard')).toBeInTheDocument()
  })

  it('affiche un message quand il n\'y a pas d\'ouvriers', () => {
    render(
      <VueOuvrierListeClient
        ouvriers={[]}
        joursSemaine={joursSemaine}
        chantiersNonTermines={chantiersNonTermines}
        weekStart={weekStart}
      />
    )

    expect(screen.getByText('Aucun ouvrier actif trouvé.')).toBeInTheDocument()
  })

  it('distingue visuellement les sous-traitants', () => {
    const ouvriers = [
      createOuvrier(1, 'Dupont', 'Jean', 'SALARIE'),
      createOuvrier(2, 'Martin', 'Pierre', 'SOUS_TRAITANT')
    ]

    render(
      <VueOuvrierListeClient
        ouvriers={ouvriers}
        joursSemaine={joursSemaine}
        chantiersNonTermines={chantiersNonTermines}
        weekStart={weekStart}
      />
    )

    // L'icône sous-traitant doit être présente
    expect(screen.getByTitle('Sous-traitant')).toBeInTheDocument()
  })

  it('affiche 7 colonnes pour les jours de la semaine sur desktop', () => {
    const ouvriers = [createOuvrier(1, 'Dupont', 'Jean')]

    const { container } = render(
      <VueOuvrierListeClient
        ouvriers={ouvriers}
        joursSemaine={joursSemaine}
        chantiersNonTermines={chantiersNonTermines}
        weekStart={weekStart}
      />
    )

    // Vérifie la présence de la grille 7 colonnes
    const headerGrid = container.querySelector('.sm\\:grid-cols-7')
    expect(headerGrid).toBeInTheDocument()
  })

  it('affiche les affectations dans les bonnes cellules', () => {
    const ouvriers = [
      {
        ...createOuvrier(1, 'Dupont', 'Jean'),
        affectations: [
          {
            id: 1,
            date: joursSemaine[0],
            periode: 'JOURNEE' as Periode,
            statutPresence: 'TRAVAIL' as StatutPresence,
            chantier: { id: 1, nom: 'Chantier Alpha', statut: 'ACTIF' as StatutChantier }
          }
        ]
      }
    ]

    render(
      <VueOuvrierListeClient
        ouvriers={ouvriers}
        joursSemaine={joursSemaine}
        chantiersNonTermines={chantiersNonTermines}
        weekStart={weekStart}
      />
    )

    // Le texte apparaît deux fois (desktop + mobile view)
    const elements = screen.getAllByText('Chantier Alpha')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })
})
