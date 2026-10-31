import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { File, Paths } from "expo-file-system";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

// ==========================================================================
// Voz de Pedi.
// La voz del celular (expo-speech) sonaba muy robótica, así que ahora uso la
// voz de Gemini (el mismo proveedor y la misma llave del chatbot). Gemini
// genera el audio con una voz natural y le pido que hable alegre y
// cariñosa, como una maestra de preescolar. Si Gemini falla (sin internet,
// sin llave o se acabó la cuota gratis), uso la mejor voz en español que
// tenga el celular, para que el botón 🔊 nunca se quede sin hacer nada.
//
// Se puede cambiar en .env.local:
//   EXPO_PUBLIC_GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview
//   EXPO_PUBLIC_GEMINI_TTS_VOICE=Leda   (otras: Aoede, Laomedeia, Achird, Sulafat)
// ==========================================================================

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const VOZ_GEMINI = process.env.EXPO_PUBLIC_GEMINI_TTS_VOICE || "Leda";

// si un modelo no existe para la llave, pruebo el siguiente y me quedo con
// el que sí funcionó
const MODELOS_VOZ = [
  process.env.EXPO_PUBLIC_GEMINI_TTS_MODEL,
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
].filter((modelo, i, lista): modelo is string => !!modelo && lista.indexOf(modelo) === i);

let modeloQueFunciona: string | null = null;

const ESTILO_VOZ =
  "Lee en voz alta el siguiente texto en español de México. Habla como una " +
  "maestra de preescolar alegre y cariñosa que les explica algo a papás y " +
  "niños: voz dulce y sonriente, con entusiasmo, ritmo tranquilo y pausas " +
  "naturales. Lee el texto tal cual, sin agregar ni quitar palabras:\n\n";

export type EventosVoz = {
  alEmpezar?: () => void;
  alTerminar?: () => void;
};

// le quito el Markdown y los emojis para que no diga "asterisco" ni
// nombres raros
export function limpiarParaVoz(texto: string): string {
  return texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1500);
}

// ---------- audio de Gemini ----------

// Gemini regresa el audio "crudo" (PCM de 16 bits). Para que el celular lo
// pueda reproducir le pongo encima la cabecera de un archivo .wav
function pcmAWav(pcm: Uint8Array, frecuencia: number): Uint8Array {
  const cabecera = new DataView(new ArrayBuffer(44));
  const texto = (posicion: number, valor: string) => {
    for (let i = 0; i < valor.length; i++) cabecera.setUint8(posicion + i, valor.charCodeAt(i));
  };
  texto(0, "RIFF");
  cabecera.setUint32(4, 36 + pcm.length, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  cabecera.setUint32(16, 16, true);
  cabecera.setUint16(20, 1, true); // PCM
  cabecera.setUint16(22, 1, true); // mono
  cabecera.setUint32(24, frecuencia, true);
  cabecera.setUint32(28, frecuencia * 2, true);
  cabecera.setUint16(32, 2, true);
  cabecera.setUint16(34, 16, true);
  texto(36, "data");
  cabecera.setUint32(40, pcm.length, true);

  const wav = new Uint8Array(44 + pcm.length);
  wav.set(new Uint8Array(cabecera.buffer), 0);
  wav.set(pcm, 44);
  return wav;
}

function base64ABytes(base64: string): Uint8Array {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

// los audios ya generados se guardan para que la segunda vez suene al instante
const audiosGuardados = new Map<string, string>();
let contadorArchivos = 0;

async function pedirAudioAGemini(texto: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  if (audiosGuardados.has(texto)) return audiosGuardados.get(texto)!;

  const modelos = modeloQueFunciona ? [modeloQueFunciona] : MODELOS_VOZ;

  for (const modelo of modelos) {
    try {
      const respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: ESTILO_VOZ + texto }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOZ_GEMINI } } },
            },
          }),
        }
      );

      // modelo que no existe para esta llave: pruebo el siguiente
      if (respuesta.status === 404 || respuesta.status === 400) continue;
      // sin cuota u otro error: uso la voz del celular
      if (!respuesta.ok) return null;

      const datos = await respuesta.json();
      const parte = datos?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data);
      if (!parte) return null;

      const tipo: string = parte.inlineData.mimeType || "";
      const frecuencia = Number(tipo.match(/rate=(\d+)/)?.[1] || 24000);
      const bytes = base64ABytes(parte.inlineData.data);
      const wav = /wav|mpeg|mp3|ogg/i.test(tipo) ? bytes : pcmAWav(bytes, frecuencia);

      let uri: string;
      if (Platform.OS === "web") {
        uri = URL.createObjectURL(new Blob([wav as Uint8Array<ArrayBuffer>], { type: "audio/wav" }));
      } else {
        const archivo = new File(Paths.cache, `pedi-voz-${Date.now()}-${contadorArchivos++}.wav`);
        archivo.create({ overwrite: true });
        archivo.write(wav);
        uri = archivo.uri;
      }

      modeloQueFunciona = modelo;
      audiosGuardados.set(texto, uri);
      return uri;
    } catch (error) {
      console.log("No se pudo generar la voz con Gemini:", error);
      return null;
    }
  }
  return null;
}

