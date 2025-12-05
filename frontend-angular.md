# Frontend - Sistema de Gestión de Productos
## Angular 17+ con Bootstrap 5

---

## 1. Estructura del Proyecto

```
productos-app/
├── angular.json
├── package.json
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss
│   │
│   └── app/
│       ├── app.component.ts
│       ├── app.component.html
│       ├── app.config.ts
│       ├── app.routes.ts
│       │
│       ├── core/
│       │   ├── guards/
│       │   │   └── auth.guard.ts
│       │   ├── interceptors/
│       │   │   └── auth.interceptor.ts
│       │   └── services/
│       │       ├── auth.service.ts
│       │       └── producto.service.ts
│       │
│       ├── shared/
│       │   ├── components/
│       │   │   ├── navbar/
│       │   │   │   ├── navbar.component.ts
│       │   │   │   └── navbar.component.html
│       │   │   ├── confirm-dialog/
│       │   │   │   ├── confirm-dialog.component.ts
│       │   │   │   └── confirm-dialog.component.html
│       │   │   └── toast/
│       │   │       ├── toast.component.ts
│       │   │       └── toast.component.html
│       │   ├── models/
│       │   │   ├── producto.model.ts
│       │   │   ├── api-response.model.ts
│       │   │   └── auth.model.ts
│       │   └── services/
│       │       └── toast.service.ts
│       │
│       └── features/
│           ├── auth/
│           │   └── login/
│           │       ├── login.component.ts
│           │       └── login.component.html
│           │
│           └── productos/
│               ├── producto-list/
│               │   ├── producto-list.component.ts
│               │   └── producto-list.component.html
│               └── producto-form/
│                   ├── producto-form.component.ts
│                   └── producto-form.component.html
```

---

## 2. Instalación y Configuración

### 2.1 Crear proyecto
```bash
ng new productos-app --standalone --routing --style=scss
cd productos-app
```

### 2.2 Instalar dependencias
```bash
npm install bootstrap bootstrap-icons
npm install @popperjs/core
```

### 2.3 Configurar Bootstrap en angular.json
```json
{
  "projects": {
    "productos-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/bootstrap/dist/css/bootstrap.min.css",
              "node_modules/bootstrap-icons/font/bootstrap-icons.css",
              "src/styles.scss"
            ],
            "scripts": [
              "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
            ]
          }
        }
      }
    }
  }
}
```

### 2.4 styles.scss
```scss
// Variables personalizadas
$primary: #0d6efd;
$success: #198754;
$danger: #dc3545;
$warning: #ffc107;

// Estilos globales
body {
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.cursor-pointer {
  cursor: pointer;
}

.table-hover tbody tr:hover {
  background-color: rgba(0, 123, 255, 0.075);
}

// Toast container
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
}

// Loading spinner
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
```

---

## 3. Modelos

### 3.1 shared/models/producto.model.ts
```typescript
export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
}

export interface ProductoRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
}
```

### 3.2 shared/models/api-response.model.ts
```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  status?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}
```

### 3.3 shared/models/auth.model.ts
```typescript
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  roles: string[];
  authenticated: boolean;
}

export interface User {
  username: string;
  roles: string[];
}
```

---

## 4. Servicios Core

