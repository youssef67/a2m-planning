'use client'

import { useActionState } from 'react'
import { useEffect, useRef } from 'react'
import { creerAffectation, verifierConflitAffectation } from '@/actions/affectations'
import type { Ouvrier, Periode } from '@/generated/prisma/client'
import type { ConflitPeriode } from '@/lib/affectations'

type FormState = { error?: string; success?: boolean } | null

const STATUT_LABELS: Record<string, string> = {
  CONGE_PAYE: 'En congé',
  MALADIE: 'En maladie',
  ABSENCE: 'Absent',
  FORMATION: 'En formation'
}

interface AffectationFormProps {
  chantierId: number
  date?: string
  ouvriers: Pick<Ouvrier, 'id' | 'nom' | 'prenom' | 'type'>[]
  indisponibles?: Record<number, string>
  onSuccess?: () => void
  onCancel?: () => void
  onConflict?: (conflit: ConflitPeriode, nouvellePeriode: Periode) => void
}

export function AffectationForm({
  chantierId,
  date,
  ouvriers,
  indisponibles = {},
  onSuccess,
  onCancel,
  onConflict
}: AffectationFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      // Vérifier les conflits de période avant création
      const ouvrierId = Number(formData.get('ouvrierId'))
      const dateValue = formData.get('date') as string
      const periode = formData.get('periode') as Periode

      if (onConflict && ouvrierId && dateValue && periode) {
        const { conflit } = await verifierConflitAffectation(ouvrierId, dateValue, periode)
        if (conflit) {
          onConflict(conflit, periode)
          return null // Ne pas créer, le conflit sera géré par le parent
        }
      }

      const result = await creerAffectation(formData)
      return result
    },
    null
  )

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      onSuccess?.()
    }
  }, [state?.success, onSuccess])

  const today = new Date().toISOString().split('T')[0]

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="chantierId" value={chantierId} />

      <div>
        <label htmlFor="ouvrierId" className="block text-sm font-medium text-gray-700">
          Ouvrier
        </label>
        <select
          id="ouvrierId"
          name="ouvrierId"
          required
          className="mt-1 input-field"
        >
          <option value="">Sélectionner un ouvrier</option>
          {ouvriers.map((ouvrier) => {
            const indispoStatut = indisponibles[ouvrier.id]
            const isIndisponible = !!indispoStatut
            const label = `${ouvrier.nom} ${ouvrier.prenom} (${ouvrier.type === 'SALARIE' ? 'Salarié' : 'Sous-traitant'})${isIndisponible ? ` - ${STATUT_LABELS[indispoStatut] ?? indispoStatut}` : ''}`
            return (
              <option
                key={ouvrier.id}
                value={ouvrier.id}
                disabled={isIndisponible}
                className={isIndisponible ? 'text-gray-400' : ''}
              >
                {label}
              </option>
            )
          })}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          defaultValue={date ?? today}
          required
          className="mt-1 input-field"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">Période</legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="periode"
              value="JOURNEE"
              defaultChecked
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Journée complète</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="periode"
              value="MATIN"
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Matin</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="periode"
              value="APRES_MIDI"
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Après-midi</span>
          </label>
        </div>
      </fieldset>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 btn-primary"
        >
          {isPending ? 'En cours...' : 'Créer'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
