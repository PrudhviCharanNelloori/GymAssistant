import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { Equipment, MuscleGroup, TrackingMetric } from '../models';
import { AppDatabase, ExerciseRepository } from '../storage';
import { ExerciseService } from './exercise.service';

describe('ExerciseService', () => {
  let db: AppDatabase;
  let service: ExerciseService;
  let repo: ExerciseRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [AppDatabase, ExerciseRepository, ExerciseService],
    });

    db = TestBed.inject(AppDatabase);
    service = TestBed.inject(ExerciseService);
    repo = TestBed.inject(ExerciseRepository);

    await db.open();
    await db.exercises.clear();

    await repo.createExercise({
      name: 'Bench Press',
      primaryMuscleGroup: MuscleGroup.CHEST,
      secondaryMuscleGroups: [MuscleGroup.TRICEPS],
      equipment: [Equipment.BARBELL],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: false,
    });
    await repo.createExercise({
      name: 'Cable Fly',
      primaryMuscleGroup: MuscleGroup.CHEST,
      secondaryMuscleGroups: [],
      equipment: [Equipment.CABLE],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: true,
    });
    await repo.createExercise({
      name: 'Back Squat',
      primaryMuscleGroup: MuscleGroup.QUADS,
      secondaryMuscleGroups: [MuscleGroup.GLUTES],
      equipment: [Equipment.BARBELL],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: false,
    });

    await service.load();
  });

  afterEach(async () => {
    await db.exercises.clear();
    db.close();
  });

  it('filters by search, muscle, equipment, and custom flag', () => {
    service.setSearch('bench');
    expect(service.filteredExercises()).toHaveLength(1);
    expect(service.filteredExercises()[0].name).toBe('Bench Press');

    service.clearFilters();
    service.toggleMuscleFilter(MuscleGroup.CHEST);
    expect(service.filteredExercises()).toHaveLength(2);

    service.toggleEquipmentFilter(Equipment.CABLE);
    expect(service.filteredExercises()).toHaveLength(1);
    expect(service.filteredExercises()[0].name).toBe('Cable Fly');

    service.clearFilters();
    service.toggleCustomOnly();
    expect(service.filteredExercises()).toHaveLength(1);
    expect(service.filteredExercises()[0].isCustom).toBe(true);
  });

  it('creates and deletes custom exercises', async () => {
    const created = await service.createCustom({
      name: 'Landmine Press',
      primaryMuscleGroup: MuscleGroup.SHOULDERS,
      secondaryMuscleGroups: [MuscleGroup.CHEST],
      equipment: [Equipment.BARBELL],
    });

    expect(created.isCustom).toBe(true);
    expect(service.exercises().some((exercise) => exercise.id === created.id)).toBe(true);

    await service.deleteCustom(created.id);
    expect(service.exercises().some((exercise) => exercise.id === created.id)).toBe(false);
  });

  it('prevents deleting built-in exercises', async () => {
    const builtIn = service.exercises().find((exercise) => !exercise.isCustom);
    expect(builtIn).toBeTruthy();

    await expect(service.deleteCustom(builtIn!.id)).rejects.toThrow(
      'Built-in exercises cannot be deleted',
    );
  });
});
