import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ApiResponse, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8089/api/productos';

  getAll(): Observable<ApiResponse<Producto[]>> {
    return this.http.get<ApiResponse<Producto[]>>(this.API_URL);
  }

  getAllPaginated(page: number = 0, size: number = 10, sort: string = 'id,asc'): Observable<PaginatedResponse<Producto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    return this.http.get<PaginatedResponse<Producto>>(`${this.API_URL}/paginated`, { params });
  }

  getById(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.API_URL}/${id}`);
  }

  create(producto: Producto): Observable<ApiResponse<Producto>> {
    return this.http.post<ApiResponse<Producto>>(this.API_URL, producto);
  }

  update(id: number, producto: Producto): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.API_URL}/${id}`, producto);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }

  search(nombre: string): Observable<ApiResponse<Producto[]>> {
    // El backend usa el endpoint principal con filtro por nombre
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<ApiResponse<Producto[]>>(this.API_URL, { params });
  }
}
