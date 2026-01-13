'use client'

interface ModalConfirmationProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ModalConfirmation({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}: ModalConfirmationProps) {
  if (!isOpen) return null

  const iconColor = variant === 'danger' ? 'text-red-600' : 'text-yellow-600'
  const iconBg = variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
  const confirmBtnClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onCancel}
        />
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div className="text-center">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBg} mb-4`}>
              <svg
                className={`h-6 w-6 ${iconColor}`}
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
            <h3 id="modal-title" className="text-lg font-medium text-gray-900 mb-2">
              {title}
            </h3>
            <p id="modal-description" className="text-sm text-gray-600 mb-6">
              {message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmBtnClass}`}
              >
                {isLoading ? 'En cours...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
