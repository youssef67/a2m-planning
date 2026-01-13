'use client'

import type { Periode } from '@/generated/prisma/client'
import type { ConflitPeriode } from '@/lib/affectations'

const PERIODE_LABELS: Record<Periode, string> = {
  JOURNEE: 'la journée',
  MATIN: 'le matin',
  APRES_MIDI: "l'après-midi"
}

interface ModalConflitPeriodeProps {
  conflit: ConflitPeriode
  nouvellePeriode: Periode
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ModalConflitPeriode({
  conflit,
  nouvellePeriode,
  onConfirm,
  onCancel,
  isLoading = false
}: ModalConflitPeriodeProps) {
  const periodeExistanteLabel = PERIODE_LABELS[conflit.affectationExistante.periode]
  const nouvellePeriodeLabel = PERIODE_LABELS[nouvellePeriode]

  // Générer le message contextuel selon le type de conflit
  const getMessage = () => {
    if (conflit.typeConflit === 'JOURNEE_VERS_PARTIEL') {
      // JOURNEE existante → demande MATIN ou APRES_MIDI
      return (
        <>
          Cet ouvrier est déjà affecté pour <strong>la journée</strong> sur{' '}
          <strong>{conflit.affectationExistante.chantier.nom}</strong>. Souhaitez-vous
          modifier pour l&apos;affecter uniquement {nouvellePeriodeLabel} ?
        </>
      )
    } else {
      // MATIN ou APRES_MIDI existante → demande JOURNEE
      return (
        <>
          Cet ouvrier est déjà affecté {periodeExistanteLabel} sur{' '}
          <strong>{conflit.affectationExistante.chantier.nom}</strong>. Souhaitez-vous
          modifier pour l&apos;affecter la journée entière ?
        </>
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onCancel}
        />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Conflit de période
              </h3>
              <p className="mt-2 text-sm text-gray-600">{getMessage()}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Modification...' : 'Modifier'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
