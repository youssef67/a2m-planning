/**
 * Audit logging utility
 * TODO: Implement full audit trail with database storage when Historique model is added
 */

type Action = 'CREATE' | 'UPDATE' | 'DELETE'

export async function logModification(
  action: Action,
  entity: string,
  entityId: number,
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${action} ${entity}#${entityId}`, {
      old: oldValue,
      new: newValue
    })
  }
}
