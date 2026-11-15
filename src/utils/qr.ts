import qrcode from "qrcode-generator";

// Aquí armo la "matriz" del código QR (true = cuadrito negro). Uso
// qrcode-generator porque es JavaScript puro: funciona igual en Android,
// iPhone y web sin instalar nada nativo. El dibujo lo hace CodigoQR.tsx.
export function matrizQR(texto: string): boolean[][] {
  // 0 = que elija solo el tamaño; "M" aguanta que se tape o maltrate
  // hasta ~15% del código y sigue leyéndose
  const qr = qrcode(0, "M");
  qr.addData(texto);
  qr.make();

  const tamano = qr.getModuleCount();
  const filas: boolean[][] = [];
  for (let fila = 0; fila < tamano; fila++) {
    const celdas: boolean[] = [];
    for (let columna = 0; columna < tamano; columna++) {
      celdas.push(qr.isDark(fila, columna));
    }
    filas.push(celdas);
  }
  return filas;
}

// dirección pública donde se abre una ficha (la versión web/PWA). Si algún
// día cambia el dominio, se puede poner en EXPO_PUBLIC_WEB_URL
export const URL_WEB =
  process.env.EXPO_PUBLIC_WEB_URL || "https://pediatritrack-global.expo.app";

export function enlaceDeFicha(token: string): string {
  return `${URL_WEB}/?ficha=${token}`;
}

// del texto que trae un QR saco el código de la ficha. Acepto el enlace
// completo o solo el código, y nada más letras a-f y números (48), para no
// abrir cualquier cosa que venga en un QR desconocido
export function tokenDeTexto(texto: string): string | null {
  const limpio = (texto || "").trim();
  const enEnlace = limpio.match(/[?&]ficha=([0-9a-f]{48})\b/i);
  if (enEnlace) return enEnlace[1].toLowerCase();
  if (/^[0-9a-f]{48}$/i.test(limpio)) return limpio.toLowerCase();
  return null;
}
