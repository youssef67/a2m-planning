import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectionChantierOuvrier } from '@/components/features/planning/SelectionChantierOuvrier'
import type { StatutChantier } from '@/generated/prisma/client'

interface Chantier {
  id: number
  nom: string
  statut: StatutChantier
}

function createChantiers(): Chantier[] {
  return [
    { id: 1, nom: 'Chantier Alpha', statut: 'ACTIF' },
    { id: 2, nom: 'Chantier Beta', statut: 'ACTIF' },
    { id: 3, nom: 'Chantier Gamma', statut: 'EN_PAUSE' },
    { id: 4, nom: 'Chantier Delta', statut: 'TERMINE' }
  ]
}

describe('SelectionChantierOuvrier', () => {
  it('affiche le bouton de sélection avec le placeholder', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    expect(screen.getByText('Sélectionner un chantier')).toBeInTheDocument()
  })

  it('affiche le nom du chantier sélectionné', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={1}
        onSelectionChange={onSelectionChange}
      />
    )

    expect(screen.getByText('Chantier Alpha')).toBeInTheDocument()
  })

  it('ouvre le dropdown au clic sur le bouton', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(screen.getByPlaceholderText('Rechercher un chantier...')).toBeInTheDocument()
  })

  it('affiche uniquement les chantiers ACTIF (pas EN_PAUSE ni TERMINE)', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Chantiers ACTIF doivent être visibles
    expect(screen.getByText('Chantier Alpha')).toBeInTheDocument()
    expect(screen.getByText('Chantier Beta')).toBeInTheDocument()

    // EN_PAUSE et TERMINE ne doivent pas être affichés
    expect(screen.queryByText('Chantier Gamma')).not.toBeInTheDocument()
    expect(screen.queryByText('Chantier Delta')).not.toBeInTheDocument()
  })

  it('filtre les chantiers par nom', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    const searchInput = screen.getByPlaceholderText('Rechercher un chantier...')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })

    expect(screen.getByText('Chantier Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Chantier Beta')).not.toBeInTheDocument()
  })

  it('appelle onSelectionChange lors de la sélection d\'un chantier', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    const chantierOption = screen.getByText('Chantier Alpha')
    fireEvent.click(chantierOption)

    expect(onSelectionChange).toHaveBeenCalledWith(1)
  })

  it('ferme le dropdown après sélection', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    const chantierOption = screen.getByText('Chantier Alpha')
    fireEvent.click(chantierOption)

    expect(screen.queryByPlaceholderText('Rechercher un chantier...')).not.toBeInTheDocument()
  })

  it('affiche un message quand aucun chantier n\'est trouvé', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    const searchInput = screen.getByPlaceholderText('Rechercher un chantier...')
    fireEvent.change(searchInput, { target: { value: 'xyz123' } })

    expect(screen.getByText('Aucun chantier trouvé')).toBeInTheDocument()
  })

  it('affiche un message quand aucun chantier actif n\'est disponible', () => {
    const chantiers: Chantier[] = [
      { id: 1, nom: 'Chantier Terminé', statut: 'TERMINE' }
    ]
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(screen.getByText('Aucun chantier actif disponible')).toBeInTheDocument()
  })

  it('affiche une coche pour le chantier sélectionné', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={1}
        onSelectionChange={onSelectionChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Le chantier sélectionné doit avoir une mise en surbrillance
    const allChantierAlpha = screen.getAllByText('Chantier Alpha')
    // Le deuxième est dans le dropdown (le premier est dans le bouton principal)
    const selectedOption = allChantierAlpha[1]?.closest('button')
    expect(selectedOption).toHaveClass('bg-blue-50')
  })

  it('affiche le label "Chantier"', () => {
    const chantiers = createChantiers()
    const onSelectionChange = vi.fn()

    render(
      <SelectionChantierOuvrier
        chantiers={chantiers}
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />
    )

    expect(screen.getByText('Chantier')).toBeInTheDocument()
  })
})
