import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleProp, ViewStyle } from "react-native";

import { sinMovimiento } from "../utils/movimiento";

const NATIVO = Platform.OS !== "web";

type Props = {
  children: ReactNode;
  // milisegundos antes de que aparezca (para que las secciones entren una
  // tras otra)
  retraso?: number;
  style?: StyleProp<ViewStyle>;
};

// Hace que una sección entre suavecito: aparece y sube un poquito. Si está
// activado "Menos animaciones" se muestra directo, sin moverse.
export default function Aparecer({ children, retraso = 0, style }: Props) {
  const quieto = sinMovimiento();
  const valor = useRef(new Animated.Value(quieto ? 1 : 0)).current;

  useEffect(() => {
    if (quieto) return;
    const animacion = Animated.timing(valor, {
      toValue: 1,
      duration: 480,
      delay: retraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVO,
    });
    animacion.start();
    return () => animacion.stop();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: valor,
          transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
