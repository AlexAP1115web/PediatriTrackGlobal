import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { aplicarTema } from "../styles/globalStyles";
import { guardarPreferencia, leerPreferencia } from "../utils/preferencias";

// aquí guardo las opciones de accesibilidad (modo daltonismo y texto
// grande). Las pongo en un contexto para que cualquier pantalla pueda
// leerlas o cambiarlas, y se guardan en el celular para que no se pierdan
// al cerrar la app

const CLAVE_PREFERENCIAS = "pediatritrack_accesibilidad";

type ValorAccesibilidad = {
  daltonismo: boolean;
  textoGrande: boolean;
  // cambia cada vez que se aplica un tema nuevo; el index la usa como key
  // para volver a dibujar la pantalla con los estilos nuevos
  versionTema: number;
  cambiarDaltonismo: (activo: boolean) => void;
  cambiarTextoGrande: (activo: boolean) => void;
};

const AccesibilidadContext = createContext<ValorAccesibilidad>({
  daltonismo: false,
  textoGrande: false,
  versionTema: 0,
  cambiarDaltonismo: () => {},
  cambiarTextoGrande: () => {},
});

export function AccesibilidadProvider({ children }: { children: ReactNode }) {
  const [daltonismo, setDaltonismo] = useState(false);
  const [textoGrande, setTextoGrande] = useState(false);
  const [versionTema, setVersionTema] = useState(0);

  // al abrir la app cargo lo que el usuario dejó guardado
  useEffect(() => {
    (async () => {
      const guardado = await leerPreferencia(CLAVE_PREFERENCIAS);
      if (!guardado) return;
      try {
        const datos = JSON.parse(guardado);
        aplicar(!!datos.daltonismo, !!datos.textoGrande, false);
      } catch {
        // si el dato estaba mal guardado me quedo con el tema normal
      }
    })();
  }, []);

  const aplicar = (nuevoDaltonismo: boolean, nuevoTextoGrande: boolean, guardar = true) => {
    aplicarTema(nuevoDaltonismo, nuevoTextoGrande);
    setDaltonismo(nuevoDaltonismo);
    setTextoGrande(nuevoTextoGrande);
    setVersionTema((v) => v + 1);
    if (guardar) {
      guardarPreferencia(
        CLAVE_PREFERENCIAS,
        JSON.stringify({ daltonismo: nuevoDaltonismo, textoGrande: nuevoTextoGrande })
      );
    }
  };

  return (
    <AccesibilidadContext.Provider
      value={{
        daltonismo,
        textoGrande,
        versionTema,
        cambiarDaltonismo: (activo) => aplicar(activo, textoGrande),
        cambiarTextoGrande: (activo) => aplicar(daltonismo, activo),
      }}
    >
      {children}
    </AccesibilidadContext.Provider>
  );
}

export function useAccesibilidad() {
  return useContext(AccesibilidadContext);
}
