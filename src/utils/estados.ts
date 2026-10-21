// para que los estados no se distingan solo por el color (una persona con
// daltonismo no ve la diferencia entre el verde y el rojo), a cada estado
// le pongo también un ícono. Así se entiende por color, por ícono y por
// la palabra
export function iconoEstado(estado: string): string {
  const texto = estado.toLowerCase();
  if (texto.includes("aplicada") || texto.includes("al día")) return "✓";
  if (texto.includes("atrasada")) return "⚠";
  if (texto.includes("próxima") || texto.includes("hoy")) return "⏳";
  return "○";
}

export function textoEstado(estado: string): string {
  return `${iconoEstado(estado)} ${estado}`;
}
