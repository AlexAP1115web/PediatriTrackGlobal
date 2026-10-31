import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Text, View } from "react-native";

import { colors } from "../styles/globalStyles";
import { sinMovimiento } from "../utils/movimiento";

// Pedi, el robotito del asistente virtual. La profa nos pidió que el
// chatbot fuera infantil, interactivo y que se moviera: que mueva los
// brazos, sonría, baile y festeje. Está dibujado solo con Views (sin
// imágenes), así toma los colores del tema y cambia con los modos de
// daltonismo.
//
// Estados:
//   "normal"     -> flota, respira, parpadea, y cada pocos segundos hace
//                   algo solito: saluda, baila, mira a los lados o brinca
//   "saludando"  -> levanta el brazo y saluda sonriendo
//   "escuchando" -> mientras escribes inclina la cabeza y asiente
//   "pensando"   -> se lleva la mano a la cabeza, mira arriba y sale un "?"
//   "feliz"      -> festeja: brazos arriba, brinca, ojitos felices, confeti
//                   y un bailecito
//   "hablando"   -> mueve la boca y los brazos mientras lee en voz alta
//
// "quieto" lo deja sin moverse (botón del chat o "Menos animaciones")

export type EstadoMascota = "normal" | "saludando" | "escuchando" | "pensando" | "feliz" | "hablando";

type Props = {
  tamano?: number;
  estado?: EstadoMascota;
  // en las burbujas del chat solo uso la carita
  soloCara?: boolean;
  // si no lo mandan, uso la opción "Menos animaciones"
  quieto?: boolean;
};

// en web el driver nativo no existe y manda advertencias
const NATIVO = Platform.OS !== "web";

const t = (valor: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.quad)) =>
  Animated.timing(valor, { toValue, duration, easing, useNativeDriver: NATIVO });
const resorte = (valor: Animated.Value, toValue: number, friction = 4) =>
  Animated.spring(valor, { toValue, friction, tension: 140, useNativeDriver: NATIVO });

// piezas del confeti: ángulo hacia donde salen y figura
const CONFETI = [
  { angulo: -160, figura: "★" },
  { angulo: -135, figura: "●" },
  { angulo: -110, figura: "♥" },
  { angulo: -90, figura: "★" },
  { angulo: -70, figura: "●" },
  { angulo: -45, figura: "♥" },
  { angulo: -20, figura: "★" },
  { angulo: -120, figura: "✦" },
  { angulo: -60, figura: "✦" },
];

