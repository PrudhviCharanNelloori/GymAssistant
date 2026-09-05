import type { Table } from 'dexie';
import type { Repository } from './repository.interface';

/**
 * Generic Dexie-backed repository. Entity-specific repos extend this for queries.
 */
export abstract class BaseRepository<T extends { id: string }> implements Repository<T> {
  constructor(protected readonly table: Table<T, string>) {}

  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async getAll(): Promise<T[]> {
    return this.table.toArray();
  }

  async create(entity: T): Promise<T> {
    await this.table.add(entity);
    return entity;
  }

  async update(entity: T): Promise<T> {
    await this.table.put(entity);
    return entity;
  }

  async upsert(entity: T): Promise<T> {
    await this.table.put(entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async count(): Promise<number> {
    return this.table.count();
  }

  async clear(): Promise<void> {
    await this.table.clear();
  }

  async exists(id: string): Promise<boolean> {
    return (await this.table.get(id)) !== undefined;
  }
}
