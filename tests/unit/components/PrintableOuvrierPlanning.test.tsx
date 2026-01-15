import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrintableOuvrierPlanning } from '@/components/features/planning/PrintableOuvrierPlanning'
import type { TypeOuvrier, Periode, StatutPresence } from '@/generated/prisma/client'

interface Affectation {
  id: number
  date: Date
  periode: Periode
  statutPresence: StatutPresence
  chantier: {
    id: number
    nom: string
  } | null
}

interface Ouvrier {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
  affectations: Affectation[]
}

function createOuvrier(overrides: Partial<Ouvrier> = {}): Ouvrier {
  return {
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    type: 'SALARIE',
    affectations: [],
    ...overrides
  }
}

describe('PrintableOuvrierPlanning (Story 2.17)', () => {
  const weekStart = new Date('2026-01-13')

  it('affiche le nom de l\'ouvrier en majuscules (AC: 5)', () => {
    const ouvrier = createOuvrier({ nom: 'Dupont', prenom: 'Jean' })

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    expect(screen.getByText('DUPONT JEAN')).toBeInTheDocument()
  })

  it('affiche la période de 3 semaines dans le sous-titre (AC: 6)', () => {
    const ouvrier = createOuvrier()

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    // Le sous-titre devrait mentionner la période
    const subtitle = screen.getByText(/Planning du/i)
    expect(subtitle).toBeInTheDocument()
  })

  it('affiche un tableau avec 3 lignes de semaines', () => {
    const ouvrier = createOuvrier()

    const { container } = render(
      <PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />
    )

    // 1 row header + 3 rows de semaines
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(3)
  })

  it('affiche 7 colonnes de jours', () => {
    const ouvrier = createOuvrier()

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    // Les jours de la semaine
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Mar')).toBeInTheDocument()
    expect(screen.getByText('Mer')).toBeInTheDocument()
    expect(screen.getByText('Jeu')).toBeInTheDocument()
    expect(screen.getByText('Ven')).toBeInTheDocument()
    expect(screen.getByText('Sam')).toBeInTheDocument()
    expect(screen.getByText('Dim')).toBeInTheDocument()
  })

  it('affiche "Aucun" pour les cellules vides (AC: 9)', () => {
    const ouvrier = createOuvrier({ affectations: [] })

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    // Il devrait y avoir plusieurs "Aucun" (21 jours sans affectations)
    const aucunElements = screen.getAllByText('Aucun')
    expect(aucunElements.length).toBe(21)
  })

  it('affiche le nom du chantier tronqué si > 10 caractères (AC: 7)', () => {
    const ouvrier = createOuvrier({
      affectations: [
        {
          id: 1,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Résidence Les Lilas' }
        }
      ]
    })

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    // Le nom est tronqué à 10 caractères (défaut)
    expect(screen.getByText('Résidence…')).toBeInTheDocument()
  })

  it('n\'affiche pas de période pour JOURNEE (AC: 7)', () => {
    const ouvrier = createOuvrier({
      affectations: [
        {
          id: 1,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Villa' }
        }
      ]
    })

    const { container } = render(
      <PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />
    )

    // Pas de "M" ou "AM" pour cette affectation
    const cellPeriodes = container.querySelectorAll('.cell-periode')
    const periodeTexts = Array.from(cellPeriodes).map(el => el.textContent)
    expect(periodeTexts.filter(t => t === 'M' || t === 'AM')).toHaveLength(0)
  })

  it('affiche "M" pour MATIN (AC: 7)', () => {
    const ouvrier = createOuvrier({
      affectations: [
        {
          id: 1,
          date: new Date('2026-01-13'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Villa' }
        }
      ]
    })

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('affiche "AM" pour APRES_MIDI (AC: 7)', () => {
    const ouvrier = createOuvrier({
      affectations: [
        {
          id: 1,
          date: new Date('2026-01-13'),
          periode: 'APRES_MIDI',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Villa' }
        }
      ]
    })

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    expect(screen.getByText('AM')).toBeInTheDocument()
  })

  it('affiche les indisponibilités avec le motif complet (AC: 8)', () => {
    const ouvrier = createOuvrier({
      affectations: [
        {
          id: 1,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'CONGE',
          chantier: null
        }
      ]
    })

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    expect(screen.getByText('Congé')).toBeInTheDocument()
  })

  it('affiche la légende en bas (AC: 10)', () => {
    const ouvrier = createOuvrier()

    render(<PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />)

    expect(screen.getByText(/LÉGENDE/i)).toBeInTheDocument()
    expect(screen.getByText(/Journée complète/i)).toBeInTheDocument()
    expect(screen.getByText(/M = Matin/i)).toBeInTheDocument()
    expect(screen.getByText(/AM = Après-midi/i)).toBeInTheDocument()
  })

  it('a l\'id correct pour l\'impression individuelle', () => {
    const ouvrier = createOuvrier({ id: 42 })

    const { container } = render(
      <PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />
    )

    const printableDiv = container.querySelector('#printable-ouvrier-42')
    expect(printableDiv).toBeInTheDocument()
  })

  it('a la classe printable-ouvrier pour le CSS print', () => {
    const ouvrier = createOuvrier()

    const { container } = render(
      <PrintableOuvrierPlanning ouvrier={ouvrier} weekStart={weekStart} />
    )

    const printableDiv = container.querySelector('.printable-ouvrier')
    expect(printableDiv).toBeInTheDocument()
  })
})