export default function MascotaRobot({ tamano = 80, estado = "normal", soloCara = false, quieto }: Props) {
  const s = tamano;
  const sinMover = quieto ?? sinMovimiento();

  const flotar = useRef(new Animated.Value(0)).current;
  const respirar = useRef(new Animated.Value(0)).current;
  const parpadeo = useRef(new Animated.Value(1)).current;
  const antena = useRef(new Animated.Value(0)).current;
  const brazoIzq = useRef(new Animated.Value(0)).current;
  const brazoDer = useRef(new Animated.Value(0)).current;
  const inclinar = useRef(new Animated.Value(0)).current;
  const salto = useRef(new Animated.Value(0)).current;
  const baile = useRef(new Animated.Value(0)).current;
  const boca = useRef(new Animated.Value(0)).current;
  const sonrisa = useRef(new Animated.Value(0)).current;
  const ojosFelices = useRef(new Animated.Value(0)).current;
  const miradaX = useRef(new Animated.Value(0)).current;
  const miradaY = useRef(new Animated.Value(0)).current;
  const confeti = useRef(new Animated.Value(0)).current;
  const notas = useRef(new Animated.Value(0)).current;
  const pregunta = useRef(new Animated.Value(0)).current;

  // ---------- rutinas de movimiento ----------
  const saludar = () =>
    Animated.parallel([
      t(sonrisa, 1, 200),
      Animated.sequence([
        t(brazoDer, 1.6, 220, Easing.out(Easing.back(1.5))),
        Animated.loop(Animated.sequence([t(brazoDer, 1.25, 180), t(brazoDer, 1.85, 180)]), { iterations: 3 }),
        t(brazoDer, 0, 260),
      ]),
      Animated.sequence([t(inclinar, 0.5, 300), Animated.delay(900), t(inclinar, 0, 300)]),
    ]);

  const bailar = (compases = 2) =>
    Animated.parallel([
      t(sonrisa, 1, 200),
      t(notas, 1, 300 * compases * 2, Easing.linear),
      Animated.loop(
        Animated.sequence([
          Animated.parallel([t(baile, 1, 280), t(brazoIzq, 1.4, 280), t(brazoDer, -0.6, 280), t(salto, 0.35, 140)]),
          Animated.parallel([t(salto, 0, 140)]),
          Animated.parallel([t(baile, -1, 280), t(brazoIzq, -0.6, 280), t(brazoDer, 1.4, 280), t(salto, 0.35, 140)]),
          Animated.parallel([t(salto, 0, 140)]),
        ]),
        { iterations: compases }
      ),
    ]);

  const terminarBaile = () =>
    Animated.parallel([t(baile, 0, 200), t(brazoIzq, 0, 250), t(brazoDer, 0, 250), t(sonrisa, 0, 400), t(salto, 0, 150)]);

  const festejar = () => {
    confeti.setValue(0);
    notas.setValue(0);
    return Animated.sequence([
      Animated.parallel([
        t(sonrisa, 1, 150),
        t(ojosFelices, 1, 150),
        t(brazoIzq, 2, 220, Easing.out(Easing.back(2))),
        t(brazoDer, 2, 220, Easing.out(Easing.back(2))),
        Animated.timing(confeti, { toValue: 1, duration: 1300, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVO }),
        Animated.sequence([t(salto, 1, 180, Easing.out(Easing.quad)), resorte(salto, 0, 3), t(salto, 0.7, 160), resorte(salto, 0, 3)]),
      ]),
      bailar(2),
      Animated.parallel([terminarBaile(), t(ojosFelices, 0, 300)]),
    ]);
  };

  const mirarAlrededor = () =>
    Animated.sequence([
      Animated.parallel([t(miradaX, -1, 300), t(inclinar, -0.5, 300)]),
      Animated.delay(450),
      Animated.parallel([t(miradaX, 1, 400), t(inclinar, 0.5, 400)]),
      Animated.delay(450),
      Animated.parallel([t(miradaX, 0, 300), t(inclinar, 0, 300)]),
    ]);

  const brinquito = () =>
    Animated.parallel([
      t(sonrisa, 1, 150),
      Animated.sequence([t(salto, 0.8, 170, Easing.out(Easing.quad)), resorte(salto, 0, 3)]),
      Animated.sequence([t(brazoIzq, 1.2, 170), t(brazoIzq, 0, 300)]),
      Animated.sequence([t(brazoDer, 1.2, 170), t(brazoDer, 0, 300)]),
      Animated.sequence([Animated.delay(700), t(sonrisa, 0, 300)]),
    ]);

  // ---------- siempre: flotar, respirar, antena y parpadeo ----------
  useEffect(() => {
    if (sinMover) return;
    const bucles = [
      Animated.loop(Animated.sequence([t(flotar, 1, 1200, Easing.inOut(Easing.sin)), t(flotar, 0, 1200, Easing.inOut(Easing.sin))])),
      Animated.loop(Animated.sequence([t(respirar, 1, 900, Easing.inOut(Easing.sin)), t(respirar, 0, 900, Easing.inOut(Easing.sin))])),
      Animated.loop(Animated.sequence([t(antena, 1, 500), t(antena, -1, 500)])),
      Animated.loop(Animated.sequence([Animated.delay(2400), t(parpadeo, 0.1, 80), t(parpadeo, 1, 100)])),
    ];
    bucles.forEach((b) => b.start());
    return () => bucles.forEach((b) => b.stop());
  }, [sinMover]);

  // ---------- en reposo: cada pocos segundos hace algo solito ----------
  useEffect(() => {
    if (sinMover || estado !== "normal" || soloCara) return;
    let cancelado = false;
    let temporizador: ReturnType<typeof setTimeout>;
    let actual: Animated.CompositeAnimation | null = null;
    const rutinas = [
      () => saludar(),
      () => Animated.sequence([bailar(2), terminarBaile()]),
      () => mirarAlrededor(),
      () => brinquito(),
    ];
    let ultima = -1;

    const travesura = () => {
      if (cancelado) return;
      let indice = Math.floor(Math.random() * rutinas.length);
      if (indice === ultima) indice = (indice + 1) % rutinas.length;
      ultima = indice;
      actual = rutinas[indice]();
      actual.start(() => {
        if (!cancelado) temporizador = setTimeout(travesura, 1800 + Math.random() * 2200);
      });
    };

    temporizador = setTimeout(travesura, 1200);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
      actual?.stop();
      terminarBaile().start();
    };
  }, [estado, sinMover, soloCara]);

  // ---------- animaciones según el estado ----------
  useEffect(() => {
    if (sinMover) return;
    let animacion: Animated.CompositeAnimation | null = null;

    if (estado === "saludando") {
      animacion = saludar();
    } else if (estado === "escuchando") {
      t(miradaY, 0.8, 250).start();
      t(miradaX, 0.6, 250).start();
      animacion = Animated.loop(Animated.sequence([t(inclinar, 0.7, 350), t(inclinar, 0.25, 350)]));
    } else if (estado === "pensando") {
      t(miradaY, -0.9, 250).start();
      t(brazoDer, 1.15, 300).start();
      pregunta.setValue(0);
      animacion = Animated.parallel([
        Animated.loop(Animated.sequence([t(inclinar, 1, 450), t(inclinar, -0.6, 450)])),
        Animated.loop(Animated.sequence([t(pregunta, 1, 700), t(pregunta, 0.4, 700)])),
      ]);
    } else if (estado === "feliz") {
      animacion = festejar();
    } else if (estado === "hablando") {
      t(sonrisa, 0.6, 200).start();
      animacion = Animated.parallel([
        Animated.loop(Animated.sequence([t(boca, 1, 130), t(boca, 0.2, 110), t(boca, 0.8, 140), t(boca, 0, 120)])),
        Animated.loop(
          Animated.sequence([
            Animated.parallel([t(brazoDer, 0.7, 500), t(brazoIzq, 0.2, 500), t(inclinar, 0.3, 500)]),
            Animated.parallel([t(brazoDer, 0.2, 500), t(brazoIzq, 0.7, 500), t(inclinar, -0.3, 500)]),
          ])
        ),
      ]);
    }

    animacion?.start();
    return () => {
      animacion?.stop();
      Animated.parallel([
        t(inclinar, 0, 180),
        t(miradaX, 0, 180),
        t(miradaY, 0, 180),
        t(boca, 0, 120),
        t(pregunta, 0, 150),
        t(ojosFelices, 0, 200),
        terminarBaile(),
      ]).start();
    };
  }, [estado, sinMover]);

  // ---------- interpolaciones ----------
  const subir = flotar.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.06] });
  const brincar = salto.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.24] });
  const estirar = respirar.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const girarCabeza = inclinar.interpolate({ inputRange: [-1, 1], outputRange: ["-10deg", "10deg"] });
  const girarCuerpo = baile.interpolate({ inputRange: [-1, 1], outputRange: ["-12deg", "12deg"] });
  const girarAntena = antena.interpolate({ inputRange: [-1, 1], outputRange: ["-14deg", "14deg"] });
  // brazos: 0 = abajo, 1 = levantado, 2 = arriba del todo (festejando)
  const girarBrazoDer = brazoDer.interpolate({ inputRange: [-1, 0, 1, 2], outputRange: ["35deg", "-18deg", "-110deg", "-140deg"] });
  const girarBrazoIzq = brazoIzq.interpolate({ inputRange: [-1, 0, 1, 2], outputRange: ["-35deg", "18deg", "110deg", "140deg"] });

  const pensando = estado === "pensando";

  // ---------- carita (la uso sola en las burbujas) ----------
  const anchoCabeza = soloCara ? s : s * 0.86;
  const altoCabeza = soloCara ? s * 0.82 : s * 0.66;
  const ojo = anchoCabeza * 0.15;
  const grosor = Math.max(2, s * 0.035);

  const boquita = pensando ? (
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
    // sonrisa normal y sonrisa grande (con lengüita) que se cruzan
    <View style={{ width: anchoCabeza * 0.26, height: anchoCabeza * 0.14, alignItems: "center", marginTop: -altoCabeza * 0.04 }}>
      <Animated.View
        style={{
          position: "absolute",
          width: anchoCabeza * 0.22,
          height: anchoCabeza * 0.11,
          borderBottomWidth: grosor,
          borderLeftWidth: grosor,
          borderRightWidth: grosor,
          borderTopWidth: 0,
          borderColor: colors.text,
          borderBottomLeftRadius: anchoCabeza * 0.12,
          borderBottomRightRadius: anchoCabeza * 0.12,
          opacity: sonrisa.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: anchoCabeza * 0.26,
          height: anchoCabeza * 0.14,
          backgroundColor: colors.text,
          borderBottomLeftRadius: anchoCabeza * 0.14,
          borderBottomRightRadius: anchoCabeza * 0.14,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "flex-end",
          opacity: sonrisa,
          transform: [{ scale: sonrisa.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }}
      >
        <View style={{ width: anchoCabeza * 0.14, height: anchoCabeza * 0.06, borderTopLeftRadius: anchoCabeza * 0.07, borderTopRightRadius: anchoCabeza * 0.07, backgroundColor: colors.pink }} />
      </Animated.View>
    </View>
  );

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
        {/* ojitos: redondos que miran a los lados, o felices (^ ^) */}
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
            <View key={i} style={{ width: ojo, height: ojo }}>
              <Animated.View
                style={{
                  width: ojo,
                  height: ojo,
                  borderRadius: ojo / 2,
                  backgroundColor: colors.text,
                  opacity: ojosFelices.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                  transform: [{ scaleY: parpadeo }],
                }}
              >
                <View style={{ position: "absolute", top: ojo * 0.15, right: ojo * 0.15, width: ojo * 0.35, height: ojo * 0.35, borderRadius: ojo, backgroundColor: colors.white }} />
              </Animated.View>
              <Animated.View
                style={{
                  position: "absolute",
                  top: ojo * 0.15,
                  width: ojo,
                  height: ojo * 0.55,
                  borderTopLeftRadius: ojo,
                  borderTopRightRadius: ojo,
                  borderTopWidth: grosor,
                  borderLeftWidth: grosor,
                  borderRightWidth: grosor,
                  borderBottomWidth: 0,
                  borderColor: colors.text,
                  opacity: ojosFelices,
                }}
              />
            </View>
          ))}
        </Animated.View>

        {/* cachetes */}
        <View style={{ flexDirection: "row", gap: anchoCabeza * 0.34, marginTop: altoCabeza * 0.01 }}>
          <View style={{ width: ojo * 0.9, height: ojo * 0.55, borderRadius: ojo, backgroundColor: colors.pink, opacity: 0.45 }} />
          <View style={{ width: ojo * 0.9, height: ojo * 0.55, borderRadius: ojo, backgroundColor: colors.pink, opacity: 0.45 }} />
        </View>

        {boquita}
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
  const largoBrazo = s * 0.28;

  const brazo = (lado: "izq" | "der") => (
    <Animated.View
      style={{
        width: s * 0.1,
        height: largoBrazo,
        borderRadius: s * 0.05,
        backgroundColor: colors.primaryDark,
        marginTop: s * 0.02,
        [lado === "izq" ? "marginRight" : "marginLeft"]: s * 0.015,
        alignItems: "center",
        justifyContent: "flex-end",
        // giro desde el hombro (la parte de arriba del brazo)
        transform: [
          { translateY: -largoBrazo / 2 },
          { rotate: lado === "izq" ? girarBrazoIzq : girarBrazoDer },
          { translateY: largoBrazo / 2 },
        ],
      }}
    >
      {/* manita */}
      <View
        style={{
          width: s * 0.14,
          height: s * 0.14,
          borderRadius: s * 0.07,
          backgroundColor: colors.pink,
          borderWidth: Math.max(1.5, s * 0.025),
          borderColor: colors.white,
          marginBottom: -s * 0.035,
        }}
      />
    </Animated.View>
  );

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: s,
        height: s * 1.2,
        alignItems: "center",
        transform: [{ translateY: Animated.add(subir, brincar) }, { rotate: girarCuerpo }, { scaleY: estirar }],
      }}
    >
      {/* confeti cuando festeja */}
      {!sinMover &&
        CONFETI.map((pieza, i) => {
          const rad = (pieza.angulo * Math.PI) / 180;
          const distancia = s * (0.75 + (i % 3) * 0.18);
          return (
            <Animated.Text
              key={`c${i}`}
              style={{
                position: "absolute",
                top: s * 0.35,
                left: s * 0.44,
                fontSize: s * 0.17,
                color: coloresConfeti[i % coloresConfeti.length],
                opacity: confeti.interpolate({ inputRange: [0, 0.08, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: confeti.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * distancia] }) },
                  { translateY: confeti.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * distancia + s * 0.25] }) },
                  { rotate: confeti.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${i % 2 ? 200 : -200}deg`] }) },
                  { scale: confeti.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.3, 0.8] }) },
                ],
              }}
            >
              {pieza.figura}
            </Animated.Text>
          );
        })}

      {/* notitas musicales cuando baila */}
      {!sinMover &&
        [0, 1].map((i) => (
          <Animated.Text
            key={`n${i}`}
            style={{
              position: "absolute",
              top: s * 0.1,
              [i ? "right" : "left"]: -s * 0.12,
              fontSize: s * 0.2,
              color: i ? colors.pink : colors.primaryDark,
              opacity: notas.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: notas.interpolate({ inputRange: [0, 1], outputRange: [s * 0.2, -s * 0.25] }) },
                { rotate: notas.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["-15deg", "15deg", "-15deg"] }) },
              ],
            }}
          >
            {i ? "♫" : "♪"}
          </Animated.Text>
        ))}

      {/* signo de pregunta cuando piensa */}
      {!sinMover && (
        <Animated.Text
          style={{
            position: "absolute",
            top: -s * 0.08,
            right: -s * 0.06,
            fontSize: s * 0.28,
            fontWeight: "900",
            color: colors.pink,
            opacity: pregunta,
            transform: [{ scale: pregunta.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.1] }) }],
          }}
        >
          ?
        </Animated.Text>
      )}

      {/* antena que se balancea y su bolita que brilla */}
      <Animated.View style={{ alignItems: "center", transform: [{ translateY: s * 0.12 }, { rotate: girarAntena }, { translateY: -s * 0.12 }] }}>
        <Animated.View
          style={{
            width: s * 0.15,
            height: s * 0.15,
            borderRadius: s * 0.075,
            backgroundColor: colors.pink,
            transform: [{ scale: antena.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 1.25, 1] }) }],
          }}
        />
        <View style={{ width: s * 0.045, height: s * 0.08, backgroundColor: colors.primaryDark }} />
      </Animated.View>

      {cabeza}

      {/* cuerpito con corazón y bracitos */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: -s * 0.02 }}>
        {brazo("izq")}
        <View
          style={{
            width: s * 0.46,
            height: s * 0.27,
            borderRadius: s * 0.12,
            backgroundColor: colors.primaryDark,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: s * 0.13, lineHeight: s * 0.16, color: colors.pink }}>♥</Text>
        </View>
        {brazo("der")}
      </View>
    </Animated.View>
  );
}
