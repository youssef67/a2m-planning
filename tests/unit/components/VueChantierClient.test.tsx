import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VueChantierClient } from '@/components/features/planning/VueChantierClient'
import type { StatutChantier, TypeOuvrier } from '@/generated/prisma/client'
import { startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns'

// Mock des hooks et actions
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() })
}))

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() })
}))

vi.mock('@/actions/affectations', () => ({
  creerAffectationsEnMasse: vi.fn()
}))

interface Chantier {
  id: number
  nom: string
  statut: StatutChantier
  affectations: unknown[]
}

interface OuvrierActif {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

function createChantier(overrides: Partial<Chantier> = {}): Chantier {
  return {
    id: 1,
    nom: 'Chantier Test',
    statut: 'ACTIF',
    affectations: [],
    ...overrides
  }
}

function createOuvrierActif(overrides: Partial<OuvrierActif> = {}): OuvrierActif {
  return {
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    type: 'SALARIE',
    ...overrides
  }
}

function getWeekDays(): Date[] {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

describe('VueChantierClient - Bouton "+" multi-ouvriers', () => {
  const defaultProps = {
    chantiers: [createChantier()],
    chantiersActifs: [{ id: 1, nom: 'Chantier Test' }],
    joursSemaine: getWeekDays(),
    ouvriersActifs: [createOuvrierActif()],
    indisponiblesByDate: {}
  }

  it('affiche le bouton "+" pour un chantier actif', () => {
    render(<VueChantierClient {...defaultProps} />)

    const addButton = screen.getByRole('button', {
      name: /affecter des ouvriers au chantier/i
    })
    expect(addButton).toBeInTheDocument()
  })

  it('n\'affiche pas le bouton "+" pour un chantier en pause', () => {
    const chantierEnPause = createChantier({ statut: 'EN_PAUSE' })

    render(
      <VueChantierClient
        {...defaultProps}
        chantiers={[chantierEnPause]}
      />
    )

    const addButton = screen.queryByRole('button', {
      name: /affecter des ouvriers au chantier/i
    })
    expect(addButton).not.toBeInTheDocument()
  })

  it('affiche un bouton "+" pour chaque chantier actif', () => {
    const chantiers = [
      createChantier({ id: 1, nom: 'Chantier A' }),
      createChantier({ id: 2, nom: 'Chantier B' }),
      createChantier({ id: 3, nom: 'Chantier C' })
    ]

    render(
      <VueChantierClient
        {...defaultProps}
        chantiers={chantiers}
        chantiersActifs={chantiers.map((c) => ({ id: c.id, nom: c.nom }))}
      />
    )

    const addButtons = screen.getAllByRole('button', {
      name: /affecter des ouvriers au chantier/i
    })
    expect(addButtons).toHaveLength(3)
  })

  it('ouvre le modal multi-jours au clic sur le bouton "+"', () => {
    render(<VueChantierClient {...defaultProps} />)

    const addButton = screen.getByRole('button', {
      name: /affecter des ouvriers au chantier/i
    })
    fireEvent.click(addButton)

    // Vérifie que le modal s'ouvre avec le bon titre
    expect(screen.getByText(/affecter au chantier/i)).toBeInTheDocument()
  })

  it('affiche le nom du chantier dans le titre du modal', () => {
    const chantier = createChantier({ nom: 'Chantier Alpha' })

    render(
      <VueChantierClient
        {...defaultProps}
        chantiers={[chantier]}
        chantiersActifs={[{ id: chantier.id, nom: chantier.nom }]}
      />
    )

    const addButton = screen.getByRole('button', {
      name: /affecter des ouvriers au chantier chantier alpha/i
    })
    fireEvent.click(addButton)

    expect(screen.getByText('Affecter au chantier Chantier Alpha')).toBeInTheDocument()
  })

  it('le bouton "+" a l\'attribut title pour le tooltip', () => {
    render(<VueChantierClient {...defaultProps} />)

    const addButton = screen.getByRole('button', {
      name: /affecter des ouvriers au chantier/i
    })
    expect(addButton).toHaveAttribute('title', 'Affectation multi-ouvriers')
  })

  it('ne montre pas le "+" au survol des cellules jour', () => {
    render(<VueChantierClient {...defaultProps} />)

    // Vérifie qu'il n'y a pas de span avec "+" dans les cellules jour
    // Le seul "+" visible est dans le bouton du header
    const plusIcons = screen.queryAllByText('+')
    expect(plusIcons).toHaveLength(0)
  })

  it('affiche le message vide quand aucun chantier', () => {
    render(
      <VueChantierClient
        {...defaultProps}
        chantiers={[]}
      />
    )

    expect(screen.getByText(/aucun chantier actif ou en pause trouvé/i)).toBeInTheDocument()
  })
})
