// ==========================================================================
// Chatbot pediátrico (Asistente Virtual) — src/services/chatbotService.ts
//
// Aquí NO entreno un modelo desde cero, eso necesita muchísima
// infraestructura de machine learning que no tengo para este proyecto de
// escuela. Lo que hago es conectarme a un modelo que ya está entrenado
// (Gemini de Google) y le doy instrucciones fijas (un "system prompt") para
// que se comporte como un asistente pediátrico responsable y no se salga
// del tema. A esto se le llama prompt engineering, y así funcionan casi
// todos los chatbots que uno usa en la vida real.
//
// La profa nos recomendó ver otras herramientas (Antigravity, Codex,
// Copilot, OpenCode) para el chatbot, pero esas son asistentes de
// PROGRAMACIÓN (te ayudan a ti a escribir código en tu editor), no APIs de
// chat que una app pueda llamar para responder a los usuarios. Por eso, en
// vez de esas cuatro, agregué OpenAI como respaldo: si Gemini falla (se cae
// el servicio, se agota el límite gratuito, etc.), la app automáticamente
// reintenta la misma pregunta con la API de OpenAI antes de darse por
// vencida. Así el chatbot no depende de un solo proveedor.
//
// Para configurar Gemini (gratis, sin tarjeta):
//   1. Entrar a https://aistudio.google.com con una cuenta de Google.
//   2. Crear una API key gratuita.
//   3. Pegarla en el archivo .env.local (en la raíz del proyecto), así:
//      EXPO_PUBLIC_GEMINI_API_KEY=tu_llave_aqui
//
// Para configurar el respaldo de OpenAI (OJO: esta sí es de paga, hay que
// cargar saldo en la cuenta, no tiene plan gratuito como Gemini):
//   1. Entrar a https://platform.openai.com y crear una cuenta.
//   2. Cargar algo de saldo (unos cuantos dólares alcanzan para meses de
//      pruebas de escuela, uso el modelo económico "gpt-4o-mini").
//   3. Crear una API key en https://platform.openai.com/api-keys.
//   4. Pegarla en .env.local, así:
//      EXPO_PUBLIC_OPENAI_API_KEY=tu_llave_aqui
//
// Si no configuras la de OpenAI no pasa nada, el chatbot sigue funcionando
// normal solo con Gemini (el respaldo es opcional).
//
// OJO: ninguna llave va escrita aquí en el código. GitHub bloqueó mi primer
// intento de subir el proyecto porque detectó la llave real de Gemini
// dentro de este archivo (con justa razón: subir una llave a un repo es
// mala práctica, aunque el repo sea privado). Por eso ambas llaves viven en
// .env.local, que está en .gitignore y nunca se sube a GitHub.
//
// Si no hay ninguna llave configurada, el chatbot avisa claro que falta
// configurarse en vez de tronar sin explicación (mismo patrón que uso en
// el resto de la app: si algo falla, avisar bonito y no romper la
// pantalla).
// ==========================================================================

import { GUIAS_MODULOS, ModuloAyuda } from "../constants/guiasModulos";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

// el modelo ahora se elige desde el .env.local (EXPO_PUBLIC_GEMINI_MODEL),
// igual que en MediCore. Antes tenía fijo el alias "gemini-flash-latest" y
// con la llave nueva me regresaba error, mientras que gemini-3.5-flash-lite
// sí funciona. Así, si Google retira un modelo, solo cambio el .env y ya
// (lista de modelos: https://ai.google.dev/gemini-api/docs/models)
const GEMINI_MODELO =
  process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent`;

// modelo económico de OpenAI, de aquí sale el respaldo cuando Gemini falla
const OPENAI_MODELO = process.env.EXPO_PUBLIC_OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// aquí van las instrucciones fijas para que el chatbot se comporte como
// asistente pediátrico responsable y no se ponga a dar diagnósticos
const INSTRUCCIONES_SISTEMA = `
Eres el Asistente Virtual de PediatriTrack Global, una app de seguimiento
pediátrico para padres y tutores. Debes seguir SIEMPRE estas reglas:

1. Solo respondes dudas generales sobre cuidado infantil, vacunación,
   vitaminación, alimentación complementaria y desarrollo del bebé.
2. NUNCA das un diagnóstico médico. Si describen síntomas, orienta de forma
   general y SIEMPRE recomienda consultar a un pediatra de confianza.
