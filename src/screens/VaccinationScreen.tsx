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
import { globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";
import { textoEstado } from "../utils/estados";

type Props = {
  onGo: (screen: string) => void;
};

type Pais = "México" | "Estados Unidos";

type Vacuna = {
  id: number;
  nombre: string;
  dosis: string;
  edad: string;
  pais: Pais;
  descripcion: string;
  efectos: string;
};

type Modulo = {
  id: number;
  icono: string;
  titulo: string;
  descripcion: string;
  ruta: string;
};

type EstadoVacuna = "Aplicada" | "Próxima" | "Pendiente";

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
  return `${meses} meses`;
}

function parsearEdadRequeridaAMeses(edad: string): number {
  const texto = edad.toLowerCase();

  if (
    texto.includes("recién nacido") ||
    texto.includes("recien nacido") ||
    texto.includes("birth") ||
    texto.includes("newborn")
  ) {
    return 0;
  }

  const coincidencia = edad.match(/\d+/);
  return coincidencia ? parseInt(coincidencia[0], 10) : 0;
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

  const vacunasMexico: Vacuna[] = [
    {
      id: 1,
      nombre: "BCG",
      dosis: "Única",
      edad: "Recién nacido",
      pais: "México",
      descripcion: "Protege contra formas graves de tuberculosis.",
      efectos: "Dolor local, enrojecimiento o pequeña marca en el brazo.",
    },
    {
      id: 2,
      nombre: "Hepatitis B",
      dosis: "1ra dosis",
      edad: "Recién nacido",
      pais: "México",
      descripcion: "Ayuda a prevenir infección por hepatitis B.",
      efectos: "Dolor en la zona de aplicación o fiebre leve.",
    },
    {
      id: 3,
      nombre: "Hexavalente",
      dosis: "1ra dosis",
      edad: "2 meses",
      pais: "México",
      descripcion:
        "Protege contra difteria, tos ferina, tétanos, hepatitis B, poliomielitis e influenza tipo B.",
      efectos: "Fiebre leve, irritabilidad, dolor o inflamación local.",
    },
    {
      id: 4,
      nombre: "Rotavirus",
      dosis: "1ra dosis",
      edad: "2 meses",
      pais: "México",
      descripcion: "Previene diarrea grave causada por rotavirus.",
      efectos: "Irritabilidad, diarrea leve o vómito ocasional.",
    },
    {
      id: 5,
      nombre: "Neumococo",
      dosis: "1ra dosis",
      edad: "2 meses",
      pais: "México",
      descripcion:
        "Ayuda a prevenir neumonía, meningitis y otras infecciones por neumococo.",
      efectos: "Dolor local, fiebre leve o cansancio.",
    },
    {
      id: 6,
      nombre: "Influenza",
      dosis: "Anual",
      edad: "6 meses en adelante",
      pais: "México",
      descripcion: "Protege contra influenza estacional.",
      efectos: "Dolor local, fiebre leve o malestar temporal.",
    },
  ];

  const vacunasUSA: Vacuna[] = [
    {
      id: 1,
      nombre: "Hepatitis B",
      dosis: "1ra dosis",
      edad: "Recién nacido",
      pais: "Estados Unidos",
      descripcion: "Protege contra la infección por hepatitis B.",
      efectos: "Fiebre leve o dolor en la zona de aplicación.",
    },
    {
      id: 2,
      nombre: "DTaP",
      dosis: "1ra dosis",
      edad: "2 meses",
      pais: "Estados Unidos",
      descripcion: "Protege contra difteria, tétanos y tos ferina.",
      efectos: "Fiebre, irritabilidad, inflamación o dolor local.",
    },
    {
      id: 3,
      nombre: "IPV",
      dosis: "1ra dosis",
      edad: "2 meses",
      pais: "Estados Unidos",
      descripcion: "Protege contra el poliovirus.",
      efectos: "Dolor o enrojecimiento en la zona de aplicación.",
    },
    {
      id: 4,
      nombre: "Hib",
      dosis: "1ra dosis",
      edad: "2 meses",
      pais: "Estados Unidos",
      descripcion:
        "Protege contra la enfermedad por Haemophilus influenzae tipo B.",
      efectos: "Fiebre, enrojecimiento o inflamación.",
    },
    {
      id: 5,
      nombre: "Neumococo (PCV)",
      dosis: "1ra dosis",
      edad: "2 meses",
      pais: "Estados Unidos",
      descripcion: "Protege contra enfermedades neumocócicas.",
      efectos: "Somnolencia, fiebre, pérdida de apetito o dolor local.",
    },
    {
      id: 6,
      nombre: "Rotavirus",
      dosis: "1ra dosis",
      edad: "2 meses",
      pais: "Estados Unidos",
      descripcion: "Protege contra diarrea grave por rotavirus.",
      efectos: "Diarrea leve o vómito ocasional.",
    },
  ];

  const vacunas = paisSeleccionado === "México" ? vacunasMexico : vacunasUSA;

  const aplicadasClaves = useMemo(() => {
    return new Set(
      vacunasAplicadas
        .filter((registro) => registro.pais === paisSeleccionado)
        .map(claveVacuna)
    );
  }, [vacunasAplicadas, paisSeleccionado]);

  const totalVacunas = vacunas.length;

  const aplicadas = vacunas.filter((vacuna) =>
    aplicadasClaves.has(claveVacuna(vacuna))
  ).length;

  const pendientes = totalVacunas - aplicadas;

  const porcentajeCompletado =
    totalVacunas > 0 ? Math.round((aplicadas / totalVacunas) * 100) : 0;

  const proximaVacuna =
    vacunas.find((vacuna) => !aplicadasClaves.has(claveVacuna(vacuna))) ||
    null;

  const obtenerEstadoVisual = (vacuna: Vacuna): EstadoVacuna => {
    if (aplicadasClaves.has(claveVacuna(vacuna))) return "Aplicada";
    if (proximaVacuna && proximaVacuna.id === vacuna.id) return "Próxima";
    return "Pendiente";
  };

  const proximaAtrasada =
    proximaVacuna !== null &&
    edadBebeMeses !== null &&
    edadBebeMeses > parsearEdadRequeridaAMeses(proximaVacuna.edad);

  const obtenerRegistroAplicado = (vacuna: Vacuna) => {
    return vacunasAplicadas.find(
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

  const historialAplicadas = useMemo(() => {
    return vacunasAplicadas.filter(
      (registro) => registro.pais === paisSeleccionado
    );
  }, [vacunasAplicadas, paisSeleccionado]);

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

  const getStatusStyle = (estado: EstadoVacuna) => {
    if (estado === "Aplicada") return globalStyles.statusApplied;
    if (estado === "Próxima") return globalStyles.statusNext;
    return globalStyles.statusPending;
  };

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
            Seguimiento pediátrico del esquema de vacunación de México o
            Estados Unidos, organizado por edad, meses y dosis recomendadas.
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
            onPress={() => setPaisSeleccionado("México")}
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
            onPress={() => setPaisSeleccionado("Estados Unidos")}
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
            <Text style={globalStyles.summaryNumber}>{totalVacunas}</Text>
            <Text style={globalStyles.summaryText}>Vacunas</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{aplicadas}</Text>
            <Text style={globalStyles.summaryText}>Aplicadas</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{pendientes}</Text>
            <Text style={globalStyles.summaryText}>Pendientes</Text>
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
                {proximaAtrasada ? " • Atrasada" : ""}
              </Text>

              <Text style={globalStyles.nextDate}>
                {proximaVacuna.descripcion}
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
                {porcentajeCompletado}% del esquema completado
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

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">Esquema de vacunación</Text>

        <View style={globalStyles.tableCard}>
          <View style={globalStyles.tableHeader}>
            <Text
              style={[globalStyles.tableHeaderText, globalStyles.colLarge]}
            >
              Vacuna
            </Text>

            <Text
              style={[globalStyles.tableHeaderText, globalStyles.colMedium]}
            >
              Edad
            </Text>

            <Text
              style={[globalStyles.tableHeaderText, globalStyles.colSmall]}
            >
              Estado
            </Text>
          </View>

          {vacunas.map((vacuna) => (
            <View key={vacuna.id} style={globalStyles.tableRow}>
              <View style={globalStyles.colLarge}>
                <Text style={globalStyles.vaccineName}>{vacuna.nombre}</Text>

                <Text style={globalStyles.vaccineDose}>{vacuna.dosis}</Text>
              </View>

              <Text
                style={[globalStyles.vaccineStage, globalStyles.colMedium]}
              >
                {vacuna.edad}
              </Text>

              <View style={globalStyles.colSmall}>
                <View
                  style={[
                    globalStyles.statusBadge,
                    getStatusStyle(obtenerEstadoVisual(vacuna)),
                  ]}
                  accessible
                  accessibilityLabel={`Estado: ${obtenerEstadoVisual(vacuna)}`}
                >
                  <Text style={globalStyles.statusText}>
                    {textoEstado(obtenerEstadoVisual(vacuna))}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">Detalle de vacunas</Text>

        {vacunas.map((vacuna) => {
          const estadoVisual = obtenerEstadoVisual(vacuna);
          const registro = obtenerRegistroAplicado(vacuna);
          const clave = claveVacuna(vacuna);
          const enProceso = procesando === clave;

          return (
            <View key={`detalle-${vacuna.id}`} style={globalStyles.moduleCard}>
              <View style={globalStyles.moduleIconBox}>
                <Text style={globalStyles.moduleIcon}>💉</Text>
              </View>

              <View style={globalStyles.moduleInfo}>
                <Text style={globalStyles.moduleTitle}>
                  {vacuna.nombre} • {vacuna.edad}
                </Text>

                <Text style={globalStyles.moduleDescription}>
                  {vacuna.descripcion}
                </Text>

                <Text style={globalStyles.moduleDescription}>
                  Posibles efectos: {vacuna.efectos}
                </Text>

                {estadoVisual === "Aplicada" && registro ? (
                  <>
                    <Text style={globalStyles.moduleDescription}>
                      Aplicada el {registro.fechaAplicacion}
                    </Text>

                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Desmarcar ${vacuna.nombre}, ${vacuna.dosis}`}
                      style={globalStyles.unmarkButton}
                      disabled={enProceso}
                      onPress={() => desmarcarAplicada(vacuna)}
                    >
                      <Text style={globalStyles.unmarkButtonText}>
                        {enProceso ? "Actualizando..." : "Desmarcar"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Marcar ${vacuna.nombre}, ${vacuna.dosis}, como aplicada`}
                    style={globalStyles.applyButton}
                    disabled={enProceso}
                    onPress={() => marcarComoAplicada(vacuna)}
                  >
                    <Text style={globalStyles.applyButtonText}>
                      {enProceso ? "Guardando..." : "Marcar como aplicada"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
