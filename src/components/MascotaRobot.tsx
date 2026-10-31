import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Text, View } from "react-native";

import { colors } from "../styles/globalStyles";
import { sinMovimiento } from "../utils/movimiento";

// Pedi, el robotito del asistente virtual. La profa nos pidió que el
// chatbot fuera más infantil, más interactivo y que se moviera, así que le
// hice una mascota dibujada solo con Views (sin imágenes), para que tome
// los colores del tema y cambie con los modos de daltonismo.
//
// Estados:
//   "normal"     -> flota, parpadea, mira a los lados y de vez en cuando
//                   saluda o se mueve solito
//   "saludando"  -> mueve el bracito como diciendo hola
//   "escuchando" -> mientras escribes se inclina y mira hacia abajo
//   "pensando"   -> mueve la cabeza de lado a lado y mira hacia arriba
//   "feliz"      -> brinca, baila y suelta confeti de estrellitas
//   "hablando"   -> mueve la boca mientras lee en voz alta
//
// Si "quieto" es true, o si están activadas las "Menos animaciones" (en la
// app o en el celular), Pedi no se mueve.

export type EstadoMascota = "normal" | "saludando" | "escuchando" | "pensando" | "feliz" | "hablando";

type Props = {
  tamano?: number;
  estado?: EstadoMascota;
  // en las burbujas del chat solo uso la carita
  soloCara?: boolean;
  quieto?: boolean;
};

// en web el driver nativo no existe y manda advertencias
const NATIVO = Platform.OS !== "web";

const t = (valor: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.quad)) =>
  Animated.timing(valor, { toValue, duration, easing, useNativeDriver: NATIVO });

// estrellitas del confeti: ángulo, distancia, color y figura
const CONFETI = [
  { angulo: -150, figura: "★" },
  { angulo: -120, figura: "●" },
  { angulo: -90, figura: "★" },
  { angulo: -60, figura: "●" },
  { angulo: -30, figura: "★" },
  { angulo: -170, figura: "♥" },
  { angulo: -10, figura: "♥" },
  { angulo: -105, figura: "✦" },
];

