/** Stable unique IDs for entities (sync-friendly). */
export function createId(): string {
  return crypto.randomUUID();
}
