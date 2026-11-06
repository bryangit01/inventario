// TemaService → modo claro / oscuro. Se guarda la elección y, si no hay,
// se respeta la preferencia del sistema operativo.
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TemaService {
  oscuro = false;

  constructor() {
    const guardado = localStorage.getItem('inventario_tema');
    this.oscuro = guardado
      ? guardado === 'oscuro'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.aplicar();
  }

  alternar(): void {
    this.oscuro = !this.oscuro;
    localStorage.setItem('inventario_tema', this.oscuro ? 'oscuro' : 'claro');
    this.aplicar();
  }

  private aplicar(): void {
    document.documentElement.dataset['tema'] = this.oscuro ? 'oscuro' : 'claro';
  }
}
