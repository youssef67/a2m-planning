'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { formatTableauComptage, copyToClipboard, type OuvrierPourExport } from '@/lib/export-utils'

interface BoutonCopierProps {
  data: OuvrierPourExport[]
  annee: number
}

export function BoutonCopier({ data, annee }: BoutonCopierProps) {
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  async function handleCopy() {
    const text = formatTableauComptage(data, annee)
    await copyToClipboard(text)
    setCopied(true)
    showToast('Copié !', 'success')

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="no-print inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Copier le tableau"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Copié</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>Copier</span>
        </>
      )}
    </button>
  )
}
