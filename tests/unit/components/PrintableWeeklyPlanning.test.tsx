import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrintableWeeklyPlanning } from '@/components/features/planning/PrintableWeeklyPlanning'

const createOuvrier = (overrides = {}) => ({
  id: 1,
  nom: 'Dupont',
  prenom: 'Jean',
  type: 'SALARIE' as const,
  affectations: [],
  ...overrides
})

describe('PrintableWeeklyPlanning', () => {
  const weekStart = new Date('2026-01-13')
  const weekEnd = new Date('2026-01-19')

  it('affiche le titre avec les dates de la semaine', () => {
    render(
      <PrintableWeeklyPlanning
        ouvriers={[]}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText(/PLANNING SEMAINE DU 13 AU 19 JANVIER 2026/i)).toBeInTheDocument()
  })

  it('affiche le titre correct pour une semaine à cheval sur deux mois', () => {
    const crossMonthStart = new Date('2026-01-26')
    const crossMonthEnd = new Date('2026-02-01')

    render(
      <PrintableWeeklyPlanning
        ouvriers={[]}
        weekStart={crossMonthStart}
        weekEnd={crossMonthEnd}
      />
    )

    expect(screen.getByText(/PLANNING SEMAINE DU 26 JANVIER AU 1 FÉVRIER 2026/i)).toBeInTheDocument()
  })

  it('affiche la légende', () => {
    render(
      <PrintableWeeklyPlanning
        ouvriers={[]}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText(/LÉGENDE : Jour = Journée complète \| M = Matin \| AM = Après-midi/i)).toBeInTheDocument()
  })

  it('affiche les en-têtes des jours de la semaine', () => {
    render(
      <PrintableWeeklyPlanning
        ouvriers={[]}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('Ouvrier')).toBeInTheDocument()
    expect(screen.getByText(/Lun 13/i)).toBeInTheDocument()
    expect(screen.getByText(/Mar 14/i)).toBeInTheDocument()
    expect(screen.getByText(/Mer 15/i)).toBeInTheDocument()
    expect(screen.getByText(/Jeu 16/i)).toBeInTheDocument()
    expect(screen.getByText(/Ven 17/i)).toBeInTheDocument()
    expect(screen.getByText(/Sam 18/i)).toBeInTheDocument()
    expect(screen.getByText(/Dim 19/i)).toBeInTheDocument()
  })

  it('affiche le nom de l\'ouvrier', () => {
    const ouvriers = [createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean' })]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('Dupont Jean')).toBeInTheDocument()
  })

  it('affiche "(Sous-traitant)" pour les sous-traitants', () => {
    const ouvriers = [
      createOuvrier({ id: 1, nom: 'Martin', prenom: 'Pierre', type: 'SOUS_TRAITANT' })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('Martin Pierre')).toBeInTheDocument()
    expect(screen.getByText('(Sous-traitant)')).toBeInTheDocument()
  })

  it('n\'affiche pas "(Sous-traitant)" pour les salariés', () => {
    const ouvriers = [
      createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.queryByText('(Sous-traitant)')).not.toBeInTheDocument()
  })

  it('affiche "-" pour les cellules vides', () => {
    const ouvriers = [createOuvrier({ id: 1, affectations: [] })]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    // 7 jours sans affectation = 7 tirets
    const tirets = screen.getAllByText('-')
    expect(tirets.length).toBe(7)
  })

  it('affiche le nom du chantier et la période pour une affectation', () => {
    const ouvriers = [
      createOuvrier({
        id: 1,
        affectations: [
          {
            id: 100,
            date: new Date('2026-01-13'),
            periode: 'JOURNEE',
            statutPresence: 'PRESENT',
            chantier: { id: 1, nom: 'Villa Martin' }
          }
        ]
      })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('Villa Martin')).toBeInTheDocument()
    expect(screen.getByText('Jour')).toBeInTheDocument()
  })

  it('affiche "M" pour une affectation matin', () => {
    const ouvriers = [
      createOuvrier({
        id: 1,
        affectations: [
          {
            id: 100,
            date: new Date('2026-01-13'),
            periode: 'MATIN',
            statutPresence: 'PRESENT',
            chantier: { id: 1, nom: 'Chantier' }
          }
        ]
      })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('affiche "AM" pour une affectation après-midi', () => {
    const ouvriers = [
      createOuvrier({
        id: 1,
        affectations: [
          {
            id: 100,
            date: new Date('2026-01-13'),
            periode: 'APRES_MIDI',
            statutPresence: 'PRESENT',
            chantier: { id: 1, nom: 'Chantier' }
          }
        ]
      })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('AM')).toBeInTheDocument()
  })

  it('affiche le statut d\'indisponibilité (Congé)', () => {
    const ouvriers = [
      createOuvrier({
        id: 1,
        affectations: [
          {
            id: 100,
            date: new Date('2026-01-13'),
            periode: 'JOURNEE',
            statutPresence: 'CONGE',
            chantier: null
          }
        ]
      })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('Congé')).toBeInTheDocument()
  })

  it('affiche le statut d\'indisponibilité (Maladie)', () => {
    const ouvriers = [
      createOuvrier({
        id: 1,
        affectations: [
          {
            id: 100,
            date: new Date('2026-01-13'),
            periode: 'JOURNEE',
            statutPresence: 'MALADIE',
            chantier: null
          }
        ]
      })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('Maladie')).toBeInTheDocument()
  })

  it('tronque les noms de chantier longs', () => {
    const ouvriers = [
      createOuvrier({
        id: 1,
        affectations: [
          {
            id: 100,
            date: new Date('2026-01-13'),
            periode: 'JOURNEE',
            statutPresence: 'PRESENT',
            chantier: { id: 1, nom: 'Résidence Les Lilas du Parc' }
          }
        ]
      })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('Résidence Les …')).toBeInTheDocument()
  })

  it('a la classe print-only pour être masqué à l\'écran', () => {
    const { container } = render(
      <PrintableWeeklyPlanning
        ouvriers={[]}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(container.querySelector('.print-only')).toBeInTheDocument()
  })

  it('affiche plusieurs ouvriers', () => {
    const ouvriers = [
      createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean' }),
      createOuvrier({ id: 2, nom: 'Martin', prenom: 'Pierre' }),
      createOuvrier({ id: 3, nom: 'Durand', prenom: 'Marie', type: 'SOUS_TRAITANT' })
    ]

    render(
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    )

    expect(screen.getByText('Dupont Jean')).toBeInTheDocument()
    expect(screen.getByText('Martin Pierre')).toBeInTheDocument()
    expect(screen.getByText('Durand Marie')).toBeInTheDocument()
  })
})
