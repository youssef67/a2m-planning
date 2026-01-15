import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrintableChantierPlanning } from '@/components/features/planning/PrintableChantierPlanning'
import type { TypeOuvrier, Periode } from '@/generated/prisma/client'

interface OuvrierData {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

interface AffectationData {
  id: number
  date: Date
  periode: Periode
  ouvrier: OuvrierData
}

interface ChantierData {
  id: number
  nom: string
  affectations: AffectationData[]
}

function createChantier(overrides: Partial<ChantierData> = {}): ChantierData {
  return {
    id: 1,
    nom: 'Résidence Les Lilas',
    affectations: [],
    ...overrides
  }
}

function createAffectation(overrides: Partial<AffectationData> = {}): AffectationData {
  return {
    id: 1,
    date: new Date('2026-01-13'),
    periode: 'JOURNEE',
    ouvrier: {
      id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      type: 'SALARIE'
    },
    ...overrides
  }
}

describe('PrintableChantierPlanning (Story 2.18)', () => {
  const weekStart = new Date('2026-01-13')

  it('affiche le nom du chantier en majuscules (AC: 5)', () => {
    const chantier = createChantier({ nom: 'Résidence Les Lilas' })

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    expect(screen.getByText('RÉSIDENCE LES LILAS')).toBeInTheDocument()
  })

  it('affiche la période de 3 semaines dans le sous-titre (AC: 6)', () => {
    const chantier = createChantier()

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    const subtitle = screen.getByText(/Planning du/i)
    expect(subtitle).toBeInTheDocument()
  })

  it('affiche un tableau avec 3 lignes de semaines (AC: 6)', () => {
    const chantier = createChantier()

    const { container } = render(
      <PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />
    )

    // 1 row header + 3 rows de semaines
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(3)
  })

  it('affiche 7 colonnes de jours', () => {
    const chantier = createChantier()

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Mar')).toBeInTheDocument()
    expect(screen.getByText('Mer')).toBeInTheDocument()
    expect(screen.getByText('Jeu')).toBeInTheDocument()
    expect(screen.getByText('Ven')).toBeInTheDocument()
    expect(screen.getByText('Sam')).toBeInTheDocument()
    expect(screen.getByText('Dim')).toBeInTheDocument()
  })

  it('affiche "Aucun" pour les cellules vides (AC: 8)', () => {
    const chantier = createChantier({ affectations: [] })

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    // Il devrait y avoir plusieurs "Aucun" (21 jours sans affectations)
    const aucunElements = screen.getAllByText('Aucun')
    expect(aucunElements.length).toBe(21)
  })

  it('affiche le nom de l\'ouvrier seul (AC: 7)', () => {
    const chantier = createChantier({
      affectations: [
        createAffectation({
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }
        })
      ]
    })

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    expect(screen.getByText('Dupont')).toBeInTheDocument()
  })

  it('affiche liste verticale des ouvriers pour une journée (AC: 7)', () => {
    const chantier = createChantier({
      affectations: [
        createAffectation({
          id: 1,
          date: new Date('2026-01-13'),
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }
        }),
        createAffectation({
          id: 2,
          date: new Date('2026-01-13'),
          ouvrier: { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SALARIE' }
        })
      ]
    })

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    expect(screen.getByText('Dupont')).toBeInTheDocument()
    expect(screen.getByText('Martin')).toBeInTheDocument()
  })

  it('n\'affiche pas de période pour JOURNEE (AC: 7)', () => {
    const chantier = createChantier({
      affectations: [
        createAffectation({ periode: 'JOURNEE' })
      ]
    })

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    // Le nom seul sans M ou AM
    expect(screen.getByText('Dupont')).toBeInTheDocument()
    // Pas de M ou AM isolé
    expect(screen.queryByText(/^M$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^AM$/)).not.toBeInTheDocument()
  })

  it('affiche "M" après le nom pour MATIN (AC: 7)', () => {
    const chantier = createChantier({
      affectations: [
        createAffectation({ periode: 'MATIN' })
      ]
    })

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    expect(screen.getByText('Dupont M')).toBeInTheDocument()
  })

  it('affiche "AM" après le nom pour APRES_MIDI (AC: 7)', () => {
    const chantier = createChantier({
      affectations: [
        createAffectation({ periode: 'APRES_MIDI' })
      ]
    })

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    expect(screen.getByText('Dupont AM')).toBeInTheDocument()
  })

  it('inclut les sous-traitants comme les autres ouvriers (AC: 9)', () => {
    const chantier = createChantier({
      affectations: [
        createAffectation({
          id: 1,
          date: new Date('2026-01-13'),
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }
        }),
        createAffectation({
          id: 2,
          date: new Date('2026-01-13'),
          ouvrier: { id: 2, nom: 'SousTraitant', prenom: 'Paul', type: 'SOUS_TRAITANT' }
        })
      ]
    })

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    // Les deux sont affichés sans distinction
    expect(screen.getByText('Dupont')).toBeInTheDocument()
    expect(screen.getByText('SousTraitant')).toBeInTheDocument()
  })

  it('affiche la légende en bas (AC: 10)', () => {
    const chantier = createChantier()

    render(<PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />)

    expect(screen.getByText(/LÉGENDE/i)).toBeInTheDocument()
    expect(screen.getByText(/Journée complète/i)).toBeInTheDocument()
    expect(screen.getByText(/M = Matin/i)).toBeInTheDocument()
    expect(screen.getByText(/AM = Après-midi/i)).toBeInTheDocument()
  })

  it('a l\'id correct pour l\'impression individuelle (AC: 4)', () => {
    const chantier = createChantier({ id: 42 })

    const { container } = render(
      <PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />
    )

    const printableDiv = container.querySelector('#printable-chantier-42')
    expect(printableDiv).toBeInTheDocument()
  })

  it('a la classe printable-chantier pour le CSS print (AC: 11, 12)', () => {
    const chantier = createChantier()

    const { container } = render(
      <PrintableChantierPlanning chantier={chantier} weekStart={weekStart} />
    )

    const printableDiv = container.querySelector('.printable-chantier')
    expect(printableDiv).toBeInTheDocument()
  })
})
