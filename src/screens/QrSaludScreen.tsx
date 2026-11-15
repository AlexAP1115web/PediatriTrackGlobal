import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import BottomNav from "../components/BottomNav";
import CodigoQR from "../components/CodigoQR";
import {
  BebeFirebase,
  crearFichaFirebase,
  desactivarFichaFirebase,
  FichaSalud,
  obtenerMisFichasFirebase,
  obtenerUltimoBebeFirebase,
  obtenerVacunasAplicadasFirebase,
  TipoFicha,
} from "../firebase/firebaseService";
import { resumirPreconsulta } from "../services/chatbotService";
import { colors, globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";
import { calcularEdadEnMeses, formatearEdad } from "../utils/edad";
import { enlaceDeFicha } from "../utils/qr";
import FichaSaludScreen from "./FichaSaludScreen";

type Props = {
  onGo: (screen: string) => void;
};

// opciones rápidas, parecidas a las de la pre-consulta de MediCore
const MOTIVOS = [
  "Revisión de rutina",
  "Fiebre",
  "Tos o gripa",
  "Diarrea o vómito",
  "Ronchas o piel",
  "Vacunas",
  "Otro",
];
// versión sencilla del mapa del cuerpo (SomaMap) de MediCore
const ZONAS = ["Cabeza", "Ojos", "Oídos", "Nariz", "Garganta", "Pecho", "Panza", "Piel", "Zona del pañal", "Brazos o piernas"];
const DESDE_CUANDO = ["Hoy", "1 a 3 días", "Una semana", "Más de una semana", "Es revisión"];
const GRUPOS_SANGUINEOS = ["No sé", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
// la de pre-consulta dura 72 horas (como en MediCore); la de viaje la elige el papá
const HORAS_PRECONSULTA = 72;
const VIGENCIAS_VIAJE = [
  { texto: "7 días", horas: 7 * 24 },
  { texto: "30 días", horas: 30 * 24 },
  { texto: "90 días", horas: 90 * 24 },
];

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fechaCorta(fecha?: Date) {
  if (!fecha) return "";
  return fecha.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function QrSaludScreen({ onGo }: Props) {
  const [bebe, setBebe] = useState<BebeFirebase | null>(null);
  const [vacunas, setVacunas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tipo, setTipo] = useState<TipoFicha>("preconsulta");

  // pre-consulta
  const [motivo, setMotivo] = useState("");
  const [desdeCuando, setDesdeCuando] = useState("");
  const [zonas, setZonas] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [peso, setPeso] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [preguntas, setPreguntas] = useState("");
  const [correoPediatra, setCorreoPediatra] = useState("");

  // viaje
  const [destino, setDestino] = useState("");
  const [grupoSanguineo, setGrupoSanguineo] = useState("No sé");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [seguro, setSeguro] = useState("");
  const [notas, setNotas] = useState("");
  const [horasViaje, setHorasViaje] = useState(30 * 24);

  const [incluirVacunas, setIncluirVacunas] = useState(true);
  const [generando, setGenerando] = useState(false);
  // la ficha que se está mostrando con su QR
  const [actual, setActual] = useState<FichaSalud | null>(null);
  const [misFichas, setMisFichas] = useState<FichaSalud[]>([]);
  // para que el papá vea cómo le va a salir al pediatra
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const bebeActivo = await obtenerUltimoBebeFirebase();
      setBebe(bebeActivo);
      if (bebeActivo) {
        const registros = await obtenerVacunasAplicadasFirebase();
        setVacunas(
          registros
            .filter((r) => !r.bebeId || r.bebeId === bebeActivo.id)
            .map((r) => `${r.nombre} · ${r.dosis}${r.fechaAplicacion ? ` (${r.fechaAplicacion})` : ""}`)
        );
      }
      await cargarMisFichas();
    } catch (error) {
      console.log("Error al cargar QR de salud:", error);
    } finally {
      setCargando(false);
    }
  };

  const cargarMisFichas = async () => {
    try {
      setMisFichas(await obtenerMisFichasFirebase());
    } catch (error) {
      console.log("Error al cargar mis fichas:", error);
    }
  };

  const generarFicha = async () => {
    if (!bebe?.id) {
      Alert.alert("Falta el bebé", "Primero registra a tu bebé para poder armar la ficha.");
      return;
    }
    if (tipo === "preconsulta" && !motivo) {
      Alert.alert("Falta el motivo", "Elige el motivo de la consulta.");
      return;
    }
    if (tipo === "preconsulta" && correoPediatra && !CORREO_VALIDO.test(correoPediatra.trim())) {
      Alert.alert("Correo no válido", "Revisa el correo del pediatra o déjalo vacío.");
      return;
    }
    if (tipo === "viaje" && !contactoTelefono.trim()) {
      Alert.alert("Falta un teléfono", "Pon el teléfono de un contacto de emergencia.");
      return;
    }

    const edadMeses = calcularEdadEnMeses(bebe.fechaNacimiento);
    const ficha: FichaSalud = {
      bebeId: bebe.id,
      tipo,
      bebe: {
        nombre: bebe.nombre || "",
        fechaNacimiento: bebe.fechaNacimiento || "",
        edad: formatearEdad(edadMeses),
        sexo: bebe.sexo || "",
        pais: bebe.pais || "",
        alergias: bebe.alergias || "",
        alergiasAlimentarias: bebe.alergiasAlimentarias || "",
        condiciones: bebe.condiciones || "",
      },
      vacunas: incluirVacunas ? vacunas : [],
      ...(tipo === "preconsulta"
        ? {
            motivo,
            zonas: zonas.join(", "),
            desdeCuando,
            descripcion: descripcion.trim(),
            temperatura: temperatura.trim(),
            peso: peso.trim(),
            medicamentos: medicamentos.trim(),
            preguntas: preguntas.trim(),
            correoPediatra: correoPediatra.trim(),
          }
        : {
            destino: destino.trim(),
            grupoSanguineo,
            contactoNombre: contactoNombre.trim(),
            contactoTelefono: contactoTelefono.trim(),
            seguro: seguro.trim(),
            notas: notas.trim(),
          }),
    };

    setGenerando(true);
    try {
      // a la pre-consulta le agrego el resumen con IA para el pediatra
      if (tipo === "preconsulta") {
        ficha.resumenIA = await resumirPreconsulta(datosParaResumen(ficha));
      }
      const horas = tipo === "preconsulta" ? HORAS_PRECONSULTA : horasViaje;
      const { token, expira } = await crearFichaFirebase(ficha, horas);
      setActual({ ...ficha, id: token, activa: true, expiraEn: { toDate: () => expira } });
      await cargarMisFichas();
    } catch (error: any) {
      console.log("Error al crear la ficha:", error);
      Alert.alert(
        "No se pudo crear la ficha",
        `Revisa tu conexión e intenta de nuevo. (Detalle: ${error?.code || "desconocido"})`
      );
    } finally {
      setGenerando(false);
    }
  };

  const datosParaResumen = (ficha: FichaSalud) =>
    [
      `Bebé: ${ficha.bebe.edad}, ${ficha.bebe.sexo}`,
      `Alergias: ${ficha.bebe.alergias || "ninguna registrada"}`,
      `Alergias a alimentos: ${ficha.bebe.alergiasAlimentarias || "ninguna registrada"}`,
      `Condiciones: ${ficha.bebe.condiciones || "ninguna registrada"}`,
      `Motivo: ${ficha.motivo}`,
      ficha.zonas ? `Zona del cuerpo: ${ficha.zonas}` : "",
      ficha.desdeCuando ? `Desde cuándo: ${ficha.desdeCuando}` : "",
      ficha.descripcion ? `Lo que notó la familia: ${ficha.descripcion}` : "",
      ficha.temperatura ? `Temperatura: ${ficha.temperatura} °C` : "",
      ficha.peso ? `Peso: ${ficha.peso} kg` : "",
      ficha.medicamentos ? `Medicamentos que le dieron: ${ficha.medicamentos}` : "",
      ficha.preguntas ? `Preguntas de la familia: ${ficha.preguntas}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const textoParaCompartir = (ficha: FichaSalud) => {
    const enlace = enlaceDeFicha(ficha.id || "");
    const vence = fechaCorta(ficha.expiraEn?.toDate?.());
    if (ficha.tipo === "viaje") {
      return `Ficha de viaje de ${ficha.bebe.nombre} (PediatriTrack Global) / Travel health card:\n${enlace}\n\nVigente hasta / Valid until: ${vence}`;
    }
    return `Hola, le comparto la pre-consulta de ${ficha.bebe.nombre} (${ficha.bebe.edad}) para su próxima cita.\nMotivo: ${ficha.motivo}${ficha.desdeCuando ? ` (desde: ${ficha.desdeCuando})` : ""}\n\nVer ficha completa: ${enlace}\n\nVigente hasta: ${vence}\nEnviado desde PediatriTrack Global.`;
  };

  const compartir = async (ficha: FichaSalud) => {
    const mensaje = textoParaCompartir(ficha);
    try {
      if (Platform.OS === "web") {
        const nav: any = typeof navigator !== "undefined" ? navigator : null;
        if (nav?.share) {
          await nav.share({ title: "PediatriTrack Global", text: mensaje });
        } else if (nav?.clipboard) {
          await nav.clipboard.writeText(mensaje);
          Alert.alert("Enlace copiado", "Ya puedes pegarlo en WhatsApp o en un correo.");
        }
        return;
      }
      await Share.share({ message: mensaje });
    } catch (error) {
      console.log("No se compartió la ficha:", error);
    }
  };

  // WhatsApp con el mensaje ya escrito (como en MediCore)
  const enviarWhatsApp = async (ficha: FichaSalud) => {
    const url = `https://wa.me/?text=${encodeURIComponent(textoParaCompartir(ficha))}`;
    try {
      if (Platform.OS === "web") {
        window.open(url, "_blank", "noopener");
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.log("No se pudo abrir WhatsApp:", error);
    }
  };

  // abre la app de correo con el mensaje ya escrito (el papá solo le da
  // "Enviar"). No mando correos desde un servidor para no guardar
  // contraseñas ni llaves de correo en la app.
  const enviarCorreo = async (ficha: FichaSalud) => {
    const para = ficha.tipo === "preconsulta" ? ficha.correoPediatra || "" : "";
    const asunto =
      ficha.tipo === "viaje"
        ? `Ficha de viaje de ${ficha.bebe.nombre} - PediatriTrack Global`
        : `Pre-consulta de ${ficha.bebe.nombre} - PediatriTrack Global`;
    const url = `mailto:${encodeURIComponent(para)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(textoParaCompartir(ficha))}`;
    try {
      if (Platform.OS === "web") {
        window.location.href = url;
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.log("No se pudo abrir el correo:", error);
      Alert.alert("Sin app de correo", "No encontré una app de correo en este celular. Usa \"Compartir\".");
    }
  };

  const desactivar = (ficha: FichaSalud) => {
    Alert.alert(
      "Desactivar ficha",
      "El QR y el enlace dejarán de funcionar. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              await desactivarFichaFirebase(ficha.id || "");
              if (actual?.id === ficha.id) setActual(null);
              await cargarMisFichas();
            } catch (error) {
              console.log("Error al desactivar ficha:", error);
              Alert.alert("Error", "No se pudo desactivar. Intenta de nuevo.");
            }
          },
        },
      ]
    );
  };

  const estaVigente = (ficha: FichaSalud) => {
    const vence = ficha.expiraEn?.toDate?.() as Date | undefined;
    return ficha.activa !== false && !!vence && vence.getTime() > Date.now();
  };

  if (vistaPrevia) {
    return (
      <FichaSaludScreen
        token={vistaPrevia}
        onCerrar={() => setVistaPrevia(null)}
        textoCerrar="← Regresar a mi QR"
      />
    );
  }

  const chips = (
    opciones: string[],
    valor: string,
    alElegir: (opcion: string) => void
  ) => (
    <View style={globalStyles.chipRow}>
      {opciones.map((opcion) => {
        const activo = opcion === valor;
        return (
          <TouchableOpacity
            key={opcion}
            style={[globalStyles.chipButton, activo && globalStyles.chipButtonActive]}
            onPress={() => alElegir(activo ? "" : opcion)}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
          >
            <Text style={[globalStyles.chipText, activo && globalStyles.chipTextActive]}>{opcion}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={globalStyles.screen}>
      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
        <View style={globalStyles.headerCard}>
          <Text style={globalStyles.title} accessibilityRole="header">
            📲 QR de salud
          </Text>
          <Text style={globalStyles.subtitle}>
            Llena los datos antes de la consulta o arma la ficha para viajar.
            La app crea un código QR: el pediatra lo escanea con su celular y ve
            todo sin que tengas que repetirlo.
          </Text>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
        ) : !bebe ? (
          <View style={globalStyles.alertCard}>
            <Text style={globalStyles.alertTitle}>Primero registra a tu bebé</Text>
            <Text style={globalStyles.alertText}>
              La ficha usa los datos del bebé (edad, alergias y vacunas).
            </Text>
          </View>
        ) : (
          <>
            <View style={globalStyles.qrBebeFila}>
              <View style={globalStyles.qrBebeAvatar}>
                <Text style={{ fontSize: 22 }}>👶</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={globalStyles.qrBebeNombre}>{bebe.nombre}</Text>
                <Text style={globalStyles.qrBebeSub}>
                  {formatearEdad(calcularEdadEnMeses(bebe.fechaNacimiento))} · {vacunas.length} vacunas aplicadas
                </Text>
              </View>
            </View>

            {actual && (
              <View style={globalStyles.qrResultadoCard}>
                <Text style={globalStyles.qrResultadoTitulo}>
                  {actual.tipo === "viaje" ? "✈️ Ficha de viaje lista" : "🩺 Pre-consulta lista"}
                </Text>
                <Text style={globalStyles.qrResultadoSub}>
                  Enséñale este código al pediatra. Vigente hasta: {fechaCorta(actual.expiraEn?.toDate?.())}
                </Text>
                <CodigoQR valor={enlaceDeFicha(actual.id || "")} tamano={230} />
                <Text style={globalStyles.qrEnlace} selectable>
                  {enlaceDeFicha(actual.id || "")}
                </Text>
                <View style={globalStyles.qrAcciones}>
                  <TouchableOpacity style={globalStyles.qrBoton} onPress={() => enviarWhatsApp(actual)} accessibilityRole="button">
                    <Text style={globalStyles.qrBotonTexto}>💬 WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.qrBoton} onPress={() => compartir(actual)} accessibilityRole="button">
                    <Text style={globalStyles.qrBotonTexto}>📤 Compartir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.qrBoton} onPress={() => enviarCorreo(actual)} accessibilityRole="button">
                    <Text style={globalStyles.qrBotonTexto}>✉️ Enviar por correo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.qrBoton} onPress={() => setVistaPrevia(actual.id || null)} accessibilityRole="button">
                    <Text style={globalStyles.qrBotonTexto}>👀 Ver como el pediatra</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[globalStyles.qrBoton, globalStyles.qrBotonPeligro]}
                    onPress={() => desactivar(actual)}
                    accessibilityRole="button"
                  >
                    <Text style={[globalStyles.qrBotonTexto, globalStyles.qrBotonPeligroTexto]}>🚫 Desactivar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={globalStyles.qrPestanas} accessibilityRole="tablist">
              {([
                ["preconsulta", "🩺 Antes de la consulta"],
                ["viaje", "✈️ Para viajar"],
              ] as [TipoFicha, string][]).map(([valor, texto]) => (
                <TouchableOpacity
                  key={valor}
                  style={[globalStyles.qrPestana, tipo === valor && globalStyles.qrPestanaActiva]}
                  onPress={() => setTipo(valor)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tipo === valor }}
                >
                  <Text style={globalStyles.qrPestanaTexto}>{texto}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={globalStyles.formCard}>
              {tipo === "preconsulta" ? (
                <>
                  <Text style={globalStyles.label}>¿Por qué van a consulta?</Text>
                  {chips(MOTIVOS, motivo, setMotivo)}

                  <Text style={globalStyles.label}>¿Dónde le molesta? (puedes elegir varias)</Text>
                  <View style={globalStyles.chipRow}>
                    {ZONAS.map((zona) => {
                      const activa = zonas.includes(zona);
                      return (
                        <TouchableOpacity
                          key={zona}
                          style={[globalStyles.chipButton, activa && globalStyles.chipButtonActive]}
                          onPress={() => setZonas(activa ? zonas.filter((z) => z !== zona) : [...zonas, zona])}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: activa }}
                        >
                          <Text style={[globalStyles.chipText, activa && globalStyles.chipTextActive]}>{zona}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={globalStyles.label}>¿Desde cuándo?</Text>
                  {chips(DESDE_CUANDO, desdeCuando, setDesdeCuando)}

                  <Text style={globalStyles.label}>¿Qué has notado?</Text>
                  <TextInput
                    style={[globalStyles.input, globalStyles.textArea]}
                    placeholder="Ej. tiene fiebre en las noches y come menos"
                    placeholderTextColor={colors.muted}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    maxLength={600}
                  />

                  <View style={globalStyles.qrDosColumnas}>
                    <View style={globalStyles.qrColumna}>
                      <Text style={globalStyles.label}>Temperatura (°C)</Text>
                      <TextInput
                        style={globalStyles.input}
                        placeholder="38.2"
                        placeholderTextColor={colors.muted}
                        keyboardType="decimal-pad"
                        value={temperatura}
                        onChangeText={(v) => setTemperatura(v.replace(/[^\d.,]/g, "").slice(0, 5))}
                      />
                    </View>
                    <View style={globalStyles.qrColumna}>
                      <Text style={globalStyles.label}>Peso (kg)</Text>
                      <TextInput
                        style={globalStyles.input}
                        placeholder="8.5"
                        placeholderTextColor={colors.muted}
                        keyboardType="decimal-pad"
                        value={peso}
                        onChangeText={(v) => setPeso(v.replace(/[^\d.,]/g, "").slice(0, 5))}
                      />
                    </View>
                  </View>

                  <Text style={globalStyles.label}>Medicamentos que le has dado</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="Ej. paracetamol gotas, ayer 8 pm"
                    placeholderTextColor={colors.muted}
                    value={medicamentos}
                    onChangeText={setMedicamentos}
                    maxLength={300}
                  />

                  <Text style={globalStyles.label}>Preguntas para el pediatra</Text>
                  <TextInput
                    style={[globalStyles.input, globalStyles.textArea]}
                    placeholder="Lo que no quieres que se te olvide preguntar"
                    placeholderTextColor={colors.muted}
                    value={preguntas}
                    onChangeText={setPreguntas}
                    multiline
                    maxLength={600}
                  />

                  <Text style={globalStyles.label}>Correo del pediatra (opcional)</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="pediatra@correo.com"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={correoPediatra}
                    onChangeText={setCorreoPediatra}
                    maxLength={120}
                  />
                  <Text style={globalStyles.qrAyudaCampo}>
                    Si lo pones, el botón "Enviar por correo" ya lo lleva escrito.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={globalStyles.label}>Destino</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="Ej. Orlando, Florida"
                    placeholderTextColor={colors.muted}
                    value={destino}
                    onChangeText={setDestino}
                    maxLength={120}
                  />

                  <Text style={globalStyles.label}>Grupo sanguíneo</Text>
                  {chips(GRUPOS_SANGUINEOS, grupoSanguineo, (v) => setGrupoSanguineo(v || "No sé"))}

                  <Text style={globalStyles.label}>Contacto de emergencia</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="Nombre (ej. Mamá - Laura)"
                    placeholderTextColor={colors.muted}
                    value={contactoNombre}
                    onChangeText={setContactoNombre}
                    maxLength={80}
                  />
                  <TextInput
                    style={globalStyles.input}
                    placeholder="Teléfono con lada (ej. +52 222 123 4567)"
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                    value={contactoTelefono}
                    onChangeText={(v) => setContactoTelefono(v.replace(/[^\d+\s()-]/g, "").slice(0, 25))}
                  />

                  <Text style={globalStyles.label}>Seguro médico (opcional)</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="Aseguradora y teléfono de asistencia"
                    placeholderTextColor={colors.muted}
                    value={seguro}
                    onChangeText={setSeguro}
                    maxLength={160}
                  />

                  <Text style={globalStyles.label}>Notas</Text>
                  <TextInput
                    style={[globalStyles.input, globalStyles.textArea]}
                    placeholder="Medicamentos que toma, indicaciones del pediatra, etc."
                    placeholderTextColor={colors.muted}
                    value={notas}
                    onChangeText={setNotas}
                    multiline
                    maxLength={600}
                  />

                  <Text style={globalStyles.label}>¿Cuánto tiempo sirve el QR?</Text>
                  <View style={globalStyles.optionRow}>
                    {VIGENCIAS_VIAJE.map((opcion) => (
                      <TouchableOpacity
                        key={opcion.horas}
                        style={[globalStyles.optionButton, horasViaje === opcion.horas && globalStyles.optionActive]}
                        onPress={() => setHorasViaje(opcion.horas)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: horasViaje === opcion.horas }}
                      >
                        <Text style={[globalStyles.optionText, horasViaje === opcion.horas && globalStyles.optionTextActive]}>
                          {opcion.texto}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={globalStyles.qrComparte}>
                <Text style={globalStyles.qrComparteTexto}>
                  🔐 Se comparte: nombre, edad, sexo, alergias, condiciones
                  {incluirVacunas ? ` y ${vacunas.length} vacunas aplicadas` : ""}, más lo que escribiste
                  aquí. Quien tenga el QR o el enlace lo puede ver
                  {tipo === "preconsulta" ? " durante 72 horas" : " hasta que venza"} o hasta que lo
                  desactives. Compártelo solo con personal de salud.
                </Text>
                <TouchableOpacity
                  style={[globalStyles.chipButton, { alignSelf: "flex-start", marginTop: 10, marginBottom: 0 }, incluirVacunas && globalStyles.chipButtonActive]}
                  onPress={() => setIncluirVacunas(!incluirVacunas)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: incluirVacunas }}
                >
                  <Text style={[globalStyles.chipText, incluirVacunas && globalStyles.chipTextActive]}>
                    {incluirVacunas ? "✓ Incluir vacunas" : "Incluir vacunas"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[globalStyles.buttonPrimary, generando && { opacity: 0.6 }]}
                onPress={generarFicha}
                disabled={generando}
                accessibilityRole="button"
              >
                <Text style={globalStyles.buttonText}>
                  {generando
                    ? tipo === "preconsulta"
                      ? "Preparando resumen para el pediatra..."
                      : "Generando..."
                    : "Generar código QR"}
                </Text>
              </TouchableOpacity>
            </View>

            {misFichas.length > 0 && (
              <>
                <Text style={globalStyles.sectionTitle} accessibilityRole="header">
                  🗂️ Mis fichas
                </Text>
                {misFichas.slice(0, 10).map((ficha) => {
                  const vigente = estaVigente(ficha);
                  const vence = ficha.expiraEn?.toDate?.() as Date | undefined;
                  return (
                    <View key={ficha.id} style={globalStyles.qrFichaFila}>
                      <View style={globalStyles.qrFichaEncabezado}>
                        <Text style={globalStyles.qrFichaTitulo}>
                          {ficha.tipo === "viaje" ? "✈️ Viaje" : "🩺 Pre-consulta"} · {ficha.bebe?.nombre}
                        </Text>
                        <View style={[globalStyles.qrEstado, vigente ? globalStyles.qrEstadoActiva : globalStyles.qrEstadoInactiva]}>
                          <Text style={globalStyles.qrEstadoTexto}>
                            {vigente ? "Activa" : ficha.activa === false ? "Desactivada" : "Vencida"}
                          </Text>
                        </View>
                      </View>
                      <Text style={globalStyles.qrFichaSub}>
                        {ficha.tipo === "viaje" ? ficha.destino || "Sin destino" : ficha.motivo}
                        {vence && ficha.activa !== false ? ` · ${vigente ? "vence" : "venció"} ${fechaCorta(vence)}` : ""}
                      </Text>
                      {vigente && (
                        <View style={globalStyles.documentActions}>
                          <TouchableOpacity style={globalStyles.viewButton} onPress={() => setActual(ficha)} accessibilityRole="button">
                            <Text style={globalStyles.viewButtonText}>Ver QR</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={globalStyles.deleteButton} onPress={() => desactivar(ficha)} accessibilityRole="button">
                            <Text style={globalStyles.deleteButtonText}>Desactivar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="qrsalud" />
    </View>
  );
}