3. Si detectas señales de urgencia (dificultad para respirar, fiebre muy
   alta, convulsiones, deshidratación severa, golpe fuerte en la cabeza,
   etc.), indica de inmediato acudir a urgencias o llamar a un número de
   emergencia local, antes que cualquier otra cosa.
4. Si preguntan algo fuera del cuidado infantil, indica amablemente que solo
   puedes ayudar con temas relacionados al bebé o niño.
5. Responde en español de México, de forma breve, cálida y clara (máximo
   unas 4-5 líneas por respuesta).
`.trim();

export type MensajeChat = {
  rol: "usuario" | "asistente";
  texto: string;
};

// foto que se le manda a Gemini (la uso para leer la caja de un medicamento)
export type ImagenParaIA = {
  base64: string;
  tipo: string; // por ejemplo "image/jpeg"
};

// pequeña pausa para el reintento automático de Gemini
function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// lo que regresa cada proveedor: el texto o, si falló, el código HTTP para
// saber qué decirle al usuario
type ResultadoIA = { texto: string | null; codigoError?: number };

// --------------------------------------------------------------------------
// Llama a Gemini. Regresa el texto de la respuesta, o texto null y el código
// de error si falló (para que el que llama decida si intenta con OpenAI)
// --------------------------------------------------------------------------
// opciones extra para reutilizar la misma llamada a Gemini en el chatbot,
// en la ayuda de cada módulo y en la lectura de fotos
type OpcionesIA = {
  instrucciones?: string;
  imagen?: ImagenParaIA;
  json?: boolean; // pedirle a Gemini que conteste en JSON
  maxTokens?: number;
};

async function preguntarGemini(
  historial: MensajeChat[],
  nuevoMensaje: string,
  opciones: OpcionesIA = {}
): Promise<ResultadoIA> {
  const { instrucciones = INSTRUCCIONES_SISTEMA, imagen, json, maxTokens } =
    opciones;

  const contenidoHistorial = historial.map((mensaje) => ({
    role: mensaje.rol === "usuario" ? "user" : "model",
    parts: [{ text: mensaje.texto }],
  }));

  const cuerpoPeticion = JSON.stringify({
    systemInstruction: { parts: [{ text: instrucciones }] },
    contents: [
      ...contenidoHistorial,
      {
        role: "user",
        parts: imagen
          ? [
              { inline_data: { mime_type: imagen.tipo, data: imagen.base64 } },
              { text: nuevoMensaje },
            ]
          : [{ text: nuevoMensaje }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: maxTokens || 400,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });

  // la llave la mando en el header y no en la URL, así no aparece en los
  // logs de red y funciona con las llaves nuevas de AI Studio
  const opcionesPeticion = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: cuerpoPeticion,
  };

  let respuesta = await fetch(GEMINI_URL, opcionesPeticion);

  // el plan gratuito a veces tiene un pico de tráfico (429) o un hiccup
  // pasajero del servidor (503). En vez de tronar de una vez, espero 2
  // segundos y lo intento una sola vez más antes de rendirme
  if (!respuesta.ok && (respuesta.status === 429 || respuesta.status === 503)) {
    await esperar(2000);
    respuesta = await fetch(GEMINI_URL, opcionesPeticion);
  }

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    console.log(
      `Error de la API de Gemini (modelo ${GEMINI_MODELO}):`,
      respuesta.status,
      textoError
    );
    return { texto: null, codigoError: respuesta.status };
  }

  const datos = await respuesta.json();
  const texto: string | undefined =
    datos?.candidates?.[0]?.content?.parts?.[0]?.text;
  return { texto: texto?.trim() || null };
}

// según el error de Gemini le explico al usuario qué pasó, en vez de decir
// siempre "muchos mensajes" aunque el problema sea otro
function mensajeSegunError(codigo?: number): string {
  if (codigo === 429) {
    return "Estoy recibiendo muchos mensajes ahora mismo. Espera unos segundos e intenta de nuevo.";
  }
  if (codigo === 400 || codigo === 401 || codigo === 403) {
    return "El asistente no está disponible por un problema con la llave de la API. Avísale al equipo de PediatriTrack.";
  }
  if (codigo === 404) {
    return "El asistente no está disponible porque el modelo de IA configurado no existe. Avísale al equipo de PediatriTrack.";
  }
  return "El asistente no está disponible en este momento. Intenta de nuevo en unos minutos.";
}

// --------------------------------------------------------------------------
// Llama a OpenAI (respaldo). Regresa el texto de la respuesta, o null si
// falló o si no hay llave configurada
// --------------------------------------------------------------------------
async function preguntarOpenAI(
  historial: MensajeChat[],
  nuevoMensaje: string,
  instrucciones: string = INSTRUCCIONES_SISTEMA
): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;

  try {
    const mensajesHistorial = historial.map((mensaje) => ({
      role: mensaje.rol === "usuario" ? "user" : "assistant",
      content: mensaje.texto,
    }));

    const respuesta = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODELO,
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: "system", content: instrucciones },
          ...mensajesHistorial,
          { role: "user", content: nuevoMensaje },
        ],
      }),
    });

    if (!respuesta.ok) {
      const textoError = await respuesta.text();
      console.log("Error de la API de OpenAI:", respuesta.status, textoError);
      return null;
    }

    const datos = await respuesta.json();
    const texto: string | undefined = datos?.choices?.[0]?.message?.content;
    return texto?.trim() || null;
  } catch (error) {
    console.log("Error al conectar con OpenAI:", error);
    return null;
  }
}

// datos del bebé que le paso al chatbot para que personalice la respuesta.
// El nombre NO se manda a Gemini, solo lo necesario (edad y alergias)
export type ContextoBebe = {
  edadMeses: number | null;
  alergias: string;
  alergiasAlimentarias: string;
  condiciones: string;
};

function describirContexto(contexto?: ContextoBebe): string {
  if (!contexto) return "";
  const edad =
    contexto.edadMeses === null ? "no registrada" : `${contexto.edadMeses} meses`;
  return `

