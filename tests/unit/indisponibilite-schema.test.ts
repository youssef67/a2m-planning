import { describe, it, expect } from 'vitest'
import { indisponibiliteSchema, modifierIndisponibiliteSchema } from '@/schemas/indisponibilite'

describe('indisponibiliteSchema', () => {
  it('should accept valid indisponibilité data with CONGE_PAYE', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE',
      statutPresence: 'CONGE_PAYE'
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid indisponibilité data with MALADIE', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      date: '2026-01-15',
      periode: 'MATIN',
      statutPresence: 'MALADIE'
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid indisponibilité data with ABSENCE', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      date: '2026-01-15',
      periode: 'APRES_MIDI',
      statutPresence: 'ABSENCE'
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid indisponibilité data with FORMATION', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE',
      statutPresence: 'FORMATION'
    })
    expect(result.success).toBe(true)
  })

  it('should reject TRAVAIL as statutPresence (not an indisponibilité)', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE',
      statutPresence: 'TRAVAIL'
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid statutPresence', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      date: '2026-01-15',
      periode: 'JOURNEE',
      statutPresence: 'INVALID'
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing ouvrierId', () => {
    const result = indisponibiliteSchema.safeParse({
      date: '2026-01-15',
      periode: 'JOURNEE',
      statutPresence: 'CONGE_PAYE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive ouvrierId', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 0,
      date: '2026-01-15',
      periode: 'JOURNEE',
      statutPresence: 'CONGE_PAYE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing date', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      periode: 'JOURNEE',
      statutPresence: 'CONGE_PAYE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty date', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      date: '',
      periode: 'JOURNEE',
      statutPresence: 'CONGE_PAYE'
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid periode', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 1,
      date: '2026-01-15',
      periode: 'INVALID',
      statutPresence: 'CONGE_PAYE'
    })
    expect(result.success).toBe(false)
  })

  it('should accept all valid periode values', () => {
    const periodes = ['JOURNEE', 'MATIN', 'APRES_MIDI'] as const
    periodes.forEach((periode) => {
      const result = indisponibiliteSchema.safeParse({
        ouvrierId: 1,
        date: '2026-01-15',
        periode,
        statutPresence: 'CONGE_PAYE'
      })
      expect(result.success).toBe(true)
    })
  })

  it('should return French error message for invalid ouvrier', () => {
    const result = indisponibiliteSchema.safeParse({
      ouvrierId: 0,
      date: '2026-01-15',
      periode: 'JOURNEE',
      statutPresence: 'CONGE_PAYE'
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const ouvrierError = result.error.issues.find(i => i.path.includes('ouvrierId'))
      expect(ouvrierError?.message).toBe("L'ouvrier est requis")
    }
  })
})

describe('modifierIndisponibiliteSchema', () => {
  it('should accept valid modification data', () => {
    const result = modifierIndisponibiliteSchema.safeParse({
      periode: 'MATIN',
      statutPresence: 'FORMATION'
    })
    expect(result.success).toBe(true)
  })

  it('should accept all valid periode values', () => {
    const periodes = ['JOURNEE', 'MATIN', 'APRES_MIDI'] as const
    periodes.forEach((periode) => {
      const result = modifierIndisponibiliteSchema.safeParse({
        periode,
        statutPresence: 'CONGE_PAYE'
      })
      expect(result.success).toBe(true)
    })
  })

  it('should accept all valid statutPresence values', () => {
    const statuts = ['CONGE_PAYE', 'MALADIE', 'ABSENCE', 'FORMATION'] as const
    statuts.forEach((statutPresence) => {
      const result = modifierIndisponibiliteSchema.safeParse({
        periode: 'JOURNEE',
        statutPresence
      })
      expect(result.success).toBe(true)
    })
  })

  it('should reject TRAVAIL as statutPresence', () => {
    const result = modifierIndisponibiliteSchema.safeParse({
      periode: 'JOURNEE',
      statutPresence: 'TRAVAIL'
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid periode', () => {
    const result = modifierIndisponibiliteSchema.safeParse({
      periode: 'INVALID',
      statutPresence: 'CONGE_PAYE'
    })
    expect(result.success).toBe(false)
  })

  it('should not require ouvrierId or date (modification only)', () => {
    const result = modifierIndisponibiliteSchema.safeParse({
      periode: 'MATIN',
      statutPresence: 'MALADIE'
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('ouvrierId')
      expect(result.data).not.toHaveProperty('date')
    }
  })
})
