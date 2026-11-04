import { File, Paths } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";

// tipos de archivo que acepta la sección de Documentos: PDF y Word
export const TIPO_PDF = "application/pdf";
export const TIPO_WORD = "application/msword";
export const TIPO_WORDX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const TIPOS_DOCUMENTO = [TIPO_PDF, TIPO_WORD, TIPO_WORDX];

// saco el tipo del archivo: primero el que da el selector y, si no viene,
// por la extensión del nombre
export function tipoDeArchivo(nombre?: string, tipoDado?: string | null) {
  if (tipoDado && TIPOS_DOCUMENTO.includes(tipoDado)) return tipoDado;
  const extension = (nombre || "").toLowerCase().split(".").pop();
  if (extension === "docx") return TIPO_WORDX;
  if (extension === "doc") return TIPO_WORD;
  return TIPO_PDF;
}

function extensionDeTipo(tipo: string) {
  if (tipo === TIPO_WORDX) return ".docx";
  if (tipo === TIPO_WORD) return ".doc";
  return ".pdf";
}

// Intent.FLAG_GRANT_READ_URI_PERMISSION: deja que la otra app lea el archivo
const PERMISO_DE_LECTURA = 1;

// Antes abría el link de Firebase con WebBrowser, pero en Android Chrome no
// muestra PDF ni Word dentro de la app y salía la pestaña en blanco. Ahora
// en Android bajo el archivo al celular y lo abro con la app que tenga para
// ese tipo (Drive, el lector de PDF, Word...). En iPhone y en web el
// navegador sí los muestra, así que ahí sigo usando WebBrowser.
export async function abrirDocumento(url: string, nombreArchivo?: string, tipoGuardado?: string) {
  if (Platform.OS !== "android") {
    await WebBrowser.openBrowserAsync(url);
    return;
  }

  const tipo = tipoDeArchivo(nombreArchivo, tipoGuardado);
  let nombreSeguro = (nombreArchivo || "documento").replace(/[^A-Za-z0-9._-]/g, "_");
  if (!nombreSeguro.toLowerCase().endsWith(extensionDeTipo(tipo))) {
    nombreSeguro += extensionDeTipo(tipo);
  }

  // siempre con el mismo nombre, así no se van juntando copias en el cel
  const destino = new File(Paths.cache, `documento-${nombreSeguro}`);
  const archivo = await File.downloadFileAsync(url, destino, { idempotent: true });

  if (!archivo.size) {
    throw new Error("ARCHIVO_VACIO");
  }

  try {
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: archivo.contentUri,
      type: tipo,
      flags: PERMISO_DE_LECTURA,
    });
  } catch (error) {
    // si el cel no tiene ninguna app para ese tipo, lo mando al navegador
    // para que por lo menos se descargue
    console.log("No hay app para abrir el archivo:", error);
    await Linking.openURL(url);
    throw new Error("SIN_APP");
  }
}
