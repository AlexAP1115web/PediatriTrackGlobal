import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AyudaModulo from "../components/AyudaModulo";
import BottomNav from "../components/BottomNav";
import { auth } from "../firebase/firebaseConfig";
import {
  BebeFirebase,
  cerrarSesionFirebase,
  eliminarVacunaAplicadaFirebase,
  establecerBebeActivoFirebase,
  guardarVacunaAplicadaFirebase,
  obtenerAlimentosFirebase,
  obtenerBebesFirebase,
  obtenerDocumentosFirebase,
  obtenerUltimoBebeFirebase,
  obtenerVacunasAplicadasFirebase,
  obtenerVitaminasFirebase,
  VacunaAplicadaFirebase,
} from "../firebase/firebaseService";
import {
  esquemaDe,
  FUENTE_ESQUEMA,
  INFO_VACUNAS,
  nombreEtapa,
  Pais,
  TEXTO_ACCESO,
  VacunaEsquema,
} from "../data/esquemasVacunacion";
import { globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";

type Props = {
  onGo: (screen: string) => void;
};

type Vacuna = VacunaEsquema;

type Modulo = {
  id: number;
  icono: string;
  titulo: string;
  descripcion: string;
  ruta: string;
};

// estado de cada vacuna según lo registrado y la edad del bebé
type EstadoVacuna =
  | "Aplicada"
  | "Atrasada"
  | "Le toca"
  | "Más adelante"
  | "Ya no aplica"
  | "Pendiente";

// filtro de la línea de tiempo: todas, solo las del esquema oficial o solo
// las privadas / con el pediatra
type FiltroVacunas = "todas" | "oficiales" | "extra";

const ICONO_ESTADO: Record<EstadoVacuna, string> = {
  Aplicada: "✓",
  Atrasada: "⚠",
  "Le toca": "⏳",
  "Más adelante": "○",
  "Ya no aplica": "–",
  Pendiente: "○",
};

// ==========================
// funciones de apoyo para fechas y edad del bebé
// ==========================

function calcularEdadBebeEnMeses(fechaTexto: string): number | null {
  const coincidencia = fechaTexto.match(
    /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/
  );

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

  if (hoy.getDate() < nacimiento.getDate()) {
    meses -= 1;
  }

  return meses < 0 ? 0 : meses;
}

function formatearEdadBebe(meses: number | null): string {
  if (meses === null) return "Edad no disponible";
  if (meses < 1) return "Recién nacido";
  if (meses === 1) return "1 mes";
  if (meses < 24) return `${meses} meses`;
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  return resto > 0 ? `${anios} años y ${resto} ${resto === 1 ? "mes" : "meses"}` : `${anios} años`;
}

// cuánto tiempo de margen doy antes de marcar una vacuna como atrasada
function margenDeAtraso(edadMeses: number) {
  if (edadMeses < 12) return 1;
  if (edadMeses < 24) return 3;
  return 6;
}

function formatearFechaHoy(): string {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, "0");
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const anio = hoy.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function claveVacuna(v: { pais: string; nombre: string; dosis: string }) {
  return `${v.pais}__${v.nombre}__${v.dosis}`;
}

// esto es para el saludo personalizado, cambia según la hora del día
function obtenerSaludoPorHora(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

// el nombre que muestro en el saludo: uso el del tutor si lo registró,
// si no, agarro lo que viene antes del "@" de su correo como respaldo
function obtenerNombreParaSaludo(
  nombreTutor: string | undefined,
  correo: string | null | undefined
): string {
  if (nombreTutor && nombreTutor.trim() !== "") return nombreTutor.trim();
  if (correo) return correo.split("@")[0];
  return "";
}

export default function VaccinationScreen({ onGo }: Props) {
  const [bebe, setBebe] = useState<BebeFirebase | null>(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais>("México");
  const [vacunasAplicadas, setVacunasAplicadas] = useState<
    VacunaAplicadaFirebase[]
  >([]);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroVacunas>("todas");
  // vacuna con el detalle abierto en la línea de tiempo
  const [abierta, setAbierta] = useState<string | null>(null);

  const [vitaminasActivas, setVitaminasActivas] = useState(0);
  const [totalDocumentos, setTotalDocumentos] = useState(0);
  const [totalAlimentos, setTotalAlimentos] = useState(0);

  const [bebes, setBebes] = useState<BebeFirebase[]>([]);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [cambiandoBebeId, setCambiandoBebeId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const bebeGuardado = await obtenerUltimoBebeFirebase();

      if (bebeGuardado) {
        setBebe(bebeGuardado);

        if (
          bebeGuardado.pais === "México" ||
          bebeGuardado.pais === "Estados Unidos"
        ) {
          setPaisSeleccionado(bebeGuardado.pais);
        }
      }
    } catch (error) {
      console.log("Error al obtener bebé desde Firebase:", error);
    }

    await cargarVacunasAplicadas();
    await cargarResumenGeneral();
  };

  const cargarResumenGeneral = async () => {
    try {
      const [vitaminas, documentos, alimentos] = await Promise.all([
        obtenerVitaminasFirebase(),
        obtenerDocumentosFirebase(),
        obtenerAlimentosFirebase(),
      ]);

      setVitaminasActivas(
        vitaminas.filter((v) => (v.estado || "Activa") === "Activa").length
      );
      setTotalDocumentos(documentos.length);
      setTotalAlimentos(alimentos.length);
    } catch (error) {
      console.log("Error al cargar resumen general:", error);
    }
  };

  const cargarVacunasAplicadas = async () => {
    try {
      const datos = await obtenerVacunasAplicadasFirebase();
      setVacunasAplicadas(datos);
    } catch (error) {
      console.log("Error al obtener vacunas aplicadas:", error);
    }
  };

  const abrirSelectorBebes = async () => {
    // quiero que el menú de cuenta (con el botón de cerrar sesión) se
    // pueda abrir siempre, aunque falle la carga de bebés (por conexión
    // o porque le falta un índice a Firestore, por ejemplo)
    setSelectorVisible(true);

    try {
      const datos = await obtenerBebesFirebase();
      setBebes(datos.length > 0 ? datos : bebe ? [bebe] : []);
    } catch (error) {
      console.log("Error al obtener bebés registrados:", error);
      // esto no bloquea el menú: si ya tenía un bebé cargado, muestro
      // ese al menos, y las opciones de cuenta siguen disponibles
      setBebes(bebe ? [bebe] : []);
    }
  };

  const cambiarBebeActivo = async (idBebe: string) => {
    if (!idBebe || idBebe === bebe?.id) {
      setSelectorVisible(false);
      return;
    }

    setCambiandoBebeId(idBebe);

    try {
      await establecerBebeActivoFirebase(idBebe);
      setSelectorVisible(false);
      await cargarDatos();
    } catch (error) {
      console.log("Error al cambiar de bebé:", error);
      Alert.alert("Error", "No se pudo cambiar de bebé.");
    } finally {
      setCambiandoBebeId(null);
    }
  };

  const irARegistrarBebe = () => {
    setSelectorVisible(false);
    onGo("registro");
  };

  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          setSelectorVisible(false);
          try {
            await cerrarSesionFirebase();
          } catch (error) {
            console.log("Error al cerrar sesión:", error);
            Alert.alert(
              "No se pudo cerrar sesión",
              "Revisa tu conexión a internet e intenta de nuevo."
            );
          }
        },
      },
    ]);
  };

  const nombreBebe = bebe?.nombre || "Bebé sin registrar";
  const fechaNacimiento = bebe?.fechaNacimiento || "Sin fecha registrada";
  const sexoBebe = bebe?.sexo || "Sin sexo registrado";
  const alergiasBebe = bebe?.alergias || "Ninguna";
  const alergiasAlimentarias = bebe?.alergiasAlimentarias || "Ninguna";
  const condicionesBebe = bebe?.condiciones || "Ninguna";

  const edadBebeMeses = useMemo(
    () => calcularEdadBebeEnMeses(fechaNacimiento),
    [fechaNacimiento]
  );

  const nombreParaSaludo = obtenerNombreParaSaludo(
    bebe?.nombreTutor,
    auth.currentUser?.email
  );
  const saludoPorHora = obtenerSaludoPorHora();
  const parentescoBebe = bebe?.parentesco || "";

  // el esquema completo de 0 a 6 años del país elegido (ver
  // src/data/esquemasVacunacion.ts)
  const vacunas = esquemaDe(paisSeleccionado);
  const esMexico = paisSeleccionado === "México";

  // en México las "oficiales" son las públicas; en EE. UU. todas las que
  // recomienda la AAP cuentan para el avance
  const esOficial = (vacuna: Vacuna) => vacuna.acceso !== "privada";

  // solo los registros de este bebé y este país (los registros viejos que
  // no tienen bebeId se toman como del bebé activo)
  const registrosDelBebe = useMemo(() => {
    return vacunasAplicadas.filter(
      (registro) =>
        registro.pais === paisSeleccionado &&
        (!registro.bebeId || registro.bebeId === bebe?.id)
    );
  }, [vacunasAplicadas, paisSeleccionado, bebe?.id]);

  const aplicadasClaves = useMemo(
    () => new Set(registrosDelBebe.map(claveVacuna)),
    [registrosDelBebe]
  );

  const obtenerEstadoVisual = (vacuna: Vacuna): EstadoVacuna => {
    if (aplicadasClaves.has(claveVacuna(vacuna))) return "Aplicada";
    if (edadBebeMeses === null) return "Pendiente";
    if (edadBebeMeses < vacuna.edadMeses) return "Más adelante";
    if (vacuna.edadMaxMeses !== undefined && edadBebeMeses > vacuna.edadMaxMeses) {
      return "Ya no aplica";
    }
    // las privadas son opcionales: nunca las marco como atrasadas
    if (esOficial(vacuna) && edadBebeMeses > vacuna.edadMeses + margenDeAtraso(vacuna.edadMeses)) {
      return "Atrasada";
    }
    return "Le toca";
  };

  // para el avance cuento las oficiales que todavía aplican a su edad
  const oficiales = vacunas.filter(
    (vacuna) => esOficial(vacuna) && obtenerEstadoVisual(vacuna) !== "Ya no aplica"
  );
  const totalVacunas = oficiales.length;
  const aplicadas = oficiales.filter((vacuna) =>
    aplicadasClaves.has(claveVacuna(vacuna))
  ).length;
  const leTocanYa = oficiales.filter((vacuna) => {
    const estado = obtenerEstadoVisual(vacuna);
    return estado === "Le toca" || estado === "Atrasada";
  }).length;
  const atrasadas = oficiales.filter(
    (vacuna) => obtenerEstadoVisual(vacuna) === "Atrasada"
  ).length;
  const porcentajeCompletado =
    totalVacunas > 0 ? Math.round((aplicadas / totalVacunas) * 100) : 0;

  // la próxima es la primera del esquema oficial que falta, en orden de edad
  const proximaVacuna =
    oficiales.find((vacuna) => !aplicadasClaves.has(claveVacuna(vacuna))) ||
    null;
  const proximaAtrasada =
    proximaVacuna !== null && obtenerEstadoVisual(proximaVacuna) === "Atrasada";

  // la línea de tiempo: agrupo por edad lo que deja ver el filtro
  const vacunasFiltradas = vacunas.filter((vacuna) => {
    if (filtro === "oficiales") return esMexico ? vacuna.acceso !== "privada" : vacuna.acceso === "rutina";
    if (filtro === "extra") return esMexico ? vacuna.acceso === "privada" || vacuna.acceso === "parcial" : vacuna.acceso === "pediatra";
    return true;
  });
  const etapas = useMemo(() => {
    const grupos: { edadMeses: number; vacunas: Vacuna[] }[] = [];
    for (const vacuna of vacunasFiltradas) {
      let grupo = grupos.find((g) => g.edadMeses === vacuna.edadMeses);
      if (!grupo) {
        grupo = { edadMeses: vacuna.edadMeses, vacunas: [] };
        grupos.push(grupo);
      }
      grupo.vacunas.push(vacuna);
    }
    return grupos.sort((a, b) => a.edadMeses - b.edadMeses);
  }, [vacunasFiltradas]);

  // la etapa en la que va el bebé: la última cuya edad ya cumplió
  const etapaActual =
    edadBebeMeses === null
      ? null
      : etapas.reduce<number | null>(
          (actual, etapa) => (etapa.edadMeses <= edadBebeMeses ? etapa.edadMeses : actual),
          null
        );

  const obtenerRegistroAplicado = (vacuna: Vacuna) => {
    return registrosDelBebe.find(
      (registro) => claveVacuna(registro) === claveVacuna(vacuna)
    );
  };

  const marcarComoAplicada = async (vacuna: Vacuna) => {
    const clave = claveVacuna(vacuna);
    setProcesando(clave);

    try {
      await guardarVacunaAplicadaFirebase({
        pais: paisSeleccionado,
        nombre: vacuna.nombre,
        dosis: vacuna.dosis,
        edad: vacuna.edad,
        fechaAplicacion: formatearFechaHoy(),
        bebeId: bebe?.id,
      });

      await cargarVacunasAplicadas();

      Alert.alert(
        "Vacuna registrada",
        `${vacuna.nombre} (${vacuna.dosis}) fue marcada como aplicada.`
      );
    } catch (error) {
      console.log("Error al marcar vacuna aplicada:", error);
      Alert.alert("Error", "No se pudo registrar la vacuna en Firebase.");
    } finally {
      setProcesando(null);
    }
  };

  const desmarcarAplicada = async (vacuna: Vacuna) => {
    const registro = obtenerRegistroAplicado(vacuna);
    if (!registro?.id) return;

    const clave = claveVacuna(vacuna);
    setProcesando(clave);

    try {
      await eliminarVacunaAplicadaFirebase(registro.id);
      await cargarVacunasAplicadas();
    } catch (error) {
      console.log("Error al desmarcar vacuna:", error);
      Alert.alert("Error", "No se pudo actualizar el registro en Firebase.");
    } finally {
      setProcesando(null);
    }
  };

  const historialAplicadas = registrosDelBebe;

  const modulos: Modulo[] = [
    {
      id: 1,
      icono: "💊",
      titulo: "Vitaminación",
      descripcion: "Control de vitaminas, dosis, frecuencia y duración.",
      ruta: "vitaminas",
    },
    {
      id: 2,
      icono: "📄",
      titulo: "Documentos",
      descripcion:
        "Acta de nacimiento, cartilla, estudios, consultas y archivos médicos.",
      ruta: "documentos",
    },
    {
      id: 3,
      icono: "🍎",
      titulo: "Alimentación complementaria",
      descripcion:
        "Alimentos por mes, alergias y recomendaciones de textura.",
      ruta: "alimentacion",
    },
    {
      id: 4,
      icono: "ℹ️",
      titulo: "Información adicional",
      descripcion:
        "Primeros auxilios, efectos de vacunas y cuidados preventivos.",
      ruta: "info",
    },
    {
      id: 5,
      icono: "🔒",
      titulo: "Política de privacidad",
      descripcion: "Cómo protegemos los datos de tu bebé y tu cuenta.",
      ruta: "privacidad",
    },
    {
      id: 6,
      icono: "🤖",
      titulo: "Asistente Virtual",
      descripcion:
        "Chatea con nuestro asistente pediátrico sobre dudas generales.",
      ruta: "chatbot",
    },
    {
      id: 7,
      icono: "♿",
      titulo: "Accesibilidad",
      descripcion: "Colores para daltonismo, letra grande, voz y más.",
      ruta: "accesibilidad",
    },
  ];

  const obtenerEstiloIconoModulo = (ruta: string) => {
    if (ruta === "vitaminas") return globalStyles.moduleIconBoxWarning;
    if (ruta === "alimentacion") return globalStyles.moduleIconBoxGreen;
    if (ruta === "chatbot") return globalStyles.moduleIconBoxGreen;
    if (ruta === "info" || ruta === "privacidad" || ruta === "accesibilidad")
      return globalStyles.moduleIconBoxMuted;
    return globalStyles.moduleIconBox;
  };

  const estiloEstado = (estado: EstadoVacuna) => {
    if (estado === "Aplicada") return globalStyles.vacEstadoAplicada;
    if (estado === "Atrasada") return globalStyles.vacEstadoAtrasada;
    if (estado === "Le toca") return globalStyles.vacEstadoLeToca;
    return globalStyles.vacEstadoDespues;
  };

  const estiloAcceso = (acceso: Vacuna["acceso"]) => {
    if (acceso === "publica") return globalStyles.vacAccesoPublica;
    if (acceso === "privada") return globalStyles.vacAccesoPrivada;
    if (acceso === "parcial") return globalStyles.vacAccesoParcial;
    if (acceso === "rutina") return globalStyles.vacAccesoRutina;
    return globalStyles.vacAccesoPediatra;
  };

  const filtrosDisponibles: { valor: FiltroVacunas; texto: string }[] = esMexico
    ? [
        { valor: "todas", texto: "Todas" },
        { valor: "oficiales", texto: "🏥 Públicas" },
        { valor: "extra", texto: "💳 Privadas" },
      ]
    : [
        { valor: "todas", texto: "Todas" },
        { valor: "oficiales", texto: "✅ Para todos" },
        { valor: "extra", texto: "🩺 Con tu pediatra" },
      ];

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        {nombreParaSaludo !== "" && (
          <View style={globalStyles.greetingBanner}>
            <Text style={globalStyles.greetingTitle}>
              {saludoPorHora}, {nombreParaSaludo} 👋
            </Text>
            <Text style={globalStyles.greetingSubtitle}>
              Este es el resumen de {nombreBebe} el día de hoy
            </Text>
          </View>
        )}

        <View style={globalStyles.profileCard}>
          <View style={globalStyles.avatar}>
            <Text style={globalStyles.avatarText}>👶</Text>
          </View>

          <View style={globalStyles.profileInfo}>
            <Text style={globalStyles.babyName}>{nombreBebe}</Text>

            <Text style={globalStyles.babyAge}>
              Edad actual: {formatearEdadBebe(edadBebeMeses)}
            </Text>

            <Text style={globalStyles.babyAge}>
              Fecha de nacimiento: {fechaNacimiento}
            </Text>

            <Text style={globalStyles.babyAge}>Sexo: {sexoBebe}</Text>

            <View style={globalStyles.countryBadge}>
              <Text style={globalStyles.countryText}>
                {paisSeleccionado === "México"
                  ? "🇲🇽 Esquema de vacunación: México"
                  : "🇺🇸 Esquema de vacunación: Estados Unidos"}
              </Text>
            </View>

            {parentescoBebe !== "" && (
              <View style={globalStyles.relationshipBadge}>
                <Text style={globalStyles.relationshipText}>
                  👤 {parentescoBebe}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={globalStyles.configButton}
            onPress={abrirSelectorBebes}
            accessibilityRole="button"
            accessibilityLabel="Cambiar de bebé o cuenta"
            accessibilityHint="Abre el selector de bebés registrados y la opción de cerrar sesión"
          >
            <Text style={globalStyles.configIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={globalStyles.headerCard}>
          <Text style={globalStyles.title} accessibilityRole="header">💉 Sistema de Vacunación</Text>

          <Text style={globalStyles.subtitle}>
            Todas las vacunas de los 0 a los 6 años del esquema de México o
            Estados Unidos, ordenadas por edad. Toca una vacuna para ver qué
            protege y registrarla.
          </Text>
        </View>

        {/* ayuda con IA: explica cómo funciona este módulo */}
        <AyudaModulo modulo="vacunas" />

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          Seleccionar esquema de vacunación
        </Text>

        <View style={globalStyles.countryContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              globalStyles.countryButton,
              paisSeleccionado === "México" && globalStyles.countryActive,
            ]}
            onPress={() => {
              setPaisSeleccionado("México");
              setFiltro("todas");
              setAbierta(null);
            }}
          >
            <Text style={globalStyles.countryText}>🇲🇽 México</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            style={[
              globalStyles.countryButton,
              paisSeleccionado === "Estados Unidos" &&
                globalStyles.countryActive,
            ]}
            onPress={() => {
              setPaisSeleccionado("Estados Unidos");
              setFiltro("todas");
              setAbierta(null);
            }}
          >
            <Text style={globalStyles.countryText}>🇺🇸 Estados Unidos</Text>
          </TouchableOpacity>
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">Información clínica</Text>

        <View style={globalStyles.moduleCard}>
          <View style={globalStyles.moduleIconBox}>
            <Text style={globalStyles.moduleIcon}>🧬</Text>
          </View>

          <View style={globalStyles.moduleInfo}>
            <Text style={globalStyles.moduleTitle}>Alergias médicas</Text>

            <Text style={globalStyles.moduleDescription}>
              {alergiasBebe}
            </Text>
          </View>
        </View>

        <View style={globalStyles.moduleCard}>
          <View style={globalStyles.moduleIconBox}>
            <Text style={globalStyles.moduleIcon}>🍎</Text>
          </View>

          <View style={globalStyles.moduleInfo}>
            <Text style={globalStyles.moduleTitle}>
              Alergias alimentarias
            </Text>

            <Text style={globalStyles.moduleDescription}>
              {alergiasAlimentarias}
            </Text>
          </View>
        </View>

        <View style={globalStyles.moduleCard}>
          <View style={globalStyles.moduleIconBox}>
            <Text style={globalStyles.moduleIcon}>🏥</Text>
          </View>

          <View style={globalStyles.moduleInfo}>
            <Text style={globalStyles.moduleTitle}>Condiciones médicas</Text>

            <Text style={globalStyles.moduleDescription}>
              {condicionesBebe}
            </Text>
          </View>
        </View>

        <View style={globalStyles.summaryRow}>
          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>
              {aplicadas}/{totalVacunas}
            </Text>
            <Text style={globalStyles.summaryText}>Aplicadas</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{leTocanYa}</Text>
            <Text style={globalStyles.summaryText}>Le tocan ya</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{atrasadas}</Text>
            <Text style={globalStyles.summaryText}>Atrasadas</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>
              {porcentajeCompletado}%
            </Text>
            <Text style={globalStyles.summaryText}>Completado</Text>
          </View>
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">Próxima vacuna</Text>

        <View style={globalStyles.nextVaccineCard}>
          {proximaVacuna ? (
            <>
              <Text style={globalStyles.nextTitle}>
                {proximaVacuna.nombre}
              </Text>

              <Text style={globalStyles.nextSubtitle}>
                {proximaVacuna.dosis} • {proximaVacuna.edad}
                {proximaAtrasada ? " • ⚠ Atrasada" : ""}
              </Text>

              <Text style={globalStyles.nextDate}>
                {INFO_VACUNAS[proximaVacuna.nombre]?.protege}
              </Text>

              <View style={globalStyles.progressBarTrack}>
                <View
                  style={[
                    globalStyles.progressBarFill,
                    { width: `${porcentajeCompletado}%` },
                  ]}
                />
              </View>

              <Text style={globalStyles.progressLabel}>
                {porcentajeCompletado}% del esquema {esMexico ? "público" : "recomendado"} completado
              </Text>

              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  globalStyles.scheduleButton,
                  { marginTop: 14 },
                ]}
                disabled={procesando === claveVacuna(proximaVacuna)}
                onPress={() => marcarComoAplicada(proximaVacuna)}
              >
                <Text style={globalStyles.scheduleButtonText}>
                  {procesando === claveVacuna(proximaVacuna)
                    ? "Guardando..."
                    : "Marcar como aplicada"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={globalStyles.nextTitle}>
                Esquema completo 🎉
              </Text>

              <Text style={globalStyles.nextSubtitle}>
                Todas las vacunas de este esquema fueron registradas.
              </Text>

              <View style={globalStyles.progressBarTrack}>
                <View
                  style={[globalStyles.progressBarFill, { width: "100%" }]}
                />
              </View>

              <Text style={globalStyles.progressLabel}>
                100% del esquema completado
              </Text>
            </>
          )}
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          Esquema completo de 0 a 6 años
        </Text>

        {/* qué significa cada insignia */}
        <View style={globalStyles.vacLeyenda}>
          <View style={globalStyles.vacInsignias}>
            {(esMexico
              ? (["publica", "parcial", "privada"] as const)
              : (["rutina", "pediatra"] as const)
            ).map((acceso) => (
              <View key={acceso} style={[globalStyles.vacInsignia, estiloAcceso(acceso)]}>
                <Text style={globalStyles.vacInsigniaTexto}>{TEXTO_ACCESO[acceso]}</Text>
              </View>
            ))}
          </View>
          <Text style={globalStyles.vacLeyendaTexto}>{FUENTE_ESQUEMA[paisSeleccionado]}</Text>
        </View>

        <View style={globalStyles.vacFiltros} accessibilityRole="tablist">
          {filtrosDisponibles.map((opcion) => {
            const activo = filtro === opcion.valor;
            return (
              <TouchableOpacity
                key={opcion.valor}
                style={[globalStyles.vacFiltro, activo && globalStyles.vacFiltroActivo]}
                onPress={() => setFiltro(opcion.valor)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
              >
                <Text style={[globalStyles.vacFiltroTexto, activo && globalStyles.vacFiltroTextoActivo]}>
                  {opcion.texto}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* línea de tiempo: una tarjeta por edad, con todas sus vacunas */}
        {etapas.map((etapa) => {
          const esActual = etapa.edadMeses === etapaActual;
          const aplicadasEtapa = etapa.vacunas.filter((v) => aplicadasClaves.has(claveVacuna(v))).length;

          return (
            <View
              key={`etapa-${etapa.edadMeses}`}
              style={[globalStyles.vacEtapa, esActual && globalStyles.vacEtapaActual]}
            >
              <View style={globalStyles.vacEtapaEncabezado}>
                <View style={{ flex: 1 }}>
                  <Text style={globalStyles.vacEtapaTitulo} accessibilityRole="header">
                    {nombreEtapa(etapa.edadMeses)}
                  </Text>
                  <Text style={globalStyles.vacEtapaSub}>
                    {aplicadasEtapa} de {etapa.vacunas.length} aplicadas
                  </Text>
                </View>
                {esActual && (
                  <View style={globalStyles.vacEtapaEtiqueta}>
                    <Text style={globalStyles.vacEtapaEtiquetaTexto}>👶 Su edad</Text>
                  </View>
                )}
              </View>

              {etapa.vacunas.map((vacuna) => {
                const estado = obtenerEstadoVisual(vacuna);
                const registro = obtenerRegistroAplicado(vacuna);
                const clave = claveVacuna(vacuna);
                const enProceso = procesando === clave;
                const detalleAbierto = abierta === vacuna.id;
                const info = INFO_VACUNAS[vacuna.nombre];

                return (
                  <View key={vacuna.id}>
                    <TouchableOpacity
                      style={globalStyles.vacFila}
                      onPress={() => setAbierta(detalleAbierto ? null : vacuna.id)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: detalleAbierto }}
                      accessibilityLabel={`${vacuna.nombre}, ${vacuna.dosis}, ${vacuna.edad}. ${TEXTO_ACCESO[vacuna.acceso]}. Estado: ${estado}`}
                      accessibilityHint="Toca para ver qué protege y registrarla"
                    >
                      <View style={[globalStyles.vacPunto, estiloEstado(estado)]}>
                        <Text style={globalStyles.vacPuntoTexto}>{ICONO_ESTADO[estado]}</Text>
                      </View>

                      <View style={globalStyles.vacFilaInfo}>
                        <Text style={globalStyles.vacNombre}>{vacuna.nombre}</Text>
                        <Text style={globalStyles.vacDosis}>
                          {vacuna.dosis}
                          {vacuna.edad !== nombreEtapa(etapa.edadMeses) ? ` • ${vacuna.edad}` : ""}
                          {` • ${estado}`}
                        </Text>
                        <View style={globalStyles.vacInsignias}>
                          <View style={[globalStyles.vacInsignia, estiloAcceso(vacuna.acceso)]}>
                            <Text style={globalStyles.vacInsigniaTexto}>{TEXTO_ACCESO[vacuna.acceso]}</Text>
                          </View>
                        </View>
                      </View>

                      <Text style={globalStyles.vacFlecha}>{detalleAbierto ? "⌃" : "⌄"}</Text>
                    </TouchableOpacity>

                    {detalleAbierto && (
                      <View style={globalStyles.vacDetalle}>
                        {info && (
                          <>
                            <Text style={globalStyles.vacDetalleTexto}>
                              <Text style={globalStyles.vacNegrita}>Protege contra: </Text>
                              {info.protege}
                            </Text>
                            <Text style={globalStyles.vacDetalleTexto}>
                              <Text style={globalStyles.vacNegrita}>Posibles efectos: </Text>
                              {info.efectos}
                            </Text>
                          </>
                        )}
                        {vacuna.nota && (
                          <Text style={globalStyles.vacDetalleTexto}>
                            <Text style={globalStyles.vacNegrita}>Importante: </Text>
                            {vacuna.nota}
                          </Text>
                        )}
                        {registro && (
                          <Text style={globalStyles.vacDetalleTexto}>
                            <Text style={globalStyles.vacNegrita}>Aplicada el: </Text>
                            {registro.fechaAplicacion}
                          </Text>
                        )}

                        <View style={globalStyles.vacBotones}>
                          {estado === "Ya no aplica" ? (
                            <Text style={globalStyles.vacDetalleTexto}>
                              Por su edad ya no se aplica. Si tienes dudas, consúltalo con tu pediatra.
                            </Text>
                          ) : estado === "Aplicada" ? (
                            <TouchableOpacity
                              accessibilityRole="button"
                              accessibilityLabel={`Desmarcar ${vacuna.nombre}, ${vacuna.dosis}`}
                              style={globalStyles.vacBotonSecundario}
                              disabled={enProceso}
                              onPress={() => desmarcarAplicada(vacuna)}
                            >
                              <Text style={globalStyles.vacBotonSecundarioTexto}>
                                {enProceso ? "Actualizando..." : "Desmarcar"}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              accessibilityRole="button"
                              accessibilityLabel={`Marcar ${vacuna.nombre}, ${vacuna.dosis}, como aplicada`}
                              style={globalStyles.vacBoton}
                              disabled={enProceso}
                              onPress={() => marcarComoAplicada(vacuna)}
                            >
                              <Text style={globalStyles.vacBotonTexto}>
                                {enProceso ? "Guardando..." : "✓ Marcar como aplicada"}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          Historial de vacunas aplicadas
        </Text>

        {historialAplicadas.length === 0 && (
          <View style={globalStyles.helpCard}>
            <Text style={globalStyles.helpTitle}>Sin registros todavía</Text>

            <Text style={globalStyles.helpText}>
              Marca una vacuna como aplicada para comenzar el historial de
              este esquema de vacunación.
            </Text>
          </View>
        )}

        {historialAplicadas.map((registro) => (
          <View key={registro.id} style={globalStyles.historyCard}>
            <Text style={globalStyles.historyDate}>
              {registro.fechaAplicacion}
            </Text>

            <Text style={globalStyles.historyText}>
              {registro.nombre} • {registro.dosis}
            </Text>

            <Text style={globalStyles.historyText}>
              Edad correspondiente: {registro.edad}
            </Text>
          </View>
        ))}

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">Resumen general</Text>

        <View style={globalStyles.summaryRow}>
          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{vitaminasActivas}</Text>
            <Text style={globalStyles.summaryText}>Vitaminas activas</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{totalDocumentos}</Text>
            <Text style={globalStyles.summaryText}>Documentos</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{totalAlimentos}</Text>
            <Text style={globalStyles.summaryText}>Alimentos</Text>
          </View>
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">Paneles principales</Text>

        {modulos.map((modulo) => (
          <TouchableOpacity
            key={modulo.id}
            style={globalStyles.moduleCard}
            onPress={() => onGo(modulo.ruta)}
            accessibilityRole="button"
            accessibilityLabel={modulo.titulo}
            accessibilityHint={modulo.descripcion}
          >
            <View
              style={[
                globalStyles.moduleIconBox,
                obtenerEstiloIconoModulo(modulo.ruta),
              ]}
            >
              <Text style={globalStyles.moduleIcon}>{modulo.icono}</Text>
            </View>

            <View style={globalStyles.moduleInfo}>
              <Text style={globalStyles.moduleTitle}>{modulo.titulo}</Text>

              <Text style={globalStyles.moduleDescription}>
                {modulo.descripcion}
              </Text>
            </View>

            <Text style={globalStyles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={globalStyles.alertCard}>
          <Text style={globalStyles.alertTitle}>🔔 Recomendación</Text>

          <Text style={globalStyles.alertText}>
            Esta sección funciona como guía de seguimiento. Ante fiebre alta,
            reacción intensa, dificultad respiratoria o síntomas graves,
            acude a atención médica.
          </Text>
        </View>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="dashboard" />

      {/* uso una View normal en vez de <Modal> de RN (ver nota en
      globalStyles.modalOverlay del porqué) */}
      {selectorVisible && (
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalSheet}>
            <Text style={globalStyles.sectionTitle} accessibilityRole="header">Cuenta y bebés</Text>

            {bebes.map((item) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={item.id}
                style={globalStyles.moduleCard}
                disabled={cambiandoBebeId === item.id}
                onPress={() => item.id && cambiarBebeActivo(item.id)}
              >
                <View style={globalStyles.moduleIconBox}>
                  <Text style={globalStyles.moduleIcon}>
                    {item.id === bebe?.id ? "✅" : "👶"}
                  </Text>
                </View>

                <View style={globalStyles.moduleInfo}>
                  <Text style={globalStyles.moduleTitle}>{item.nombre}</Text>

                  <Text style={globalStyles.moduleDescription}>
                    {item.id === bebe?.id
                      ? "Bebé activo actualmente"
                      : cambiandoBebeId === item.id
                      ? "Cambiando..."
                      : "Toca para mostrar este perfil"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              accessibilityRole="button"
              style={globalStyles.buttonPrimary}
              onPress={irARegistrarBebe}
            >
              <Text style={globalStyles.buttonText}>
                ➕ Registrar otro bebé
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={[globalStyles.unmarkButton, { marginTop: 10 }]}
              onPress={cerrarSesion}
            >
              <Text style={globalStyles.unmarkButtonText}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setSelectorVisible(false);
                onGo("privacidad");
              }}
            >
              <Text style={globalStyles.modalCancelText}>
                🔒 Política de privacidad
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setSelectorVisible(false);
                onGo("accesibilidad");
              }}
            >
              <Text style={globalStyles.modalCancelText}>♿ Accesibilidad</Text>
            </TouchableOpacity>

            <TouchableOpacity accessibilityRole="button" onPress={() => setSelectorVisible(false)}>
              <Text style={globalStyles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
