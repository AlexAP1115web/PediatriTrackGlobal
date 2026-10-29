import { ReactNode, useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../styles/globalStyles";

// piezas animadas del chat infantil (las separé de ChatbotScreen para que
// esa pantalla no quedara gigante)

const NATIVO = Platform.OS !== "web";

// reviso una sola vez si el usuario pidió reducir movimiento
let reducirMovimiento = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((valor) => {
    reducirMovimiento = valor;
  })
  .catch(() => {});

// ---------- burbuja que "aparece" (sube, se agranda y se hace visible) ----------
export function BurbujaAnimada({
  children,
  desdeDerecha = false,
  style,
}: {
  children: ReactNode;
  desdeDerecha?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const entrada = useRef(new Animated.Value(reducirMovimiento ? 1 : 0)).current;

  useEffect(() => {
    if (reducirMovimiento) return;
    Animated.spring(entrada, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: entrada,
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            { translateX: entrada.interpolate({ inputRange: [0, 1], outputRange: [desdeDerecha ? 18 : -18, 0] }) },
            { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ---------- tres puntitos de colores que brincan mientras Pedi escribe ----------
export function PuntosEscribiendo() {
  const puntos = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    if (reducirMovimiento) return;
    const animaciones = puntos.map((valor, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(valor, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: NATIVO }),
          Animated.timing(valor, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: NATIVO }),
          Animated.delay((2 - i) * 150),
        ])
      )
    );
    animaciones.forEach((a) => a.start());
    return () => animaciones.forEach((a) => a.stop());
  }, []);

  const colores = [colors.primary, colors.pink, colors.green];

  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 }}
      accessible
      accessibilityLabel="Pedi está escribiendo"
    >
      {puntos.map((valor, i) => (
        <Animated.View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colores[i],
            transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }],
          }}
        />
      ))}
    </View>
  );
}

// ---------- botón que rebota al tocarlo (para las preguntas de colores) ----------
export function BotonRebote({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
  accessibilityHint,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const escala = useRef(new Animated.Value(1)).current;

  const animar = (valor: number) =>
    Animated.spring(escala, { toValue: valor, friction: 4, tension: 160, useNativeDriver: NATIVO }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animar(0.9)}
      onPressOut={() => animar(1)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[style, { transform: [{ scale: escala }] }, disabled && { opacity: 0.55 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---------- burbujitas y estrellas que flotan en el fondo del encabezado ----------
function Decoracion({
  tipo,
  tamano,
  color,
  posicion,
  retraso,
}: {
  tipo: "burbuja" | "estrella";
  tamano: number;
  color: string;
  posicion: ViewStyle;
  retraso: number;
}) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducirMovimiento) return;
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.delay(retraso),
        Animated.timing(valor, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
        Animated.timing(valor, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
      ])
    );
    bucle.start();
    return () => bucle.stop();
  }, []);

  const estilo = {
    position: "absolute" as const,
    ...posicion,
    opacity: valor.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] }),
    transform: [
      { translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
      { scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) },
    ],
  };

  if (tipo === "estrella") {
    return (
      <Animated.Text style={[estilo, { fontSize: tamano, color }]} importantForAccessibility="no">
        ★
      </Animated.Text>
    );
  }
  return (
    <Animated.View
      style={[estilo, { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: color }]}
    />
  );
}

export function FondoDivertido() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Decoracion tipo="burbuja" tamano={46} color={colors.pinkLight} posicion={{ top: -10, right: 30 }} retraso={0} />
      <Decoracion tipo="burbuja" tamano={26} color={colors.greenLight} posicion={{ bottom: 8, right: 90 }} retraso={500} />
      <Decoracion tipo="burbuja" tamano={18} color={colors.yellow} posicion={{ top: 14, left: "48%" }} retraso={900} />
      <Decoracion tipo="estrella" tamano={16} color={colors.pink} posicion={{ top: 10, right: 12 }} retraso={300} />
      <Decoracion tipo="estrella" tamano={13} color={colors.primary} posicion={{ bottom: 12, right: 24 }} retraso={1200} />
      <Decoracion tipo="estrella" tamano={11} color={colors.warning} posicion={{ top: 40, left: "60%" }} retraso={700} />
    </View>
  );
}

// ---------- texto con negritas ----------
// a veces Gemini manda **palabras** con asteriscos; aquí los convierto en
// negritas de verdad y cambio los "* " del inicio de línea por viñetas
export function TextoConNegritas({ texto, style }: { texto: string; style?: StyleProp<TextStyle> }) {
  const limpio = texto.replace(/^\s*[*-]\s+/gm, "• ");
  const partes = limpio.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "");

  return (
    <Text style={style}>
      {partes.map((parte, i) =>
        parte.startsWith("**") && parte.endsWith("**") ? (
          <Text key={i} style={{ fontWeight: "900" }}>
            {parte.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{parte.replace(/\*\*/g, "")}</Text>
        )
      )}
    </Text>
  );
}
