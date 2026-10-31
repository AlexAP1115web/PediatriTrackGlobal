import { AccessibilityInfo } from "react-native";

// aquí decido si las animaciones (Pedi, burbujas, confeti) se mueven o no.
// Lo controla la opción "Menos animaciones" (en Accesibilidad o con el
// botón de Pedi en el chat).
//
// Si el celular o la computadora tienen activado "reducir movimiento", lo
// uso solo como valor de inicio la primera vez; después manda lo que el
// usuario elija. Antes lo respetaba siempre y en algunas computadoras con
// las animaciones de Windows apagadas Pedi nunca se movía aunque el usuario
// quisiera

let menosAnimacionesApp = false;

export function configurarMenosAnimaciones(activo: boolean) {
  menosAnimacionesApp = activo;
}

export function sinMovimiento(): boolean {
  return menosAnimacionesApp;
}

export async function sistemaPideMenosMovimiento(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}
