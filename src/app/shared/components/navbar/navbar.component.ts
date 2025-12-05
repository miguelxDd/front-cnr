import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <nav class="navbar-container">
      <a routerLink="/productos" class="navbar-brand">
        <i class="pi pi-box"></i>
        <span>Gestión de Productos</span>
      </a>

      <div class="navbar-user">
        <span>
          <i class="pi pi-user mr-2"></i>
          {{ authService.user()?.username }}
        </span>
        <p-button 
          icon="pi pi-sign-out" 
          severity="secondary"
          [text]="true"
          (onClick)="logout()"
          pTooltip="Cerrar sesión"
        />
      </div>
    </nav>
  `,
  styles: ``
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
  }
}
