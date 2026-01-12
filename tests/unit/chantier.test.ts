import { describe, it, expect } from 'vitest'
import {
  creerChantierSchema,
  modifierChantierSchema,
  changerStatutChantierSchema
} from '@/schemas/chantier'

describe('creerChantierSchema', () => {
  it('should accept valid chantier data', () => {
    const result = creerChantierSchema.safeParse({
      nom: 'Chantier A'
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty nom', () => {
    const result = creerChantierSchema.safeParse({
      nom: ''
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing nom', () => {
    const result = creerChantierSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject nom longer than 200 characters', () => {
    const result = creerChantierSchema.safeParse({
      nom: 'a'.repeat(201)
    })
    expect(result.success).toBe(false)
  })

  it('should accept nom at max length (200)', () => {
    const result = creerChantierSchema.safeParse({
      nom: 'a'.repeat(200)
    })
    expect(result.success).toBe(true)
  })
})

describe('modifierChantierSchema', () => {
  it('should accept valid modification data', () => {
    const result = modifierChantierSchema.safeParse({
      id: 1,
      nom: 'Chantier B'
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing id', () => {
    const result = modifierChantierSchema.safeParse({
      nom: 'Chantier B'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive id', () => {
    const result = modifierChantierSchema.safeParse({
      id: 0,
      nom: 'Chantier B'
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative id', () => {
    const result = modifierChantierSchema.safeParse({
      id: -1,
      nom: 'Chantier B'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-integer id', () => {
    const result = modifierChantierSchema.safeParse({
      id: 1.5,
      nom: 'Chantier B'
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty nom', () => {
    const result = modifierChantierSchema.safeParse({
      id: 1,
      nom: ''
    })
    expect(result.success).toBe(false)
  })
})

describe('changerStatutChantierSchema', () => {
  it('should accept valid status change to ACTIF', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 1,
      statut: 'ACTIF'
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid status change to EN_PAUSE', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 1,
      statut: 'EN_PAUSE'
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid status change to TERMINE', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 1,
      statut: 'TERMINE'
    })
    expect(result.success).toBe(true)
  })

  it('should accept EN_PAUSE with raisonPause', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 1,
      statut: 'EN_PAUSE',
      raisonPause: 'Attente de permis'
    })
    expect(result.success).toBe(true)
  })

  it('should accept EN_PAUSE without raisonPause (optional)', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 1,
      statut: 'EN_PAUSE'
    })
    expect(result.success).toBe(true)
  })

  it('should reject raisonPause longer than 500 characters', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 1,
      statut: 'EN_PAUSE',
      raisonPause: 'a'.repeat(501)
    })
    expect(result.success).toBe(false)
  })

  it('should accept raisonPause at max length (500)', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 1,
      statut: 'EN_PAUSE',
      raisonPause: 'a'.repeat(500)
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid statut', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 1,
      statut: 'INVALID'
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing id', () => {
    const result = changerStatutChantierSchema.safeParse({
      statut: 'ACTIF'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive id', () => {
    const result = changerStatutChantierSchema.safeParse({
      id: 0,
      statut: 'ACTIF'
    })
    expect(result.success).toBe(false)
  })
})
