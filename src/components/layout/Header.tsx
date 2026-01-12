'use client'

import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'

export function Header() {
  const pathname = usePathname()

  // Don't show header on login page
  if (pathname === '/login') {
    return null
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900">A2M Planning</h1>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
