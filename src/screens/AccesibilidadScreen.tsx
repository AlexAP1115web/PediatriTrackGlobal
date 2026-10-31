import { ReactNode, useEffect, useRef } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import BottomNav from "../components/BottomNav";
import MascotaRobot from "../components/MascotaRobot";
import { useAccesibilidad } from "../context/AccesibilidadContext";
import {
  colors,
  ESCALAS_TEXTO,
  globalStyles,
  ModoColor,
  PALETAS,
  TamanoTexto,
} from "../styles/globalStyles";
import { textoEstado } from "../utils/estados";
import { hablar } from "../utils/voz";

type Props = {
  onGo: (screen: string) => void;
};

// pantalla de opciones de accesibilidad. La idea es que la app la pueda
// usar más gente: personas con distintos tipos de daltonismo, con baja
// visión, que se marean con el movimiento, que leen con dificultad o que
// usan lector de pantalla (TalkBack en Android)

const MODOS_COLOR: { modo: ModoColor; titulo: string; descripcion: string }[] = [
  { modo: "normal", titulo: "Colores normales", descripcion: "Los colores de siempre de la app." },
  {
    modo: "rojoVerde",
    titulo: "Daltonismo rojo-verde",
    descripcion: "Protanopía y deuteranopía, los más comunes. Cambia rojo y verde por azul, naranja y bermellón.",
  },
  {
    modo: "azulAmarillo",
    titulo: "Daltonismo azul-amarillo",
    descripcion: "Tritanopía. Usa verde azulado y rojo, que sí se distinguen.",
  },
  {
    modo: "grises",
    titulo: "Escala de grises",
    descripcion: "Para quien no distingue colores (acromatopsia). Todo se reconoce por ícono y palabra.",
  },
];

const TAMANOS: { tamano: TamanoTexto; etiqueta: string }[] = [
  { tamano: "normal", etiqueta: "Normal" },
  { tamano: "grande", etiqueta: "Grande" },
  { tamano: "muyGrande", etiqueta: "Muy grande" },
];

// tarjetas blancas para las opciones (las helpCard amarillas las dejo para
// los avisos)
const tarjeta = () => ({
  backgroundColor: colors.white,
  borderRadius: 20,
  padding: 14,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: colors.border,
});
const tituloOpcion = () => [globalStyles.helpTitle, { color: colors.text }];
const textoOpcion = () => [globalStyles.helpText, { color: colors.muted }];

// al cambiar una opción la app vuelve a dibujar la pantalla; guardo hasta
// dónde había bajado el usuario para regresarlo ahí y que no "brinque"
let ultimoScroll = 0;

