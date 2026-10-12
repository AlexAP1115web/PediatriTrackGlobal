// ==========================================================================
// Aquí puse las APIs externas que no tienen nada que ver con Firebase.
//
// Como quedamos que TODO lo de Firebase va en src/firebase/firebaseService.ts,
// decidí separar en este archivo las APIs públicas de terceros para no
// mezclar cosas que no son lo mismo.
//
// APIs que uso aquí:
//   - openFDA (FDA de EUA): info oficial de medicamentos/vacunas.
//   - RxNorm / RxNav (Instituto Nacional de Salud de EUA): para normalizar
//     el nombre de un medicamento.
//
// Las dos son públicas, gratis y no piden llave para uso normal. Uso el
// mismo truco que ya tenía en contrasenaFiltradaPublicamente: si la API
// no responde, regreso null y la pantalla sigue funcionando normal, nunca
// se debe caer la app por culpa de una API externa caída.
// ==========================================================================

// llave opcional de openFDA (va en el .env.local). Sin llave funciona igual,
// con llave solo sube el límite de consultas por día
const OPENFDA_API_KEY = process.env.EXPO_PUBLIC_OPENFDA_API_KEY || "";

export type InfoMedicamentoOpenFDA = {
  nombreEncontrado: string;
  indicaciones?: string;
  advertencias?: string;
  dosisYAdministracion?: string;
};

export type InfoMedicamentoRxNorm = {
  nombreNormalizado: string;
  rxcui: string;
};

// la FDA a veces regresa textos larguísimos, esto lo recorta para que se
// pueda leer bien dentro de la app
function recortarTexto(valor: string | undefined, limite = 500): string | undefined {
  if (!valor) return undefined;
  return valor.length > limite ? `${valor.slice(0, limite)}…` : valor;
}

// busco el medicamento/vitamina en openFDA, primero por nombre comercial
// y si no lo encuentra intento con el nombre genérico
export async function buscarInfoMedicamentoOpenFDA(
  nombre: string
): Promise<InfoMedicamentoOpenFDA | null> {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return null;

  const intentarBusqueda = async (campo: "brand_name" | "generic_name") => {
    const url =
      "https://api.fda.gov/drug/label.json?search=" +
      `openfda.${campo}:"${encodeURIComponent(nombreLimpio)}"&limit=1` +
      (OPENFDA_API_KEY ? `&api_key=${OPENFDA_API_KEY}` : "");

    const respuesta = await fetch(url);
    if (!respuesta.ok) return null;

    const datos = await respuesta.json();
    const resultado = datos?.results?.[0];
    if (!resultado) return null;

    return {
      nombreEncontrado:
        resultado.openfda?.brand_name?.[0] ||
        resultado.openfda?.generic_name?.[0] ||
        nombreLimpio,
      indicaciones: recortarTexto(resultado.indications_and_usage?.[0]),
      advertencias: recortarTexto(resultado.warnings?.[0] || resultado.warnings_and_cautions?.[0]),
      dosisYAdministracion: recortarTexto(
        resultado.dosage_and_administration?.[0]
      ),
    } as InfoMedicamentoOpenFDA;
  };

  try {
    const porMarca = await intentarBusqueda("brand_name");
    if (porMarca) return porMarca;

    const porGenerico = await intentarBusqueda("generic_name");
    return porGenerico;
  } catch (error) {
    console.log("No se pudo consultar openFDA:", error);
    return null;
  }
}

// esto normaliza el nombre del medicamento contra el catálogo de RxNorm,
// sirve para confirmar el nombre clínico correcto de lo que se registró
export async function buscarInfoMedicamentoRxNorm(
  nombre: string
): Promise<InfoMedicamentoRxNorm | null> {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return null;

  try {
    const urlBusqueda = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(
      nombreLimpio
    )}`;

    const respuestaBusqueda = await fetch(urlBusqueda);
    if (!respuestaBusqueda.ok) return null;

    const datosBusqueda = await respuestaBusqueda.json();
    const rxcui = datosBusqueda?.idGroup?.rxnormId?.[0];
    if (!rxcui) return null;

    const urlPropiedades = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`;
    const respuestaPropiedades = await fetch(urlPropiedades);
    if (!respuestaPropiedades.ok) return null;

    const datosPropiedades = await respuestaPropiedades.json();
    const nombreNormalizado = datosPropiedades?.properties?.name;
    if (!nombreNormalizado) return null;

    return { nombreNormalizado, rxcui };
  } catch (error) {
    console.log("No se pudo consultar RxNorm:", error);
    return null;
  }
}
