// Recordatorio en Google Calendar (en MediCore sincronizamos las citas con
// Google Calendar; aquí lo hice más sencillo: armo el enlace del evento ya
// lleno y el papá solo le da "Guardar". No pide permisos ni cuenta extra).

// fecha en la que le toca la vacuna: nacimiento + edad en meses. Si ya
// pasó (vacuna atrasada), lo pongo para mañana.
export function fechaDeVacuna(fechaNacimiento: string, edadMeses: number): Date {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);

  const partes = (fechaNacimiento || "").match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (!partes) return manana;
  let anio = parseInt(partes[3], 10);
  if (anio < 100) anio += 2000;
  const fecha = new Date(anio, parseInt(partes[2], 10) - 1 + edadMeses, parseInt(partes[1], 10));
  if (Number.isNaN(fecha.getTime()) || fecha.getTime() < Date.now()) return manana;
  return fecha;
}

function aaaammdd(fecha: Date) {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}${dos(fecha.getMonth() + 1)}${dos(fecha.getDate())}`;
}

// evento de todo el día
export function enlaceGoogleCalendar(titulo: string, fecha: Date, detalles: string): string {
  const siguiente = new Date(fecha);
  siguiente.setDate(siguiente.getDate() + 1);
  const parametros = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(titulo)}`,
    `dates=${aaaammdd(fecha)}/${aaaammdd(siguiente)}`,
    `details=${encodeURIComponent(detalles)}`,
  ].join("&");
  return `https://calendar.google.com/calendar/render?${parametros}`;
}
