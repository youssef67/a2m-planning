'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AffectationForm } from './AffectationForm'
import { ModalConflitPeriode } from './planning/ModalConflitPeriode'
import { modifierPeriodeAffectation } from '@/actions/affectations'
import { useToast } from '@/components/ui/Toast'
import type { Ouvrier, Periode } from '@/generated/prisma/client'
import type { ConflitPeriode } from '@/lib/affectations'

interface AffectationModalProps {
  chantierId: number
  chantierNom: string
  date?: string
  ouvriers: Pick<Ouvrier, 'id' | 'nom' | 'prenom' | 'type'>[]
  indisponibles?: Record<number, string>
  isOpen: boolean
  onClose: () => void
}

export function AffectationModal({
  chantierId,
  chantierNom,
  date,
  ouvriers,
  indisponibles,
  isOpen,
  onClose
}: AffectationModalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [conflit, setConflit] = useState<ConflitPeriode | null>(null)
  const [nouvellePeriode, setNouvellePeriode] = useState<Periode | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const handleSuccess = () => {
    showToast('Affectation créée', 'success')
    router.refresh()
    onClose()
  }

  const handleConflict = (conflitDetecte: ConflitPeriode, periode: Periode) => {
    setConflit(conflitDetecte)
    setNouvellePeriode(periode)
  }

  const handleConfirmModification = () => {
    if (!conflit || !nouvellePeriode) return

    startTransition(async () => {
      const result = await modifierPeriodeAffectation(
        conflit.affectationExistante.id,
        nouvellePeriode
      )

      if ('error' in result) {
        showToast(result.error || 'Une erreur est survenue', 'error')
        setConflit(null)
        setNouvellePeriode(null)
      } else {
        setConflit(null)
        setNouvellePeriode(null)
        handleSuccess()
      }
    })
  }

  const handleCancelConflict = () => {
    setConflit(null)
    setNouvellePeriode(null)
  }

  // Afficher le modal de conflit si un conflit est détecté
  if (conflit && nouvellePeriode) {
    return (
      <ModalConflitPeriode
        conflit={conflit}
        nouvellePeriode={nouvellePeriode}
        onConfirm={handleConfirmModification}
        onCancel={handleCancelConflict}
        isLoading={isPending}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Ajouter une affectation
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Chantier: <span className="font-medium">{chantierNom}</span>
          </p>
          <AffectationForm
            chantierId={chantierId}
            date={date}
            ouvriers={ouvriers}
            indisponibles={indisponibles}
            onSuccess={handleSuccess}
            onCancel={onClose}
            onConflict={handleConflict}
          />
        </div>
      </div>
    </div>
  )
}
