import { Injectable } from '@angular/core';
import type { User } from '../../models';
import { createId } from '../../utils';
import { AppDatabase } from '../database';
import { BaseRepository } from './base.repository';

export const DEFAULT_USER_ID = 'default-user';

export type CreateUserInput = {
  id?: string;
  name?: string;
};

@Injectable({ providedIn: 'root' })
export class UserRepository extends BaseRepository<User> {
  constructor(db: AppDatabase) {
    super(db.users);
  }

  async createUser(input: CreateUserInput = {}): Promise<User> {
    const now = new Date();
    return this.create({
      id: input.id ?? createId(),
      name: input.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateUser(id: string, changes: Pick<User, 'name'>): Promise<User> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`User not found: ${id}`);
    }

    return this.update({
      ...existing,
      ...changes,
      updatedAt: new Date(),
    });
  }

  /** MVP: single local user. */
  async getDefaultUser(): Promise<User | undefined> {
    return this.getById(DEFAULT_USER_ID);
  }
}
