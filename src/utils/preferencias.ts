import Storage from "expo-sqlite/kv-store";

// guardo preferencias pequeñas en el propio celular (accesibilidad y el
// historial del chatbot). Uso el kv-store de expo-sqlite porque ya tenía
// expo-sqlite instalado y funciona igual que AsyncStorage. En web se usa
// preferencias.web.ts (localStorage) en lugar de este archivo
export async function leerPreferencia(clave: string): Promise<string | null> {
  try {
    return await Storage.getItem(clave);
  } catch (error) {
    console.log("No se pudo leer la preferencia", clave, error);
    return null;
  }
}

export async function guardarPreferencia(clave: string, valor: string) {
  try {
    await Storage.setItem(clave, valor);
  } catch (error) {
    console.log("No se pudo guardar la preferencia", clave, error);
  }
}
