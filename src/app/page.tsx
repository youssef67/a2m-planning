import { redirect } from 'next/navigation'
import { getSession, getSessionFromCookie } from '@/lib/auth'

export default async function Home() {
  const sessionId = await getSessionFromCookie()

  if (sessionId) {
    const result = await getSession(sessionId)
    if (!('error' in result) && result.valid) {
      redirect('/planning/chantier')
    }
  }

  redirect('/login')
}
