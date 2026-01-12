'use client'

import { useState } from 'react'
import { AffectationForm } from './AffectationForm'
import type { Ouvrier } from '@/generated/prisma/client'

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
  const [showSuccess, setShowSuccess] = useState(false)

  if (!isOpen) return null

  const handleSuccess = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">
                Affectation créée
              </p>
            </div>
          ) : (
            <>
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
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
