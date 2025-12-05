import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        toastService.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        authService.logout();
      } else if (error.status === 403) {
        toastService.error('No tiene permisos para realizar esta acción.');
      } else if (error.status === 0) {
        toastService.error('No se puede conectar con el servidor.');
      }

      return throwError(() => error);
    })
  );
};
