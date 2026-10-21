// cálculo de la edad del bebé en meses a partir de la fecha DD/MM/AAAA que
// se captura en el registro (la misma lógica que uso en vacunación)
export function calcularEdadEnMeses(fechaTexto: string | undefined): number | null {
  if (!fechaTexto) return null;
  const coincidencia = fechaTexto.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (!coincidencia) return null;

  const dia = parseInt(coincidencia[1], 10);
  const mes = parseInt(coincidencia[2], 10);
  let anio = parseInt(coincidencia[3], 10);
  if (anio < 100) anio += 2000;

  const nacimiento = new Date(anio, mes - 1, dia);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let meses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 +
    (hoy.getMonth() - nacimiento.getMonth());
  if (hoy.getDate() < nacimiento.getDate()) meses -= 1;

  return meses < 0 ? 0 : meses;
}

export function formatearEdad(meses: number | null): string {
  if (meses === null) return "Edad no registrada";
  if (meses < 1) return "Recién nacido";
  if (meses === 1) return "1 mes";
  return `${meses} meses`;
}
