import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'workouts',
    loadComponent: () =>
      import('./features/workouts/workouts.component').then((m) => m.WorkoutsComponent),
  },
  {
    path: 'workouts/new',
    loadComponent: () =>
      import('./features/workouts/workout-editor/workout-editor.component').then(
        (m) => m.WorkoutEditorComponent,
      ),
  },
  {
    path: 'workouts/:id/add',
    loadComponent: () =>
      import('./features/workouts/workout-exercise-picker/workout-exercise-picker.component').then(
        (m) => m.WorkoutExercisePickerComponent,
      ),
  },
  {
    path: 'workouts/:id/exercises/:exerciseId',
    loadComponent: () =>
      import('./features/workouts/workout-exercise-config/workout-exercise-config.component').then(
        (m) => m.WorkoutExerciseConfigComponent,
      ),
  },
  {
    path: 'workouts/:id',
    loadComponent: () =>
      import('./features/workouts/workout-editor/workout-editor.component').then(
        (m) => m.WorkoutEditorComponent,
      ),
  },
  {
    path: 'program',
    loadComponent: () =>
      import('./features/workouts/program/program.component').then((m) => m.ProgramComponent),
  },
  {
    path: 'workout-builder',
    redirectTo: 'workouts',
    pathMatch: 'full',
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./features/exercises/exercises.component').then((m) => m.ExercisesComponent),
  },
  {
    path: 'exercises/new',
    loadComponent: () =>
      import('./features/exercises/exercise-form/exercise-form.component').then(
        (m) => m.ExerciseFormComponent,
      ),
  },
  {
    path: 'exercises/:id/edit',
    loadComponent: () =>
      import('./features/exercises/exercise-form/exercise-form.component').then(
        (m) => m.ExerciseFormComponent,
      ),
  },
  {
    path: 'exercises/:id',
    loadComponent: () =>
      import('./features/exercises/exercise-detail/exercise-detail.component').then(
        (m) => m.ExerciseDetailComponent,
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'history/exercises/:exerciseId',
    loadComponent: () =>
      import('./features/history/exercise-history.component').then(
        (m) => m.ExerciseHistoryComponent,
      ),
  },
  {
    path: 'history/:sessionId',
    loadComponent: () =>
      import('./features/history/history-detail.component').then(
        (m) => m.HistoryDetailComponent,
      ),
  },
  {
    path: 'progress',
    loadComponent: () =>
      import('./features/progress/progress.component').then((m) => m.ProgressComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'session/active',
    loadComponent: () =>
      import('./features/workout/active-workout.component').then((m) => m.ActiveWorkoutComponent),
  },
  {
    path: 'session/complete',
    loadComponent: () =>
      import('./features/workout/workout-complete.component').then(
        (m) => m.WorkoutCompleteComponent,
      ),
  },
  {
    path: 'workout',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  { path: '**', redirectTo: 'home' },
];
