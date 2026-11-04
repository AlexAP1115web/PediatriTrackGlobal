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
} from "../components/ChatAnimado";
import MarkdownPedi from "../components/MarkdownPedi";
import MascotaRobot, { EstadoMascota } from "../components/MascotaRobot";
import { useAccesibilidad } from "../context/AccesibilidadContext";
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
  separarSeguimiento,
} from "../services/chatbotService";
import {
  analizarFotoMedicamento,
  tomarFotoMedicamento,
} from "../services/fotoMedicamento";
import { colors, globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";
import { calcularEdadEnMeses, formatearEdad } from "../utils/edad";
import { guardarPreferencia, leerPreferencia } from "../utils/preferencias";
import { callar, hablar } from "../utils/voz";

type Props = {
  onGo: (screen: string) => void;
};

// en pantalla guardo también la foto (si el mensaje fue una foto) y las
// preguntas de seguimiento que sugiere Pedi
type MensajeUI = MensajeChat & { imagenUri?: string; seguimiento?: string[] };

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
    "### ¡Hola! 👋 Soy Pedi\nEl robotito ayudante de **PediatriTrack Global**. Te puedo ayudar con:\n- **Vacunas** y vitaminas\n- **Comida** según la edad del bebé\n- **Cuidados** de todos los días\n- Leer la caja de una medicina con 📷\n\n> No sustituyo a un pediatra. Si hay síntomas o una urgencia, consulta a un profesional de salud.",
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
  "Aquí abajo eliges al bebé y yo cuido sus alergias",
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
  const { leerEnVozAlta, menosAnimaciones, cambiarOpciones } = useAccesibilidad();
  const [animoPedi, setAnimoPedi] = useState<EstadoMascota>("saludando");
  const [tipPedi, setTipPedi] = useState(0);
  // el botón de Pedi en el chat cambia la misma opción "Menos animaciones"
  // de Accesibilidad (sin volver a dibujar la pantalla, para no perder la
  // plática)
  const pediQuieto = menosAnimaciones;
  // qué mensaje se está leyendo en voz alta (null = ninguno) y cuál se está
  // preparando (la voz de Gemini tarda un par de segundos en generarse)
  const [leyendo, setLeyendo] = useState<number | null>(null);
  const [preparandoVoz, setPreparandoVoz] = useState<number | null>(null);
  const escribiendo = textoEntrada.trim().length > 0;
  // Pedi piensa mientras llega la respuesta, mueve la boca mientras lee,
  // y te mira mientras escribes
  const estadoPedi: EstadoMascota = enviando
    ? "pensando"
    : leyendo !== null
      ? "hablando"
      : escribiendo && animoPedi === "normal"
        ? "escuchando"
        : animoPedi;
  const temporizadorPedi = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cambiarAnimo = (animo: EstadoMascota, duracion: number) => {
    if (temporizadorPedi.current) clearTimeout(temporizadorPedi.current);
    setAnimoPedi(animo);
    temporizadorPedi.current = setTimeout(() => setAnimoPedi("normal"), duracion);
  };

  useEffect(() => {
    cambiarAnimo("saludando", 2600);
    return () => {
      if (temporizadorPedi.current) clearTimeout(temporizadorPedi.current);
      callar();
    };
  }, []);

  const cambiarPediQuieto = () => {
    const quieto = !pediQuieto;
    cambiarOpciones({ menosAnimaciones: quieto }, false);
    if (!quieto) cambiarAnimo("feliz", 3200);
  };

  // 🔊 leer o dejar de leer un mensaje
  const leerMensaje = (indice: number, texto: string) => {
    if (leyendo === indice || preparandoVoz === indice) {
      callar();
      setLeyendo(null);
      setPreparandoVoz(null);
      return;
    }
    setLeyendo(null);
    setPreparandoVoz(indice);
    hablar(texto, {
      alEmpezar: () => {
        setPreparandoVoz((actual) => (actual === indice ? null : actual));
        setLeyendo(indice);
      },
      alTerminar: () => {
        setPreparandoVoz((actual) => (actual === indice ? null : actual));
        setLeyendo((actual) => (actual === indice ? null : actual));
      },
    });
  };

  const tocarPedi = () => {
    setTipPedi((actual) => (actual + 1) % TIPS_PEDI.length);
    cambiarAnimo(animoPedi === "feliz" ? "saludando" : "feliz", 3000);
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

  // cuando llega la respuesta de Pedi no bajo hasta el final (así solo se
  // veían las últimas líneas): llevo la pantalla al INICIO de la respuesta
  // para que se lea de arriba hacia abajo. Para eso guardo dónde quedó la
  // tarjeta del chat y la lista de mensajes dentro del scroll
  const respuestaPorMostrar = useRef<number | null>(null);
  const yTarjeta = useRef(0);
  const yLista = useRef(0);

  const mostrarRespuesta = (indice: number) => {
    respuestaPorMostrar.current = indice;
  };

  const alMedirMensaje = (indice: number, y: number) => {
    if (respuestaPorMostrar.current !== indice) return;
    respuestaPorMostrar.current = null;
    // en celular todo va en un solo scroll (encabezado + tarjeta + mensajes)
    const inicio = (pantallaAncha ? 0 : yTarjeta.current) + yLista.current + y;
    setTimeout(
      () => scrollRef.current?.scrollTo({ y: Math.max(0, inicio - 12), animated: true }),
      60
    );
  };

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
      const respuestaCompleta = await preguntarAlChatbot(historialPrevio, texto, contexto);
      const { texto: respuesta, seguimiento } = separarSeguimiento(respuestaCompleta);
      setMensajes([...conUsuario, { rol: "asistente", texto: respuesta, seguimiento }]);
      mostrarRespuesta(conUsuario.length);
      cambiarAnimo("feliz", 3200);
      if (leerEnVozAlta) leerMensaje(conUsuario.length, respuesta);
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
      mostrarRespuesta(conUsuario.length);
    } finally {
      setEnviando(false);
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
    mostrarRespuesta(conFoto.length);
    setEnviando(false);
    cambiarAnimo("feliz", 3200);
    if (leerEnVozAlta) leerMensaje(conFoto.length, resultado);

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
    mostrarRespuesta(mensajes.length + 1);
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

  // bebé elegido y sus alergias, como el paciente en MediCore
  const contextoBebe = (
    <>
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
                // con nombres largos el chip baja de línea en vez de salirse
                style={[globalStyles.chipButton, elegido && globalStyles.chipButtonActive, { marginBottom: 6, maxWidth: "100%" }]}
                onPress={() => setBebe(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: elegido }}
                accessibilityLabel={`Usar los datos de ${item.nombre}`}
              >
                <Text style={[globalStyles.chipText, elegido && globalStyles.chipTextActive, { flexShrink: 1 }]}>
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
    </>
  );

  // los mensajes, las preguntas de seguimiento, los temas del inicio y los
  // puntitos de "escribiendo". En celular lleva su propio fondo y espacio
  const listaMensajes = (
    <View
      style={!pantallaAncha && globalStyles.chatMensajesMovil}
      onLayout={(e) => (yLista.current = e.nativeEvent.layout.y)}
    >
      {mensajes.map((mensaje, indice) => {
        const esUsuario = mensaje.rol === "usuario";
        return (
          // mido cada mensaje para poder llevar la pantalla al inicio de
          // la respuesta nueva
          <View key={indice} onLayout={(e) => alMedirMensaje(indice, e.nativeEvent.layout.y)}>
            <BurbujaAnimada
              desdeDerecha={esUsuario}
              style={[
                globalStyles.chatBubbleRow,
                esUsuario ? globalStyles.chatBubbleRowUsuario : globalStyles.chatBubbleRowAsistente,
              ]}
            >
              {/* la carita de Pedi junto a sus mensajes */}
              {!esUsuario && (
                <View style={globalStyles.chatAvatar}>
                  <MascotaRobot tamano={34} soloCara quieto={pediQuieto} />
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
                {esUsuario ? (
                  <Text style={globalStyles.chatBubbleTextUsuario}>{mensaje.texto}</Text>
                ) : (
                  // las respuestas de Pedi vienen en Markdown
                  <MarkdownPedi texto={mensaje.texto} style={globalStyles.chatBubbleTextAsistente} />
                )}

                {!esUsuario && (
                  <View style={globalStyles.chatAccionesFila}>
                    <TouchableOpacity
                      style={[
                        globalStyles.chatAccion,
                        (leyendo === indice || preparandoVoz === indice) && globalStyles.chatAccionActiva,
                      ]}
                      onPress={() => leerMensaje(indice, mensaje.texto)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        leyendo === indice || preparandoVoz === indice
                          ? "Dejar de leer en voz alta"
                          : "Escuchar esta respuesta en voz alta"
                      }
                    >
                      <Text
                        style={[
                          globalStyles.chatAccionTexto,
                          (leyendo === indice || preparandoVoz === indice) && globalStyles.chatAccionTextoActiva,
                        ]}
                      >
                        {preparandoVoz === indice ? "⏳ Preparando voz..." : leyendo === indice ? "⏹ Detener" : "🔊 Escuchar"}
                      </Text>
                    </TouchableOpacity>

                    {/* la bienvenida no es de la IA, esa no se reporta */}
                    {indice > 0 && (
                      <TouchableOpacity
                        style={globalStyles.chatAccion}
                        onPress={() => reportarRespuesta(mensaje.texto)}
                        accessibilityRole="button"
                        accessibilityLabel="Reportar esta respuesta"
                      >
                        <Text style={globalStyles.chatAccionTexto}>⚑ Reportar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </BurbujaAnimada>
          </View>
        );
      })}

      {/* preguntas de seguimiento que sugiere Pedi después de responder */}
      {!enviando &&
        mensajes.length > 1 &&
        (mensajes[mensajes.length - 1].seguimiento?.length ?? 0) > 0 && (
          <BurbujaAnimada style={globalStyles.chatSeguimiento}>
            <Text style={globalStyles.chatSeguimientoTitulo}>Sigue preguntando 👇</Text>
            <View style={globalStyles.chatSeguimientoLista}>
              {mensajes[mensajes.length - 1].seguimiento!.map((pregunta, i) => (
                <BotonRebote
                  key={pregunta}
                  style={[globalStyles.chatSugerenciaChip, colorDeChip(["azul", "rosa", "verde"][i % 3])]}
                  onPress={() => enviarMensaje(pregunta)}
                  accessibilityLabel={`Preguntar: ${pregunta}`}
                >
                  <Text style={globalStyles.chatSugerenciaTexto}>{pregunta}</Text>
                </BotonRebote>
              ))}
            </View>
          </BurbujaAnimada>
        )}

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
            <MascotaRobot tamano={34} soloCara estado="pensando" quieto={pediQuieto} />
          </View>
          <View style={[globalStyles.chatBubble, globalStyles.chatBubbleAsistente]}>
            <PuntosEscribiendo />
          </View>
        </BurbujaAnimada>
      )}
    </View>
  );

  // preguntas sugeridas (cuando ya empezó la plática; antes están los
  // temas grandes)
  const sugerencias = mensajes.length > 1 && (
    <>
      <Text style={globalStyles.chatSugerenciasTitulo}>
        💡 Toca una pregunta (desliza para ver más →)
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={globalStyles.chatSugerencias}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 10, alignItems: "center" }}
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
  );

  // entrada: foto + texto + enviar
  const entrada = (
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
  );

  // mientras Pedi piensa, bajo para que se vea tu pregunta y los puntitos
  const alCrecerContenido = () => {
    if (enviando) bajarAlFinal();
  };

  // encabezado: el cielo donde vive Pedi. Si lo tocas saluda, brinca y te
  // da un tip. En celular es más bajito para dejarle lugar a la plática
  const encabezado = (
    <View style={globalStyles.chatEncabezado}>
      <TouchableOpacity
        onPress={() => onGo("dashboard")}
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio"
      >
        <Text style={globalStyles.privacyLinkText}>← Volver al inicio</Text>
      </TouchableOpacity>

      <View style={[globalStyles.chatHero, !pantallaAncha && globalStyles.chatHeroMovil]}>
        {/* en celular las nubes van abajo, para que no tapen el nombre */}
        {pantallaAncha ? (
          <>
            <Nube ancho={170} posicion={{ left: -18, bottom: -26 }} />
            <Nube ancho={70} posicion={{ right: 18, top: 10 }} opacidad={0.85} />
            <Nube ancho={46} posicion={{ right: 96, top: 34 }} opacidad={0.6} />
          </>
        ) : (
          <>
            <Nube ancho={104} posicion={{ left: -20, bottom: -24 }} />
            <Nube ancho={56} posicion={{ right: -10, bottom: -6 }} opacidad={0.7} />
          </>
        )}

        <Pressable
          onPress={tocarPedi}
          style={{ marginLeft: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Pedi, el robotito del asistente"
          accessibilityHint="Toca para que Pedi te dé un consejo de cómo usar el chat"
        >
          <MascotaRobot tamano={pantallaAncha ? 104 : 70} estado={estadoPedi} quieto={pediQuieto} />
        </Pressable>

        <View style={globalStyles.chatHeroTextos}>
          <Text
            style={[globalStyles.chatHeroTitulo, !pantallaAncha && globalStyles.chatHeroTituloMovil]}
            accessibilityRole="header"
          >
            Pedi
          </Text>
          <Text style={globalStyles.chatHeroSub}>
            {enviando
              ? "Estoy pensando tu respuesta..."
              : leyendo !== null
                ? "Te estoy leyendo la respuesta 🔊"
                : escribiendo
                  ? "Te escucho... 👀"
                  : pantallaAncha
                    ? "Tu asistente virtual. Pregúntame sobre vacunas, vitaminas, comida o cuidados del bebé."
                    : "Pregúntame de vacunas, vitaminas, comida o cuidados del bebé."}
          </Text>
          <View style={globalStyles.chatHeroFila}>
            <BurbujaAnimada key={tipPedi} style={globalStyles.chatGlobito}>
              <Text style={globalStyles.chatGlobitoTexto} accessibilityLiveRegion="polite">
                {TIPS_PEDI[tipPedi]}
              </Text>
            </BurbujaAnimada>
            <TouchableOpacity
              style={globalStyles.chatBotonQuieto}
              onPress={cambiarPediQuieto}
              accessibilityRole="switch"
              accessibilityState={{ checked: !pediQuieto }}
              accessibilityLabel="Movimiento de Pedi"
              accessibilityHint={pediQuieto ? "Toca para que Pedi se vuelva a mover" : "Toca para que Pedi se quede quieto"}
            >
              <Text style={globalStyles.chatBotonQuietoTexto}>
                {pediQuieto ? "▶ Que se mueva" : "⏸ Pedi quieto"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={globalStyles.chatInsigniaHero}>
          <Text style={globalStyles.chatInsigniaTexto}>✨ Con Gemini</Text>
        </View>
      </View>

      {/* en celular la info lateral va en botones para no saturar (si no
      caben en una fila, bajan a la siguiente) */}
      {!pantallaAncha && (
        <View style={globalStyles.chatPanelFila}>
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
  );

  return (
    <KeyboardAvoidingView
      style={globalStyles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          globalStyles.container,
          { flex: 1, maxWidth: 1180 },
          !pantallaAncha && { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 },
        ]}
        onLayout={(e) => setAnchoDisponible(e.nativeEvent.layout.width)}
      >
        {pantallaAncha ? (
          // computadora o tablet: el chat a la izquierda con su propio
          // scroll y la info a la derecha
          <>
            {encabezado}
            <View style={{ flex: 1, flexDirection: "row", gap: 16 }}>
              <View style={[globalStyles.chatPrincipalCard, { flex: 1 }]}>
                {contextoBebe}
                <ScrollView
                  ref={scrollRef}
                  style={globalStyles.chatMessagesArea}
                  contentContainerStyle={{ padding: 12 }}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={alCrecerContenido}
                >
                  {listaMensajes}
                </ScrollView>
                {sugerencias}
                {entrada}
              </View>
              <ScrollView style={{ width: 300, flexGrow: 0 }}>
                {tarjetaComoResponde}
                {tarjetaHistorial}
              </ScrollView>
            </View>
          </>
        ) : (
          // celular: antes el encabezado, el bebé y las sugerencias se
          // comían la pantalla y la plática quedaba aplastada. Ahora todo
          // va en un solo scroll y abajo solo queda fija la caja de escribir
          <>
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={alCrecerContenido}
            >
              {encabezado}
              {panel !== "ninguno" && (panel === "como" ? tarjetaComoResponde : tarjetaHistorial)}
              <View
                style={globalStyles.chatPrincipalCard}
                onLayout={(e) => (yTarjeta.current = e.nativeEvent.layout.y)}
              >
                {contextoBebe}
                {listaMensajes}
                {sugerencias}
              </View>
            </ScrollView>
            <View style={globalStyles.chatEntradaMovil}>{entrada}</View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
