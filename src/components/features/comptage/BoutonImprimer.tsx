'use client'

import { Printer } from 'lucide-react'

export function BoutonImprimer() {
  function handlePrint() {
    window.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="no-print inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Imprimer le tableau"
    >
      <Printer className="h-4 w-4" />
      <span>Imprimer</span>
    </button>
  )
}
