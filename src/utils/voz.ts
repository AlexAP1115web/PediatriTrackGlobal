import * as Speech from "expo-speech";

// lectura en voz alta de las respuestas de Pedi (expo-speech usa la voz
// del celular, y en web la del navegador). Le quito el formato Markdown y
// los emojis antes de leer, para que no diga "asterisco" ni nombres raros

function limpiarParaVoz(texto: string): string {
  return texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [texto](link) -> texto
    .replace(/^\s*#{1,6}\s+/gm, "") // títulos
    .replace(/^\s*>\s?/gm, "") // citas
    .replace(/^\s*[-*•]\s+/gm, "") // viñetas
    .replace(/[*_`~]/g, "") // negritas, cursivas, código
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "") // emojis
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hablar(texto: string, alTerminar?: () => void) {
  Speech.stop();
  Speech.speak(limpiarParaVoz(texto), {
    language: "es-MX",
    rate: 0.95,
    pitch: 1.1,
    onDone: alTerminar,
    onStopped: alTerminar,
    onError: alTerminar,
  });
}

export function callar() {
  Speech.stop();
}