### 4.1 core/services/auth.service.ts
```typescript
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiResponse, LoginRequest, LoginResponse, User } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = 'http://localhost:8080/api/auth';
  
  // Signals para estado reactivo
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  // Computed values
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  currentUser = computed(() => this.currentUserSignal());
  isLoading = computed(() => this.isLoadingSignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    const storedCredentials = localStorage.getItem('credentials');
    
    if (storedUser && storedCredentials) {
      this.currentUserSignal.set(JSON.parse(storedUser));
    }
  }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    this.isLoadingSignal.set(true);
    
    // Crear header Basic Auth
    const base64Credentials = btoa(`${credentials.username}:${credentials.password}`);
    const headers = new HttpHeaders({
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/login`, credentials, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const user: User = {
              username: response.data.username,
              roles: response.data.roles
            };
            
            // Guardar en localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('credentials', base64Credentials);
            
            this.currentUserSignal.set(user);
          }
          this.isLoadingSignal.set(false);
        }),
        catchError(error => {
          this.isLoadingSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('credentials');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getAuthHeaders(): HttpHeaders {
    const credentials = localStorage.getItem('credentials');
    if (credentials) {
      return new HttpHeaders({
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getCredentials(): string | null {
    return localStorage.getItem('credentials');
  }
}
```

### 4.2 core/services/producto.service.ts
```typescript
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { ApiResponse, PageResponse } from '../../shared/models/api-response.model';
import { Producto, ProductoRequest } from '../../shared/models/producto.model';

export interface ProductoFiltros {
  nombre?: string;
  precioMin?: number;
  precioMax?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private readonly API_URL = 'http://localhost:8080/api/productos';
  
  // Signal para loading
  isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  listar(filtros: ProductoFiltros = {}): Observable<ApiResponse<PageResponse<Producto>>> {
    this.isLoading.set(true);
    
    let params = new HttpParams();
    
    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }
    if (filtros.precioMin !== undefined && filtros.precioMin !== null) {
      params = params.set('precioMin', filtros.precioMin.toString());
    }
    if (filtros.precioMax !== undefined && filtros.precioMax !== null) {
      params = params.set('precioMax', filtros.precioMax.toString());
    }
    params = params.set('page', (filtros.page || 0).toString());
    params = params.set('size', (filtros.size || 10).toString());
    params = params.set('sortBy', filtros.sortBy || 'id');
    params = params.set('sortDir', filtros.sortDir || 'desc');

    return this.http.get<ApiResponse<PageResponse<Producto>>>(this.API_URL, { params })
      .pipe(
        finalize(() => this.isLoading.set(false))
      );
  }

  obtenerPorId(id: number): Observable<ApiResponse<Producto>> {
    this.isLoading.set(true);
    return this.http.get<ApiResponse<Producto>>(`${this.API_URL}/${id}`)
      .pipe(
        finalize(() => this.isLoading.set(false))
      );
  }

  crear(producto: ProductoRequest): Observable<ApiResponse<Producto>> {
    this.isLoading.set(true);
    return this.http.post<ApiResponse<Producto>>(this.API_URL, producto)
      .pipe(
        finalize(() => this.isLoading.set(false))
      );
  }

  actualizar(id: number, producto: ProductoRequest): Observable<ApiResponse<Producto>> {
    this.isLoading.set(true);
    return this.http.put<ApiResponse<Producto>>(`${this.API_URL}/${id}`, producto)
      .pipe(
        finalize(() => this.isLoading.set(false))
      );
  }

  eliminar(id: number): Observable<ApiResponse<void>> {
    this.isLoading.set(true);
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`)
      .pipe(
        finalize(() => this.isLoading.set(false))
      );
  }
}
```

---

## 5. Interceptor y Guard

### 5.1 core/interceptors/auth.interceptor.ts
```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Obtener credenciales
  const credentials = authService.getCredentials();
  
  // Clonar request con headers de autenticación
  let authReq = req;
  if (credentials) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Basic ${credentials}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

### 5.2 core/guards/auth.guard.ts
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/productos']);
  return false;
};
```

---

## 6. Servicios Compartidos

### 6.1 shared/services/toast.service.ts
```typescript
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  
  private toastId = 0;
  toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'info', duration: number = 4000): void {
    const toast: Toast = {
      id: ++this.toastId,
      message,
      type,
      duration
    };

    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  remove(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
```

---

## 7. Componentes Compartidos

### 7.1 shared/components/navbar/navbar.component.ts
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  
  private authService = inject(AuthService);
  
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;

  logout(): void {
    this.authService.logout();
  }
}
```

### 7.2 shared/components/navbar/navbar.component.html
```html
<nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
  <div class="container">
    <a class="navbar-brand d-flex align-items-center" routerLink="/">
      <i class="bi bi-box-seam me-2"></i>
      <span>Gestión de Productos</span>
    </a>
    
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    
    <div class="collapse navbar-collapse" id="navbarNav">
      @if (isAuthenticated()) {
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link" routerLink="/productos" routerLinkActive="active">
              <i class="bi bi-list-ul me-1"></i> Productos
            </a>
          </li>
        </ul>
        
        <div class="navbar-nav">
          <div class="nav-item dropdown">
            <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" 
               data-bs-toggle="dropdown">
              <i class="bi bi-person-circle me-1"></i>
              {{ currentUser()?.username }}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <span class="dropdown-item-text text-muted small">
                  <i class="bi bi-shield-check me-1"></i>
                  {{ currentUser()?.roles?.join(', ') }}
                </span>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <button class="dropdown-item text-danger" (click)="logout()">
                  <i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        </div>
      }
    </div>
  </div>
</nav>
```

### 7.3 shared/components/toast/toast.component.ts
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html'
})
export class ToastComponent {
  
  toastService = inject(ToastService);

  getToastClass(type: string): string {
    const classes: Record<string, string> = {
      success: 'bg-success text-white',
      error: 'bg-danger text-white',
      warning: 'bg-warning text-dark',
      info: 'bg-info text-white'
    };
    return classes[type] || classes['info'];
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };
    return icons[type] || icons['info'];
  }
}
```

### 7.4 shared/components/toast/toast.component.html
```html
<div class="toast-container">
  @for (toast of toastService.toasts(); track toast.id) {
    <div class="toast show mb-2 shadow" [class]="getToastClass(toast.type)" role="alert">
      <div class="toast-body d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <i class="bi me-2" [class]="getIcon(toast.type)"></i>
          <span>{{ toast.message }}</span>
        </div>
        <button type="button" class="btn-close btn-close-white ms-3" 
                (click)="toastService.remove(toast.id)">
        </button>
      </div>
    </div>
  }
</div>
```

### 7.5 shared/components/confirm-dialog/confirm-dialog.component.ts
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
  
  @Input() title: string = 'Confirmar';
  @Input() message: string = '¿Está seguro de realizar esta acción?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmClass: string = 'btn-danger';
  @Input() isLoading: boolean = false;
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
```

### 7.6 shared/components/confirm-dialog/confirm-dialog.component.html
```html
<div class="modal fade" id="confirmModal" tabindex="-1" data-bs-backdrop="static">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="bi bi-exclamation-triangle text-warning me-2"></i>
          {{ title }}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" 
                [disabled]="isLoading" (click)="onCancel()">
        </button>
      </div>
      <div class="modal-body">
        <p class="mb-0">{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" 
                [disabled]="isLoading" (click)="onCancel()">
          {{ cancelText }}
        </button>
        <button type="button" [class]="'btn ' + confirmClass" 
                [disabled]="isLoading" (click)="onConfirm()">
          @if (isLoading) {
            <span class="spinner-border spinner-border-sm me-1"></span>
          }
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 8. Feature: Login

### 8.1 features/auth/login/login.component.ts
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  loginForm: FormGroup;
  showPassword = false;
  isLoading = this.authService.isLoading;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`¡Bienvenido, ${response.data.username}!`);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/productos';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (error) => {
        const message = error.error?.message || 'Credenciales inválidas';
        this.toastService.error(message);
      }
    });
  }

  // Helpers para validación
  isInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.errors?.['required']) {
      return 'Este campo es obligatorio';
    }
    return '';
  }
}
```

### 8.2 features/auth/login/login.component.html
```html
<div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
        
        <div class="card shadow-lg border-0">
          <div class="card-body p-4 p-md-5">
            
            <!-- Header -->
            <div class="text-center mb-4">
              <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style="width: 64px; height: 64px;">
                <i class="bi bi-box-seam fs-3"></i>
              </div>
              <h4 class="mb-1">Gestión de Productos</h4>
              <p class="text-muted small">Ingrese sus credenciales para continuar</p>
            </div>

            <!-- Form -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              
              <!-- Username -->
              <div class="mb-3">
                <label class="form-label" for="username">
                  <i class="bi bi-person me-1"></i> Usuario
                </label>
                <input type="text" 
                       class="form-control" 
                       id="username"
                       formControlName="username"
                       [class.is-invalid]="isInvalid('username')"
                       placeholder="Ingrese su usuario"
                       autocomplete="username">
                @if (isInvalid('username')) {
                  <div class="invalid-feedback">{{ getError('username') }}</div>
                }
              </div>

              <!-- Password -->
              <div class="mb-4">
                <label class="form-label" for="password">
                  <i class="bi bi-lock me-1"></i> Contraseña
                </label>
                <div class="input-group">
                  <input [type]="showPassword ? 'text' : 'password'" 
                         class="form-control" 
                         id="password"
                         formControlName="password"
                         [class.is-invalid]="isInvalid('password')"
                         placeholder="Ingrese su contraseña"
                         autocomplete="current-password">
                  <button type="button" class="btn btn-outline-secondary" 
                          (click)="togglePassword()">
                    <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                  </button>
                  @if (isInvalid('password')) {
                    <div class="invalid-feedback">{{ getError('password') }}</div>
                  }
                </div>
              </div>

              <!-- Submit Button -->
              <button type="submit" 
                      class="btn btn-primary w-100 py-2"
                      [disabled]="isLoading()">
                @if (isLoading()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Iniciando sesión...
                } @else {
                  <i class="bi bi-box-arrow-in-right me-2"></i>
                  Iniciar sesión
                }
              </button>

            </form>

            <!-- Footer -->
            <div class="text-center mt-4">
              <small class="text-muted">
                Centro Nacional de Registros<br>
                Sistema de Gestión de Productos v1.0
              </small>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
