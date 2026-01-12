import { describe, it, expect } from 'vitest'
import { reassignationSchema } from '@/schemas/reassignation'

describe('reassignationSchema', () => {
  it('should accept valid reassignment data', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 1,
      nouveauChantierId: 2
    })
    expect(result.success).toBe(true)
  })

  it('should accept large valid IDs', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 9999,
      nouveauChantierId: 8888
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing affectationId', () => {
    const result = reassignationSchema.safeParse({
      nouveauChantierId: 2
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing nouveauChantierId', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 1
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive affectationId (zero)', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 0,
      nouveauChantierId: 2
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative affectationId', () => {
    const result = reassignationSchema.safeParse({
      affectationId: -1,
      nouveauChantierId: 2
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive nouveauChantierId (zero)', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 1,
      nouveauChantierId: 0
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative nouveauChantierId', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 1,
      nouveauChantierId: -5
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-integer affectationId', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 1.5,
      nouveauChantierId: 2
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-integer nouveauChantierId', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 1,
      nouveauChantierId: 2.5
    })
    expect(result.success).toBe(false)
  })

  it('should reject string values', () => {
    const result = reassignationSchema.safeParse({
      affectationId: '1',
      nouveauChantierId: '2'
    })
    expect(result.success).toBe(false)
  })

  it('should return French error message for invalid affectation', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 0,
      nouveauChantierId: 2
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const affectationError = result.error.issues.find((i) =>
        i.path.includes('affectationId')
      )
      expect(affectationError?.message).toBe("L'affectation est requise")
    }
  })

  it('should return French error message for invalid chantier', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 1,
      nouveauChantierId: 0
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const chantierError = result.error.issues.find((i) =>
        i.path.includes('nouveauChantierId')
      )
      expect(chantierError?.message).toBe('Le nouveau chantier est requis')
    }
  })

  it('should infer correct TypeScript type', () => {
    const result = reassignationSchema.safeParse({
      affectationId: 1,
      nouveauChantierId: 2
    })
    if (result.success) {
      // Type check: these should be numbers
      const affId: number = result.data.affectationId
      const chantierId: number = result.data.nouveauChantierId
      expect(typeof affId).toBe('number')
      expect(typeof chantierId).toBe('number')
    }
  })
})
