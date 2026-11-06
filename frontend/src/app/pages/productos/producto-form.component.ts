// =====================================================================
//  ProductoFormComponent  →  Ventana para crear / editar un producto
// =====================================================================
//  Recibe el producto a editar con @Input (o null si es nuevo) y los
//  catálogos para los selects. Avisa al padre con @Output.
//  Nota: el STOCK solo se escribe al crear ("stock inicial"). Al editar,
//  se cambia desde "Mover stock" para que quede registrado en el kardex.
// =====================================================================
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Catalogo } from '../../models/api.models';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './producto-form.component.html',
})
export class ProductoFormComponent implements OnInit {
  @Input() producto: Producto | null = null;
  @Input() categorias: Catalogo[] = [];
  @Input() proveedores: Catalogo[] = [];
  @Output() guardar = new EventEmitter<Producto>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    sku: [''],
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: [''],
    categoria_id: [null as number | null],
    proveedor_id: [null as number | null],
    precio_costo: [0, [Validators.required, Validators.min(0)]],
    precio_venta: [0, [Validators.required, Validators.min(0)]],
    stock_minimo: [5, [Validators.required, Validators.min(0)]],
    cantidad: [0, [Validators.required, Validators.min(0)]],
    activo: [true],
  });

  constructor(private fb: FormBuilder) {}

  get esEdicion(): boolean {
    return this.producto !== null;
  }

  ngOnInit(): void {
    if (this.producto) {
      const p = this.producto;
      this.form.patchValue({
        sku: p.sku ?? '',
        nombre: p.nombre,
        descripcion: p.descripcion ?? '',
        categoria_id: p.categoria_id,
        proveedor_id: p.proveedor_id,
        precio_costo: p.precio_costo,
        precio_venta: p.precio_venta,
        stock_minimo: p.stock_minimo,
        cantidad: p.cantidad,
        activo: p.activo,
      });
      this.form.controls.cantidad.disable(); // el stock no se edita aquí
    }
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.guardar.emit({
      ...this.producto,
      sku: v.sku.trim() || null,
      nombre: v.nombre,
      descripcion: v.descripcion,
      categoria_id: v.categoria_id,
      proveedor_id: v.proveedor_id,
      precio_costo: Number(v.precio_costo ?? 0),
      precio_venta: Number(v.precio_venta ?? 0),
      stock_minimo: Number(v.stock_minimo ?? 0),
      cantidad: Number(v.cantidad ?? 0),
      activo: v.activo,
    });
  }
}
