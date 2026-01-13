'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const onglets = [
  { href: '/planning/chantier', label: 'Vue Chantier' },
  { href: '/planning/ouvrier', label: 'Vue Ouvrier' },
  { href: '/planning/comptage', label: 'Comptage' }
] as const

export function NavigationOnglets() {
  const pathname = usePathname()

  return (
    <nav className="flex border-b border-gray-200 mb-4" aria-label="Navigation planning">
      {onglets.map((onglet) => {
        const isActive = pathname === onglet.href

        return (
          <Link
            key={onglet.href}
            href={onglet.href}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {onglet.label}
          </Link>
        )
      })}
    </nav>
  )
}