// ---------- voz del celular (respaldo) ----------

let vozDelCelular: string | undefined;
let vozBuscada = false;

// busco la voz en español que suene más natural (las de Google en línea o
// las "mejoradas" suenan menos robóticas)
async function elegirVozDelCelular() {
  if (vozBuscada) return;
  vozBuscada = true;
  try {
    const voces = await Speech.getAvailableVoicesAsync();
    const espanol = voces.filter((voz) => voz.language?.toLowerCase().startsWith("es"));
    const puntos = (voz: Speech.Voice) =>
      (/mx|us|419/i.test(voz.language) ? 2 : 0) +
      (voz.quality === Speech.VoiceQuality.Enhanced ? 3 : 0) +
      (/network|google|natural|online/i.test(`${voz.identifier} ${voz.name}`) ? 3 : 0);
    espanol.sort((a, b) => puntos(b) - puntos(a));
    vozDelCelular = espanol[0]?.identifier;
  } catch {
    vozDelCelular = undefined;
  }
}

// ---------- reproducir ----------

let reproductor: AudioPlayer | null = null;
let turno = 0;
let modoAudioListo = false;

function soltarReproductor() {
  if (reproductor) {
    try {
      reproductor.pause();
      reproductor.remove();
    } catch {
      // ya estaba liberado
    }
    reproductor = null;
  }
}

export function callar() {
  turno++;
  soltarReproductor();
  Speech.stop();
}

export async function hablar(textoOriginal: string, eventos: EventosVoz = {}) {
  callar();
  const miTurno = turno;
  const texto = limpiarParaVoz(textoOriginal);
  if (!texto) {
    eventos.alTerminar?.();
    return;
  }

  const uri = await pedirAudioAGemini(texto);
  // si mientras se generaba el audio el usuario tocó otra cosa, ya no lo pongo
  if (miTurno !== turno) return;

  if (uri) {
    try {
      if (!modoAudioListo && Platform.OS !== "web") {
        modoAudioListo = true;
        await setAudioModeAsync({ playsInSilentMode: true });
      }
      reproductor = createAudioPlayer({ uri });
      let empezo = false;
      reproductor.addListener("playbackStatusUpdate", (estado) => {
        if (miTurno !== turno) return;
        if (estado.playing && !empezo) {
          empezo = true;
          eventos.alEmpezar?.();
        }
        if (estado.didJustFinish) {
          soltarReproductor();
          eventos.alTerminar?.();
        }
      });
      reproductor.play();
      return;
    } catch (error) {
      console.log("No se pudo reproducir la voz de Gemini:", error);
      soltarReproductor();
    }
  }

  // respaldo: la voz del celular
  await elegirVozDelCelular();
  if (miTurno !== turno) return;
  Speech.speak(texto, {
    language: "es-MX",
    voice: vozDelCelular,
    rate: 0.92,
    pitch: 1.15,
    onStart: eventos.alEmpezar,
    onDone: eventos.alTerminar,
    onStopped: eventos.alTerminar,
    onError: eventos.alTerminar,
  });
}
