import { redirect } from 'next/navigation'
import { getSession, getSessionFromCookie } from '@/lib/auth'
import { Header } from '@/components/layout/Header'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionId = await getSessionFromCookie()

  if (!sessionId) {
    redirect('/login')
  }

  const result = await getSession(sessionId)

  if ('error' in result || !result.valid) {
    redirect('/login')
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </>
  )
}
