import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import {
  AppDatabase,
  ExerciseRepository,
  UserRepository,
  WorkoutProgramRepository,
  WorkoutRepository,
  WorkoutSessionRepository,
} from './core/storage';
import { BootstrapService } from './core/services';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        AppDatabase,
        UserRepository,
        ExerciseRepository,
        WorkoutRepository,
        WorkoutProgramRepository,
        WorkoutSessionRepository,
        BootstrapService,
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
