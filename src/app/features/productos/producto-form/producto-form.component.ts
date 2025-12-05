import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { ProductoService, ToastService } from '../../../core/services';
import { Producto } from '../../../core/models';
import { NavbarComponent, LoadingComponent } from '../../../shared/components';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    InputTextarea,
    ButtonModule,
    CardModule,
    NavbarComponent,
    LoadingComponent
  ],
  template: `
    <app-navbar />
    
    <div class="p-4">
      <div class="custom-card" style="max-width: 600px; margin: 0 auto;">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 style="margin: 0; font-weight: 600;">
            <i class="pi pi-{{ isEditMode() ? 'pencil' : 'plus' }} mr-2"></i>
            {{ isEditMode() ? 'Editar Producto' : 'Nuevo Producto' }}
          </h2>
          <p-button 
            icon="pi pi-arrow-left" 
            [outlined]="true"
            pTooltip="Volver"
            (onClick)="goBack()"
          />
        </div>

        @if (loading()) {
          <app-loading [loading]="true" message="Cargando..." />
        } @else {
          <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="nombre" class="block mb-2 font-medium">
                Nombre <span class="p-error">*</span>
              </label>
              <input 
                id="nombre"
                type="text" 
                pInputText 
                formControlName="nombre"
                placeholder="Ingrese el nombre del producto"
                class="w-full"
                [class.ng-invalid]="isFieldInvalid('nombre')"
              />
              @if (isFieldInvalid('nombre')) {
                <small class="p-error">El nombre es requerido</small>
              }
            </div>

            <div class="mb-3">
              <label for="descripcion" class="block mb-2 font-medium">
                Descripción <span class="p-error">*</span>
              </label>
              <textarea 
                id="descripcion"
                pInputTextarea
                formControlName="descripcion"
                placeholder="Ingrese la descripción del producto"
                [rows]="4"
                class="w-full"
                [class.ng-invalid]="isFieldInvalid('descripcion')"
              ></textarea>
              @if (isFieldInvalid('descripcion')) {
                <small class="p-error">La descripción es requerida</small>
              }
            </div>

            <div class="d-flex gap-3 mb-3">
              <div style="flex: 1;">
                <label for="precio" class="block mb-2 font-medium">
                  Precio <span class="p-error">*</span>
                </label>
                <p-inputNumber 
                  id="precio"
                  formControlName="precio"
                  mode="currency" 
                  currency="USD" 
                  locale="en-US"
                  [min]="0"
                  placeholder="0.00"
                  styleClass="w-full"
                  [class.ng-invalid]="isFieldInvalid('precio')"
                />
                @if (isFieldInvalid('precio')) {
                  <small class="p-error">El precio es requerido y debe ser mayor a 0</small>
                }
              </div>

              <div style="flex: 1;">
                <label for="stock" class="block mb-2 font-medium">
                  Stock <span class="p-error">*</span>
                </label>
                <p-inputNumber 
                  id="stock"
                  formControlName="stock"
                  [min]="0"
                  [showButtons]="true"
                  placeholder="0"
                  styleClass="w-full"
                  [class.ng-invalid]="isFieldInvalid('stock')"
                />
                @if (isFieldInvalid('stock')) {
                  <small class="p-error">El stock es requerido y debe ser mayor o igual a 0</small>
                }
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
              <p-button 
                type="button"
                label="Cancelar" 
                severity="secondary"
                [outlined]="true"
                (onClick)="goBack()"
              />
              <p-button 
                type="submit"
                [label]="isEditMode() ? 'Actualizar' : 'Guardar'"
                [icon]="isEditMode() ? 'pi pi-check' : 'pi pi-save'"
                [loading]="saving()"
                [disabled]="productForm.invalid || saving()"
              />
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: `
    .block {
      display: block;
    }

    .font-medium {
      font-weight: 500;
    }

    .p-error {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
    }

    :host ::ng-deep .p-inputnumber {
      width: 100%;
    }

    :host ::ng-deep .p-inputtext,
    :host ::ng-deep .p-inputtextarea {
      width: 100%;
    }
  `
})
export class ProductoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productoService = inject(ProductoService);
  private readonly toastService = inject(ToastService);

  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  private productId: number | null = null;

  productForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['', [Validators.required, Validators.minLength(5)]],
    precio: [null, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.productId = +id;
      this.isEditMode.set(true);
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: number): void {
    this.loading.set(true);
    this.productoService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.productForm.patchValue({
            nombre: response.data.nombre,
            descripcion: response.data.descripcion,
            precio: response.data.precio,
            stock: response.data.stock
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Error al cargar el producto');
        this.goBack();
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const producto: Producto = this.productForm.value;

    const operation = this.isEditMode() && this.productId
      ? this.productoService.update(this.productId, producto)
      : this.productoService.create(producto);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(
            this.isEditMode() 
              ? 'Producto actualizado exitosamente' 
              : 'Producto creado exitosamente'
          );
          this.router.navigate(['/productos']);
        } else {
          this.toastService.error(response.message || 'Error al guardar el producto');
        }
        this.saving.set(false);
      },
      error: (error) => {
        this.saving.set(false);
        this.toastService.error(error.error?.message || 'Error al guardar el producto');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/productos']);
  }
}
