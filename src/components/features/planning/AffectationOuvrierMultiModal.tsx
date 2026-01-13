'use client'

import { useState, useTransition, useCallback } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ModalAffectationMultiJours } from './ModalAffectationMultiJours'
import { SelectionChantierOuvrier } from './SelectionChantierOuvrier'
import { SelectionOuvriersChantier } from './SelectionOuvriersChantier'
import { creerAffectationsEnMasse } from '@/actions/affectations'
import { useToast } from '@/components/ui/Toast'
import type { Periode, TypeOuvrier, StatutChantier } from '@/generated/prisma/client'

interface Chantier {
  id: number
  nom: string
  statut: StatutChantier
}

interface Ouvrier {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

type IndisponibilitesMap = Record<string, Record<number, string>>

interface AffectationOuvrierMultiModalProps {
  isOpen: boolean
  onClose: () => void
  chantiers: Chantier[]
  ouvriers: Ouvrier[]
  semaineDebut: Date
  indisponibilites?: IndisponibilitesMap
  onRefresh?: () => void
}

export function AffectationOuvrierMultiModal({
  isOpen,
  onClose,
  chantiers,
  ouvriers,
  semaineDebut,
  indisponibilites = {},
  onRefresh
}: AffectationOuvrierMultiModalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [selectedChantierId, setSelectedChantierId] = useState<number | null>(null)
  const [selectedOuvrierIds, setSelectedOuvrierIds] = useState<number[]>([])

  const handleClose = useCallback(() => {
    setSelectedChantierId(null)
    setSelectedOuvrierIds([])
    onClose()
  }, [onClose])

  const handleConfirm = useCallback(
    async (jours: Date[], periode: Periode) => {
      if (!selectedChantierId) {
        showToast('Veuillez sélectionner un chantier', 'error')
        return
      }

      if (selectedOuvrierIds.length === 0) {
        showToast('Veuillez sélectionner au moins un ouvrier', 'error')
        return
      }

      const dates = jours.map((j) => format(j, 'yyyy-MM-dd'))

      startTransition(async () => {
        const result = await creerAffectationsEnMasse({
          ouvrierIds: selectedOuvrierIds,
          chantierId: selectedChantierId,
          dates,
          periode
        })

        if ('error' in result && result.error) {
          showToast(result.error, 'error')
        } else if ('success' in result) {
          showToast(`${result.count} affectation(s) créée(s)`, 'success')
          handleClose()
          if (onRefresh) {
            onRefresh()
          } else {
            router.refresh()
          }
        }
      })
    },
    [selectedChantierId, selectedOuvrierIds, showToast, router, handleClose, onRefresh]
  )

  const renderContent = useCallback(
    (joursSelectionnes: Date[]) => (
      <div className="space-y-4">
        <SelectionChantierOuvrier
          chantiers={chantiers}
          selectedId={selectedChantierId}
          onSelectionChange={setSelectedChantierId}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ouvriers</label>
          <SelectionOuvriersChantier
            ouvriers={ouvriers}
            selectedIds={selectedOuvrierIds}
            onSelectionChange={setSelectedOuvrierIds}
            joursSelectionnes={joursSelectionnes}
            indisponibilites={indisponibilites}
          />
        </div>
      </div>
    ),
    [chantiers, ouvriers, selectedChantierId, selectedOuvrierIds, indisponibilites]
  )

  return (
    <ModalAffectationMultiJours
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      titre="Nouvelle affectation"
      semaineDebut={semaineDebut}
      isLoading={isPending}
      renderContent={renderContent}
    />
  )
}
