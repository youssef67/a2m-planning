import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectionOuvriersChantier } from '@/components/features/planning/SelectionOuvriersChantier'
import type { TypeOuvrier } from '@/generated/prisma/client'

interface Ouvrier {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

function createOuvriers(): Ouvrier[] {
  return [
    { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' },
    { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SOUS_TRAITANT' },
    { id: 3, nom: 'Bernard', prenom: 'Marie', type: 'SALARIE' }
  ]
}

describe('SelectionOuvriersChantier', () => {
  it('affiche tous les ouvriers disponibles', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument()
    expect(screen.getByText('Marie Bernard')).toBeInTheDocument()
  })

  it('affiche le champ de recherche', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    expect(screen.getByPlaceholderText('Rechercher un ouvrier...')).toBeInTheDocument()
  })

  it('filtre les ouvriers par nom', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    const searchInput = screen.getByPlaceholderText('Rechercher un ouvrier...')
    fireEvent.change(searchInput, { target: { value: 'Dupont' } })

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.queryByText('Pierre Martin')).not.toBeInTheDocument()
    expect(screen.queryByText('Marie Bernard')).not.toBeInTheDocument()
  })

  it('filtre les ouvriers par prénom', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    const searchInput = screen.getByPlaceholderText('Rechercher un ouvrier...')
    fireEvent.change(searchInput, { target: { value: 'Pierre' } })

    expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument()
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument()
    expect(screen.queryByText('Marie Bernard')).not.toBeInTheDocument()
  })

  it('filtre avec le nom complet', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    const searchInput = screen.getByPlaceholderText('Rechercher un ouvrier...')
    fireEvent.change(searchInput, { target: { value: 'Jean Dupont' } })

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.queryByText('Pierre Martin')).not.toBeInTheDocument()
  })

  it('appelle onSelectionChange lors de la sélection d\'un ouvrier', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    expect(onSelectionChange).toHaveBeenCalledWith([1])
  })

  it('appelle onSelectionChange pour désélectionner un ouvrier', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[1, 2]}
        onSelectionChange={onSelectionChange}
      />
    )

    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    expect(onSelectionChange).toHaveBeenCalledWith([2])
  })

  it('affiche le nombre d\'ouvriers sélectionnés', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[1, 2]}
        onSelectionChange={onSelectionChange}
      />
    )

    expect(screen.getByText('2 ouvriers sélectionnés')).toBeInTheDocument()
  })

  it('affiche le texte singulier pour un ouvrier sélectionné', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[1]}
        onSelectionChange={onSelectionChange}
      />
    )

    expect(screen.getByText('1 ouvrier sélectionné')).toBeInTheDocument()
  })

  it('affiche un message quand aucun ouvrier n\'est trouvé', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    const searchInput = screen.getByPlaceholderText('Rechercher un ouvrier...')
    fireEvent.change(searchInput, { target: { value: 'xyz123' } })

    expect(screen.getByText('Aucun ouvrier trouvé')).toBeInTheDocument()
  })

  it('affiche le type de l\'ouvrier', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    // Il y a 2 ouvriers SALARIE et 1 SOUS_TRAITANT
    expect(screen.getAllByText('Salarié')).toHaveLength(2)
    expect(screen.getByText('Sous-traitant')).toBeInTheDocument()
  })

  it('permet de tout sélectionner', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    )

    const selectAllButton = screen.getByText('Tout sélectionner')
    fireEvent.click(selectAllButton)

    expect(onSelectionChange).toHaveBeenCalledWith([1, 2, 3])
  })

  it('permet de tout désélectionner', () => {
    const ouvriers = createOuvriers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionOuvriersChantier
        ouvriers={ouvriers}
        selectedIds={[1, 2, 3]}
        onSelectionChange={onSelectionChange}
      />
    )

    const deselectAllButton = screen.getByText('Tout désélectionner')
    fireEvent.click(deselectAllButton)

    expect(onSelectionChange).toHaveBeenCalledWith([])
  })

  describe('Indicateurs d\'indisponibilité (AC6)', () => {
    it('affiche une icône d\'avertissement pour les ouvriers indisponibles', () => {
      const ouvriers = createOuvriers()
      const onSelectionChange = vi.fn()
      const joursSelectionnes = [new Date('2024-01-15')]
      const indisponibilites = {
        '2024-01-15': {
          1: 'Congé payé'
        }
      }

      render(
        <SelectionOuvriersChantier
          ouvriers={ouvriers}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
          joursSelectionnes={joursSelectionnes}
          indisponibilites={indisponibilites}
        />
      )

      // Vérifier que l'indicateur d'indisponibilité est affiché
      expect(screen.getByText('(1 indispo.)')).toBeInTheDocument()
    })

    it('n\'affiche pas d\'icône pour les ouvriers disponibles', () => {
      const ouvriers = createOuvriers()
      const onSelectionChange = vi.fn()
      const joursSelectionnes = [new Date('2024-01-15')]
      const indisponibilites = {
        '2024-01-15': {
          1: 'Congé payé'
        }
      }

      render(
        <SelectionOuvriersChantier
          ouvriers={ouvriers}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
          joursSelectionnes={joursSelectionnes}
          indisponibilites={indisponibilites}
        />
      )

      // Seul l'ouvrier 1 a une indisponibilité
      const indispoTexts = screen.getAllByText(/indispo\./)
      expect(indispoTexts).toHaveLength(1)
    })

    it('affiche le tooltip avec la raison de l\'indisponibilité', () => {
      const ouvriers = createOuvriers()
      const onSelectionChange = vi.fn()
      const joursSelectionnes = [new Date('2024-01-15')]
      const indisponibilites = {
        '2024-01-15': {
          1: 'Congé payé'
        }
      }

      render(
        <SelectionOuvriersChantier
          ouvriers={ouvriers}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
          joursSelectionnes={joursSelectionnes}
          indisponibilites={indisponibilites}
        />
      )

      // Vérifier que le tooltip existe
      const warningIcon = screen.getByTitle('Indisponible: Congé payé')
      expect(warningIcon).toBeInTheDocument()
    })

    it('compte les indisponibilités sur plusieurs jours', () => {
      const ouvriers = createOuvriers()
      const onSelectionChange = vi.fn()
      const joursSelectionnes = [
        new Date('2024-01-15'),
        new Date('2024-01-16'),
        new Date('2024-01-17')
      ]
      const indisponibilites = {
        '2024-01-15': { 1: 'Congé payé' },
        '2024-01-16': { 1: 'Congé payé' }
      }

      render(
        <SelectionOuvriersChantier
          ouvriers={ouvriers}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
          joursSelectionnes={joursSelectionnes}
          indisponibilites={indisponibilites}
        />
      )

      // 2 jours d'indisponibilité pour l'ouvrier 1
      expect(screen.getByText('(2 indispo.)')).toBeInTheDocument()
    })

    it('n\'affiche pas d\'indicateur si aucun jour n\'est sélectionné', () => {
      const ouvriers = createOuvriers()
      const onSelectionChange = vi.fn()
      const indisponibilites = {
        '2024-01-15': { 1: 'Congé payé' }
      }

      render(
        <SelectionOuvriersChantier
          ouvriers={ouvriers}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
          joursSelectionnes={[]}
          indisponibilites={indisponibilites}
        />
      )

      // Pas d'indicateur car aucun jour sélectionné
      expect(screen.queryByText(/indispo\./)).not.toBeInTheDocument()
    })
  })
})
