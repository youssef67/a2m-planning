'use client'

import { Copy } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { formatTableauComptage, copyToClipboard, type OuvrierPourExport } from '@/lib/export-utils'

interface BoutonCopierProps {
  data: OuvrierPourExport[]
  annee: number
}

export function BoutonCopier({ data, annee }: BoutonCopierProps) {
  const { showToast } = useToast()

  async function handleCopy() {
    const text = formatTableauComptage(data, annee)
    await copyToClipboard(text)
    showToast('Copié !', 'success')
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="no-print inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Copier le tableau"
    >
      <Copy className="h-4 w-4" />
      <span>Copier</span>
    </button>
  )
}
