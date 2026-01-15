import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { VueOuvrierListeClient } from '@/components/features/planning/VueOuvrierListeClient'
import { startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns'
import type { TypeOuvrier, StatutChantier } from '@/generated/prisma/client'

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

function getWeekDays(): Date[] {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

function generateOuvriers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    nom: `Nom${i + 1}`,
    prenom: `Prenom${i + 1}`,
    type: (i % 3 === 0 ? 'SOUS_TRAITANT' : 'SALARIE') as TypeOuvrier,
    affectations: []
  }))
}

describe('Vue Ouvrier - Performance', () => {
  const joursSemaine = getWeekDays()
  const weekStart = joursSemaine[0]
  const chantiersNonTermines = [
    { id: 1, nom: 'Chantier A', statut: 'ACTIF' as StatutChantier }
  ]

  it('rend 50 ouvriers en moins de 500ms', () => {
    const ouvriers = generateOuvriers(50)

    const startTime = performance.now()

    render(
      <VueOuvrierListeClient
        ouvriers={ouvriers}
        joursSemaine={joursSemaine}
        chantiersNonTermines={chantiersNonTermines}
        weekStart={weekStart}
      />
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Le rendu doit prendre moins de 500ms
    expect(renderTime).toBeLessThan(500)
  })

  it('rend 100 ouvriers en moins de 1000ms', () => {
    const ouvriers = generateOuvriers(100)

    const startTime = performance.now()

    render(
      <VueOuvrierListeClient
        ouvriers={ouvriers}
        joursSemaine={joursSemaine}
        chantiersNonTermines={chantiersNonTermines}
        weekStart={weekStart}
      />
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Le rendu de 100 ouvriers doit rester raisonnable
    expect(renderTime).toBeLessThan(1000)
  })

  it('gère un grand nombre d\'ouvriers avec affectations', () => {
    const ouvriers = generateOuvriers(50).map((ouvrier, i) => ({
      ...ouvrier,
      affectations: joursSemaine.slice(0, 3).map((jour, j) => ({
        id: i * 100 + j,
        date: jour,
        periode: 'JOURNEE' as const,
        statutPresence: 'TRAVAIL' as const,
        chantier: { id: 1, nom: 'Chantier Test', statut: 'ACTIF' as StatutChantier }
      }))
    }))

    const startTime = performance.now()

    render(
      <VueOuvrierListeClient
        ouvriers={ouvriers}
        joursSemaine={joursSemaine}
        chantiersNonTermines={chantiersNonTermines}
        weekStart={weekStart}
      />
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Le rendu avec affectations doit rester sous 750ms
    expect(renderTime).toBeLessThan(750)
  })
})
