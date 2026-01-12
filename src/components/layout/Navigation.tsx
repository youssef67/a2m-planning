'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Building2, Users, Menu, X } from 'lucide-react'
import { clsx } from 'clsx'

const navLinks = [
  { href: '/planning/chantier', label: 'Planning', icon: Calendar },
  { href: '/chantiers', label: 'Chantiers', icon: Building2 },
  { href: '/ouvriers', label: 'Ouvriers', icon: Users },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/planning/chantier') {
      return pathname.startsWith('/planning')
    }
    return pathname.startsWith(href)
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden z-50">
          <nav className="flex flex-col py-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}
