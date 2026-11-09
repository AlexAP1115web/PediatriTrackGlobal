// Esquemas de vacunación de 0 a 6 años para México y Estados Unidos.
//
// México: Programa de Vacunación Universal (PRONAM "Vacunación a lo largo
// de la vida", Secretaría de Salud, 2026) + las vacunas que los pediatras
// recomiendan en privado porque no vienen en la cartilla pública.
// Estados Unidos: calendario de la AAP 2026 (el que siguen la mayoría de
// los pediatras). En enero de 2026 los CDC dejaron como "para todos" solo
// algunas vacunas y las demás pasaron a "decisión con el pediatra", por eso
// cada vacuna de EE. UU. dice en qué grupo quedó.
//
// Es una guía: las fechas exactas las confirma el pediatra.

export type Pais = "México" | "Estados Unidos";

// México: pública (gratis en el Sector Salud), privada (con costo) o
// parcial (gratis solo en algunos estados o guarderías)
// EE. UU.: rutina (CDC la recomienda para todos) o pediatra (la AAP la
// recomienda; los CDC la dejaron a decisión con el pediatra)
export type Acceso = "publica" | "privada" | "parcial" | "rutina" | "pediatra";

export type VacunaEsquema = {
  id: string;
  pais: Pais;
  nombre: string;
  dosis: string;
  // edad en meses a la que se recomienda (sirve para ordenar y para saber
  // si ya le toca al bebé)
  edadMeses: number;
  // la edad como se muestra en pantalla
  edad: string;
  acceso: Acceso;
  // después de esta edad ya no se aplica (por ejemplo rotavirus o el
  // anticuerpo contra VSR), así que no se marca como atrasada
  edadMaxMeses?: number;
  nota?: string;
};

// qué protege cada vacuna y sus efectos comunes (para no repetirlo en
// cada dosis)
export const INFO_VACUNAS: Record<string, { protege: string; efectos: string }> = {
  BCG: {
    protege: "Formas graves de tuberculosis (meníngea y miliar).",
    efectos: "Ampolla pequeña que se vuelve costra y deja una cicatriz en el brazo.",
  },
  "Hepatitis B": {
    protege: "Infección del hígado por el virus de la hepatitis B.",
    efectos: "Dolor en la zona de aplicación o fiebre leve.",
  },
  Hexavalente: {
    protege:
      "Difteria, tos ferina, tétanos, poliomielitis, Haemophilus influenzae tipo b y hepatitis B (6 enfermedades en una).",
    efectos: "Fiebre leve, irritabilidad, dolor o hinchazón en el muslo.",
  },
  Rotavirus: {
    protege: "Diarrea grave y deshidratación por rotavirus.",
    efectos: "Irritabilidad, diarrea leve o vómito ocasional.",
  },
  Neumococo: {
    protege: "Neumonía, meningitis e infecciones de oído por neumococo.",
    efectos: "Dolor local, fiebre leve o somnolencia.",
  },
  "Neumococo (PCV)": {
    protege: "Neumonía, meningitis e infecciones de oído por neumococo.",
    efectos: "Dolor local, fiebre leve o somnolencia.",
  },
  Influenza: {
    protege: "Influenza estacional y sus complicaciones.",
    efectos: "Dolor local, fiebre leve o malestar por 1 o 2 días.",
  },
  "COVID-19": {
    protege: "Formas graves de COVID-19.",
    efectos: "Dolor local, cansancio o fiebre leve.",
  },
  SRP: {
    protege: "Sarampión, rubéola y paperas (parotiditis).",
    efectos: "Fiebre o ronchitas leves 7 a 12 días después.",
  },
  "Triple viral (MMR)": {
    protege: "Sarampión, rubéola y paperas.",
    efectos: "Fiebre o ronchitas leves 7 a 12 días después.",
  },
  DPT: {
    protege: "Difteria, tos ferina y tétanos (refuerzo).",
    efectos: "Dolor e hinchazón en el brazo, fiebre leve.",
  },
  DTaP: {
    protege: "Difteria, tétanos y tos ferina.",
    efectos: "Fiebre, irritabilidad, dolor o hinchazón local.",
  },
  IPV: {
    protege: "Poliomielitis (polio).",
    efectos: "Dolor o enrojecimiento en la zona de aplicación.",
  },
  Hib: {
    protege: "Meningitis y otras infecciones por Haemophilus influenzae tipo b.",
    efectos: "Fiebre leve, enrojecimiento o hinchazón.",
  },
  "Hepatitis A": {
    protege: "Infección del hígado por el virus de la hepatitis A.",
    efectos: "Dolor local, cansancio o poco apetito.",
  },
  Varicela: {
    protege: "Varicela y sus complicaciones (infecciones de la piel, neumonía).",
    efectos: "Dolor local, fiebre o algunas ronchitas parecidas a la varicela.",
  },
  "Meningococo B": {
    protege: "Meningitis y septicemia por meningococo del grupo B.",
    efectos: "Fiebre (más frecuente en bebés), dolor e irritabilidad.",
  },
  "Meningococo ACWY": {
    protege: "Meningitis por meningococo de los grupos A, C, W e Y.",
    efectos: "Dolor local, irritabilidad o fiebre leve.",
  },
  "Anticuerpo VSR": {
    protege:
      "Bronquiolitis y neumonía por virus sincicial respiratorio (VSR) en su primera temporada de frío. Es un anticuerpo, no una vacuna.",
    efectos: "Ronchitas o dolor leve en la zona de aplicación (poco frecuente).",
  },
};