Datos del bebé registrados por su tutor en la app (úsalos para adaptar la
respuesta a su edad y SIEMPRE avisa primero si algo de lo que preguntan
choca con sus alergias):
- Edad: ${edad}
- Alergias médicas: ${contexto.alergias || "Ninguna"}
- Alergias alimentarias: ${contexto.alergiasAlimentarias || "Ninguna"}
- Condiciones médicas: ${contexto.condiciones || "Ninguna"}`;
}

const SIN_LLAVES =
  "El asistente todavía no está configurado. Falta agregar la llave " +
  "gratuita de Gemini (o, de respaldo, una llave de OpenAI) en el " +
  "archivo .env.local del proyecto.";

// --------------------------------------------------------------------------
// Función principal que uso desde la pantalla del chat: intenta Gemini
// primero (es el que tengo configurado gratis) y, si falla, cae
// automáticamente a OpenAI como respaldo (si está configurado). Nunca dejo
// que truene hacia la pantalla: si ambos fallan, regreso un mensaje de
// error que se entienda
// --------------------------------------------------------------------------
export async function preguntarAlChatbot(
  historial: MensajeChat[],
  nuevoMensaje: string,
  contexto?: ContextoBebe
): Promise<string> {
  if (!GEMINI_API_KEY && !OPENAI_API_KEY) return SIN_LLAVES;

  const instrucciones = INSTRUCCIONES_SISTEMA + describirContexto(contexto);

  try {
    let codigoErrorGemini: number | undefined;

    if (GEMINI_API_KEY) {
      const respuestaGemini = await preguntarGemini(historial, nuevoMensaje, {
        instrucciones,
      });
      if (respuestaGemini.texto) return respuestaGemini.texto;
      codigoErrorGemini = respuestaGemini.codigoError;
      console.log("Gemini no respondió, intento con OpenAI como respaldo...");
    }

    const respuestaOpenAI = await preguntarOpenAI(
      historial,
      nuevoMensaje,
      instrucciones
    );
    if (respuestaOpenAI) return respuestaOpenAI;

    // si llegamos aquí, ninguno de los dos pudo responder
    return mensajeSegunError(codigoErrorGemini);
  } catch (error) {
    console.log("Error al conectar con el chatbot:", error);
    return "Hubo un problema de conexión. Revisa tu internet e intenta de nuevo.";
  }
}

// --------------------------------------------------------------------------
// Ayuda de cada módulo ("¿Cómo funciona?"). A Gemini le paso la guía del
// módulo y le pido que la explique fácil, sin inventar. Si falla o no hay
// internet, regreso la guía escrita tal cual para que nunca quede vacío
// --------------------------------------------------------------------------
export async function explicarModulo(
  modulo: ModuloAyuda,
  historial: MensajeChat[],
  pregunta?: string
): Promise<{ texto: string; deRespaldo: boolean }> {
  const { titulo, guia } = GUIAS_MODULOS[modulo];

  const instrucciones = `
