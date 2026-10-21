// versión web de preferencias.ts: en el navegador uso localStorage. Lo
// envuelvo en try/catch porque en modo incógnito o con el almacenamiento
// bloqueado localStorage puede tronar, y no quiero que eso rompa la app
export async function leerPreferencia(clave: string): Promise<string | null> {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

export async function guardarPreferencia(clave: string, valor: string) {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // si no se puede guardar, la preferencia solo dura mientras está abierta
  }
}
