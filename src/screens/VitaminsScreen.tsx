import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AyudaModulo from "../components/AyudaModulo";
import BottomNav from "../components/BottomNav";
import {
  actualizarVitaminaFirebase,
  eliminarVitaminaFirebase,
  guardarVitaminaFirebase,
  obtenerVitaminasFirebase,
  registrarTomaVitaminaFirebase,
  VitaminaFirebase,
} from "../firebase/firebaseService";
import {
  buscarInfoMedicamentoOpenFDA,
  buscarInfoMedicamentoRxNorm,
} from "../services/apisExternas";
import { globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";
import { textoEstado } from "../utils/estados";

type Props = {
  onGo: (screen: string) => void;
};

type EstadoRecordatorio =
  | "Pendiente hoy"
  | "Atrasada"
  | "Al día"
  | "Según indicación médica";

// ==========================
// funciones de apoyo para fechas y recordatorios
// ==========================

function formatearFechaHoy(): string {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, "0");
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const anio = hoy.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function parsearFecha(fechaTexto: string): Date | null {
  const coincidencia = fechaTexto.match(
    /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/
  );

  if (!coincidencia) return null;

  const dia = parseInt(coincidencia[1], 10);
  const mes = parseInt(coincidencia[2], 10);
  let anio = parseInt(coincidencia[3], 10);
  if (anio < 100) anio += 2000;

  const fecha = new Date(anio, mes - 1, dia);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

function obtenerDiasPorFrecuencia(frecuencia: string): number | null {
  if (frecuencia === "Diario") return 1;
  if (frecuencia === "Cada 2 días") return 2;
  if (frecuencia === "Semanal") return 7;
  return null;
}

function obtenerEstadoRecordatorio(
  vitamina: VitaminaFirebase
): EstadoRecordatorio {
  const dias = obtenerDiasPorFrecuencia(vitamina.frecuencia);
  if (dias === null) return "Según indicación médica";

  if (!vitamina.ultimaToma) return "Pendiente hoy";

  const ultima = parsearFecha(vitamina.ultimaToma);
  if (!ultima) return "Pendiente hoy";

  const proxima = sumarDias(ultima, dias);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  proxima.setHours(0, 0, 0, 0);

  if (proxima.getTime() < hoy.getTime()) return "Atrasada";
  if (proxima.getTime() === hoy.getTime()) return "Pendiente hoy";
  return "Al día";
}

function obtenerEstiloEstado(estado: EstadoRecordatorio) {
  if (estado === "Atrasada") return globalStyles.statusPending;
  if (estado === "Pendiente hoy") return globalStyles.statusNext;
  return globalStyles.statusApplied;
}

export default function VitaminsScreen({ onGo }: Props) {
  const [nombre, setNombre] = useState("");
  const [dosis, setDosis] = useState("");
  const [frecuencia, setFrecuencia] = useState("Diario");
  const [duracion, setDuracion] = useState("");
  const [indicaciones, setIndicaciones] = useState("");

  const [vitaminas, setVitaminas] = useState<VitaminaFirebase[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [consultandoId, setConsultandoId] = useState<string | null>(null);

  useEffect(() => {
    cargarVitaminas();
  }, []);

  const cargarVitaminas = async () => {
    try {
      const datos = await obtenerVitaminasFirebase();
      setVitaminas(datos);
    } catch (error) {
      console.log("Error al cargar vitaminas:", error);
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDosis("");
    setFrecuencia("Diario");
    setDuracion("");
    setIndicaciones("");
    setEditandoId(null);
  };

  const iniciarEdicion = (vitamina: VitaminaFirebase) => {
    if (!vitamina.id) return;

    setEditandoId(vitamina.id);
    setNombre(vitamina.nombre);
    setDosis(vitamina.dosis);
    setFrecuencia(vitamina.frecuencia);
    setDuracion(vitamina.duracion);
    setIndicaciones(vitamina.indicaciones || "");
  };

  const guardarVitamina = async () => {
    if (!nombre.trim() || !dosis.trim()) {
      Alert.alert(
        "Datos incompletos",
        "Escribe el nombre de la vitamina y la dosis."
      );
      return;
    }

    setGuardando(true);

    try {
      if (editandoId) {
        await actualizarVitaminaFirebase(editandoId, {
          nombre: nombre.trim(),
          dosis: dosis.trim(),
          frecuencia,
          duracion: duracion.trim() || "Sin duración definida",
          indicaciones:
            indicaciones.trim() || "Sin indicaciones adicionales",
        });

        Alert.alert(
          "Vitamina actualizada",
          "El plan de vitaminación fue actualizado correctamente."
        );
      } else {
        await guardarVitaminaFirebase({
          nombre: nombre.trim(),
          dosis: dosis.trim(),
          frecuencia,
          duracion: duracion.trim() || "Sin duración definida",
          indicaciones:
            indicaciones.trim() || "Sin indicaciones adicionales",
        });

        Alert.alert(
          "Vitamina guardada",
          "El plan de vitaminación fue registrado correctamente en Firebase."
        );
      }

      await cargarVitaminas();
      limpiarFormulario();
    } catch (error) {
      console.log("Error al guardar vitamina:", error);

      Alert.alert(
        "Error",
        "No se pudo guardar el plan de vitaminación."
      );
    } finally {
      setGuardando(false);
    }
  };

  const registrarToma = async (vitamina: VitaminaFirebase) => {
    if (!vitamina.id) return;

    setProcesandoId(vitamina.id);

    try {
      await registrarTomaVitaminaFirebase(vitamina.id, formatearFechaHoy());
      await cargarVitaminas();
    } catch (error) {
      console.log("Error al registrar toma:", error);
      Alert.alert("Error", "No se pudo registrar la toma de hoy.");
    } finally {
      setProcesandoId(null);
    }
  };

  // aquí consulto openFDA y RxNorm (son públicas, no piden llave) para
  // mostrar info oficial del nombre que se registró. Esto no sustituye
  // la indicación médica, si ninguna API encuentra nada nada más aviso
  // y dejo seguir usando el panel normal
  const consultarInformacionOficial = async (vitamina: VitaminaFirebase) => {
    if (!vitamina.id) return;

    setConsultandoId(vitamina.id);

    try {
      const [infoFDA, infoRxNorm] = await Promise.all([
        buscarInfoMedicamentoOpenFDA(vitamina.nombre),
        buscarInfoMedicamentoRxNorm(vitamina.nombre),
      ]);

      if (!infoFDA && !infoRxNorm) {
        Alert.alert(
          "Sin resultados",
          `No se encontró "${vitamina.nombre}" en las bases oficiales de openFDA ni RxNorm. Puede ser un nombre comercial local o estar escrito de forma distinta.`
        );
        return;
      }

      const partes: string[] = [];

      if (infoRxNorm) {
        partes.push(`Nombre normalizado (RxNorm): ${infoRxNorm.nombreNormalizado}`);
      }

      if (infoFDA) {
        partes.push(`Fuente: FDA — ${infoFDA.nombreEncontrado}`);
        if (infoFDA.indicaciones) {
          partes.push(`\nIndicaciones:\n${infoFDA.indicaciones}`);
        }
        if (infoFDA.dosisYAdministracion) {
          partes.push(`\nDosis y administración:\n${infoFDA.dosisYAdministracion}`);
        }
        if (infoFDA.advertencias) {
          partes.push(`\nAdvertencias:\n${infoFDA.advertencias}`);
        }
      }

      Alert.alert(`Información oficial: ${vitamina.nombre}`, partes.join("\n"));
    } catch (error) {
      console.log("Error al consultar información oficial:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo consultar la información oficial en este momento."
      );
    } finally {
      setConsultandoId(null);
    }
  };

  const confirmarEliminar = (vitamina: VitaminaFirebase) => {
    Alert.alert(
      "Eliminar vitamina",
      `¿Seguro que quieres eliminar "${vitamina.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => eliminarVitamina(vitamina),
        },
      ]
    );
  };

  const eliminarVitamina = async (vitamina: VitaminaFirebase) => {
    if (!vitamina.id) return;

    setProcesandoId(vitamina.id);

    try {
      await eliminarVitaminaFirebase(vitamina.id);

      if (editandoId === vitamina.id) {
        limpiarFormulario();
      }

      await cargarVitaminas();
    } catch (error) {
      console.log("Error al eliminar vitamina:", error);
      Alert.alert("Error", "No se pudo eliminar la vitamina.");
    } finally {
      setProcesandoId(null);
    }
  };

  const pendientesHoy = vitaminas.filter((item) => {
    const estado = obtenerEstadoRecordatorio(item);
    return estado === "Pendiente hoy" || estado === "Atrasada";
  }).length;

  const tomadasHoy = vitaminas.filter(
    (item) => item.ultimaToma === formatearFechaHoy()
  ).length;

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={globalStyles.headerCard}>
          <Text style={globalStyles.title} accessibilityRole="header">💊 Vitaminación</Text>

          <Text style={globalStyles.subtitle}>
            Panel para registrar vitaminas, dosis, frecuencia y duración,
            con recordatorios de tomas pendientes y completadas.
          </Text>
        </View>

        {/* ayuda con IA: explica cómo funciona este módulo */}
        <AyudaModulo modulo="vitaminas" />

        <View style={globalStyles.summaryRow}>
          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{vitaminas.length}</Text>
            <Text style={globalStyles.summaryText}>Registradas</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{tomadasHoy}</Text>
            <Text style={globalStyles.summaryText}>Tomadas hoy</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{pendientesHoy}</Text>
            <Text style={globalStyles.summaryText}>Pendientes</Text>
          </View>
        </View>

        <View style={globalStyles.formCard}>
          <Text style={globalStyles.sectionTitle} accessibilityRole="header">
            {editandoId
              ? "Editar suplemento o vitamina"
              : "Registrar suplemento o vitamina"}
          </Text>

          <Text style={globalStyles.label}>Nombre</Text>
          <TextInput
            placeholder="Ej. Vitamina D, Hierro, Multivitamínico"
            placeholderTextColor="#90A4AE"
            value={nombre}
            onChangeText={setNombre}
            style={globalStyles.input}
          />

          <Text style={globalStyles.label}>Dosis</Text>
          <TextInput
            placeholder="Ej. 2 gotas, 1 ml, 1 tableta"
            placeholderTextColor="#90A4AE"
            value={dosis}
            onChangeText={setDosis}
            style={globalStyles.input}
          />

          <Text style={globalStyles.label}>Frecuencia</Text>

          <View style={globalStyles.optionRow}>
            <TouchableOpacity
              accessibilityRole="button"
              style={[
                globalStyles.optionButton,
                frecuencia === "Diario" && globalStyles.optionActive,
              ]}
              onPress={() => setFrecuencia("Diario")}
            >
              <Text
                style={[
                  globalStyles.optionText,
                  frecuencia === "Diario" && globalStyles.optionTextActive,
                ]}
              >
                Diario
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={[
                globalStyles.optionButton,
                frecuencia === "Cada 2 días" && globalStyles.optionActive,
              ]}
              onPress={() => setFrecuencia("Cada 2 días")}
            >
              <Text
                style={[
                  globalStyles.optionText,
                  frecuencia === "Cada 2 días" &&
                    globalStyles.optionTextActive,
                ]}
              >
                Cada 2 días
              </Text>
            </TouchableOpacity>
          </View>

          <View style={globalStyles.optionRow}>
            <TouchableOpacity
              accessibilityRole="button"
              style={[
                globalStyles.optionButton,
                frecuencia === "Semanal" && globalStyles.optionActive,
              ]}
              onPress={() => setFrecuencia("Semanal")}
            >
              <Text
                style={[
                  globalStyles.optionText,
                  frecuencia === "Semanal" && globalStyles.optionTextActive,
                ]}
              >
                Semanal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={[
                globalStyles.optionButton,
                frecuencia === "Indicación médica" &&
                  globalStyles.optionActive,
              ]}
              onPress={() => setFrecuencia("Indicación médica")}
            >
              <Text
                style={[
                  globalStyles.optionText,
                  frecuencia === "Indicación médica" &&
                    globalStyles.optionTextActive,
                ]}
              >
                Médica
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={globalStyles.label}>Duración</Text>
          <TextInput
            placeholder="Ej. 30 días, 3 meses, continuo"
            placeholderTextColor="#90A4AE"
            value={duracion}
            onChangeText={setDuracion}
            style={globalStyles.input}
          />

          <Text style={globalStyles.label}>Indicaciones adicionales</Text>
          <TextInput
            placeholder="Ej. Administrar después del desayuno"
            placeholderTextColor="#90A4AE"
            value={indicaciones}
            onChangeText={setIndicaciones}
            style={[globalStyles.input, globalStyles.textArea]}
            multiline
          />

          <View style={globalStyles.noticeCard}>
            <Text style={globalStyles.noticeText}>
              Este panel registra información de apoyo. La dosis debe seguir la
              indicación médica correspondiente.
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={globalStyles.buttonGreen}
            onPress={guardarVitamina}
            disabled={guardando}
          >
            <Text style={globalStyles.buttonText}>
              {guardando
                ? "Guardando..."
                : editandoId
                ? "Actualizar vitaminación"
                : "Guardar vitaminación"}
            </Text>
          </TouchableOpacity>

          {editandoId && (
            <TouchableOpacity
              accessibilityRole="button"
              style={[globalStyles.unmarkButton, { marginTop: 10 }]}
              onPress={limpiarFormulario}
            >
              <Text style={globalStyles.unmarkButtonText}>
                Cancelar edición
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          Vitaminas registradas
        </Text>

        {vitaminas.length === 0 && (
          <View style={globalStyles.helpCard}>
            <Text style={globalStyles.helpTitle}>
              Sin registros todavía
            </Text>

            <Text style={globalStyles.helpText}>
              Agrega una vitamina o suplemento para visualizarlo en este panel.
            </Text>
          </View>
        )}

        {vitaminas.map((item) => {
          const estadoRecordatorio = obtenerEstadoRecordatorio(item);
          const enProceso = procesandoId === item.id;

          return (
            <View key={item.id} style={globalStyles.vitaminCard}>
              <View style={globalStyles.vitaminHeader}>
                <View style={globalStyles.vitaminIconBox}>
                  <Text style={globalStyles.vitaminIcon}>💊</Text>
                </View>

                <View style={globalStyles.vitaminInfoBox}>
                  <Text style={globalStyles.vitaminName}>
                    {item.nombre}
                  </Text>

                  <Text style={globalStyles.vitaminInfo}>
                    Dosis: {item.dosis}
                  </Text>
                </View>

                <View
                  style={[
                    globalStyles.statusBadge,
                    obtenerEstiloEstado(estadoRecordatorio),
                  ]}
                  accessible
                  accessibilityLabel={`Estado del recordatorio: ${estadoRecordatorio}`}
                >
                  <Text style={globalStyles.statusText}>
                    {textoEstado(estadoRecordatorio)}
                  </Text>
                </View>
              </View>

              <View style={globalStyles.vitaminDetails}>
                <Text style={globalStyles.vitaminInfo}>
                  Frecuencia: {item.frecuencia}
                </Text>

                <Text style={globalStyles.vitaminInfo}>
                  Duración: {item.duracion}
                </Text>

                <Text style={globalStyles.vitaminInfo}>
                  Última toma: {item.ultimaToma || "Sin registrar"}
                </Text>
              </View>

              <View style={globalStyles.documentActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={globalStyles.applyButton}
                  disabled={enProceso}
                  onPress={() => registrarToma(item)}
                >
                  <Text style={globalStyles.applyButtonText}>
                    {enProceso ? "Guardando..." : "Registrar toma de hoy"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={globalStyles.documentActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={globalStyles.viewButton}
                  disabled={consultandoId === item.id}
                  onPress={() => consultarInformacionOficial(item)}
                >
                  <Text style={globalStyles.viewButtonText}>
                    {consultandoId === item.id
                      ? "Consultando..."
                      : "🔎 Info oficial (FDA/RxNorm)"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={globalStyles.documentActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={globalStyles.viewButton}
                  onPress={() => iniciarEdicion(item)}
                >
                  <Text style={globalStyles.viewButtonText}>✏️ Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  style={globalStyles.deleteButton}
                  disabled={enProceso}
                  onPress={() => confirmarEliminar(item)}
                >
                  <Text style={globalStyles.deleteButtonText}>
                    {enProceso ? "Eliminando..." : "🗑 Eliminar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            📌 Nota importante
          </Text>

          <Text style={globalStyles.helpText}>
            PediatriTrack Global organiza el seguimiento de vitaminas, pero no
            sustituye indicaciones médicas. Ante dudas sobre dosis o duración,
            se debe consultar al profesional de salud.
          </Text>
        </View>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="vitaminas" />
    </View>
  );
}
