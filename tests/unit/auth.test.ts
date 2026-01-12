import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/schemas/auth'

// Test bcrypt functions directly instead of through auth.ts (which imports Prisma)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'test123'
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
    expect(hash.startsWith('$2')).toBe(true) // bcrypt hash prefix
  })

  it('should generate different hashes for same password', async () => {
    const password = 'test123'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)

    expect(hash1).not.toBe(hash2)
  })
})

describe('Password Verification', () => {
  it('should return true for correct password', async () => {
    const password = 'test123'
    const hash = await hashPassword(password)

    const result = await verifyPassword(password, hash)

    expect(result).toBe(true)
  })

  it('should return false for incorrect password', async () => {
    const password = 'test123'
    const hash = await hashPassword(password)

    const result = await verifyPassword('wrongpassword', hash)

    expect(result).toBe(false)
  })

  it('should return false for empty password', async () => {
    const hash = await hashPassword('test123')

    const result = await verifyPassword('', hash)

    expect(result).toBe(false)
  })
})

describe('Login Schema Validation', () => {
  it('should accept valid password', () => {
    const result = loginSchema.safeParse({ password: 'test123' })

    expect(result.success).toBe(true)
  })

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({ password: '' })

    expect(result.success).toBe(false)
  })

  it('should reject missing password', () => {
    const result = loginSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('should reject non-string password', () => {
    const result = loginSchema.safeParse({ password: 123 })

    expect(result.success).toBe(false)
  })
})