export const ESQUEMA_MEXICO: VacunaEsquema[] = [
  // ---------- al nacer ----------
  { id: "mx-bcg", edadMaxMeses: 12, pais: "México", nombre: "BCG", dosis: "Única", edadMeses: 0, edad: "Al nacer", acceso: "publica" },
  {
    id: "mx-hb", edadMaxMeses: 2, pais: "México", nombre: "Hepatitis B", dosis: "1ra dosis", edadMeses: 0, edad: "Al nacer", acceso: "publica",
    nota: "Se aplica en las primeras 24 horas. Las siguientes dosis ya vienen dentro de la hexavalente.",
  },
  {
    id: "mx-vsr", edadMaxMeses: 8, pais: "México", nombre: "Anticuerpo VSR", dosis: "Única", edadMeses: 0, edad: "Al nacer", acceso: "privada",
    nota: "En el sector público se vacuna a la mamá en el embarazo (semanas 32 a 36). En privado se puede aplicar al bebé antes de su primer invierno.",
  },
  // ---------- 2 meses ----------
  { id: "mx-hexa1", pais: "México", nombre: "Hexavalente", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "publica" },
  { id: "mx-rota1", edadMaxMeses: 8, pais: "México", nombre: "Rotavirus", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "publica", nota: "Es oral (en gotas)." },
  { id: "mx-neumo1", pais: "México", nombre: "Neumococo", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "publica", nota: "Neumocócica conjugada 20-valente." },
  { id: "mx-menb1", pais: "México", nombre: "Meningococo B", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "privada" },
  // ---------- 4 meses ----------
  { id: "mx-hexa2", pais: "México", nombre: "Hexavalente", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "publica" },
  { id: "mx-rota2", edadMaxMeses: 8, pais: "México", nombre: "Rotavirus", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "publica", nota: "Debe aplicarse antes de los 8 meses de edad." },
  { id: "mx-neumo2", pais: "México", nombre: "Neumococo", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "publica" },
  { id: "mx-menb2", pais: "México", nombre: "Meningococo B", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "privada" },
  // ---------- 6 meses ----------
  { id: "mx-hexa3", pais: "México", nombre: "Hexavalente", dosis: "3ra dosis", edadMeses: 6, edad: "6 meses", acceso: "publica" },
  {
    id: "mx-flu1", pais: "México", nombre: "Influenza", dosis: "1ra dosis", edadMeses: 6, edad: "6 meses", acceso: "publica",
    nota: "Se aplica en temporada invernal (octubre a marzo). La primera vez son 2 dosis con 4 semanas de diferencia.",
  },
  {
    id: "mx-covid1", pais: "México", nombre: "COVID-19", dosis: "1ra dosis", edadMeses: 6, edad: "6 meses", acceso: "publica",
    nota: "De 6 a 59 meses: 2 dosis con 4 semanas de diferencia y después una dosis al año.",
  },
  // ---------- 7 meses ----------
  { id: "mx-flu2", pais: "México", nombre: "Influenza", dosis: "2da dosis", edadMeses: 7, edad: "7 meses", acceso: "publica" },
  { id: "mx-covid2", pais: "México", nombre: "COVID-19", dosis: "2da dosis", edadMeses: 7, edad: "7 meses", acceso: "publica" },
  // ---------- 12 meses ----------
  { id: "mx-srp1", pais: "México", nombre: "SRP", dosis: "1ra dosis", edadMeses: 12, edad: "12 meses", acceso: "publica" },
  { id: "mx-neumo3", pais: "México", nombre: "Neumococo", dosis: "Refuerzo", edadMeses: 12, edad: "12 meses", acceso: "publica" },
  {
    id: "mx-vari1", pais: "México", nombre: "Varicela", dosis: "1ra dosis", edadMeses: 12, edad: "12 meses", acceso: "parcial",
    nota: "Gratis solo en algunos estados y en guarderías, según disponibilidad. Si no, se aplica en privado.",
  },
  { id: "mx-menb3", pais: "México", nombre: "Meningococo B", dosis: "Refuerzo", edadMeses: 12, edad: "12 meses", acceso: "privada" },
  {
    id: "mx-acwy", pais: "México", nombre: "Meningococo ACWY", dosis: "1 dosis", edadMeses: 12, edad: "12 meses", acceso: "privada",
    nota: "Según la marca se puede empezar desde los 2 meses. Recomendada sobre todo si hay brotes o viajes.",
  },
  {
    id: "mx-fluanual", pais: "México", nombre: "Influenza", dosis: "Refuerzo anual", edadMeses: 12, edad: "12 meses", acceso: "publica",
    nota: "Una dosis cada temporada invernal hasta los 5 años.",
  },
  // ---------- 18 meses ----------
  { id: "mx-hexa4", pais: "México", nombre: "Hexavalente", dosis: "Refuerzo", edadMeses: 18, edad: "18 meses", acceso: "publica" },
  { id: "mx-srp2", pais: "México", nombre: "SRP", dosis: "2da dosis", edadMeses: 18, edad: "18 meses", acceso: "publica" },
  { id: "mx-hepa1", pais: "México", nombre: "Hepatitis A", dosis: "1ra dosis", edadMeses: 18, edad: "18 meses", acceso: "publica" },
  // ---------- 2 años ----------
  {
    id: "mx-hepa2", pais: "México", nombre: "Hepatitis A", dosis: "2da dosis", edadMeses: 24, edad: "2 años", acceso: "privada",
    nota: "La cartilla pública solo trae una dosis. La segunda se aplica de 6 a 18 meses después de la primera.",
  },
  // ---------- 4 años ----------
  {
    id: "mx-dpt", pais: "México", nombre: "DPT", dosis: "Refuerzo", edadMeses: 48, edad: "4 años", acceso: "publica",
    nota: "Si va a guardería o estancia infantil puede aplicarse desde los 3 años y medio.",
  },
  { id: "mx-vari2", pais: "México", nombre: "Varicela", dosis: "2da dosis", edadMeses: 48, edad: "4 años", acceso: "privada" },
];

