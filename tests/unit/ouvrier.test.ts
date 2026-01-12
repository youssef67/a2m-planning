import { describe, it, expect } from 'vitest'
import {
  creerOuvrierSchema,
  modifierOuvrierSchema,
  archiverOuvrierSchema
} from '@/schemas/ouvrier'

describe('creerOuvrierSchema', () => {
  it('should accept valid ouvrier data', () => {
    const result = creerOuvrierSchema.safeParse({
      nom: 'Dupont',
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(true)
  })

  it('should accept sous-traitant type', () => {
    const result = creerOuvrierSchema.safeParse({
      nom: 'Martin',
      prenom: 'Pierre',
      type: 'SOUS_TRAITANT'
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty nom', () => {
    const result = creerOuvrierSchema.safeParse({
      nom: '',
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty prenom', () => {
    const result = creerOuvrierSchema.safeParse({
      nom: 'Dupont',
      prenom: '',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing nom', () => {
    const result = creerOuvrierSchema.safeParse({
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing prenom', () => {
    const result = creerOuvrierSchema.safeParse({
      nom: 'Dupont',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid type', () => {
    const result = creerOuvrierSchema.safeParse({
      nom: 'Dupont',
      prenom: 'Jean',
      type: 'INVALID'
    })
    expect(result.success).toBe(false)
  })

  it('should reject nom longer than 100 characters', () => {
    const result = creerOuvrierSchema.safeParse({
      nom: 'a'.repeat(101),
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject prenom longer than 100 characters', () => {
    const result = creerOuvrierSchema.safeParse({
      nom: 'Dupont',
      prenom: 'a'.repeat(101),
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })
})

describe('modifierOuvrierSchema', () => {
  it('should accept valid modification data', () => {
    const result = modifierOuvrierSchema.safeParse({
      id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing id', () => {
    const result = modifierOuvrierSchema.safeParse({
      nom: 'Dupont',
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive id', () => {
    const result = modifierOuvrierSchema.safeParse({
      id: 0,
      nom: 'Dupont',
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative id', () => {
    const result = modifierOuvrierSchema.safeParse({
      id: -1,
      nom: 'Dupont',
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-integer id', () => {
    const result = modifierOuvrierSchema.safeParse({
      id: 1.5,
      nom: 'Dupont',
      prenom: 'Jean',
      type: 'SALARIE'
    })
    expect(result.success).toBe(false)
  })
})

describe('archiverOuvrierSchema', () => {
  it('should accept valid id', () => {
    const result = archiverOuvrierSchema.safeParse({ id: 1 })
    expect(result.success).toBe(true)
  })

  it('should reject missing id', () => {
    const result = archiverOuvrierSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject non-positive id', () => {
    const result = archiverOuvrierSchema.safeParse({ id: 0 })
    expect(result.success).toBe(false)
  })

  it('should reject negative id', () => {
    const result = archiverOuvrierSchema.safeParse({ id: -5 })
    expect(result.success).toBe(false)
  })
})
