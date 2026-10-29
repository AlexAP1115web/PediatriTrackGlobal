import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import {
  BotonRebote,
  BurbujaAnimada,
  Nube,
  PuntosEscribiendo,
  TextoConNegritas,
} from "../components/ChatAnimado";
import MascotaRobot, { EstadoMascota } from "../components/MascotaRobot";
import { auth } from "../firebase/firebaseConfig";
import {
  BebeFirebase,
  obtenerBebesFirebase,
  obtenerUltimoBebeFirebase,
} from "../firebase/firebaseService";
import {
  ContextoBebe,
  MensajeChat,
  preguntarAlChatbot,
} from "../services/chatbotService";
import {
  analizarFotoMedicamento,
  tomarFotoMedicamento,
} from "../services/fotoMedicamento";
import { colors, globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";
import { calcularEdadEnMeses, formatearEdad } from "../utils/edad";
import { guardarPreferencia, leerPreferencia } from "../utils/preferencias";

type Props = {
  onGo: (screen: string) => void;
};

// en pantalla guardo también la foto (si el mensaje fue una foto)
type MensajeUI = MensajeChat & { imagenUri?: string };

type Consulta = {
  pregunta: string;
  respuesta: string;
  fecha: string;
  bebe: string;
  esFoto?: boolean;
};

const MENSAJE_BIENVENIDA: MensajeUI = {
  rol: "asistente",
  texto:
    "¡Hola! 👋 Soy Pedi, el robotito ayudante de PediatriTrack Global. Pregúntame sobre vacunas, vitaminas, comida o cuidados y te respondo según la edad y las alergias del bebé. También puedo leer la caja de una medicina si me mandas una foto con 📷.\n\nRecuerda: no sustituyo a un pediatra. Si hay síntomas o una urgencia, consulta a un profesional de salud.",
};

// cada pregunta sugerida lleva su emoji y su color, para que se vean
// como botones de juguete
const PREGUNTAS_SUGERIDAS = [
  { emoji: "🥕", texto: "¿Qué puede comer según su edad?", color: "verde" },
  { emoji: "🌡️", texto: "¿Qué hago si tiene fiebre?", color: "rosa" },
  { emoji: "💉", texto: "Efectos de la próxima vacuna", color: "azul" },
  { emoji: "🥜", texto: "¿Cómo introducir alimentos alergénicos?", color: "amarillo" },
  { emoji: "🌙", texto: "Rutina de sueño para su edad", color: "azul" },
] as const;

// temas grandes que aparecen al inicio, cuando todavía no hay plática
const TEMAS_INICIO = [
  { emoji: "🥕", titulo: "Comida para su edad", pregunta: "¿Qué puede comer según su edad?", color: "verde" },
  { emoji: "🌡️", titulo: "Tiene fiebre", pregunta: "¿Qué hago si tiene fiebre?", color: "rosa" },
  { emoji: "💉", titulo: "Su próxima vacuna", pregunta: "Efectos de la próxima vacuna", color: "azul" },
  { emoji: "🌙", titulo: "Rutina de sueño", pregunta: "Rutina de sueño para su edad", color: "amarillo" },
  { emoji: "🥜", titulo: "Alimentos alergénicos", pregunta: "¿Cómo introducir alimentos alergénicos?", color: "verde" },
  { emoji: "📷", titulo: "Foto de una medicina", pregunta: "", color: "rosa" },
] as const;

// lo que dice Pedi cuando lo tocas (solo tips de cómo usar el chat)
const TIPS_PEDI = [
  "¡Hola! Tócame cuando quieras 😄",
  "Toca una pregunta de colores y te respondo",
  "Con 📷 puedo leer la caja de una medicina",
  "Arriba eliges al bebé y yo cuido sus alergias",
  "Si es una urgencia, ¡llama al pediatra!",
];

function colorDeChip(color: string) {
  switch (color) {
    case "verde":
      return { backgroundColor: colors.greenLight, borderColor: colors.green };
    case "rosa":
      return { backgroundColor: colors.pinkLight, borderColor: colors.pink };
    case "amarillo":
      return { backgroundColor: colors.yellow, borderColor: colors.warning };
    default:
      return { backgroundColor: colors.primaryLight, borderColor: colors.primary };
  }
}

const PASOS_COMO_RESPONDE = [
  "Lee tu pregunta junto con la edad y las alergias del bebé que elegiste (su nombre no se envía).",
  "Gemini responde en lenguaje claro y solo sobre cuidado infantil.",
  "Si algo choca con sus alergias, te avisa primero.",
  "Con 📷 lee la caja de un medicamento o vitamina, te dice qué es, lo cruza con sus alergias y confirma el nombre oficial en RxNorm.",
];

const MAX_CONSULTAS = 8;
const CORREO_REPORTES = "alexpa.110215@gmail.com";

function tieneAlergias(texto?: string): boolean {
  const limpio = (texto || "").trim().toLowerCase();
  // en el registro algunos bebés quedaron con "Ninguno" y otros con "Ninguna"
  return limpio !== "" && !["ninguna", "ninguno", "no", "n/a", "sin alergias"].includes(limpio);
}

function fechaCorta(): string {
  const hoy = new Date();
  const dd = String(hoy.getDate()).padStart(2, "0");
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const hh = String(hoy.getHours()).padStart(2, "0");
  const min = String(hoy.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${hoy.getFullYear()} ${hh}:${min}`;
}

// abre el correo con la respuesta pegada para reportarla (lo pide la
// política de Google Play para apps con IA)
function reportarRespuesta(texto: string) {
  const asunto = encodeURIComponent("Reporte de respuesta del asistente - PediatriTrack");
  const cuerpo = encodeURIComponent(
    "Quiero reportar esta respuesta del asistente:\n\n" + texto.slice(0, 1500)
  );
  Linking.openURL(`mailto:${CORREO_REPORTES}?subject=${asunto}&body=${cuerpo}`);
}

// nota mía: esta pantalla la armé distinto a las demás. Uso un View en
// columna con flex (header arriba, el chat en flex:1 al centro, la entrada
// abajo) en vez de meter todo en un ScrollView, porque un ScrollView
// anidado no se expande bien en React Native. En pantallas anchas (web o
// tablet) pongo a la derecha la columna de "Cómo responde" y el historial,
// como en el asistente de MediCore
export default function ChatbotScreen({ onGo }: Props) {
  const { width } = useWindowDimensions();
  // mido el ancho real que tiene el chat (no el de la ventana), porque si
  // no en web se ponían las dos columnas aunque no cupieran y todo se veía
  // apretado
  const [anchoDisponible, setAnchoDisponible] = useState(width);
  const pantallaAncha = anchoDisponible >= 860;

  const [mensajes, setMensajes] = useState<MensajeUI[]>([MENSAJE_BIENVENIDA]);
  const [textoEntrada, setTextoEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [bebes, setBebes] = useState<BebeFirebase[]>([]);
  const [bebe, setBebe] = useState<BebeFirebase | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [panel, setPanel] = useState<"ninguno" | "como" | "historial">("ninguno");
  const scrollRef = useRef<ScrollView>(null);

  // cómo se ve Pedi: saluda al entrar, piensa mientras llega la respuesta
  // y da un saltito cuando ya contestó
  const [animoPedi, setAnimoPedi] = useState<EstadoMascota>("saludando");
  const [tipPedi, setTipPedi] = useState(0);
  const estadoPedi: EstadoMascota = enviando ? "pensando" : animoPedi;
  const temporizadorPedi = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cambiarAnimo = (animo: EstadoMascota, duracion: number) => {
    if (temporizadorPedi.current) clearTimeout(temporizadorPedi.current);
    setAnimoPedi(animo);
    temporizadorPedi.current = setTimeout(() => setAnimoPedi("normal"), duracion);
  };

  useEffect(() => {
    cambiarAnimo("saludando", 2200);
    return () => {
      if (temporizadorPedi.current) clearTimeout(temporizadorPedi.current);
    };
  }, []);

  const tocarPedi = () => {
    setTipPedi((actual) => (actual + 1) % TIPS_PEDI.length);
    cambiarAnimo(animoPedi === "feliz" ? "saludando" : "feliz", 1600);
  };

  const claveHistorial = `pediatritrack_consultas_${auth.currentUser?.uid || "anonimo"}`;

  useEffect(() => {
    cargarBebes();
    cargarHistorial();
  }, []);

  const cargarBebes = async () => {
    try {
      const activo = await obtenerUltimoBebeFirebase();
      setBebe(activo);
      const lista = await obtenerBebesFirebase();
      setBebes(lista.length > 0 ? lista : activo ? [activo] : []);
    } catch (error) {
      console.log("Error al cargar bebés en el chatbot:", error);
    }
  };

  const cargarHistorial = async () => {
    const guardado = await leerPreferencia(claveHistorial);
    if (!guardado) return;
    try {
      setConsultas(JSON.parse(guardado));
    } catch {
      setConsultas([]);
    }
  };

  const guardarConsulta = (consulta: Consulta) => {
    setConsultas((anteriores) => {
      const nuevas = [consulta, ...anteriores].slice(0, MAX_CONSULTAS);
      guardarPreferencia(claveHistorial, JSON.stringify(nuevas));
      return nuevas;
    });
  };

  const edadMeses = useMemo(
    () => calcularEdadEnMeses(bebe?.fechaNacimiento),
    [bebe?.fechaNacimiento]
  );

  // lo que le mando a la IA del bebé elegido (sin el nombre)
  const contexto: ContextoBebe | undefined = bebe
    ? {
        edadMeses,
        alergias: bebe.alergias,
        alergiasAlimentarias: bebe.alergiasAlimentarias,
        condiciones: bebe.condiciones,
      }
    : undefined;

  const hayAlergias =
    tieneAlergias(bebe?.alergias) || tieneAlergias(bebe?.alergiasAlimentarias);

  const bajarAlFinal = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  const enviarMensaje = async (textoDirecto?: string) => {
    const texto = (textoDirecto ?? textoEntrada).trim();
    if (!texto || enviando) return;

    // el historial que mando a la IA no incluye el mensaje de bienvenida
    const historialPrevio: MensajeChat[] = mensajes
      .slice(1)
      .map(({ rol, texto: t }) => ({ rol, texto: t }));
    const conUsuario: MensajeUI[] = [...mensajes, { rol: "usuario", texto }];

    setMensajes(conUsuario);
    setTextoEntrada("");
    setEnviando(true);
    bajarAlFinal();

    try {
      const respuesta = await preguntarAlChatbot(historialPrevio, texto, contexto);
      setMensajes([...conUsuario, { rol: "asistente", texto: respuesta }]);
      cambiarAnimo("feliz", 1400);
      guardarConsulta({
        pregunta: texto,
        respuesta,
        fecha: fechaCorta(),
        bebe: bebe?.nombre || "",
      });
    } catch (error) {
      console.log("Error inesperado del chatbot:", error);
      setMensajes([
        ...conUsuario,
        { rol: "asistente", texto: "Ocurrió un error inesperado. Intenta de nuevo en un momento." },
      ]);
    } finally {
      setEnviando(false);
      bajarAlFinal();
    }
  };

  const enviarFoto = async () => {
    if (enviando) return;

    let foto;
    try {
      foto = await tomarFotoMedicamento();
    } catch (error: any) {
      if (error?.message === "SIN_PERMISO_CAMARA") {
        Alert.alert(
          "Permiso de cámara",
          "Para leer la caja del medicamento necesito permiso para usar la cámara. Puedes activarlo en los ajustes del celular."
        );
      } else {
        console.log("Error al abrir la cámara:", error);
        Alert.alert("Error", "No se pudo abrir la cámara.");
      }
      return;
    }
    if (!foto) return;

    const conFoto: MensajeUI[] = [
      ...mensajes,
      { rol: "usuario", texto: "📷 Foto de un medicamento", imagenUri: foto.uri },
    ];
    setMensajes(conFoto);
    setEnviando(true);
    bajarAlFinal();

    const resultado = await analizarFotoMedicamento(foto, contexto, bebe?.nombre);
    setMensajes([...conFoto, { rol: "asistente", texto: resultado }]);
    setEnviando(false);
    cambiarAnimo("feliz", 1400);
    bajarAlFinal();

    guardarConsulta({
      pregunta: `Foto: ${resultado.split("\n")[0].replace("📦 ", "")}`,
      respuesta: resultado,
      fecha: fechaCorta(),
      bebe: bebe?.nombre || "",
      esFoto: true,
    });
  };

  const abrirConsulta = (consulta: Consulta) => {
    setPanel("ninguno");
    setMensajes((actuales) => [
      ...actuales,
      { rol: "usuario", texto: consulta.pregunta },
      { rol: "asistente", texto: consulta.respuesta },
    ]);
    bajarAlFinal();
  };

  // ---------- piezas de la pantalla ----------

  const tarjetaComoResponde = (
    <View style={globalStyles.chatLateralCard}>
      <Text style={globalStyles.chatLateralTitulo} accessibilityRole="header">
        Cómo responde
      </Text>
      {PASOS_COMO_RESPONDE.map((paso, indice) => (
        <View key={indice} style={globalStyles.chatPasoFila}>
          <View style={globalStyles.chatPasoNumero}>
            <Text style={globalStyles.chatPasoNumeroTexto}>{indice + 1}</Text>
          </View>
          <Text style={globalStyles.chatPasoTexto}>{paso}</Text>
        </View>
      ))}
      <Text style={globalStyles.chatLateralNota}>
        Es una herramienta de apoyo: no sustituye el criterio de su pediatra.
        Ante síntomas de urgencia, acude de inmediato a urgencias.
      </Text>
    </View>
  );

  const tarjetaHistorial = (
    <View style={globalStyles.chatLateralCard}>
      <Text style={globalStyles.chatLateralTitulo} accessibilityRole="header">
        Tus últimas consultas
      </Text>
      {consultas.length === 0 ? (
        <Text style={globalStyles.chatPasoTexto}>
          Todavía no tienes consultas. Se guardan solo en este dispositivo.
        </Text>
      ) : (
        consultas.map((consulta, indice) => (
          <TouchableOpacity
            key={indice}
            style={[
              globalStyles.chatConsultaFila,
              indice === consultas.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => abrirConsulta(consulta)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir consulta: ${consulta.pregunta}`}
          >
            <Text style={globalStyles.chatConsultaPregunta} numberOfLines={2}>
              {consulta.pregunta}
            </Text>
            <Text style={globalStyles.chatConsultaDetalle}>
              {consulta.fecha}
              {consulta.bebe ? ` · ${consulta.bebe}` : ""}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const chat = (
    <View style={[globalStyles.chatPrincipalCard, { flex: 1 }]}>
      {/* bebé elegido y sus alergias, como el paciente en MediCore */}
      <View style={globalStyles.chatContextoFila}>
        <Text style={globalStyles.chatContextoEtiqueta}>Bebé</Text>
        {/* los chips se acomodan en varias filas si no caben, así no se
        esconde ningún bebé */}
        <View style={globalStyles.chatBebesLista}>
          {(bebes.length > 0 ? bebes : bebe ? [bebe] : []).map((item) => {
            const elegido = item.id === bebe?.id;
            return (
              <TouchableOpacity
                key={item.id || item.nombre}
                style={[globalStyles.chipButton, elegido && globalStyles.chipButtonActive, { marginBottom: 6 }]}
                onPress={() => setBebe(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: elegido }}
                accessibilityLabel={`Usar los datos de ${item.nombre}`}
              >
                <Text style={[globalStyles.chipText, elegido && globalStyles.chipTextActive]}>
                  {elegido ? "✓ " : ""}
                  {item.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {bebe && (
        <View
          style={[
            globalStyles.chatAlergiaBanner,
            hayAlergias ? globalStyles.chatAlergiaBannerAviso : globalStyles.chatAlergiaBannerOk,
          ]}
          accessible
          accessibilityLabel={
            hayAlergias
              ? `Atención, ${bebe.nombre} tiene alergias registradas`
              : `${bebe.nombre} no tiene alergias registradas`
          }
        >
          <Text style={globalStyles.chatAlergiaTexto}>
            {hayAlergias
              ? `⚠ ${bebe.nombre} (${formatearEdad(edadMeses)}) tiene alergias registradas: ${[
                  tieneAlergias(bebe.alergias) ? bebe.alergias : "",
                  tieneAlergias(bebe.alergiasAlimentarias) ? bebe.alergiasAlimentarias : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}`
              : `🛡️ ${bebe.nombre} (${formatearEdad(edadMeses)}) no tiene alergias registradas. Pedi lo tendrá en cuenta.`}
          </Text>
        </View>
      )}

      {/* el historial del chat es el único ScrollView vertical */}
      <ScrollView
        ref={scrollRef}
        style={globalStyles.chatMessagesArea}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
        // al inicio no bajo, para que se vea la bienvenida y los temas
        onContentSizeChange={() => {
          if (mensajes.length > 1) bajarAlFinal();
        }}
      >
        {mensajes.map((mensaje, indice) => {
          const esUsuario = mensaje.rol === "usuario";
          return (
            <BurbujaAnimada
              key={indice}
              desdeDerecha={esUsuario}
              style={[
                globalStyles.chatBubbleRow,
                esUsuario ? globalStyles.chatBubbleRowUsuario : globalStyles.chatBubbleRowAsistente,
              ]}
            >
              {/* la carita de Pedi junto a sus mensajes */}
              {!esUsuario && (
                <View style={globalStyles.chatAvatar}>
                  <MascotaRobot tamano={34} soloCara />
                </View>
              )}
              <View
                style={[
                  globalStyles.chatBubble,
                  esUsuario ? globalStyles.chatBubbleUsuario : globalStyles.chatBubbleAsistente,
                ]}
              >
                {mensaje.imagenUri && (
                  <Image
                    source={{ uri: mensaje.imagenUri }}
                    style={globalStyles.chatFoto}
                    accessibilityLabel="Foto del medicamento que enviaste"
                  />
                )}
                <TextoConNegritas
                  texto={mensaje.texto}
                  style={esUsuario ? globalStyles.chatBubbleTextUsuario : globalStyles.chatBubbleTextAsistente}
                />

                {/* la bienvenida no es de la IA, esa no se reporta */}
                {!esUsuario && indice > 0 && (
                  <TouchableOpacity
                    onPress={() => reportarRespuesta(mensaje.texto)}
                    accessibilityRole="button"
                    accessibilityLabel="Reportar esta respuesta"
                  >
                    <Text style={globalStyles.chatReportar}>⚑ Reportar respuesta</Text>
                  </TouchableOpacity>
                )}
              </View>
            </BurbujaAnimada>
          );
        })}

        {/* al inicio, temas grandes tipo botones de juguete */}
        {mensajes.length === 1 && !enviando && (
          <BurbujaAnimada style={globalStyles.chatTemas}>
            <Text style={globalStyles.chatTemasTitulo}>¿De qué quieres platicar?</Text>
            <View style={globalStyles.chatTemasGrid}>
              {TEMAS_INICIO.map((tema) => (
                <BotonRebote
                  key={tema.titulo}
                  estiloExterior={{ width: pantallaAncha ? "31.5%" : "47.5%" }}
                  style={[globalStyles.chatTema, colorDeChip(tema.color)]}
                  onPress={() => (tema.pregunta ? enviarMensaje(tema.pregunta) : enviarFoto())}
                  accessibilityLabel={tema.pregunta ? `Preguntar: ${tema.pregunta}` : "Tomar foto de una medicina"}
                >
                  <Text style={globalStyles.chatTemaEmoji}>{tema.emoji}</Text>
                  <Text style={globalStyles.chatTemaTexto}>{tema.titulo}</Text>
                </BotonRebote>
              ))}
            </View>
          </BurbujaAnimada>
        )}

        {enviando && (
          <BurbujaAnimada style={[globalStyles.chatBubbleRow, globalStyles.chatBubbleRowAsistente]}>
            <View style={globalStyles.chatAvatar}>
              <MascotaRobot tamano={34} soloCara />
            </View>
            <View style={[globalStyles.chatBubble, globalStyles.chatBubbleAsistente]}>
              <PuntosEscribiendo />
            </View>
          </BurbujaAnimada>
        )}
      </ScrollView>

      {/* preguntas sugeridas (cuando ya empezó la plática; antes están
      los temas grandes) */}
      {mensajes.length > 1 && (
      <>
      <Text style={globalStyles.chatSugerenciasTitulo}>
        💡 Toca una pregunta (desliza para ver más →)
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        persistentScrollbar
        style={globalStyles.chatSugerencias}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 8, alignItems: "center" }}
      >
        {PREGUNTAS_SUGERIDAS.map((sugerencia) => (
          <BotonRebote
            key={sugerencia.texto}
            style={[globalStyles.chatSugerenciaChip, colorDeChip(sugerencia.color)]}
            onPress={() => enviarMensaje(sugerencia.texto)}
            disabled={enviando}
            accessibilityLabel={`Preguntar: ${sugerencia.texto}`}
          >
            <Text style={globalStyles.chatSugerenciaTexto}>
              {sugerencia.emoji} {sugerencia.texto}
            </Text>
          </BotonRebote>
        ))}
      </ScrollView>
      </>
      )}

      {/* entrada: foto + texto + enviar */}
      <View style={globalStyles.chatEntradaFila}>
        <BotonRebote
          style={globalStyles.chatCamaraBoton}
          onPress={enviarFoto}
          disabled={enviando}
          accessibilityLabel="Tomar foto de un medicamento"
          accessibilityHint="La IA lee la caja y la compara con las alergias del bebé"
        >
          <Text style={globalStyles.chatCamaraIcono}>📷</Text>
        </BotonRebote>

        <TextInput
          placeholder="Escribe tu pregunta..."
          placeholderTextColor={colors.muted}
          value={textoEntrada}
          onChangeText={setTextoEntrada}
          style={globalStyles.chatEntradaInput}
          multiline
          accessibilityLabel="Escribe tu pregunta para el asistente virtual"
          onSubmitEditing={() => enviarMensaje()}
        />

        <BotonRebote
          style={[
            globalStyles.chatEnviarBoton,
            (enviando || !textoEntrada.trim()) && globalStyles.chatSendButtonDisabled,
          ]}
          onPress={() => enviarMensaje()}
          disabled={enviando || !textoEntrada.trim()}
          accessibilityLabel="Enviar mensaje"
        >
          <Text style={globalStyles.chatEnviarTexto}>➤</Text>
        </BotonRebote>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={globalStyles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[globalStyles.container, { flex: 1, maxWidth: 1180 }]}
        onLayout={(e) => setAnchoDisponible(e.nativeEvent.layout.width)}
      >
        {/* encabezado */}
        <View style={globalStyles.chatEncabezado}>
          <TouchableOpacity
            onPress={() => onGo("dashboard")}
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
          >
            <Text style={globalStyles.privacyLinkText}>← Volver al inicio</Text>
          </TouchableOpacity>

          {/* encabezado: el cielo donde vive Pedi. Si lo tocas saluda,
          brinca y te da un tip */}
          <View style={globalStyles.chatHero}>
            <Nube ancho={pantallaAncha ? 170 : 130} posicion={{ left: -18, bottom: -26 }} />
            <Nube ancho={70} posicion={{ right: 18, top: 10 }} opacidad={0.85} />
            <Nube ancho={46} posicion={{ right: 96, top: 34 }} opacidad={0.6} />

            <Pressable
              onPress={tocarPedi}
              style={{ marginLeft: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Pedi, el robotito del asistente"
              accessibilityHint="Toca para que Pedi te dé un consejo de cómo usar el chat"
            >
              <MascotaRobot tamano={pantallaAncha ? 92 : 78} estado={estadoPedi} />
            </Pressable>

            <View style={globalStyles.chatHeroTextos}>
              <Text style={globalStyles.chatHeroTitulo} accessibilityRole="header">
                Pedi
              </Text>
              <Text style={globalStyles.chatHeroSub}>
                {enviando
                  ? "Estoy pensando tu respuesta..."
                  : "Tu asistente virtual. Pregúntame sobre vacunas, vitaminas, comida o cuidados del bebé."}
              </Text>
              <View style={globalStyles.chatHeroFila}>
                <BurbujaAnimada key={tipPedi} style={globalStyles.chatGlobito}>
                  <Text style={globalStyles.chatGlobitoTexto} accessibilityLiveRegion="polite">
                    {TIPS_PEDI[tipPedi]}
                  </Text>
                </BurbujaAnimada>
              </View>
            </View>

            <View style={globalStyles.chatInsigniaHero}>
              <Text style={globalStyles.chatInsigniaTexto}>✨ Con Gemini</Text>
            </View>
          </View>

          {/* en celular la info lateral va en botones para no saturar */}
          {!pantallaAncha && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={[globalStyles.chipButton, panel === "como" && globalStyles.chipButtonActive, { marginBottom: 0 }]}
                onPress={() => setPanel(panel === "como" ? "ninguno" : "como")}
                accessibilityRole="button"
                accessibilityState={{ expanded: panel === "como" }}
              >
                <Text style={[globalStyles.chipText, panel === "como" && globalStyles.chipTextActive]}>
                  ℹ️ Cómo responde
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.chipButton, panel === "historial" && globalStyles.chipButtonActive, { marginBottom: 0 }]}
                onPress={() => setPanel(panel === "historial" ? "ninguno" : "historial")}
                accessibilityRole="button"
                accessibilityState={{ expanded: panel === "historial" }}
              >
                <Text style={[globalStyles.chipText, panel === "historial" && globalStyles.chipTextActive]}>
                  🕘 Últimas consultas
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!pantallaAncha && panel !== "ninguno" && (
          <ScrollView style={{ maxHeight: 260, marginBottom: 10 }}>
            {panel === "como" ? tarjetaComoResponde : tarjetaHistorial}
          </ScrollView>
        )}

        {pantallaAncha ? (
          <View style={{ flex: 1, flexDirection: "row", gap: 16 }}>
            <View style={{ flex: 1 }}>{chat}</View>
            <ScrollView style={{ width: 300, flexGrow: 0 }}>
              {tarjetaComoResponde}
              {tarjetaHistorial}
            </ScrollView>
          </View>
        ) : (
          chat
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
