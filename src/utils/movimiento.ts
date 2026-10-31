import { AccessibilityInfo } from "react-native";

// aquí decido si las animaciones (Pedi, burbujas, confeti) se mueven o no.
// Se apagan si:
//   - el usuario activó "Menos animaciones" en la pantalla de Accesibilidad
//   - o si el celular tiene activado "reducir movimiento" en sus ajustes
// Las animaciones leen esto cuando se dibujan; al cambiar la opción la app
// vuelve a dibujar la pantalla, así que toman el valor nuevo

let menosAnimacionesApp = false;
let reducirMovimientoSistema = false;

AccessibilityInfo.isReduceMotionEnabled()
  .then((valor) => {
    reducirMovimientoSistema = valor;
  })
  .catch(() => {});

export function configurarMenosAnimaciones(activo: boolean) {
  menosAnimacionesApp = activo;
}

export function sinMovimiento(): boolean {
  return menosAnimacionesApp || reducirMovimientoSistema;
}
