'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { loginSchema } from '@/schemas/auth'
import {
  verifyPassword,
  createSession,
  deleteSession,
  getSessionFromCookie,
} from '@/lib/auth'

export async function login(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const rawData = {
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: 'Le mot de passe est requis' }
  }

  const { password } = parsed.data

  const passwordHash = process.env.APP_PASSWORD_HASH

  if (!passwordHash) {
    return { error: 'Configuration serveur invalide' }
  }

  const isValid = await verifyPassword(password, passwordHash)

  if (!isValid) {
    return { error: 'Mot de passe incorrect' }
  }

  const sessionResult = await createSession()

  if ('error' in sessionResult) {
    return { error: sessionResult.error }
  }

  revalidatePath('/')

  return { success: true }
}

export async function logout(): Promise<void> {
  const sessionId = await getSessionFromCookie()

  if (sessionId) {
    await deleteSession(sessionId)
  }

  redirect('/login')
}
