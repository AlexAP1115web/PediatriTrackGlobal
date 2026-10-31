import { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";

import { colors } from "../styles/globalStyles";
import { sinMovimiento } from "../utils/movimiento";
import MascotaRobot from "./MascotaRobot";

// Pedi flotando en la esquina de las pantallas principales. Cada rato
// saca un globito con "¿Te ayudo?" y al tocarlo abre el asistente virtual

type Props = {
  onAbrir: () => void;
};

const NATIVO = Platform.OS !== "web";

const MENSAJES = ["¿Te ayudo? 💬", "¡Pregúntame! 😄", "Estoy aquí 👋"];

export default function PediFlotante({ onAbrir }: Props) {
  const [mensaje, setMensaje] = useState(0);
  const [saludando, setSaludando] = useState(false);
  const globito = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelado = false;
    const temporizadores: ReturnType<typeof setTimeout>[] = [];

    const mostrar = (veces: number) => {
      if (cancelado) return;
      setMensaje(veces % MENSAJES.length);
      setSaludando(true);
      Animated.spring(globito, { toValue: 1, friction: 5, useNativeDriver: NATIVO }).start();
      temporizadores.push(
        setTimeout(() => {
          setSaludando(false);
          Animated.timing(globito, { toValue: 0, duration: 250, useNativeDriver: NATIVO }).start();
        }, 4000)
      );
      temporizadores.push(setTimeout(() => mostrar(veces + 1), 16000));
    };

    temporizadores.push(setTimeout(() => mostrar(0), 1500));
    return () => {
      cancelado = true;
      temporizadores.forEach(clearTimeout);
    };
  }, []);

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", right: 12, bottom: 92, alignItems: "flex-end" }}>
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          borderBottomRightRadius: 4,
          paddingVertical: 6,
          paddingHorizontal: 11,
          marginBottom: 4,
          borderWidth: 2,
          borderColor: colors.primaryLight,
          opacity: globito,
          transform: [
            { scale: sinMovimiento() ? 1 : globito.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
          ],
        }}
      >
        <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: colors.primaryDark }}>
          {MENSAJES[mensaje]}
        </Text>
      </Animated.View>

      <Pressable
        onPress={onAbrir}
        accessibilityRole="button"
        accessibilityLabel="Abrir el asistente virtual Pedi"
        accessibilityHint="Abre el chat para hacer preguntas sobre el cuidado del bebé"
        style={{
          width: 74,
          height: 74,
          borderRadius: 37,
          backgroundColor: colors.cielo,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: colors.white,
          shadowColor: colors.primaryDark,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <View style={{ marginTop: 6 }}>
          <MascotaRobot tamano={50} estado={saludando ? "saludando" : "normal"} />
        </View>
      </Pressable>
    </View>
  );
}
