import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  inject,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { AuthService, BootstrapService, SyncService } from './core/services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(async () => {
      const bootstrap = inject(BootstrapService);
      const auth = inject(AuthService);
      const sync = inject(SyncService);
      await bootstrap.initialize();
      await auth.initialize();
      sync.startAutoSync();
      if (auth.isAuthenticated()) {
        await sync.ensureLocalProfile();
        void sync.syncNow();
      }
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
};
