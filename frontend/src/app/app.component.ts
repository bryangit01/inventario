// AppComponent → raíz: solo contiene el router y los avisos flotantes.
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast.component';
import { TemaService } from './core/tema.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet />
    <app-toast />
  `,
})
export class AppComponent {
  // Inyectarlo aquí aplica el tema (claro/oscuro) desde que arranca la app.
  constructor(_tema: TemaService) {}
}