function FilaSwitch({
  titulo,
  descripcion,
  valor,
  onCambiar,
  children,
}: {
  titulo: string;
  descripcion: string;
  valor: boolean;
  onCambiar: (valor: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <View style={tarjeta()}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={tituloOpcion()}>{titulo}</Text>
          <Text style={textoOpcion()}>{descripcion}</Text>
        </View>
        <Switch
          value={valor}
          onValueChange={onCambiar}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel={titulo.replace(/^\S+\s/, "")}
          accessibilityHint={descripcion}
        />
      </View>
      {children}
    </View>
  );
}

export default function AccesibilidadScreen({ onGo }: Props) {
  const {
    modoColor,
    tamanoTexto,
    altoContraste,
    menosAnimaciones,
    lenguajeFacil,
    leerEnVozAlta,
    cambiarOpciones,
    restablecer,
  } = useAccesibilidad();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollTo({ y: ultimoScroll, animated: false }), 60);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        ref={scrollRef}
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          ultimoScroll = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={100}
      >
        <View style={globalStyles.headerCard}>
          <TouchableOpacity
            onPress={() => {
              ultimoScroll = 0;
              onGo("dashboard");
            }}
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
          >
            <Text style={globalStyles.privacyLinkText}>← Volver al inicio</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
            <MascotaRobot tamano={56} estado="saludando" />
            <View style={{ flex: 1 }}>
              <Text style={globalStyles.title} accessibilityRole="header">
                Accesibilidad
              </Text>
              <Text style={[globalStyles.subtitle, { marginTop: 4 }]}>
                Ajusta la app para que te sea cómoda de ver, de leer y de usar.
                Los cambios se guardan en este dispositivo.
              </Text>
            </View>
          </View>
        </View>

        {/* ---------- colores ---------- */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🎨 Colores
        </Text>

        <View accessibilityRole="radiogroup" accessibilityLabel="Modo de color">
          {MODOS_COLOR.map((opcion) => {
            const elegido = modoColor === opcion.modo;
            const paleta = PALETAS[opcion.modo];
            return (
              <TouchableOpacity
                key={opcion.modo}
                onPress={() => cambiarOpciones({ modoColor: opcion.modo })}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegido }}
                accessibilityLabel={opcion.titulo}
                accessibilityHint={opcion.descripcion}
                style={[
                  tarjeta(),
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderWidth: elegido ? 3 : 1,
                    borderColor: elegido ? colors.primaryDark : colors.border,
                  },
                ]}
              >
                {/* muestrita de la paleta: principal, bien, alerta y acento */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", width: 44, gap: 4 }}>
                  {[paleta.primary, paleta.green, paleta.red, paleta.pink].map((color, i) => (
                    <View key={i} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color, borderWidth: 1, borderColor: colors.border }} />
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={tituloOpcion()}>{opcion.titulo}</Text>
                  <Text style={textoOpcion()}>{opcion.descripcion}</Text>
                </View>
                <Text style={{ fontSize: 22, color: elegido ? colors.primaryDark : colors.muted }}>
                  {elegido ? "◉" : "○"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FilaSwitch
          titulo="🔲 Alto contraste"
          descripcion="Letras negras, bordes más marcados y botones más oscuros para leer mejor."
          valor={altoContraste}
          onCambiar={(valor) => cambiarOpciones({ altoContraste: valor })}
        />

        <View style={[tarjeta(), { gap: 10 }]}>
          <Text style={tituloOpcion()}>Así se ven los estados</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <View style={[globalStyles.statusBadge, globalStyles.statusApplied]}>
              <Text style={globalStyles.statusText}>{textoEstado("Aplicada")}</Text>
            </View>
            <View style={[globalStyles.statusBadge, globalStyles.statusNext]}>
              <Text style={globalStyles.statusText}>{textoEstado("Próxima")}</Text>
            </View>
            <View style={[globalStyles.statusBadge, globalStyles.statusPending]}>
              <Text style={globalStyles.statusText}>{textoEstado("Atrasada")}</Text>
            </View>
          </View>
        </View>

        {/* ---------- tamaño de letra ---------- */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🔠 Tamaño de letra
        </Text>

        <View style={tarjeta()}>
          <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup">
            {TAMANOS.map((opcion) => {
              const elegido = tamanoTexto === opcion.tamano;
              return (
                <TouchableOpacity
                  key={opcion.tamano}
                  onPress={() => cambiarOpciones({ tamanoTexto: opcion.tamano })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: elegido }}
                  accessibilityLabel={`Letra ${opcion.etiqueta}`}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 10,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: elegido ? colors.primaryDark : colors.border,
                    backgroundColor: elegido ? colors.primaryDark : colors.white,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Nunito_900Black",
                      fontSize: Math.round(18 * ESCALAS_TEXTO[opcion.tamano]),
                      color: elegido ? colors.white : colors.primaryDark,
                    }}
                  >
                    A
                  </Text>
                  <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: elegido ? colors.white : colors.text }}>
                    {opcion.etiqueta}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[textoOpcion(), { marginTop: 10 }]}>
            Así se leerá el texto en toda la app.
          </Text>
        </View>

        {/* ---------- Pedi ---------- */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🤖 Pedi, el asistente
        </Text>

        <FilaSwitch
          titulo="🔊 Leer las respuestas en voz alta"
          descripcion="Pedi lee cada respuesta con la voz del celular. También puedes tocar 🔊 Escuchar en cualquier mensaje."
          valor={leerEnVozAlta}
          onCambiar={(valor) => cambiarOpciones({ leerEnVozAlta: valor })}
        >
          <TouchableOpacity
            style={[globalStyles.chatAccion, { alignSelf: "flex-start", marginTop: 10 }]}
            onPress={() => hablar("¡Hola! Soy Pedi. Así sonará mi voz cuando te lea las respuestas.")}
            accessibilityRole="button"
            accessibilityLabel="Probar la voz de Pedi"
          >
            <Text style={globalStyles.chatAccionTexto}>🔊 Probar la voz</Text>
          </TouchableOpacity>
        </FilaSwitch>

        <FilaSwitch
          titulo="📖 Lenguaje fácil"
          descripcion="Pedi contesta con frases cortas y palabras de todos los días, sin términos técnicos."
          valor={lenguajeFacil}
          onCambiar={(valor) => cambiarOpciones({ lenguajeFacil: valor })}
        />

        {/* ---------- movimiento ---------- */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🌀 Movimiento
        </Text>

        <FilaSwitch
          titulo="⏸ Menos animaciones"
          descripcion="Pedi, las burbujas y el confeti se quedan quietos. Útil si el movimiento te marea o te distrae. Si tu celular tiene activado reducir movimiento, la app empieza con esta opción encendida."
          valor={menosAnimaciones}
          onCambiar={(valor) => cambiarOpciones({ menosAnimaciones: valor })}
        />

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>Lo que ya viene activado</Text>
          <Text style={globalStyles.helpText}>
            • Cada estado tiene ícono y palabra, no solo color (✓ aplicada,
            ⏳ próxima, ⚠ atrasada, ○ pendiente).
            {"\n"}• Los botones, títulos y estados tienen descripciones para
            lectores de pantalla como TalkBack.
            {"\n"}• En cada módulo hay un botón "¿Cómo funciona?" donde la IA te
            explica con palabras sencillas para qué sirve y cómo usarlo.
          </Text>
        </View>

        <TouchableOpacity
          style={[globalStyles.chatAccion, { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 18, marginTop: 4 }]}
          onPress={restablecer}
          accessibilityRole="button"
          accessibilityLabel="Restablecer todas las opciones de accesibilidad"
        >
          <Text style={globalStyles.chatAccionTexto}>↺ Restablecer todo</Text>
        </TouchableOpacity>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="accesibilidad" />
    </View>
  );
}
