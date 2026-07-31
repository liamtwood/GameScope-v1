import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ButtonConfig {
  label: string;
  icon?: string;
  iconColor?: string; // [GS-EDIT 2026-07-31] optional icon color override (e.g. club primary)
  customIcon?: string;
  type?: 'primary' | 'secondary' | 'outline' | 'danger' | 'primary-dark';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() config!: ButtonConfig;
  @Input() clickable: boolean = true;
  @Output() buttonClick = new EventEmitter<void>();

  onClick(): void {
    if (!this.config.disabled && !this.config.loading && this.clickable) {
      this.buttonClick.emit();
    }
  }

  getButtonClass(): string {
    const classes = ['button'];
    
    if (this.config.type) {
      classes.push(`type-${this.config.type}`);
    } else {
      classes.push('type-primary');
    }
    
    if (this.config.size) {
      classes.push(`size-${this.config.size}`);
    } else {
      classes.push('size-medium');
    }
    
    if (this.config.disabled) {
      classes.push('disabled');
    }
    
    if (this.config.loading) {
      classes.push('loading');
    }

    return classes.join(' ');
  }
}