import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
  
  onTryForFree() {
    // This would redirect to your Angular webapp
    // Replace with your actual app URL
    window.location.href = '/login'; // or 'https://app.yourdomain.com/login'
  }
  
  onLearnMore() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }
  
  onBookDemo() {
    // Add your demo booking logic here
    console.log('Book demo clicked');
  }
}