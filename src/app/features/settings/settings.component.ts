import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-settings',
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Settings" subtitle="Profile and preferences" />`,
})
export class SettingsComponent {}
