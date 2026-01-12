import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/login',
}))

// Mock the login action
vi.mock('@/actions/auth', () => ({
  login: vi.fn(),
}))

// Import after mocks
import LoginPage from '@/app/login/page'

describe('Login Page', () => {
  it('should render A2M Planning title', () => {
    render(<LoginPage />)

    expect(screen.getByText('A2M Planning')).toBeInTheDocument()
  })

  it('should render password input field', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/mot de passe/i)
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should render submit button', () => {
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    expect(submitButton).toBeInTheDocument()
  })

  it('should render connection description', () => {
    render(<LoginPage />)

    expect(
      screen.getByText(/connectez-vous pour accéder à l'application/i)
    ).toBeInTheDocument()
  })
})
