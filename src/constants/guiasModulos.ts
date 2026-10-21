// ==========================================================================
// Guías de cada módulo
//
// Este texto lo uso para dos cosas:
//   1. Se lo paso a Gemini como "fuente" para que explique el módulo con
//      sus palabras pero SIN inventar funciones que la app no tiene.
//   2. Si no hay internet o falla la IA, muestro este mismo texto tal cual,
//      así la ayuda nunca se queda vacía.
// Si agrego o quito algo en una pantalla, hay que actualizarlo aquí.
// ==========================================================================

export type ModuloAyuda =
  | "vacunas"
  | "vitaminas"
  | "documentos"
  | "alimentacion"
  | "info";

export const GUIAS_MODULOS: Record<ModuloAyuda, { titulo: string; guia: string }> = {
  vacunas: {
    titulo: "Vacunación",
    guia: `Es la pantalla principal. Arriba está el perfil del bebé activo con su edad, fecha de nacimiento y sexo.
1. Elige el esquema de vacunación: México o Estados Unidos.
2. La tabla muestra cada vacuna con su edad recomendada y su estado: "✓ Aplicada", "⏳ Próxima" (la siguiente que le toca) o "○ Pendiente".
3. En "Detalle de vacunas" cada vacuna explica para qué sirve y sus posibles efectos. Toca "Marcar como aplicada" cuando se la pongan; se guarda con la fecha de hoy. Si te equivocaste, toca "Desmarcar".
4. En "Historial de vacunas aplicadas" ves todas las que ya tiene.
5. El botón de engrane (⚙️) junto al perfil sirve para cambiar de bebé, registrar otro, ver la política de privacidad, abrir Accesibilidad o cerrar sesión.
6. Más abajo están los accesos a los demás módulos: Vitaminación, Documentos, Alimentación complementaria, Información adicional, Política de privacidad, Asistente Virtual y Accesibilidad.
Es una guía de seguimiento; las decisiones sobre vacunas las toma su pediatra.`,
  },
  vitaminas: {
    titulo: "Vitaminación",
    guia: `Sirve para llevar el control de vitaminas y suplementos que el pediatra le indicó al bebé.
1. Llena el formulario: nombre de la vitamina, dosis, frecuencia (por ejemplo diario), duración e indicaciones. Toca guardar.
2. Cada vitamina aparece en la lista con un recordatorio: "⏳ Pendiente hoy" si toca darla hoy, "⚠ Atrasada" si ya pasó la fecha, o "✓ Al día".
3. Cuando se la des, toca el botón para registrar la toma; la app recalcula cuándo toca la siguiente.
4. Puedes editar o eliminar una vitamina desde su tarjeta.
5. Hay una opción para consultar información oficial de la vitamina en las bases públicas openFDA y RxNorm (están en inglés y son de Estados Unidos).
La app no calcula dosis: registra solo lo que indicó el pediatra.`,
  },
  documentos: {
    titulo: "Documentos",
    guia: `Es un archivo digital para tener a la mano los papeles del bebé.
1. Elige el tipo de documento: Acta, Cartilla, Consulta, Estudio, Laboratorio o Receta.
2. Escribe el nombre, la fecha y una descripción opcional.
3. Si quieres, adjunta el archivo en PDF (máximo 15 MB). Se guarda de forma privada en tu cuenta.
4. En la lista puedes abrir o compartir el PDF, editar los datos o eliminar el documento.
Solo tú, con tu cuenta, puedes ver tus documentos.`,
  },
  alimentacion: {
    titulo: "Alimentación complementaria",
    guia: `Ayuda a llevar el registro de los alimentos nuevos que va probando el bebé.
1. Arriba ves un resumen y las alergias alimentarias que registraste en el perfil del bebé.
2. Para registrar un alimento elige el mes de edad, la textura (Molido, En trozos, Papilla u Otro) y la categoría, escribe el alimento e indica si le causó alergia. Puedes agregar observaciones.
3. Las recetas recomendadas cambian según el mes. Si una receta lleva algo a lo que el bebé es alérgico, la app la oculta y te avisa.
4. Abajo queda el historial de todo lo que ha probado, marcado como permitido o "evitar".
Se recomienda introducir los alimentos uno por uno y observar posibles reacciones.`,
  },
  info: {
    titulo: "Información adicional",
    guia: `Es una guía rápida de consulta para mamás, papás y tutores. Incluye:
1. Qué hacer si el bebé se atraganta (primeros auxilios).
2. Uso del suero nasal (esterimar).
3. Efectos comunes después de las vacunas.
4. Fiebre: cuidados en casa y cuándo ir al médico.
5. Diarrea e hidratación, y alimentos astringentes y no astringentes.
6. Signos de alarma y cuándo ir a urgencias de inmediato.
Es información general; no sustituye la valoración del pediatra. Ante una urgencia, acude a un servicio de urgencias.`,
  },
};
