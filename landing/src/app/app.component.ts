import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, LandingPageComponent],
  template: `
    <div class="min-h-screen bg-slate-900">
      <app-landing-page></app-landing-page>
    </div>
  `
})
export class AppComponent {
  title = 'GameScope Landing';
}