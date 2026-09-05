/**
 * Storage abstraction for entity persistence.
 * Dexie/IndexedDB is the MVP implementation; a remote backend can plug in later.
 */
export interface Repository<T extends { id: string }> {
  getById(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  upsert(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  clear(): Promise<void>;
}
