import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, View } from "react-native";

import { colors } from "../styles/globalStyles";

// Pedi, el robotito del asistente virtual. La profa nos pidió que el
// chatbot fuera más infantil y llamativo, así que le hice una mascota
// dibujada solo con Views (sin imágenes), para que tome los colores del
// tema y también cambie con el modo daltonismo.
//
// Estados:
//   "normal"     -> flota, parpadea y la antena brilla
//   "saludando"  -> mueve el brazo como diciendo hola
//   "pensando"   -> mueve la cabeza de lado a lado mientras llega la respuesta
//   "feliz"      -> da un saltito cuando ya respondió
//
// Si el celular tiene activado "reducir movimiento" no hago animaciones en
// bucle (solo se queda quieto y parpadea poco).

export type EstadoMascota = "normal" | "saludando" | "pensando" | "feliz";

type Props = {
  tamano?: number;
  estado?: EstadoMascota;
  // en las burbujas del chat solo uso la carita
  soloCara?: boolean;
};

// en web el driver nativo no existe y manda advertencias
const NATIVO = Platform.OS !== "web";

export default function MascotaRobot({ tamano = 80, estado = "normal", soloCara = false }: Props) {
  const s = tamano;

  const flotar = useRef(new Animated.Value(0)).current;
  const parpadeo = useRef(new Animated.Value(1)).current;
  const antena = useRef(new Animated.Value(0)).current;
  const brazo = useRef(new Animated.Value(0)).current;
  const inclinar = useRef(new Animated.Value(0)).current;
  const salto = useRef(new Animated.Value(0)).current;

  const [reducirMovimiento, setReducirMovimiento] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReducirMovimiento)
      .catch(() => setReducirMovimiento(false));
  }, []);

  // flotar + antena + parpadeo (siempre, menos con reducir movimiento)
  useEffect(() => {
    if (reducirMovimiento) return;

    const bucleFlotar = Animated.loop(
      Animated.sequence([
        Animated.timing(flotar, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
        Animated.timing(flotar, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
      ])
    );
    const bucleAntena = Animated.loop(
      Animated.sequence([
        Animated.timing(antena, { toValue: 1, duration: 700, useNativeDriver: NATIVO }),
        Animated.timing(antena, { toValue: 0, duration: 700, useNativeDriver: NATIVO }),
      ])
    );
    const bucleParpadeo = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(parpadeo, { toValue: 0.1, duration: 90, useNativeDriver: NATIVO }),
        Animated.timing(parpadeo, { toValue: 1, duration: 110, useNativeDriver: NATIVO }),
      ])
    );

    bucleFlotar.start();
    bucleAntena.start();
    bucleParpadeo.start();
    return () => {
      bucleFlotar.stop();
      bucleAntena.stop();
      bucleParpadeo.stop();
    };
  }, [reducirMovimiento]);

  // animaciones según el estado
  useEffect(() => {
    if (reducirMovimiento) return;
    let animacion: Animated.CompositeAnimation | null = null;

    if (estado === "saludando") {
      animacion = Animated.loop(
        Animated.sequence([
          Animated.timing(brazo, { toValue: 1, duration: 220, useNativeDriver: NATIVO }),
          Animated.timing(brazo, { toValue: -0.4, duration: 220, useNativeDriver: NATIVO }),
        ]),
        { iterations: 3 }
      );
      animacion.start(() =>
        Animated.timing(brazo, { toValue: 0, duration: 200, useNativeDriver: NATIVO }).start()
      );
    } else if (estado === "pensando") {
      animacion = Animated.loop(
        Animated.sequence([
          Animated.timing(inclinar, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVO }),
          Animated.timing(inclinar, { toValue: -1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVO }),
        ])
      );
      animacion.start();
    } else if (estado === "feliz") {
      animacion = Animated.sequence([
        Animated.timing(salto, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: NATIVO }),
        Animated.spring(salto, { toValue: 0, friction: 3, tension: 120, useNativeDriver: NATIVO }),
      ]);
      animacion.start();
    }

    return () => {
      animacion?.stop();
      Animated.timing(inclinar, { toValue: 0, duration: 150, useNativeDriver: NATIVO }).start();
    };
  }, [estado, reducirMovimiento]);

  const subir = flotar.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.06] });
  const brincar = salto.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.18] });
  const girarCabeza = inclinar.interpolate({ inputRange: [-1, 1], outputRange: ["-8deg", "8deg"] });
  const girarBrazo = brazo.interpolate({ inputRange: [-1, 1], outputRange: ["40deg", "-40deg"] });
  const brilloAntena = antena.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  const pensando = estado === "pensando";

  // ---------- carita (la uso sola en las burbujas) ----------
  const anchoCabeza = soloCara ? s : s * 0.86;
  const altoCabeza = soloCara ? s * 0.82 : s * 0.66;
  const ojo = anchoCabeza * 0.15;

  const cabeza = (
    <Animated.View
      style={{
        width: anchoCabeza,
        height: altoCabeza,
        borderRadius: anchoCabeza * 0.34,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: girarCabeza }],
      }}
    >
      {/* orejitas */}
      <View style={{ position: "absolute", left: -anchoCabeza * 0.07, width: anchoCabeza * 0.12, height: altoCabeza * 0.34, borderRadius: anchoCabeza * 0.06, backgroundColor: colors.primaryDark }} />
      <View style={{ position: "absolute", right: -anchoCabeza * 0.07, width: anchoCabeza * 0.12, height: altoCabeza * 0.34, borderRadius: anchoCabeza * 0.06, backgroundColor: colors.primaryDark }} />

      {/* pantallita de la cara */}
      <View
        style={{
          width: anchoCabeza * 0.76,
          height: altoCabeza * 0.66,
          borderRadius: anchoCabeza * 0.24,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ flexDirection: "row", gap: anchoCabeza * 0.16, marginTop: -altoCabeza * 0.04 }}>
          {[0, 1].map((i) => (
            <Animated.View
              key={i}
              style={{
                width: ojo,
                height: ojo,
                borderRadius: ojo / 2,
                backgroundColor: colors.text,
                transform: [{ scaleY: parpadeo }],
              }}
            >
              <View style={{ position: "absolute", top: ojo * 0.15, right: ojo * 0.15, width: ojo * 0.35, height: ojo * 0.35, borderRadius: ojo, backgroundColor: colors.white }} />
            </Animated.View>
          ))}
        </View>

        {/* cachetes */}
        <View style={{ flexDirection: "row", gap: anchoCabeza * 0.34, marginTop: altoCabeza * 0.01 }}>
          <View style={{ width: ojo * 0.9, height: ojo * 0.55, borderRadius: ojo, backgroundColor: colors.pink, opacity: 0.45 }} />
          <View style={{ width: ojo * 0.9, height: ojo * 0.55, borderRadius: ojo, backgroundColor: colors.pink, opacity: 0.45 }} />
        </View>

        {/* boquita: sonrisa normal, "o" cuando piensa */}
        {pensando ? (
          <View style={{ width: ojo * 0.6, height: ojo * 0.6, borderRadius: ojo, borderWidth: Math.max(1.5, s * 0.025), borderColor: colors.text, marginTop: -altoCabeza * 0.02 }} />
        ) : (
          <View
            style={{
              width: anchoCabeza * 0.22,
              height: anchoCabeza * 0.11,
              borderBottomWidth: Math.max(2, s * 0.035),
              borderLeftWidth: Math.max(2, s * 0.035),
              borderRightWidth: Math.max(2, s * 0.035),
              borderColor: colors.text,
              borderBottomLeftRadius: anchoCabeza * 0.12,
              borderBottomRightRadius: anchoCabeza * 0.12,
              borderTopWidth: 0,
              marginTop: -altoCabeza * 0.04,
            }}
          />
        )}
      </View>
    </Animated.View>
  );

  if (soloCara) {
    return (
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {cabeza}
      </View>
    );
  }

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: s,
        height: s * 1.18,
        alignItems: "center",
        transform: [{ translateY: Animated.add(subir, brincar) }],
      }}
    >
      {/* antena con su bolita que brilla */}
      <Animated.View
        style={{
          width: s * 0.15,
          height: s * 0.15,
          borderRadius: s * 0.075,
          backgroundColor: colors.pink,
          transform: [{ scale: brilloAntena }],
        }}
      />
      <View style={{ width: s * 0.045, height: s * 0.08, backgroundColor: colors.primaryDark }} />

      {cabeza}

      {/* cuerpito con corazón y bracitos */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: -s * 0.02 }}>
        <View style={{ width: s * 0.1, height: s * 0.2, borderRadius: s * 0.05, backgroundColor: colors.primaryDark, marginTop: s * 0.03, marginRight: s * 0.02, transform: [{ rotate: "20deg" }] }} />
        <View
          style={{
            width: s * 0.46,
            height: s * 0.26,
            borderRadius: s * 0.12,
            backgroundColor: colors.primaryDark,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ width: s * 0.11, height: s * 0.11, borderRadius: s * 0.06, backgroundColor: colors.pink }} />
        </View>
        <Animated.View
          style={{
            width: s * 0.1,
            height: s * 0.2,
            borderRadius: s * 0.05,
            backgroundColor: colors.primaryDark,
            marginTop: s * 0.03,
            marginLeft: s * 0.02,
            transform: [{ translateY: -s * 0.1 }, { rotate: girarBrazo }, { translateY: s * 0.1 }],
          }}
        />
      </View>
    </Animated.View>
  );
}