Eres la guía de uso de la app PediatriTrack Global y explicas el módulo
"${titulo}". Esta es la ÚNICA información que tienes sobre el módulo:

"""
${guia}
"""

Reglas:
1. Explica con palabras sencillas, como para alguien que casi no usa el
   celular. Usa pasos cortos numerados.
2. No inventes botones ni funciones que no estén en la información.
3. Lenguaje inclusivo y respetuoso (mamá, papá o tutor). No te refieras a
   las cosas solo por su color ("el botón verde"); di su nombre o ícono,
   porque algunas personas tienen daltonismo.
4. Si te preguntan algo médico, di que eso lo responde el Asistente Virtual
   o su pediatra.
5. Español de México, máximo unas 10 líneas.
`.trim();

  const mensaje =
    pregunta?.trim() ||
    `Explícame cómo funciona el módulo de ${titulo} y para qué me sirve.`;

  const respaldo = pregunta
    ? `No pude conectarme con la IA en este momento. Esto es lo que hace el módulo:\n\n${guia}`
    : guia;

  if (!GEMINI_API_KEY) return { texto: respaldo, deRespaldo: true };

  try {
    const resultado = await preguntarGemini(historial, mensaje, {
      instrucciones,
      maxTokens: 500,
    });
    if (resultado.texto) return { texto: resultado.texto, deRespaldo: false };
  } catch (error) {
    console.log("Error al explicar el módulo:", error);
  }
  return { texto: respaldo, deRespaldo: true };
}

// --------------------------------------------------------------------------
// Lectura de la foto de un medicamento o vitamina. Gemini lee la caja y me
// regresa un JSON; luego la pantalla lo cruza con las alergias del bebé
// --------------------------------------------------------------------------
export type LecturaMedicamento = {
  esMedicamento: boolean;
  nombre: string;
  principioActivo: string;
  principioActivoIngles: string; // para buscarlo en RxNorm (está en inglés)
  paraQueSirve: string;
  alertaAlergia: string; // vacío si no choca con ninguna alergia
  aviso: string;
};

export async function leerFotoMedicamento(
  imagen: ImagenParaIA,
  contexto?: ContextoBebe
): Promise<LecturaMedicamento | null> {
  if (!GEMINI_API_KEY) return null;

  const instrucciones = `
Eres un lector de empaques de medicamentos para una app de padres de
familia. Te mandan la foto de una caja, frasco o etiqueta. Contesta SOLO
con un JSON con esta forma exacta:
{"esMedicamento": true/false, "nombre": "", "principioActivo": "",
 "principioActivoIngles": "", "paraQueSirve": "", "alertaAlergia": "",
 "aviso": ""}

Reglas:
- "nombre": el nombre comercial que se lee en el empaque.
- "principioActivo": la sustancia activa (o varias separadas por "+").
- "principioActivoIngles": el mismo principio activo en inglés (ej.
  "ibuprofen"), solo el primero si son varios.
- "paraQueSirve": una frase corta y general de para qué se usa.
- "alertaAlergia": si el principio activo o algún componente choca con las
  alergias del bebé, explícalo en una frase; si no, déjalo vacío "".
- "aviso": recuerda en una frase que la dosis la indica su pediatra.
- NUNCA des dosis ni digas si se le puede dar al bebé.
- Si la foto no es de un medicamento o no se lee, pon "esMedicamento": false
  y explica en "aviso" qué pasó.
- Español de México.${describirContexto(contexto)}
`.trim();

  try {
    const resultado = await preguntarGemini(
      [],
      "Lee el empaque de esta foto.",
      { instrucciones, imagen, json: true, maxTokens: 500 }
    );
    if (!resultado.texto) return null;

    // por si Gemini manda el JSON envuelto en ```json ... ```
    const limpio = resultado.texto.replace(/```json|```/g, "").trim();
    const datos = JSON.parse(limpio);
    return {
      esMedicamento: !!datos.esMedicamento,
      nombre: String(datos.nombre || ""),
      principioActivo: String(datos.principioActivo || ""),
      principioActivoIngles: String(datos.principioActivoIngles || ""),
      paraQueSirve: String(datos.paraQueSirve || ""),
      alertaAlergia: String(datos.alertaAlergia || ""),
      aviso: String(datos.aviso || ""),
    };
  } catch (error) {
    console.log("Error al leer la foto con Gemini:", error);
    return null;
  }
}