export const ESQUEMA_USA: VacunaEsquema[] = [
  // ---------- al nacer ----------
  {
    id: "us-hb1", pais: "Estados Unidos", nombre: "Hepatitis B", dosis: "1ra dosis", edadMeses: 0, edad: "Al nacer", acceso: "pediatra",
    nota: "La AAP la recomienda en las primeras 24 horas. Desde 2026 los CDC solo la piden al nacer si la mamá tiene hepatitis B o no se sabe.",
  },
  {
    id: "us-vsr", edadMaxMeses: 8, pais: "Estados Unidos", nombre: "Anticuerpo VSR", dosis: "Única", edadMeses: 0, edad: "Al nacer", acceso: "pediatra",
    nota: "Para menores de 8 meses en su primera temporada de VSR, si la mamá no se vacunó en el embarazo.",
  },
  // ---------- 1 mes ----------
  { id: "us-hb2", pais: "Estados Unidos", nombre: "Hepatitis B", dosis: "2da dosis", edadMeses: 1, edad: "1 a 2 meses", acceso: "pediatra" },
  // ---------- 2 meses ----------
  { id: "us-dtap1", pais: "Estados Unidos", nombre: "DTaP", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "rutina" },
  { id: "us-ipv1", pais: "Estados Unidos", nombre: "IPV", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "rutina" },
  { id: "us-hib1", pais: "Estados Unidos", nombre: "Hib", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "rutina" },
  { id: "us-pcv1", pais: "Estados Unidos", nombre: "Neumococo (PCV)", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "rutina" },
  { id: "us-rv1", edadMaxMeses: 4, pais: "Estados Unidos", nombre: "Rotavirus", dosis: "1ra dosis", edadMeses: 2, edad: "2 meses", acceso: "pediatra", nota: "Es oral. La primera dosis debe darse antes de las 15 semanas de vida." },
  // ---------- 4 meses ----------
  { id: "us-dtap2", pais: "Estados Unidos", nombre: "DTaP", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "rutina" },
  { id: "us-ipv2", pais: "Estados Unidos", nombre: "IPV", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "rutina" },
  { id: "us-hib2", pais: "Estados Unidos", nombre: "Hib", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "rutina" },
  { id: "us-pcv2", pais: "Estados Unidos", nombre: "Neumococo (PCV)", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "rutina" },
  { id: "us-rv2", edadMaxMeses: 8, pais: "Estados Unidos", nombre: "Rotavirus", dosis: "2da dosis", edadMeses: 4, edad: "4 meses", acceso: "pediatra" },
  // ---------- 6 meses ----------
  { id: "us-dtap3", pais: "Estados Unidos", nombre: "DTaP", dosis: "3ra dosis", edadMeses: 6, edad: "6 meses", acceso: "rutina" },
  { id: "us-pcv3", pais: "Estados Unidos", nombre: "Neumococo (PCV)", dosis: "3ra dosis", edadMeses: 6, edad: "6 meses", acceso: "rutina" },
  { id: "us-hib3", pais: "Estados Unidos", nombre: "Hib", dosis: "3ra dosis", edadMeses: 6, edad: "6 meses", acceso: "rutina", nota: "Depende de la marca; con algunas no hace falta esta dosis." },
  { id: "us-rv3", edadMaxMeses: 8, pais: "Estados Unidos", nombre: "Rotavirus", dosis: "3ra dosis", edadMeses: 6, edad: "6 meses", acceso: "pediatra", nota: "Solo si se usó la marca de 3 dosis." },
  { id: "us-ipv3", pais: "Estados Unidos", nombre: "IPV", dosis: "3ra dosis", edadMeses: 6, edad: "6 a 18 meses", acceso: "rutina" },
  { id: "us-hb3", pais: "Estados Unidos", nombre: "Hepatitis B", dosis: "3ra dosis", edadMeses: 6, edad: "6 a 18 meses", acceso: "pediatra" },
  {
    id: "us-flu1", pais: "Estados Unidos", nombre: "Influenza", dosis: "1ra dosis", edadMeses: 6, edad: "6 meses", acceso: "pediatra",
    nota: "Cada otoño. La primera vez son 2 dosis con 4 semanas de diferencia.",
  },
  { id: "us-covid", pais: "Estados Unidos", nombre: "COVID-19", dosis: "Según temporada", edadMeses: 6, edad: "6 meses", acceso: "pediatra" },
  // ---------- 7 meses ----------
  { id: "us-flu2", pais: "Estados Unidos", nombre: "Influenza", dosis: "2da dosis", edadMeses: 7, edad: "7 meses", acceso: "pediatra" },
  // ---------- 12 meses ----------
  { id: "us-mmr1", pais: "Estados Unidos", nombre: "Triple viral (MMR)", dosis: "1ra dosis", edadMeses: 12, edad: "12 a 15 meses", acceso: "rutina" },
  { id: "us-vari1", pais: "Estados Unidos", nombre: "Varicela", dosis: "1ra dosis", edadMeses: 12, edad: "12 a 15 meses", acceso: "rutina" },
  { id: "us-pcv4", pais: "Estados Unidos", nombre: "Neumococo (PCV)", dosis: "Refuerzo", edadMeses: 12, edad: "12 a 15 meses", acceso: "rutina" },
  { id: "us-hib4", pais: "Estados Unidos", nombre: "Hib", dosis: "Refuerzo", edadMeses: 12, edad: "12 a 15 meses", acceso: "rutina" },
  { id: "us-hepa1", pais: "Estados Unidos", nombre: "Hepatitis A", dosis: "1ra dosis", edadMeses: 12, edad: "12 meses", acceso: "pediatra" },
  {
    id: "us-fluanual", pais: "Estados Unidos", nombre: "Influenza", dosis: "Refuerzo anual", edadMeses: 12, edad: "12 meses", acceso: "pediatra",
    nota: "Una dosis cada otoño.",
  },
  // ---------- 15 meses ----------
  { id: "us-dtap4", pais: "Estados Unidos", nombre: "DTaP", dosis: "4ta dosis", edadMeses: 15, edad: "15 a 18 meses", acceso: "rutina" },
  // ---------- 18 meses ----------
  { id: "us-hepa2", pais: "Estados Unidos", nombre: "Hepatitis A", dosis: "2da dosis", edadMeses: 18, edad: "18 meses", acceso: "pediatra", nota: "De 6 a 18 meses después de la primera." },
  // ---------- 4 años ----------
  { id: "us-dtap5", pais: "Estados Unidos", nombre: "DTaP", dosis: "5ta dosis", edadMeses: 48, edad: "4 a 6 años", acceso: "rutina" },
  { id: "us-ipv4", pais: "Estados Unidos", nombre: "IPV", dosis: "4ta dosis", edadMeses: 48, edad: "4 a 6 años", acceso: "rutina" },
  { id: "us-mmr2", pais: "Estados Unidos", nombre: "Triple viral (MMR)", dosis: "2da dosis", edadMeses: 48, edad: "4 a 6 años", acceso: "rutina" },
  { id: "us-vari2", pais: "Estados Unidos", nombre: "Varicela", dosis: "2da dosis", edadMeses: 48, edad: "4 a 6 años", acceso: "rutina" },
];

