import { useEffect, useRef } from "react";
import { Animated, Platform, Text, TouchableOpacity, View } from "react-native";

import { globalStyles } from "../styles/globalStyles";
import { sinMovimiento } from "../utils/movimiento";

type Props = {
  onGo: (screen: string) => void;
  active: string;
};

const NATIVO = Platform.OS !== "web";

const PESTANAS = [
  { ruta: "dashboard", icono: "💉", texto: "Vacunas", pista: "Ir al panel de vacunación" },
  { ruta: "vitaminas", icono: "💊", texto: "Vitaminas", pista: "Ir al panel de vitaminación" },
  { ruta: "documentos", icono: "📄", texto: "Docs", pista: "Ir a documentos médicos" },
  { ruta: "alimentacion", icono: "🍎", texto: "Comida", pista: "Ir a alimentación complementaria" },
  { ruta: "info", icono: "ℹ️", texto: "Info", pista: "Ir a información pediátrica" },
];

// barra de abajo. La pestaña activa "brinca" un poquito al llegar a la
// pantalla y lleva una rayita de color debajo
export default function BottomNav({ onGo, active }: Props) {
  const quieto = sinMovimiento();
  const rebote = useRef(new Animated.Value(quieto ? 1 : 0)).current;

  useEffect(() => {
    if (quieto) return;
    Animated.spring(rebote, { toValue: 1, friction: 4, tension: 120, useNativeDriver: NATIVO }).start();
  }, []);

  return (
    <View style={globalStyles.bottomNav} accessibilityRole="tablist" accessibilityLabel="Navegación principal">
      {PESTANAS.map((p) => {
        const activa = active === p.ruta;
        return (
          <TouchableOpacity
            key={p.ruta}
            style={globalStyles.bottomNavItem}
            onPress={() => onGo(p.ruta)}
            accessibilityRole="tab"
            accessibilityLabel={p.texto === "Docs" ? "Documentos" : p.texto}
            accessibilityHint={p.pista}
            accessibilityState={{ selected: activa }}
          >
            <Animated.View
              style={[
                globalStyles.bottomNavIconWrap,
                activa && globalStyles.bottomNavIconWrapActive,
                activa && {
                  transform: [
                    { scale: rebote.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                    { translateY: rebote.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
                  ],
                },
              ]}
            >
              <Text style={[globalStyles.bottomNavText, activa && globalStyles.bottomNavActive]}>{p.icono}</Text>
            </Animated.View>
            <Text style={[globalStyles.bottomNavLabel, activa && globalStyles.bottomNavActive]}>{p.texto}</Text>
            {activa && <View style={globalStyles.bottomNavRayita} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
