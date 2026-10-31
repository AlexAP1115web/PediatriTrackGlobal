import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { configurarLenguajeFacil } from "../services/chatbotService";
import { aplicarTema, ModoColor, TamanoTexto } from "../styles/globalStyles";
import { configurarMenosAnimaciones } from "../utils/movimiento";
import { guardarPreferencia, leerPreferencia } from "../utils/preferencias";

// aquí guardo las opciones de accesibilidad. Las pongo en un contexto para
// que cualquier pantalla pueda leerlas o cambiarlas, y se guardan en el
// celular para que no se pierdan al cerrar la app.
//
// Al principio solo eran dos switches (daltonismo y texto grande). Ahora
// son más opciones para que la app la pueda usar más gente:
//   - modoColor: normal, rojo-verde, azul-amarillo o escala de grises
//   - tamanoTexto: normal, grande o muy grande
//   - altoContraste: textos y bordes más oscuros
//   - menosAnimaciones: Pedi y las burbujas se quedan quietos
//   - lenguajeFacil: Pedi contesta con palabras más sencillas
//   - leerEnVozAlta: Pedi lee sus respuestas en voz alta

const CLAVE_PREFERENCIAS = "pediatritrack_accesibilidad";

export type OpcionesAccesibilidad = {
  modoColor: ModoColor;
  tamanoTexto: TamanoTexto;
  altoContraste: boolean;
  menosAnimaciones: boolean;
  lenguajeFacil: boolean;
  leerEnVozAlta: boolean;
};

export const OPCIONES_INICIALES: OpcionesAccesibilidad = {
  modoColor: "normal",
  tamanoTexto: "normal",
  altoContraste: false,
  menosAnimaciones: false,
  lenguajeFacil: false,
  leerEnVozAlta: false,
};

type ValorAccesibilidad = OpcionesAccesibilidad & {
  // los dejo por compatibilidad con lo que ya usaba "daltonismo" y
  // "texto grande" como sí/no
  daltonismo: boolean;
  textoGrande: boolean;
  // cambia cada vez que se aplica un tema nuevo; el index la usa como key
  // para volver a dibujar la pantalla con los estilos nuevos
  versionTema: number;
  cambiarOpciones: (cambios: Partial<OpcionesAccesibilidad>) => void;
  restablecer: () => void;
};

const AccesibilidadContext = createContext<ValorAccesibilidad>({
  ...OPCIONES_INICIALES,
  daltonismo: false,
  textoGrande: false,
  versionTema: 0,
  cambiarOpciones: () => {},
  restablecer: () => {},
});

// las preferencias viejas venían como { daltonismo, textoGrande }; aquí
// las paso al formato nuevo para que nadie pierda lo que ya tenía
function leerGuardado(datos: any): OpcionesAccesibilidad {
  const opciones = { ...OPCIONES_INICIALES };
  if (!datos || typeof datos !== "object") return opciones;

  if (datos.daltonismo === true && !datos.modoColor) opciones.modoColor = "rojoVerde";
  if (datos.textoGrande === true && !datos.tamanoTexto) opciones.tamanoTexto = "grande";

  if (["normal", "rojoVerde", "azulAmarillo", "grises"].includes(datos.modoColor)) {
    opciones.modoColor = datos.modoColor;
  }
  if (["normal", "grande", "muyGrande"].includes(datos.tamanoTexto)) {
    opciones.tamanoTexto = datos.tamanoTexto;
  }
  opciones.altoContraste = !!datos.altoContraste;
  opciones.menosAnimaciones = !!datos.menosAnimaciones;
  opciones.lenguajeFacil = !!datos.lenguajeFacil;
  opciones.leerEnVozAlta = !!datos.leerEnVozAlta;
  return opciones;
}

export function AccesibilidadProvider({ children }: { children: ReactNode }) {
  const [opciones, setOpciones] = useState<OpcionesAccesibilidad>(OPCIONES_INICIALES);
  const [versionTema, setVersionTema] = useState(0);

  // al abrir la app cargo lo que el usuario dejó guardado
  useEffect(() => {
    (async () => {
      const guardado = await leerPreferencia(CLAVE_PREFERENCIAS);
      if (!guardado) return;
      try {
        aplicar(leerGuardado(JSON.parse(guardado)), false);
      } catch {
        // si el dato estaba mal guardado me quedo con lo normal
      }
    })();
  }, []);

  const aplicar = (nuevas: OpcionesAccesibilidad, guardar = true) => {
    aplicarTema(nuevas.modoColor, nuevas.tamanoTexto, nuevas.altoContraste);
    configurarMenosAnimaciones(nuevas.menosAnimaciones);
    configurarLenguajeFacil(nuevas.lenguajeFacil);
    setOpciones(nuevas);
    setVersionTema((v) => v + 1);
    if (guardar) guardarPreferencia(CLAVE_PREFERENCIAS, JSON.stringify(nuevas));
  };

  const cambiarOpciones = (cambios: Partial<OpcionesAccesibilidad>) =>
    aplicar({ ...opciones, ...cambios });

  return (
    <AccesibilidadContext.Provider
      value={{
        ...opciones,
        daltonismo: opciones.modoColor !== "normal",
        textoGrande: opciones.tamanoTexto !== "normal",
        versionTema,
        cambiarOpciones,
        restablecer: () => aplicar({ ...OPCIONES_INICIALES }),
      }}
    >
      {children}
    </AccesibilidadContext.Provider>
  );
}

export function useAccesibilidad() {
  return useContext(AccesibilidadContext);
}
