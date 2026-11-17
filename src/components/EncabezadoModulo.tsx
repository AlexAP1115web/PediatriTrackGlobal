import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, Platform, Text, TouchableOpacity, View } from "react-native";

import { colors, globalStyles, paletaNormal } from "../styles/globalStyles";
import { sinMovimiento } from "../utils/movimiento";

const NATIVO = Platform.OS !== "web";

export type TonoModulo = "azul" | "rosa" | "verde" | "ambar" | "morado" | "rojo" | "gris" | "turquesa";

// cada módulo tiene su color para reconocerlo de un vistazo. Todos son tonos
// oscuros para que el texto blanco se lea bien (contraste mayor a 4.5:1)
const FONDOS: Record<TonoModulo, string> = {
  azul: "#0369A1",
  rosa: "#BE185D",
  verde: "#0F766E",
  ambar: "#B45309",
  morado: "#6D28D9",
  rojo: "#BE123C",
  gris: "#334155",
  turquesa: "#0E7490",
};
const ADORNOS: Record<TonoModulo, string> = {
  azul: "#38BDF8",
  rosa: "#F472B6",
  verde: "#2DD4BF",
  ambar: "#FBBF24",
  morado: "#A78BFA",
  rojo: "#FB7185",
  gris: "#94A3B8",
  turquesa: "#22D3EE",
};

type Props = {
  icono: string;
  titulo: string;
  subtitulo?: string;
  tono?: TonoModulo;
  // texto chiquito arriba del título (por ejemplo "Módulo")
  etiqueta?: string;
  onVolver?: () => void;
  // en pantallas que se vuelven a dibujar seguido (Accesibilidad) no animo
  animar?: boolean;
  children?: ReactNode;
};

// Encabezado de color que uso arriba de cada módulo. Entra con animación,
// el ícono rebota y los circulitos de adorno flotan. Con los modos de
// daltonismo, escala de grises o alto contraste uso el color principal del
// tema en vez del color propio del módulo.
export default function EncabezadoModulo({
  icono,
  titulo,
  subtitulo,
  tono = "azul",
  etiqueta,
  onVolver,
  animar = true,
  children,
}: Props) {
  const quieto = sinMovimiento() || !animar;
  const temaNormal = colors.primary === paletaNormal.primary && colors.text === paletaNormal.text;
  const fondo = temaNormal ? FONDOS[tono] : colors.primaryDark;
  const adorno = temaNormal ? ADORNOS[tono] : colors.primaryLight;

  const entrada = useRef(new Animated.Value(quieto ? 1 : 0)).current;
  const icono_ = useRef(new Animated.Value(quieto ? 1 : 0)).current;
  const flotar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (quieto) return;
    Animated.parallel([
      Animated.timing(entrada, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVO }),
      Animated.spring(icono_, { toValue: 1, friction: 4, tension: 90, delay: 180, useNativeDriver: NATIVO }),
    ]).start();
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(flotar, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
        Animated.timing(flotar, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
      ])
    );
    bucle.start();
    return () => bucle.stop();
  }, []);

  return (
    <Animated.View
      style={[
        globalStyles.encabezado,
        { backgroundColor: fondo },
        {
          opacity: entrada,
          transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        },
      ]}
    >
      {/* adornos */}
      <Animated.View
        pointerEvents="none"
        style={[
          globalStyles.encabezadoCirculoGrande,
          { backgroundColor: adorno },
          { transform: [{ translateY: flotar.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          globalStyles.encabezadoCirculoChico,
          { borderColor: adorno },
          { transform: [{ translateY: flotar.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] },
        ]}
      />

      {onVolver && (
        <TouchableOpacity onPress={onVolver} accessibilityRole="button" accessibilityLabel="Volver al inicio" style={globalStyles.encabezadoVolver}>
          <Text style={globalStyles.encabezadoVolverTexto}>← Inicio</Text>
        </TouchableOpacity>
      )}

      <View style={globalStyles.encabezadoFila}>
        <Animated.View
          style={[
            globalStyles.encabezadoIcono,
            {
              transform: [
                { scale: icono_.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                { rotate: icono_.interpolate({ inputRange: [0, 1], outputRange: ["-20deg", "0deg"] }) },
              ],
            },
          ]}
        >
          <Text style={globalStyles.encabezadoIconoTexto}>{icono}</Text>
        </Animated.View>
        <View style={{ flex: 1 }}>
          {!!etiqueta && <Text style={globalStyles.encabezadoEtiqueta}>{etiqueta}</Text>}
          <Text style={globalStyles.encabezadoTitulo} accessibilityRole="header">
            {titulo}
          </Text>
        </View>
      </View>

      {!!subtitulo && <Text style={globalStyles.encabezadoSubtitulo}>{subtitulo}</Text>}
      {children}
    </Animated.View>
  );
}
