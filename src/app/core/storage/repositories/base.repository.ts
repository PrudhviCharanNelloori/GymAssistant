import type { Table } from 'dexie';
import type { Repository } from './repository.interface';

type MaybeDeleted = { deletedAt?: Date | null; dirty?: boolean; syncStatus?: string; updatedAt?: Date };

/**
 * Generic Dexie-backed repository. Entity-specific repos extend this for queries.
 * Writes are marked dirty for cloud sync. Deletes are soft-deleted for sync push.
 */
export abstract class BaseRepository<T extends { id: string }> implements Repository<T> {
  constructor(protected readonly table: Table<T, string>) {}

  async getById(id: string): Promise<T | undefined> {
    const row = await this.table.get(id);
    if (!row || (row as MaybeDeleted).deletedAt) {
      return undefined;
    }
    return row;
  }

  async getAll(): Promise<T[]> {
    return this.table.filter((row) => !(row as MaybeDeleted).deletedAt).toArray();
  }

  async create(entity: T): Promise<T> {
    const stamped = this.markDirty(entity);
    await this.table.add(stamped);
    return stamped;
  }

  async update(entity: T): Promise<T> {
    const stamped = this.markDirty(entity);
    await this.table.put(stamped);
    return stamped;
  }

  async upsert(entity: T): Promise<T> {
    const stamped = this.markDirty(entity);
    await this.table.put(stamped);
    return stamped;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.table.get(id);
    if (!existing) {
      return;
    }
    const soft = {
      ...existing,
      deletedAt: new Date(),
      dirty: true,
      syncStatus: 'pending',
      updatedAt: new Date(),
    } as T;
    await this.table.put(soft);
  }

  async hardDelete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  async clear(): Promise<void> {
    await this.table.clear();
  }

  async exists(id: string): Promise<boolean> {
    return (await this.getById(id)) !== undefined;
  }

  async getDirty(): Promise<T[]> {
    return this.table.filter((row) => Boolean((row as MaybeDeleted).dirty)).toArray();
  }

  protected markDirty(entity: T): T {
    return {
      ...entity,
      dirty: true,
      syncStatus: 'pending',
      updatedAt: new Date(),
    } as T;
  }

  /** Apply a remote row without marking dirty */
  async putSynced(entity: T): Promise<T> {
    const synced = {
      ...entity,
      dirty: false,
      syncStatus: 'synced',
    } as T;
    await this.table.put(synced);
    return synced;
  }
}
