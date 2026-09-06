import { Injectable, inject, signal } from '@angular/core';
import type { SyncState } from '../models';
import { DEFAULT_USER_ID } from '../storage/repositories/user.repository';
import {
  AppDatabase,
  ExerciseRepository,
  UserRepository,
  WorkoutProgramRepository,
  WorkoutRepository,
  WorkoutSessionRepository,
} from '../storage';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/supabase.client';
import {
  exerciseFromRow,
  exerciseToRow,
  programFromRow,
  programToRow,
  sessionFromRow,
  sessionToRow,
  workoutFromRow,
  workoutToRow,
} from '../supabase/sync-mappers';
import { AuthService } from './auth.service';

const SYNC_STATE_ID = 'cloud';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly auth = inject(AuthService);
  private readonly db = inject(AppDatabase);
  private readonly users = inject(UserRepository);
  private readonly exercises = inject(ExerciseRepository);
  private readonly workouts = inject(WorkoutRepository);
  private readonly programs = inject(WorkoutProgramRepository);
  private readonly sessions = inject(WorkoutSessionRepository);

  private readonly syncingSignal = signal(false);
  private readonly lastErrorSignal = signal<string | null>(null);
  private readonly lastSyncedSignal = signal<Date | null>(null);
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly syncing = this.syncingSignal.asReadonly();
  readonly lastError = this.lastErrorSignal.asReadonly();
  readonly lastSyncedAt = this.lastSyncedSignal.asReadonly();
  readonly configured = isSupabaseConfigured();

  async hydrate(): Promise<void> {
    const state = await this.getSyncState();
    this.lastSyncedSignal.set(state?.lastSyncedAt ?? null);
    this.lastErrorSignal.set(state?.lastError ?? null);
  }

  startAutoSync(): void {
    if (typeof window === 'undefined') return;
    void this.hydrate();
    window.addEventListener('online', () => {
      void this.syncNow();
    });
  }

  scheduleSync(delayMs = 1500): void {
    if (!this.auth.isAuthenticated() || !this.configured) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      void this.syncNow();
    }, delayMs);
  }

  async syncNow(): Promise<void> {
    if (!this.configured || !this.auth.isAuthenticated() || this.syncingSignal()) {
      return;
    }

    const userId = this.auth.userId();
    const client = getSupabaseClient();
    if (!userId || !client || !navigator.onLine) {
      return;
    }

    this.syncingSignal.set(true);
    this.lastErrorSignal.set(null);

    try {
      await this.ensureLocalProfile(userId);
      await this.claimLocalData(userId);
      await this.pushAll(userId);
      await this.pullAll(userId);
      const state = await this.saveSyncState({
        id: SYNC_STATE_ID,
        userId,
        lastSyncedAt: new Date(),
        lastError: null,
        claimedLocalData: true,
      });
      this.lastSyncedSignal.set(state.lastSyncedAt);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      this.lastErrorSignal.set(message);
      const prev = await this.getSyncState();
      await this.saveSyncState({
        id: SYNC_STATE_ID,
        userId,
        lastSyncedAt: prev?.lastSyncedAt ?? null,
        lastError: message,
        claimedLocalData: prev?.claimedLocalData ?? false,
      });
    } finally {
      this.syncingSignal.set(false);
    }
  }

  async getSyncState(): Promise<SyncState | undefined> {
    return this.db.syncState.get(SYNC_STATE_ID);
  }

  /**
   * Creates/updates the local Dexie user from auth metadata so the UI shows
   * the real name (Google / signup) instead of the bootstrap "Athlete".
   */
  async ensureLocalProfile(userId = this.auth.userId()): Promise<void> {
    if (!userId || !this.auth.isAuthenticated()) {
      return;
    }

    const displayName = this.auth.displayName();
    const existing = await this.users.getById(userId);
    const now = new Date();

    if (!existing) {
      await this.users.putSynced({
        id: userId,
        userId,
        name: displayName,
        createdAt: now,
        updatedAt: now,
        dirty: false,
        syncStatus: 'synced',
      });
    } else {
      const current = existing.name?.trim() ?? '';
      const shouldReplace =
        !current || current === 'Athlete' || current === DEFAULT_USER_ID;
      if (shouldReplace && displayName !== current) {
        await this.users.putSynced({
          ...existing,
          userId,
          name: displayName,
          updatedAt: now,
          dirty: false,
          syncStatus: 'synced',
        });
      }
    }

    const client = getSupabaseClient();
    if (client && navigator.onLine) {
      const name = (await this.users.getById(userId))?.name ?? displayName;
      await client.from('profiles').upsert({
        id: userId,
        display_name: name,
      });
    }
  }

  /** Re-assign anonymous local rows to the signed-in user once. */
  async claimLocalData(userId: string): Promise<void> {
    const state = await this.getSyncState();
    if (state?.claimedLocalData && state.userId === userId) {
      return;
    }

    const stamp = <T extends { userId?: string; dirty?: boolean; updatedAt?: Date; syncStatus?: string }>(
      row: T,
    ): T => ({
      ...row,
      userId,
      dirty: true,
      syncStatus: 'pending',
      updatedAt: new Date(),
    });

    const [exerciseList, workoutList, programList, sessionList] = await Promise.all([
      this.db.exercises.toArray(),
      this.db.workouts.toArray(),
      this.db.workoutPrograms.toArray(),
      this.db.workoutSessions.toArray(),
    ]);

    await this.db.transaction(
      'rw',
      this.db.exercises,
      this.db.workouts,
      this.db.workoutPrograms,
      this.db.workoutSessions,
      this.db.users,
      async () => {
        for (const exercise of exerciseList) {
          if (!exercise.userId || exercise.userId === DEFAULT_USER_ID) {
            await this.db.exercises.put(stamp(exercise));
          }
        }
        for (const workout of workoutList) {
          if (!workout.userId || workout.userId === DEFAULT_USER_ID) {
            await this.db.workouts.put(stamp(workout));
          }
        }
        for (const program of programList) {
          if (!program.userId || program.userId === DEFAULT_USER_ID) {
            await this.db.workoutPrograms.put(stamp(program));
          }
        }
        for (const session of sessionList) {
          if (!session.userId || session.userId === DEFAULT_USER_ID) {
            await this.db.workoutSessions.put(stamp(session));
          }
        }

        const localUser = await this.users.getDefaultUser();
        const displayName = this.auth.displayName();
        if (localUser) {
          await this.db.users.put({
            ...localUser,
            id: userId,
            userId,
            name:
              !localUser.name || localUser.name === 'Athlete'
                ? displayName
                : localUser.name,
            dirty: false,
            syncStatus: 'synced',
            updatedAt: new Date(),
          });
        } else {
          await this.db.users.put({
            id: userId,
            userId,
            name: displayName,
            createdAt: new Date(),
            updatedAt: new Date(),
            dirty: false,
            syncStatus: 'synced',
          });
        }
      },
    );

    const client = getSupabaseClient();
    const name = (await this.users.getById(userId))?.name ?? this.auth.displayName();
    if (client) {
      await client.from('profiles').upsert({
        id: userId,
        display_name: name,
      });
    }

    await this.saveSyncState({
      id: SYNC_STATE_ID,
      userId,
      lastSyncedAt: state?.lastSyncedAt ?? null,
      lastError: null,
      claimedLocalData: true,
    });
  }

  private async pushAll(userId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const dirtyExercises = await this.exercises.getDirty();
    for (const exercise of dirtyExercises) {
      // Only push custom exercises as user-owned; built-ins stay local unless custom
      if (!exercise.isCustom && !exercise.deletedAt) {
        await this.exercises.putSynced({ ...exercise, dirty: false, syncStatus: 'synced', userId });
        continue;
      }
      const row = exerciseToRow({ ...exercise, userId }, userId);
      const { error } = await client.from('exercises').upsert(row);
      if (error) throw error;
      if (exercise.deletedAt) {
        await this.exercises.hardDelete(exercise.id);
      } else {
        await this.exercises.putSynced({ ...exercise, userId, dirty: false, syncStatus: 'synced' });
      }
    }

    for (const workout of await this.workouts.getDirty()) {
      const row = workoutToRow({ ...workout, userId }, userId);
      const { error } = await client.from('workouts').upsert(row);
      if (error) throw error;
      if (workout.deletedAt) {
        await this.workouts.hardDelete(workout.id);
      } else {
        await this.workouts.putSynced({ ...workout, userId, dirty: false, syncStatus: 'synced' });
      }
    }

    for (const program of await this.programs.getDirty()) {
      const row = programToRow({ ...program, userId }, userId);
      const { error } = await client.from('workout_programs').upsert(row);
      if (error) throw error;
      if (program.deletedAt) {
        await this.programs.hardDelete(program.id);
      } else {
        await this.programs.putSynced({ ...program, userId, dirty: false, syncStatus: 'synced' });
      }
    }

    for (const session of await this.sessions.getDirty()) {
      const row = sessionToRow({ ...session, userId }, userId);
      const { error } = await client.from('workout_sessions').upsert(row);
      if (error) throw error;
      if (session.deletedAt) {
        await this.sessions.hardDelete(session.id);
      } else {
        await this.sessions.putSynced({
          ...session,
          userId,
          dirty: false,
          syncStatus: 'synced',
          updatedAt: session.updatedAt ?? new Date(),
        });
      }
    }
  }

  private async pullAll(userId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const state = await this.getSyncState();
    const since = state?.lastSyncedAt?.toISOString();

    await this.pullTable('exercises', userId, since, (row) =>
      this.mergeExercise(exerciseFromRow(row)),
    );
    await this.pullTable('workouts', userId, since, (row) =>
      this.mergeWorkout(workoutFromRow(row)),
    );
    await this.pullTable('workout_programs', userId, since, (row) =>
      this.mergeProgram(programFromRow(row)),
    );
    await this.pullTable('workout_sessions', userId, since, (row) =>
      this.mergeSession(sessionFromRow(row)),
    );

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      const existing = await this.users.getById(userId);
      const fromProfile = profile.display_name?.trim() || null;
      const name =
        fromProfile && fromProfile !== 'Athlete'
          ? fromProfile
          : this.auth.displayName();
      await this.users.putSynced({
        id: userId,
        userId,
        name,
        createdAt: existing?.createdAt ?? new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at),
        dirty: false,
        syncStatus: 'synced',
      });
    }
  }

  private async pullTable(
    table: 'exercises' | 'workouts' | 'workout_programs' | 'workout_sessions',
    userId: string,
    since: string | undefined,
    apply: (row: Record<string, unknown>) => Promise<void>,
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    let query = client.from(table).select('*').eq('user_id', userId);
    if (since) {
      query = query.gt('updated_at', since);
    }
    const { data, error } = await query;
    if (error) throw error;
    for (const row of data ?? []) {
      await apply(row as Record<string, unknown>);
    }
  }

  private async mergeExercise(remote: ReturnType<typeof exerciseFromRow>): Promise<void> {
    const local = await this.exercises.getById(remote.id);
    if (local?.dirty) {
      const localTime = local.updatedAt?.getTime() ?? 0;
      const remoteTime = remote.updatedAt?.getTime() ?? 0;
      if (localTime >= remoteTime) return;
    }
    if (remote.deletedAt) {
      await this.exercises.hardDelete(remote.id);
      return;
    }
    await this.exercises.putSynced(remote);
  }

  private async mergeWorkout(remote: ReturnType<typeof workoutFromRow>): Promise<void> {
    const local = await this.workouts.getById(remote.id);
    if (local?.dirty) {
      const localTime = local.updatedAt?.getTime() ?? 0;
      const remoteTime = remote.updatedAt?.getTime() ?? 0;
      if (localTime >= remoteTime) return;
    }
    if (remote.deletedAt) {
      await this.workouts.hardDelete(remote.id);
      return;
    }
    await this.workouts.putSynced(remote);
  }

  private async mergeProgram(remote: ReturnType<typeof programFromRow>): Promise<void> {
    const local = await this.programs.getById(remote.id);
    if (local?.dirty) {
      const localTime = local.updatedAt?.getTime() ?? 0;
      const remoteTime = remote.updatedAt?.getTime() ?? 0;
      if (localTime >= remoteTime) return;
    }
    if (remote.deletedAt) {
      await this.programs.hardDelete(remote.id);
      return;
    }
    await this.programs.putSynced(remote);
  }

  private async mergeSession(remote: ReturnType<typeof sessionFromRow>): Promise<void> {
    const local = await this.sessions.getById(remote.id);
    if (local?.dirty) {
      const localTime = local.updatedAt?.getTime() ?? 0;
      const remoteTime = remote.updatedAt?.getTime() ?? 0;
      if (localTime >= remoteTime) return;
    }
    if (remote.deletedAt) {
      await this.sessions.hardDelete(remote.id);
      return;
    }
    await this.sessions.putSynced(remote);
  }

  private async saveSyncState(state: SyncState): Promise<SyncState> {
    await this.db.syncState.put(state);
    return state;
  }
}