</div>
```

---

## 9. Feature: Productos

### 9.1 features/productos/producto-list/producto-list.component.ts
```typescript
import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductoService, ProductoFiltros } from '../../../core/services/producto.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Producto } from '../../../shared/models/producto.model';
import { PageResponse } from '../../../shared/models/api-response.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

declare var bootstrap: any;

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    DecimalPipe, 
    DatePipe,
    ConfirmDialogComponent
  ],
  templateUrl: './producto-list.component.html'
})
export class ProductoListComponent implements OnInit {

  private productoService = inject(ProductoService);
  private toastService = inject(ToastService);

  // Data
  productos = signal<Producto[]>([]);
  pageInfo = signal<Omit<PageResponse<any>, 'content'> | null>(null);
  
  // Filtros
  filtros: ProductoFiltros = {
    nombre: '',
    precioMin: undefined,
    precioMax: undefined,
    page: 0,
    size: 10
  };

  // Estado
  isLoading = this.productoService.isLoading;
  productoToDelete = signal<Producto | null>(null);
  isDeleting = signal<boolean>(false);

  // Modal
  private confirmModal: any;
  @ViewChild('confirmModalRef') confirmModalRef!: ElementRef;

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngAfterViewInit(): void {
    this.confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
  }

  cargarProductos(): void {
    this.productoService.listar(this.filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.productos.set(response.data.content);
          const { content, ...pageInfo } = response.data;
          this.pageInfo.set(pageInfo);
        }
      },
      error: (error) => {
        this.toastService.error('Error al cargar los productos');
        console.error(error);
      }
    });
  }

  buscar(): void {
    this.filtros.page = 0;
    this.cargarProductos();
  }

  limpiarFiltros(): void {
    this.filtros = {
      nombre: '',
      precioMin: undefined,
      precioMax: undefined,
      page: 0,
      size: 10
    };
    this.cargarProductos();
  }

  cambiarPagina(page: number): void {
    this.filtros.page = page;
    this.cargarProductos();
  }

  cambiarTamano(size: number): void {
    this.filtros.size = size;
    this.filtros.page = 0;
    this.cargarProductos();
  }

  // Eliminar
  confirmarEliminar(producto: Producto): void {
    this.productoToDelete.set(producto);
    this.confirmModal.show();
  }

  cancelarEliminar(): void {
    this.productoToDelete.set(null);
    this.confirmModal.hide();
  }

  eliminar(): void {
    const producto = this.productoToDelete();
    if (!producto?.id) return;

    this.isDeleting.set(true);

    this.productoService.eliminar(producto.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Producto eliminado exitosamente');
          this.confirmModal.hide();
          this.productoToDelete.set(null);
          this.cargarProductos();
        }
        this.isDeleting.set(false);
      },
      error: (error) => {
        this.toastService.error('Error al eliminar el producto');
        this.isDeleting.set(false);
        console.error(error);
      }
    });
  }

  // Helpers paginación
  get totalPages(): number[] {
    const total = this.pageInfo()?.totalPages || 0;
    return Array.from({ length: total }, (_, i) => i);
  }

  get currentPage(): number {
    return this.pageInfo()?.number || 0;
  }

  get showPagination(): boolean {
    return (this.pageInfo()?.totalPages || 0) > 1;
  }
}
```

### 9.2 features/productos/producto-list/producto-list.component.html
```html
<div class="container-fluid py-4">
  
  <!-- Header -->
  <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
    <div>
      <h2 class="mb-1">
        <i class="bi bi-box-seam text-primary me-2"></i>
        Productos
      </h2>
      <p class="text-muted mb-0">Gestión del catálogo de productos</p>
    </div>
    <a routerLink="/productos/nuevo" class="btn btn-primary mt-3 mt-md-0">
      <i class="bi bi-plus-lg me-1"></i> Nuevo Producto
    </a>
  </div>

  <!-- Filtros -->
  <div class="card shadow-sm mb-4">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <label class="form-label small text-muted">Buscar por nombre</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" 
                   class="form-control" 
                   [(ngModel)]="filtros.nombre"
                   placeholder="Nombre del producto..."
                   (keyup.enter)="buscar()">
          </div>
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label small text-muted">Precio mínimo</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input type="number" 
                   class="form-control" 
                   [(ngModel)]="filtros.precioMin"
                   placeholder="0.00"
                   min="0"
                   step="0.01">
          </div>
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label small text-muted">Precio máximo</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input type="number" 
                   class="form-control" 
                   [(ngModel)]="filtros.precioMax"
                   placeholder="0.00"
                   min="0"
                   step="0.01">
          </div>
        </div>
        <div class="col-12 col-md-4 d-flex align-items-end gap-2">
          <button class="btn btn-primary flex-grow-1" (click)="buscar()" [disabled]="isLoading()">
            <i class="bi bi-search me-1"></i> Buscar
          </button>
          <button class="btn btn-outline-secondary" (click)="limpiarFiltros()" [disabled]="isLoading()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Tabla -->
  <div class="card shadow-sm">
    <div class="card-body p-0">
      
      <!-- Loading -->
      @if (isLoading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="text-muted mt-2 mb-0">Cargando productos...</p>
        </div>
      } @else if (productos().length === 0) {
        <!-- Empty state -->
        <div class="text-center py-5">
          <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-2 mb-0">No se encontraron productos</p>
          <a routerLink="/productos/nuevo" class="btn btn-primary mt-3">
            <i class="bi bi-plus-lg me-1"></i> Crear primer producto
          </a>
        </div>
      } @else {
        <!-- Table -->
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 60px;">ID</th>
                <th>Nombre</th>
                <th class="d-none d-md-table-cell">Descripción</th>
                <th class="text-end" style="width: 120px;">Precio</th>
                <th class="text-center" style="width: 80px;">Stock</th>
                <th class="text-center" style="width: 140px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (producto of productos(); track producto.id) {
                <tr>
                  <td>
                    <span class="badge bg-secondary">{{ producto.id }}</span>
                  </td>
                  <td>
                    <strong>{{ producto.nombre }}</strong>
                  </td>
                  <td class="d-none d-md-table-cell">
                    <span class="text-muted small">
                      {{ producto.descripcion || 'Sin descripción' | slice:0:50 }}
                      @if (producto.descripcion && producto.descripcion.length > 50) {
                        ...
                      }
                    </span>
                  </td>
                  <td class="text-end">
                    <strong class="text-success">$ {{ producto.precio | number:'1.2-2' }}</strong>
                  </td>
                  <td class="text-center">
                    <span class="badge" 
                          [class.bg-success]="producto.stock > 10"
                          [class.bg-warning]="producto.stock > 0 && producto.stock <= 10"
                          [class.bg-danger]="producto.stock === 0">
                      {{ producto.stock }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <a [routerLink]="['/productos/editar', producto.id]" 
                         class="btn btn-outline-primary"
                         title="Editar">
                        <i class="bi bi-pencil"></i>
                      </a>
                      <button class="btn btn-outline-danger" 
                              (click)="confirmarEliminar(producto)"
                              title="Eliminar">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (showPagination) {
          <div class="card-footer bg-white d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div class="text-muted small">
              Mostrando {{ (currentPage * filtros.size!) + 1 }} - 
              {{ Math.min((currentPage + 1) * filtros.size!, pageInfo()?.totalElements || 0) }} 
              de {{ pageInfo()?.totalElements }} registros
            </div>
            
            <div class="d-flex align-items-center gap-3">
              <!-- Page size -->
              <div class="d-flex align-items-center gap-2">
                <label class="small text-muted mb-0">Mostrar:</label>
                <select class="form-select form-select-sm" style="width: auto;"
                        [ngModel]="filtros.size"
                        (ngModelChange)="cambiarTamano($event)">
                  <option [value]="5">5</option>
                  <option [value]="10">10</option>
                  <option [value]="25">25</option>
                  <option [value]="50">50</option>
                </select>
              </div>
              
              <!-- Pagination -->
              <nav>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" [class.disabled]="pageInfo()?.first">
                    <button class="page-link" (click)="cambiarPagina(0)">
                      <i class="bi bi-chevron-double-left"></i>
                    </button>
                  </li>
                  <li class="page-item" [class.disabled]="pageInfo()?.first">
                    <button class="page-link" (click)="cambiarPagina(currentPage - 1)">
                      <i class="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  
                  @for (page of totalPages; track page) {
                    @if (page >= currentPage - 2 && page <= currentPage + 2) {
                      <li class="page-item" [class.active]="page === currentPage">
                        <button class="page-link" (click)="cambiarPagina(page)">
                          {{ page + 1 }}
                        </button>
                      </li>
                    }
                  }
                  
                  <li class="page-item" [class.disabled]="pageInfo()?.last">
                    <button class="page-link" (click)="cambiarPagina(currentPage + 1)">
                      <i class="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li class="page-item" [class.disabled]="pageInfo()?.last">
                    <button class="page-link" (click)="cambiarPagina((pageInfo()?.totalPages || 1) - 1)">
                      <i class="bi bi-chevron-double-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        }
      }
    </div>
  </div>

</div>

<!-- Confirm Dialog -->
<app-confirm-dialog
  title="Eliminar Producto"
  [message]="'¿Está seguro de eliminar el producto \'' + (productoToDelete()?.nombre || '') + '\'? Esta acción no se puede deshacer.'"
  confirmText="Eliminar"
  confirmClass="btn-danger"
  [isLoading]="isDeleting()"
  (confirmed)="eliminar()"
  (cancelled)="cancelarEliminar()">
</app-confirm-dialog>
```

### 9.3 features/productos/producto-form/producto-form.component.ts
```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Producto } from '../../../shared/models/producto.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './producto-form.component.html'
})
export class ProductoFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  productoForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  productoId = signal<number | null>(null);
  isLoading = this.productoService.isLoading;
  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.productoForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
      descripcion: ['', [
        Validators.maxLength(500)
      ]],
      precio: [null, [
        Validators.required,
        Validators.min(0.01)
      ]],
      stock: [0, [
        Validators.required,
        Validators.min(0),
        Validators.pattern(/^\d+$/)
      ]]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.productoId.set(+id);
      this.cargarProducto(+id);
    }
  }

  private cargarProducto(id: number): void {
    this.productoService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.productoForm.patchValue({
            nombre: response.data.nombre,
            descripcion: response.data.descripcion,
            precio: response.data.precio,
            stock: response.data.stock
          });
        }
      },
      error: (error) => {
        this.toastService.error('Error al cargar el producto');
        this.router.navigate(['/productos']);
      }
    });
  }

  onSubmit(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      this.toastService.warning('Por favor, corrija los errores del formulario');
      return;
    }

    this.isSubmitting.set(true);
    const productoData = this.productoForm.value;

    const request$ = this.isEditMode()
      ? this.productoService.actualizar(this.productoId()!, productoData)
      : this.productoService.crear(productoData);

    request$.subscribe({
      next: (response) => {
        if (response.success) {
          const mensaje = this.isEditMode() 
            ? 'Producto actualizado exitosamente' 
            : 'Producto creado exitosamente';
          this.toastService.success(mensaje);
          this.router.navigate(['/productos']);
        }
        this.isSubmitting.set(false);
      },
      error: (error) => {
        const mensaje = error.error?.message || 'Error al guardar el producto';
        this.toastService.error(mensaje);
        
        // Manejar errores de validación del servidor
        if (error.error?.validationErrors) {
          this.handleServerErrors(error.error.validationErrors);
        }
        this.isSubmitting.set(false);
      }
    });
  }

  private handleServerErrors(errors: any[]): void {
    errors.forEach(err => {
      const control = this.productoForm.get(err.field);
      if (control) {
        control.setErrors({ serverError: err.message });
      }
    });
  }

  // Helpers para validación
  isInvalid(field: string): boolean {
    const control = this.productoForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.productoForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['min']) {
      return `El valor mínimo es ${control.errors['min'].min}`;
    }
    if (control.errors['pattern']) return 'Debe ser un número entero';
    if (control.errors['serverError']) return control.errors['serverError'];

    return 'Campo inválido';
  }

  get pageTitle(): string {
    return this.isEditMode() ? 'Editar Producto' : 'Nuevo Producto';
  }

  get submitButtonText(): string {
    if (this.isSubmitting()) {
      return 'Guardando...';
    }
    return this.isEditMode() ? 'Actualizar' : 'Crear';
  }
}
```

### 9.4 features/productos/producto-form/producto-form.component.html
```html
<div class="container py-4">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-8 col-xl-6">

      <!-- Header -->
      <div class="d-flex align-items-center mb-4">
        <a routerLink="/productos" class="btn btn-outline-secondary me-3">
          <i class="bi bi-arrow-left"></i>
        </a>
        <div>
          <h2 class="mb-0">
            <i class="bi" [class.bi-plus-circle]="!isEditMode()" [class.bi-pencil]="isEditMode()" 
               class="text-primary me-2"></i>
            {{ pageTitle }}
          </h2>
          <p class="text-muted mb-0 small">
            @if (isEditMode()) {
              Modificando producto #{{ productoId() }}
            } @else {
              Complete los datos del nuevo producto
            }
          </p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="card shadow-sm">
        <div class="card-body p-4">
          
          @if (isLoading() && isEditMode()) {
            <div class="text-center py-5">
              <div class="spinner-border text-primary"></div>
              <p class="text-muted mt-2">Cargando producto...</p>
            </div>
          } @else {
            <form [formGroup]="productoForm" (ngSubmit)="onSubmit()">
              
              <!-- Nombre -->
              <div class="mb-3">
                <label class="form-label" for="nombre">
                  Nombre <span class="text-danger">*</span>
                </label>
                <input type="text"
                       class="form-control"
                       id="nombre"
                       formControlName="nombre"
                       [class.is-invalid]="isInvalid('nombre')"
                       placeholder="Ej: Laptop HP ProBook"
                       maxlength="100">
                @if (isInvalid('nombre')) {
                  <div class="invalid-feedback">{{ getError('nombre') }}</div>
                }
                <div class="form-text">Máximo 100 caracteres</div>
              </div>

              <!-- Descripción -->
              <div class="mb-3">
                <label class="form-label" for="descripcion">Descripción</label>
                <textarea class="form-control"
                          id="descripcion"
                          formControlName="descripcion"
                          [class.is-invalid]="isInvalid('descripcion')"
                          rows="3"
                          placeholder="Descripción detallada del producto..."
                          maxlength="500">
                </textarea>
                @if (isInvalid('descripcion')) {
                  <div class="invalid-feedback">{{ getError('descripcion') }}</div>
                }
                <div class="form-text">
                  {{ productoForm.get('descripcion')?.value?.length || 0 }} / 500 caracteres
                </div>
              </div>

              <!-- Precio y Stock en fila -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label" for="precio">
                    Precio <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number"
                           class="form-control"
                           id="precio"
                           formControlName="precio"
                           [class.is-invalid]="isInvalid('precio')"
                           placeholder="0.00"
                           min="0.01"
                           step="0.01">
                    @if (isInvalid('precio')) {
                      <div class="invalid-feedback">{{ getError('precio') }}</div>
                    }
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label" for="stock">
                    Stock <span class="text-danger">*</span>
                  </label>
                  <input type="number"
                         class="form-control"
                         id="stock"
                         formControlName="stock"
                         [class.is-invalid]="isInvalid('stock')"
                         placeholder="0"
                         min="0"
                         step="1">
                  @if (isInvalid('stock')) {
                    <div class="invalid-feedback">{{ getError('stock') }}</div>
                  }
                </div>
              </div>

              <!-- Botones -->
              <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <a routerLink="/productos" class="btn btn-outline-secondary">
                  <i class="bi bi-x-lg me-1"></i> Cancelar
                </a>
                <button type="submit" 
                        class="btn btn-primary"
                        [disabled]="isSubmitting()">
                  @if (isSubmitting()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  } @else {
                    <i class="bi" [class.bi-plus-lg]="!isEditMode()" [class.bi-check-lg]="isEditMode()" 
                       class="me-1"></i>
                  }
                  {{ submitButtonText }}
                </button>
              </div>

            </form>
          }

        </div>
      </div>

    </div>
  </div>
