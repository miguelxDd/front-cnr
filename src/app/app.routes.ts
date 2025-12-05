import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/productos/producto-list/producto-list.component').then(m => m.ProductoListComponent)
      },
      {
        path: 'nuevo',
        loadComponent: () => import('./features/productos/producto-form/producto-form.component').then(m => m.ProductoFormComponent)
      },
      {
        path: 'editar/:id',
        loadComponent: () => import('./features/productos/producto-form/producto-form.component').then(m => m.ProductoFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/productos/producto-detail/producto-detail.component').then(m => m.ProductoDetailComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'productos'
  }
];
