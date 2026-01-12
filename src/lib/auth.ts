import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { prisma } from './prisma'

const SESSION_COOKIE_NAME = 'session'
const SESSION_DURATION_DAYS = 30

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(): Promise<
  { sessionId: string } | { error: string }
> {
  try {
    const sessionId = nanoid(32)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

    await prisma.session.create({
      data: {
        id: sessionId,
        expiresAt,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: '/',
    })

    return { sessionId }
  } catch {
    return { error: 'Erreur lors de la création de la session' }
  }
}

export async function getSession(
  sessionId: string
): Promise<{ valid: boolean; expired?: boolean } | { error: string }> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return { valid: false }
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: sessionId } })
      return { valid: false, expired: true }
    }

    return { valid: true }
  } catch {
    return { error: 'Erreur lors de la vérification de la session' }
  }
}

export async function deleteSession(
  sessionId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    await prisma.session.delete({
      where: { id: sessionId },
    })

    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)

    return { success: true }
  } catch {
    return { error: 'Erreur lors de la suppression de la session' }
  }
}

export async function getSessionFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

export async function requireAuth(): Promise<
  { authenticated: true } | { error: string }
> {
  const sessionId = await getSessionFromCookie()

  if (!sessionId) {
    return { error: 'Non authentifié' }
  }

  const result = await getSession(sessionId)

  if ('error' in result) {
    return { error: result.error }
  }

  if (!result.valid) {
    return { error: 'Session invalide ou expirée' }
  }

  return { authenticated: true }
}