export function esquemaDe(pais: Pais) {
  return pais === "México" ? ESQUEMA_MEXICO : ESQUEMA_USA;
}

// el título de cada etapa de la línea de tiempo
export function nombreEtapa(edadMeses: number) {
  if (edadMeses === 0) return "Al nacer";
  if (edadMeses < 24) return `${edadMeses} ${edadMeses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(edadMeses / 12);
  return `${anios} años`;
}

// textos de las insignias de cada tipo de acceso
export const TEXTO_ACCESO: Record<Acceso, string> = {
  publica: "🏥 Pública · gratis",
  privada: "💳 Privada · con costo",
  parcial: "🏥 Pública en algunos estados",
  rutina: "✅ Para todos (CDC)",
  pediatra: "🩺 Con tu pediatra",
};

export const FUENTE_ESQUEMA: Record<Pais, string> = {
  México:
    "Fuente: Programa de Vacunación Universal, Secretaría de Salud (PRONAM 2026). Las privadas son recomendaciones de pediatras que no vienen en la cartilla pública.",
  "Estados Unidos":
    "Fuente: calendario de la AAP 2026. En EE. UU. no hay vacunas públicas y privadas como en México: se cubren con seguro médico o el programa VFC. Desde enero de 2026 los CDC recomiendan para todos solo las marcadas \"Para todos\"; las demás quedaron a decisión con el pediatra.",
};
