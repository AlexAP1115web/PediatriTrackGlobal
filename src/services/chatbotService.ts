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

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

// uso el alias "gemini-flash-latest" en vez de un nombre de versión fija,
// así Google se encarga de apuntarlo siempre al modelo flash gratuito más
// reciente y no se rompe si retiran una versión vieja (ver
// https://ai.google.dev/gemini-api/docs/models)
const GEMINI_MODELO = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent`;

// modelo económico de OpenAI, de aquí sale el respaldo cuando Gemini falla
const OPENAI_MODELO = "gpt-4o-mini";
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

// pequeña pausa para el reintento automático de Gemini
function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --------------------------------------------------------------------------
// Llama a Gemini. Regresa el texto de la respuesta, o null si falló (para
// que el que llama decida si intenta con OpenAI o no)
// --------------------------------------------------------------------------
async function preguntarGemini(
  historial: MensajeChat[],
  nuevoMensaje: string
): Promise<string | null> {
  const contenidoHistorial = historial.map((mensaje) => ({
    role: mensaje.rol === "usuario" ? "user" : "model",
    parts: [{ text: mensaje.texto }],
  }));

  const cuerpoPeticion = JSON.stringify({
    systemInstruction: { parts: [{ text: INSTRUCCIONES_SISTEMA }] },
    contents: [
      ...contenidoHistorial,
      { role: "user", parts: [{ text: nuevoMensaje }] },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 400,
    },
  });

  let respuesta = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpoPeticion,
  });

  // el plan gratuito a veces tiene un pico de tráfico (429) o un hiccup
  // pasajero del servidor (503). En vez de tronar de una vez, espero 2
  // segundos y lo intento una sola vez más antes de rendirme
  if (!respuesta.ok && (respuesta.status === 429 || respuesta.status === 503)) {
    await esperar(2000);
    respuesta = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: cuerpoPeticion,
    });
  }

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    console.log("Error de la API de Gemini:", respuesta.status, textoError);
    return null;
  }

  const datos = await respuesta.json();
  const texto: string | undefined =
    datos?.candidates?.[0]?.content?.parts?.[0]?.text;
  return texto?.trim() || null;
}

// --------------------------------------------------------------------------
// Llama a OpenAI (respaldo). Regresa el texto de la respuesta, o null si
// falló o si no hay llave configurada
// --------------------------------------------------------------------------
async function preguntarOpenAI(
  historial: MensajeChat[],
  nuevoMensaje: string
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
          { role: "system", content: INSTRUCCIONES_SISTEMA },
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

// --------------------------------------------------------------------------
// Función principal que uso desde la pantalla del chat: intenta Gemini
// primero (es el que tengo configurado gratis) y, si falla, cae
// automáticamente a OpenAI como respaldo (si está configurado). Nunca dejo
// que truene hacia la pantalla: si ambos fallan, regreso un mensaje de
// error que se entienda
// --------------------------------------------------------------------------
export async function preguntarAlChatbot(
  historial: MensajeChat[],
  nuevoMensaje: string
): Promise<string> {
  if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
    return (
      "El asistente todavía no está configurado. Falta agregar la llave " +
      "gratuita de Gemini (o, de respaldo, una llave de OpenAI) en el " +
      "archivo .env.local del proyecto."
    );
  }

  try {
    if (GEMINI_API_KEY) {
      const respuestaGemini = await preguntarGemini(historial, nuevoMensaje);
      if (respuestaGemini) return respuestaGemini;
      console.log("Gemini no respondió, intento con OpenAI como respaldo...");
    }

    const respuestaOpenAI = await preguntarOpenAI(historial, nuevoMensaje);
    if (respuestaOpenAI) return respuestaOpenAI;

    // si llegamos aquí, ninguno de los dos pudo responder
    return "Estoy recibiendo muchos mensajes ahora mismo o el asistente no está disponible. Espera unos segundos e intenta de nuevo.";
  } catch (error) {
    console.log("Error al conectar con el chatbot:", error);
    return "Hubo un problema de conexión. Revisa tu internet e intenta de nuevo.";
  }
}
