import type { Syncable } from './sync.interface';

export interface User extends Syncable {
  id: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}