</div>
```

---

## 10. Configuración Principal

### 10.1 app.config.ts
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

### 10.2 app.routes.ts
```typescript
import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/productos/producto-list/producto-list.component')
          .then(m => m.ProductoListComponent)
      },
      {
        path: 'nuevo',
        loadComponent: () => import('./features/productos/producto-form/producto-form.component')
          .then(m => m.ProductoFormComponent)
      },
      {
        path: 'editar/:id',
        loadComponent: () => import('./features/productos/producto-form/producto-form.component')
          .then(m => m.ProductoFormComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'productos'
  }
];
```

### 10.3 app.component.ts
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  
  private authService = inject(AuthService);
  isAuthenticated = this.authService.isAuthenticated;
}
```

### 10.4 app.component.html
```html
@if (isAuthenticated()) {
  <app-navbar></app-navbar>
}

<main>
  <router-outlet></router-outlet>
</main>

<app-toast></app-toast>
```

### 10.5 shared/models/index.ts (Barrel export)
```typescript
export * from './producto.model';
export * from './api-response.model';
export * from './auth.model';
```

---

## 11. Resumen de Rutas

| Ruta | Componente | Guard | Descripción |
|------|------------|-------|-------------|
| `/login` | LoginComponent | loginGuard | Inicio de sesión |
| `/productos` | ProductoListComponent | authGuard | Lista de productos |
| `/productos/nuevo` | ProductoFormComponent | authGuard | Crear producto |
| `/productos/editar/:id` | ProductoFormComponent | authGuard | Editar producto |

---

## 12. Características Implementadas

| Requisito | Implementación |
|-----------|----------------|
| Tabla con paginación | ✅ Paginación con selector de tamaño |
| Filtro por nombre | ✅ Búsqueda por nombre |
| Rango de precios | ✅ Filtros precioMin/precioMax |
| Botones editar/eliminar | ✅ En cada fila |
| Botón crear producto | ✅ En header de lista |
| Validar campos antes de enviar | ✅ Reactive Forms + validaciones |
| Mensajes de error amigables | ✅ Toast service + feedback inline |
| Éxito al guardar | ✅ Toast success |
| Error al fallar API | ✅ Toast error |
| Confirmación al eliminar | ✅ Modal de confirmación |
| Diseño responsive | ✅ Bootstrap 5 responsive |
| Login simple | ✅ Basic Auth con Spring Security |

---

## 13. Comandos Útiles

```bash
# Desarrollo
ng serve

# Build producción
ng build --configuration production

# Ejecutar con puerto específico
ng serve --port 4200

# Generar componente
ng g c features/productos/producto-detail --standalone
```
