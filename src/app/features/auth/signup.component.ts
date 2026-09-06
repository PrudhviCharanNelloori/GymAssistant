import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, SyncService } from '../../core/services';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './auth-shared.scss',
})
export class SignupComponent {
  private readonly auth = inject(AuthService);
  private readonly sync = inject(SyncService);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly configured = this.auth.configured;

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.signUp(this.email, this.password, this.name);
      await this.sync.ensureLocalProfile();
      void this.sync.syncNow();
      await this.router.navigate(['/home']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      this.submitting.set(false);
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.signInWithGoogle();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Google sign-in failed');
      this.submitting.set(false);
    }
  }
}
