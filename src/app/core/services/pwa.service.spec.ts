import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import {
  AppDatabase,
  ExerciseRepository,
  UserRepository,
  WorkoutProgramRepository,
  WorkoutRepository,
  WorkoutSessionRepository,
} from '../storage';
import { BootstrapService } from './bootstrap.service';
import { isStandaloneDisplay, PwaService } from './pwa.service';

describe('PwaService', () => {
  let db: AppDatabase;
  let pwa: PwaService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        AppDatabase,
        UserRepository,
        ExerciseRepository,
        WorkoutRepository,
        WorkoutProgramRepository,
        WorkoutSessionRepository,
        BootstrapService,
        PwaService,
      ],
    });

    db = TestBed.inject(AppDatabase);
    pwa = TestBed.inject(PwaService);
    await db.open();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  afterEach(async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    db.close();
  });

  it('reports incomplete offline readiness before bootstrap data exists', async () => {
    const readiness = await pwa.verifyOfflineDataAccess();
    expect(readiness.indexedDbAvailable).toBe(true);
    expect(readiness.databaseOpen).toBe(true);
    expect(readiness.ok).toBe(false);
    expect(readiness.userReady).toBe(false);
  });

  it('reports ready after user and exercises are seeded', async () => {
    await TestBed.inject(BootstrapService).initialize();
    const readiness = await pwa.verifyOfflineDataAccess();
    expect(readiness.ok).toBe(true);
    expect(readiness.userReady).toBe(true);
    expect(readiness.exercisesReady).toBe(true);
    expect(readiness.exerciseCount).toBeGreaterThan(0);
  });
});

describe('isStandaloneDisplay', () => {
  it('returns a boolean in the test environment', () => {
    expect(typeof isStandaloneDisplay()).toBe('boolean');
  });
});