export default function MascotaRobot({ tamano = 80, estado = "normal", soloCara = false, quieto = false }: Props) {
  const s = tamano;
  const sinMover = quieto || sinMovimiento();

  const flotar = useRef(new Animated.Value(0)).current;
  const parpadeo = useRef(new Animated.Value(1)).current;
  const antena = useRef(new Animated.Value(0)).current;
  const brazo = useRef(new Animated.Value(0)).current;
  const inclinar = useRef(new Animated.Value(0)).current;
  const salto = useRef(new Animated.Value(0)).current;
  const baile = useRef(new Animated.Value(0)).current;
  const boca = useRef(new Animated.Value(0)).current;
  const miradaX = useRef(new Animated.Value(0)).current;
  const miradaY = useRef(new Animated.Value(0)).current;
  const confeti = useRef(new Animated.Value(0)).current;

  // ---------- siempre: flotar, antena y parpadeo ----------
  useEffect(() => {
    if (sinMover) return;
    const bucles = [
      Animated.loop(Animated.sequence([t(flotar, 1, 1300, Easing.inOut(Easing.sin)), t(flotar, 0, 1300, Easing.inOut(Easing.sin))])),
      Animated.loop(Animated.sequence([t(antena, 1, 700), t(antena, 0, 700)])),
      Animated.loop(Animated.sequence([Animated.delay(2600), t(parpadeo, 0.1, 90), t(parpadeo, 1, 110)])),
    ];
    bucles.forEach((b) => b.start());
    return () => bucles.forEach((b) => b.stop());
  }, [sinMover]);

  // ---------- en reposo: mira a los lados y a veces saluda o se mueve ----------
  useEffect(() => {
    if (sinMover || estado !== "normal" || soloCara) return;
    let cancelado = false;
    let temporizador: ReturnType<typeof setTimeout>;

    const travesura = () => {
      if (cancelado) return;
      const sorteo = Math.random();
      if (sorteo < 0.4) {
        // mira a un lado y luego al otro
        Animated.sequence([
          Animated.parallel([t(miradaX, -1, 300), t(inclinar, -0.4, 300)]),
          Animated.delay(500),
          Animated.parallel([t(miradaX, 1, 400), t(inclinar, 0.4, 400)]),
          Animated.delay(500),
          Animated.parallel([t(miradaX, 0, 300), t(inclinar, 0, 300)]),
        ]).start();
      } else if (sorteo < 0.75) {
        // saluda
        Animated.sequence([
          Animated.loop(Animated.sequence([t(brazo, 1, 200), t(brazo, -0.4, 200)]), { iterations: 2 }),
          t(brazo, 0, 200),
        ]).start();
      } else {
        // bailecito
        Animated.sequence([t(baile, 1, 160), t(baile, -1, 220), t(baile, 1, 220), t(baile, 0, 160)]).start();
      }
      temporizador = setTimeout(travesura, 5500 + Math.random() * 3500);
    };

    temporizador = setTimeout(travesura, 3000);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [estado, sinMover, soloCara]);

  // ---------- animaciones según el estado ----------
  useEffect(() => {
    if (sinMover) return;
    let animacion: Animated.CompositeAnimation | null = null;

    if (estado === "saludando") {
      animacion = Animated.sequence([
        Animated.loop(Animated.sequence([t(brazo, 1, 220), t(brazo, -0.4, 220)]), { iterations: 3 }),
        t(brazo, 0, 200),
      ]);
    } else if (estado === "escuchando") {
      animacion = Animated.parallel([t(inclinar, 0.6, 300), t(miradaX, 0.7, 300), t(miradaY, 0.8, 300)]);
    } else if (estado === "pensando") {
      t(miradaY, -0.9, 250).start();
      animacion = Animated.loop(Animated.sequence([t(inclinar, 1, 450), t(inclinar, -1, 450)]));
    } else if (estado === "feliz") {
      confeti.setValue(0);
      animacion = Animated.parallel([
        Animated.sequence([
          Animated.timing(salto, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: NATIVO }),
          Animated.spring(salto, { toValue: 0, friction: 3, tension: 120, useNativeDriver: NATIVO }),
        ]),
        Animated.sequence([t(baile, 1, 150), t(baile, -1, 200), t(baile, 1, 200), t(baile, -1, 200), t(baile, 0, 150)]),
        Animated.loop(Animated.sequence([t(brazo, 1, 180), t(brazo, -0.4, 180)]), { iterations: 2 }),
        Animated.timing(confeti, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVO }),
      ]);
    } else if (estado === "hablando") {
      animacion = Animated.loop(Animated.sequence([t(boca, 1, 140), t(boca, 0.2, 120), t(boca, 0.8, 150), t(boca, 0, 130)]));
    }

    animacion?.start();
    return () => {
      animacion?.stop();
      Animated.parallel([
        t(inclinar, 0, 180),
        t(miradaX, 0, 180),
        t(miradaY, 0, 180),
        t(boca, 0, 120),
        t(brazo, 0, 150),
      ]).start();
    };
  }, [estado, sinMover]);

  const subir = flotar.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.06] });
  const brincar = salto.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.2] });
  const girarCabeza = inclinar.interpolate({ inputRange: [-1, 1], outputRange: ["-9deg", "9deg"] });
  const girarCuerpo = baile.interpolate({ inputRange: [-1, 1], outputRange: ["-10deg", "10deg"] });
  const girarBrazo = brazo.interpolate({ inputRange: [-1, 1], outputRange: ["40deg", "-40deg"] });
  const brilloAntena = antena.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  const pensando = estado === "pensando";

  // ---------- carita (la uso sola en las burbujas) ----------
  const anchoCabeza = soloCara ? s : s * 0.86;
  const altoCabeza = soloCara ? s * 0.82 : s * 0.66;
  const ojo = anchoCabeza * 0.15;
  const grosor = Math.max(2, s * 0.035);

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
        {/* ojitos (se mueven para mirar) */}
        <Animated.View
          style={{
            flexDirection: "row",
            gap: anchoCabeza * 0.16,
            marginTop: -altoCabeza * 0.04,
            transform: [
              { translateX: miradaX.interpolate({ inputRange: [-1, 1], outputRange: [-ojo * 0.45, ojo * 0.45] }) },
              { translateY: miradaY.interpolate({ inputRange: [-1, 1], outputRange: [-ojo * 0.35, ojo * 0.35] }) },
            ],
          }}
        >
          {[0, 1].map((i) => (
            <Animated.View
              key={i}
              style={{ width: ojo, height: ojo, borderRadius: ojo / 2, backgroundColor: colors.text, transform: [{ scaleY: parpadeo }] }}
            >
              <View style={{ position: "absolute", top: ojo * 0.15, right: ojo * 0.15, width: ojo * 0.35, height: ojo * 0.35, borderRadius: ojo, backgroundColor: colors.white }} />
            </Animated.View>
          ))}
        </Animated.View>

        {/* cachetes */}
        <View style={{ flexDirection: "row", gap: anchoCabeza * 0.34, marginTop: altoCabeza * 0.01 }}>
          <View style={{ width: ojo * 0.9, height: ojo * 0.55, borderRadius: ojo, backgroundColor: colors.pink, opacity: 0.45 }} />
          <View style={{ width: ojo * 0.9, height: ojo * 0.55, borderRadius: ojo, backgroundColor: colors.pink, opacity: 0.45 }} />
        </View>

        {/* boquita: "o" cuando piensa, se abre y cierra cuando habla, sonrisa normal */}
        {pensando ? (
          <View style={{ width: ojo * 0.6, height: ojo * 0.6, borderRadius: ojo, borderWidth: grosor * 0.75, borderColor: colors.text, marginTop: -altoCabeza * 0.02 }} />
        ) : estado === "hablando" ? (
          <Animated.View
            style={{
              width: anchoCabeza * 0.2,
              height: anchoCabeza * 0.12,
              borderRadius: anchoCabeza * 0.08,
              backgroundColor: colors.text,
              marginTop: -altoCabeza * 0.04,
              transform: [{ scaleY: boca.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }],
            }}
          />
        ) : (
          <View
            style={{
              width: anchoCabeza * 0.22,
              height: anchoCabeza * 0.11,
              borderBottomWidth: grosor,
              borderLeftWidth: grosor,
              borderRightWidth: grosor,
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

  const coloresConfeti = [colors.pink, colors.primary, colors.green, colors.warning];

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: s,
        height: s * 1.18,
        alignItems: "center",
        transform: [{ translateY: Animated.add(subir, brincar) }, { rotate: girarCuerpo }],
      }}
    >
      {/* confeti de estrellitas cuando está feliz */}
      {!sinMover &&
        CONFETI.map((pieza, i) => {
          const rad = (pieza.angulo * Math.PI) / 180;
          const distancia = s * (0.7 + (i % 3) * 0.15);
          return (
            <Animated.Text
              key={i}
              style={{
                position: "absolute",
                top: s * 0.35,
                left: s * 0.45,
                fontSize: s * 0.16,
                color: coloresConfeti[i % coloresConfeti.length],
                opacity: confeti.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: confeti.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * distancia] }) },
                  { translateY: confeti.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * distancia] }) },
                  { scale: confeti.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.2, 0.8] }) },
                ],
              }}
            >
              {pieza.figura}
            </Animated.Text>
          );
        })}

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
          <Text style={{ fontSize: s * 0.13, lineHeight: s * 0.16, color: colors.pink }}>♥</Text>
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
