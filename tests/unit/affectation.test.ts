import { describe, it, expect } from 'vitest'
import { creerAffectationSchema } from '@/schemas/affectation'

describe('creerAffectationSchema', () => {
  it('should accept valid affectation data', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(true)
  })

  it('should accept periode MATIN', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'MATIN'
    })
    expect(result.success).toBe(true)
  })

  it('should accept periode APRES_MIDI', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'APRES_MIDI'
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing ouvrierId', () => {
    const result = creerAffectationSchema.safeParse({
      chantierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive ouvrierId', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 0,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative ouvrierId', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: -1,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-integer ouvrierId', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1.5,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing chantierId', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive chantierId', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 0,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing date', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty date', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      date: '',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing periode', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      date: '2026-01-15'
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid periode', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'INVALID'
    })
    expect(result.success).toBe(false)
  })

  it('should return French error message for missing ouvrier', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 0,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const ouvrierError = result.error.issues.find(i => i.path.includes('ouvrierId'))
      expect(ouvrierError?.message).toBe("L'ouvrier est requis")
    }
  })

  it('should return French error message for missing chantier', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 0,
      date: '2026-01-15',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const chantierError = result.error.issues.find(i => i.path.includes('chantierId'))
      expect(chantierError?.message).toBe('Le chantier est requis')
    }
  })

  it('should return French error message for missing date', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      date: '',
      periode: 'JOURNEE'
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const dateError = result.error.issues.find(i => i.path.includes('date'))
      expect(dateError?.message).toBe('La date est requise')
    }
  })

  it('should return French error message for invalid periode', () => {
    const result = creerAffectationSchema.safeParse({
      ouvrierId: 1,
      chantierId: 1,
      date: '2026-01-15',
      periode: 'INVALID'
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const periodeError = result.error.issues.find(i => i.path.includes('periode'))
      expect(periodeError?.message).toBe('La période est requise')
    }
  })
})
