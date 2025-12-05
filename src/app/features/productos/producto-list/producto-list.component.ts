import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, SlicePipe } from '@angular/common';

import { ProductoService, ToastService } from '../../../core/services';
import { Producto } from '../../../core/models';
import { NavbarComponent, LoadingComponent } from '../../../shared/components';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    TooltipModule,
    TagModule,
    FormsModule,
    CurrencyPipe,
    SlicePipe,
    NavbarComponent,
    LoadingComponent
  ],
  providers: [ConfirmationService],
  template: `
    <app-navbar />
    
    <div class="p-4">
      <div class="custom-card">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 style="margin: 0; font-weight: 600;">
            <i class="pi pi-box mr-2"></i>
            Lista de Productos
          </h2>
          <p-button 
            label="Nuevo Producto" 
            icon="pi pi-plus" 
            (onClick)="navigateToCreate()"
          />
        </div>

        <div class="mb-3">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              pInputText 
              [(ngModel)]="searchTerm"
              placeholder="Buscar productos..."
              (input)="onSearch()"
              style="width: 300px;"
            />
          </span>
        </div>

        @if (loading()) {
          <app-loading [loading]="true" message="Cargando productos..." />
        } @else {
          <p-table 
            [value]="productos()" 
            [paginator]="true" 
            [rows]="10"
            [rowsPerPageOptions]="[5, 10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos"
            [globalFilterFields]="['nombre', 'descripcion']"
            styleClass="p-datatable-striped"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="id" style="width: 80px">
                  ID <p-sortIcon field="id" />
                </th>
                <th pSortableColumn="nombre">
                  Nombre <p-sortIcon field="nombre" />
                </th>
                <th pSortableColumn="descripcion">
                  Descripción <p-sortIcon field="descripcion" />
                </th>
                <th pSortableColumn="precio" style="width: 120px">
                  Precio <p-sortIcon field="precio" />
                </th>
                <th pSortableColumn="stock" style="width: 100px">
                  Stock <p-sortIcon field="stock" />
                </th>
                <th style="width: 150px">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-producto>
              <tr>
                <td>{{ producto.id }}</td>
                <td>
                  <strong>{{ producto.nombre }}</strong>
                </td>
                <td>{{ producto.descripcion | slice:0:50 }}{{ producto.descripcion?.length > 50 ? '...' : '' }}</td>
                <td>{{ producto.precio | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>
                  <p-tag 
                    [value]="producto.stock + ' uds'"
                    [severity]="getStockSeverity(producto.stock)"
                  />
                </td>
                <td>
                  <div class="d-flex gap-2">
                    <p-button 
                      icon="pi pi-eye" 
                      [rounded]="true" 
                      [text]="true"
                      severity="info"
                      pTooltip="Ver detalles"
                      (onClick)="viewProduct(producto)"
                    />
                    <p-button 
                      icon="pi pi-pencil" 
                      [rounded]="true" 
                      [text]="true"
                      severity="success"
                      pTooltip="Editar"
                      (onClick)="editProduct(producto)"
                    />
                    <p-button 
                      icon="pi pi-trash" 
                      [rounded]="true" 
                      [text]="true"
                      severity="danger"
                      pTooltip="Eliminar"
                      (onClick)="confirmDelete(producto)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" class="text-center p-4">
                  <i class="pi pi-inbox" style="font-size: 2rem; color: var(--text-color-secondary)"></i>
                  <p style="margin-top: 1rem; color: var(--text-color-secondary)">
                    No se encontraron productos
                  </p>
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </div>
    </div>

    <p-confirmDialog 
      header="Confirmar Eliminación" 
      icon="pi pi-exclamation-triangle"
      acceptLabel="Eliminar"
      rejectLabel="Cancelar"
      acceptButtonStyleClass="p-button-danger"
    />
  `,
  styles: ``
})
export class ProductoListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly toastService = inject(ToastService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  productos = signal<Producto[]>([]);
  loading = signal(false);
  searchTerm = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productoService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.productos.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toastService.error('Error al cargar los productos');
      }
    });
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.productoService.search(this.searchTerm).subscribe({
        next: (response) => {
          if (response.success) {
            this.productos.set(response.data);
          }
        }
      });
    } else {
      this.loadProducts();
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/productos/nuevo']);
  }

  viewProduct(producto: Producto): void {
    this.router.navigate(['/productos', producto.id]);
  }

  editProduct(producto: Producto): void {
    this.router.navigate(['/productos/editar', producto.id]);
  }

  confirmDelete(producto: Producto): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el producto "${producto.nombre}"?`,
      accept: () => {
        this.deleteProduct(producto);
      }
    });
  }

  private deleteProduct(producto: Producto): void {
    if (!producto.id) return;
    
    this.productoService.delete(producto.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Producto eliminado exitosamente');
          this.loadProducts();
        } else {
          this.toastService.error(response.message || 'Error al eliminar el producto');
        }
      },
      error: () => {
        this.toastService.error('Error al eliminar el producto');
      }
    });
  }

  getStockSeverity(stock: number): 'success' | 'warn' | 'danger' | 'info' {
    if (stock > 20) return 'success';
    if (stock > 5) return 'warn';
    return 'danger';
  }
}
