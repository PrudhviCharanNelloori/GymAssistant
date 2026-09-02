import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./features/exercises/exercises.component').then((m) => m.ExercisesComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
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
    path: 'workout',
    loadComponent: () =>
      import('./features/workout/workout.component').then((m) => m.WorkoutComponent),
  },
  {
    path: 'workout-builder',
    loadComponent: () =>
      import('./features/workout-builder/workout-builder.component').then(
        (m) => m.WorkoutBuilderComponent,
      ),
  },
  { path: '**', redirectTo: 'home' },
];
