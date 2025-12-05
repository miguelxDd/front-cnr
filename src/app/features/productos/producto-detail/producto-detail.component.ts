import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { ProductoService, ToastService } from '../../../core/services';
import { Producto } from '../../../core/models';
import { NavbarComponent, LoadingComponent } from '../../../shared/components';

@Component({
  selector: 'app-producto-detail',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    TagModule,
    CurrencyPipe,
    DatePipe,
    NavbarComponent,
    LoadingComponent
  ],
  template: `
    <app-navbar />
    
    <div class="p-4">
      @if (loading()) {
        <app-loading [loading]="true" message="Cargando producto..." />
      } @else if (producto()) {
        <div class="custom-card" style="max-width: 800px; margin: 0 auto;">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="margin: 0; font-weight: 600;">
              <i class="pi pi-box mr-2"></i>
              Detalle del Producto
            </h2>
            <div class="d-flex gap-2">
              <p-button 
                icon="pi pi-arrow-left" 
                label="Volver"
                [outlined]="true"
                (onClick)="goBack()"
              />
              <p-button 
                icon="pi pi-pencil" 
                label="Editar"
                severity="success"
                (onClick)="editProduct()"
              />
            </div>
          </div>

          <div class="product-details">
            <div class="detail-row">
              <span class="detail-label">ID:</span>
              <span class="detail-value">{{ producto()?.id }}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Nombre:</span>
              <span class="detail-value" style="font-weight: 600; font-size: 1.25rem;">
                {{ producto()?.nombre }}
              </span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Descripción:</span>
              <span class="detail-value">{{ producto()?.descripcion || 'N/A' }}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Precio:</span>
              <span class="detail-value" style="font-size: 1.5rem; color: var(--primary-color); font-weight: 600;">
                {{ producto()?.precio | currency:'USD':'symbol':'1.2-2' }}
              </span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Stock:</span>
              <span class="detail-value">
                <p-tag 
                  [value]="producto()?.stock + ' unidades'"
                  [severity]="getStockSeverity(producto()?.stock || 0)"
                />
              </span>
            </div>

            @if (producto()?.fechaCreacion) {
              <div class="detail-row">
                <span class="detail-label">Fecha de creación:</span>
                <span class="detail-value">
                  {{ producto()?.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
            }

            @if (producto()?.fechaActualizacion) {
              <div class="detail-row">
                <span class="detail-label">Última actualización:</span>
                <span class="detail-value">
                  {{ producto()?.fechaActualizacion | date:'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="custom-card text-center">
          <i class="pi pi-exclamation-circle" style="font-size: 3rem; color: var(--text-color-secondary)"></i>
          <p style="margin-top: 1rem; color: var(--text-color-secondary)">
            Producto no encontrado
          </p>
          <p-button 
            icon="pi pi-arrow-left" 
            label="Volver a la lista"
            [outlined]="true"
            (onClick)="goBack()"
          />
        </div>
      }
    </div>
  `,
  styles: `
    .product-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      font-weight: 500;
    }

    .detail-value {
      color: var(--text-color);
    }
  `
})
export class ProductoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productoService = inject(ProductoService);
  private readonly toastService = inject(ToastService);

  producto = signal<Producto | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadProduct(+id);
    }
  }

  loadProduct(id: number): void {
    this.loading.set(true);
    this.productoService.getById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.producto.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Error al cargar el producto');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/productos']);
  }

  editProduct(): void {
    if (this.producto()?.id) {
      this.router.navigate(['/productos/editar', this.producto()?.id]);
    }
  }

  getStockSeverity(stock: number): 'success' | 'warn' | 'danger' | 'info' {
    if (stock > 20) return 'success';
    if (stock > 5) return 'warn';
    return 'danger';
  }
}
