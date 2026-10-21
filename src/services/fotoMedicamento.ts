import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { buscarInfoMedicamentoRxNorm } from "./apisExternas";
import { ContextoBebe, leerFotoMedicamento } from "./chatbotService";

// ==========================================================================
// Foto de medicamento (como en MediCore pero para PediatriTrack):
//   1. tomo la foto de la caja/frasco (en web se elige un archivo)
//   2. Gemini la lee y me dice qué medicamento es y su principio activo
//   3. lo cruzo con las alergias del bebé (Gemini + una revisión mía)
//   4. confirmo el nombre oficial en RxNorm (base pública de EUA)
// ==========================================================================

export type FotoTomada = {
  uri: string;
  base64: string;
  tipo: string;
};

export async function tomarFotoMedicamento(): Promise<FotoTomada | null> {
  const opciones: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.5, // la bajo para que la foto pese menos al mandarla
    base64: true,
  };

  let resultado: ImagePicker.ImagePickerResult;

  if (Platform.OS === "web") {
    // en el navegador no hay cámara directa, se elige una imagen
    resultado = await ImagePicker.launchImageLibraryAsync(opciones);
  } else {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      throw new Error("SIN_PERMISO_CAMARA");
    }
    resultado = await ImagePicker.launchCameraAsync(opciones);
  }

  if (resultado.canceled || !resultado.assets?.[0]?.base64) return null;

  const foto = resultado.assets[0];
  return {
    uri: foto.uri,
    base64: foto.base64 as string,
    tipo: foto.mimeType || "image/jpeg",
  };
}

// quita acentos y pasa a minúsculas para comparar textos
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// revisión extra mía, por si la IA no lo marca: si alguna alergia
// registrada aparece en el nombre o en el principio activo, aviso
function buscarCoincidenciaAlergia(
  textoMedicamento: string,
  contexto?: ContextoBebe
): string {
  if (!contexto) return "";
  const alergias = `${contexto.alergias},${contexto.alergiasAlimentarias}`
    .split(/[,;\n]/)
    .map((a) => a.trim())
    .filter((a) => a && normalizar(a) !== "ninguna");

  const medicamento = normalizar(textoMedicamento);
  const encontrada = alergias.find(
    (a) => normalizar(a).length >= 4 && medicamento.includes(normalizar(a))
  );
  return encontrada
    ? `Contiene "${encontrada}", que está registrado como alergia del bebé.`
    : "";
}

export async function analizarFotoMedicamento(
  foto: FotoTomada,
  contexto?: ContextoBebe,
  nombreBebe?: string
): Promise<string> {
  const lectura = await leerFotoMedicamento(
    { base64: foto.base64, tipo: foto.tipo },
    contexto
  );

  if (!lectura) {
    return "No pude leer la foto en este momento. Revisa tu internet o intenta con una foto más clara y con buena luz.";
  }

  if (!lectura.esMedicamento) {
    return `🔎 No reconocí un medicamento en la foto.\n${lectura.aviso}`;
  }

  const lineas: string[] = [];
  lineas.push(`📦 ${lectura.nombre || "Medicamento"}`);
  if (lectura.principioActivo) {
    lineas.push(`Principio activo: ${lectura.principioActivo}`);
  }
  if (lectura.paraQueSirve) {
    lineas.push(`Para qué se usa: ${lectura.paraQueSirve}`);
  }

  const alertaPropia = buscarCoincidenciaAlergia(
    `${lectura.nombre} ${lectura.principioActivo}`,
    contexto
  );
  const alerta = lectura.alertaAlergia || alertaPropia;
  lineas.push(
    alerta
      ? `⚠ Alergias: ${alerta}`
      : `✓ No encontré conflicto con las alergias registradas${
          nombreBebe ? ` de ${nombreBebe}` : ""
        }.`
  );

  // nombre oficial en RxNorm (si lo encuentra)
  if (lectura.principioActivoIngles) {
    const rxnorm = await buscarInfoMedicamentoRxNorm(lectura.principioActivoIngles);
    if (rxnorm) {
      lineas.push(`Nombre oficial (RxNorm): ${rxnorm.nombreNormalizado}`);
    }
  }

  lineas.push(
    `ℹ️ ${lectura.aviso || "La dosis siempre la indica su pediatra."}`
  );
  lineas.push("Lectura de la foto con Gemini; confirma siempre con el empaque.");

  return lineas.join("\n");
}
