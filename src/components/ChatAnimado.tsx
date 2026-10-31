import { ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../styles/globalStyles";
import { sinMovimiento } from "../utils/movimiento";

// piezas animadas del chat infantil (las separé de ChatbotScreen para que
// esa pantalla no quedara gigante)

const NATIVO = Platform.OS !== "web";


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
  const entrada = useRef(new Animated.Value(sinMovimiento() ? 1 : 0)).current;

  useEffect(() => {
    if (sinMovimiento()) return;
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
    if (sinMovimiento()) return;
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
  estiloExterior,
  accessibilityLabel,
  accessibilityHint,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  // para anchos en porcentaje (los temas del inicio), va en el Pressable
  estiloExterior?: StyleProp<ViewStyle>;
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
      style={estiloExterior}
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

// ---------- nubecitas del encabezado (el "cielo" donde vive Pedi) ----------
// las dibujo con círculos encima de una base redondeada, sin imágenes
export function Nube({
  ancho,
  posicion,
  opacidad = 1,
}: {
  ancho: number;
  posicion: ViewStyle;
  opacidad?: number;
}) {
  const alto = ancho * 0.34;
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ position: "absolute", width: ancho, height: ancho * 0.62, opacity: opacidad, ...posicion }}
    >
      <View style={{ position: "absolute", bottom: 0, left: 0, width: ancho, height: alto, borderRadius: alto / 2, backgroundColor: colors.white }} />
      <View style={{ position: "absolute", bottom: alto * 0.45, left: ancho * 0.16, width: ancho * 0.36, height: ancho * 0.36, borderRadius: ancho, backgroundColor: colors.white }} />
      <View style={{ position: "absolute", bottom: alto * 0.4, left: ancho * 0.42, width: ancho * 0.44, height: ancho * 0.44, borderRadius: ancho, backgroundColor: colors.white }} />
    </View>
  );
}
