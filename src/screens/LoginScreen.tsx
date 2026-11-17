import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import MascotaRobot from "../components/MascotaRobot";

import { URL_APK } from "../constants/enlaces";
import {
  contrasenaFiltradaPublicamente,
  iniciarSesionFirebase,
  recuperarContrasenaFirebase,
  registrarUsuarioFirebase,
  traducirErrorAuthFirebase,
} from "../firebase/firebaseService";
import { globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";
import { sinMovimiento } from "../utils/movimiento";

// en web el driver nativo de animaciones no existe
const NATIVO = Platform.OS !== "web";
const IZQUIERDA = { textAlign: "left" as const };

type Props = {
  onLogin: () => void;
};

type Modo = "iniciarSesion" | "crearCuenta";

export default function LoginScreen({ onLogin }: Props) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [pais, setPais] = useState<"México" | "Estados Unidos">("México");
  const [modo, setModo] = useState<Modo>("iniciarSesion");
  const [cargando, setCargando] = useState(false);

  // esto es para bloquear un rato si fallan muchos intentos de login
  // seguidos, así se dificulta un ataque de fuerza bruta
  const INTENTOS_MAXIMOS = 5;
  const BLOQUEO_MS = 60 * 1000;
  const intentosFallidosRef = useRef(0);
  const bloqueadoHastaRef = useRef<number | null>(null);

  const validarCorreo = (valor: string) => /\S+@\S+\.\S+/.test(valor);

  // para cuentas nuevas pido contraseña más segura: mínimo 8 caracteres,
  // con al menos una letra y un número
  const validarPasswordFuerte = (valor: string) =>
    valor.length >= 8 && /[A-Za-z]/.test(valor) && /[0-9]/.test(valor);

  const continuar = async () => {
    if (bloqueadoHastaRef.current && Date.now() < bloqueadoHastaRef.current) {
      const segundos = Math.ceil(
        (bloqueadoHastaRef.current - Date.now()) / 1000
      );
      Alert.alert(
        "Demasiados intentos",
        `Por seguridad, espera ${segundos} segundos antes de intentar de nuevo.`
      );
      return;
    }

    if (!correo.trim() || !password.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Ingresa tu correo y contraseña."
      );
      return;
    }

    if (!validarCorreo(correo.trim())) {
      Alert.alert(
        "Correo inválido",
        "Ingresa un correo electrónico válido."
      );
      return;
    }

    if (modo === "crearCuenta") {
      if (!validarPasswordFuerte(password)) {
        Alert.alert(
          "Contraseña débil",
          "Para crear tu cuenta, la contraseña debe tener al menos 8 caracteres e incluir letras y números."
        );
        return;
      }
    } else if (password.trim().length < 6) {
      Alert.alert(
        "Contraseña muy corta",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    setCargando(true);

    try {
      if (modo === "crearCuenta") {
        const filtrada = await contrasenaFiltradaPublicamente(password);
        if (filtrada) {
          Alert.alert(
            "Contraseña no segura",
            "Esta contraseña ha aparecido en filtraciones de datos conocidas. Por tu seguridad, elige una diferente."
          );
          setCargando(false);
          return;
        }

        await registrarUsuarioFirebase(correo.trim(), password);
      } else {
        await iniciarSesionFirebase(correo.trim(), password);
      }

      intentosFallidosRef.current = 0;
      bloqueadoHastaRef.current = null;
      onLogin();
    } catch (error) {
      console.log("Error de autenticación:", error);

      if (modo === "iniciarSesion") {
        intentosFallidosRef.current += 1;

        if (intentosFallidosRef.current >= INTENTOS_MAXIMOS) {
          bloqueadoHastaRef.current = Date.now() + BLOQUEO_MS;
          intentosFallidosRef.current = 0;
          Alert.alert(
            "Demasiados intentos",
            "Por seguridad, bloqueamos los intentos de inicio de sesión por 60 segundos."
          );
          setCargando(false);
          return;
        }
      }

      Alert.alert("No se pudo continuar", traducirErrorAuthFirebase(error));
    } finally {
      setCargando(false);
    }
  };

  const recuperarContrasena = async () => {
    if (!correo.trim() || !validarCorreo(correo.trim())) {
      Alert.alert(
        "Correo requerido",
        "Escribe tu correo electrónico arriba y luego toca \"¿Olvidaste tu contraseña?\" para recibir el enlace de recuperación."
      );
      return;
    }

    setCargando(true);

    try {
      await recuperarContrasenaFirebase(correo.trim());
      Alert.alert(
        "Correo enviado",
        `Te enviamos un enlace para restablecer tu contraseña a ${correo.trim()}. Revisa tu bandeja de entrada (y spam).`
      );
    } catch (error) {
      console.log("Error al recuperar contraseña:", error);
      Alert.alert("No se pudo enviar el correo", traducirErrorAuthFirebase(error));
    } finally {
      setCargando(false);
    }
  };

  const esCrear = modo === "crearCuenta";

  // ---------- diseño ----------
  const { width } = useWindowDimensions();
  // en computadora (pantalla ancha) pongo la presentación a la izquierda y
  // el formulario a la derecha; en celular va todo en una columna
  const ancho = width >= 900;
  const quieto = sinMovimiento();

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enfocado, setEnfocado] = useState<"correo" | "password" | null>(null);
  const [anchoPestanas, setAnchoPestanas] = useState(0);

  // animaciones: entrada de la tarjeta, presentación, globito de Pedi,
  // pestaña que se desliza, pulso del logo, figuritas flotando y el botón
  const entrada = useRef(new Animated.Value(quieto ? 1 : 0)).current;
  const entradaHero = useRef(new Animated.Value(quieto ? 1 : 0)).current;
  const globo = useRef(new Animated.Value(quieto ? 1 : 0)).current;
  const pestana = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;
  const flotar = useRef(new Animated.Value(0)).current;
  const presion = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (quieto) return;
    Animated.stagger(140, [
      Animated.timing(entradaHero, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVO }),
      Animated.timing(entrada, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVO }),
      Animated.spring(globo, { toValue: 1, friction: 5, tension: 90, useNativeDriver: NATIVO }),
    ]).start();
    const bucles = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulso, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: NATIVO }),
          Animated.timing(pulso, { toValue: 0, duration: 0, useNativeDriver: NATIVO }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(flotar, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
          Animated.timing(flotar, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
        ])
      ),
    ];
    bucles.forEach((b) => b.start());
    return () => bucles.forEach((b) => b.stop());
  }, []);

  // la pestaña blanca se desliza entre "Iniciar sesión" y "Crear cuenta"
  useEffect(() => {
    const destino = esCrear ? 1 : 0;
    if (quieto) {
      pestana.setValue(destino);
      return;
    }
    Animated.spring(pestana, { toValue: destino, friction: 7, tension: 80, useNativeDriver: NATIVO }).start();
  }, [esCrear]);

  const apretar = (valor: number) => {
    if (quieto) return;
    Animated.spring(presion, { toValue: valor, friction: 5, tension: 160, useNativeDriver: NATIVO }).start();
  };

  const subir = (valor: Animated.Value, distancia = 26) => ({
    opacity: valor,
    transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [distancia, 0] }) }],
  });

  const flotando = (fase: number, rango = 10) => ({
    transform: [
      {
        translateY: flotar.interpolate({
          inputRange: [0, 1],
          outputRange: fase % 2 === 0 ? [0, -rango] : [-rango, 0],
        }),
      },
    ],
  });

  // ---------- piezas ----------
  const presentacion = (
    <Animated.View style={[globalStyles.lgHero, ancho && globalStyles.lgHeroAncho, subir(entradaHero)]}>
      <View style={[globalStyles.lgLogoZona, ancho && { alignSelf: "flex-start" }]}>
        {!quieto && (
          <Animated.View
            pointerEvents="none"
            style={[
              globalStyles.lgLogoPulso,
              {
                opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
              },
            ]}
          />
        )}
        <View style={globalStyles.lgLogoInsignia}>
          <Image
            source={require("../../assets/images/logo-icon.png")}
            style={globalStyles.lgLogoImagen}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Logo de PediatriTrack Global"
          />
        </View>
      </View>

      <Text style={[globalStyles.lgEyebrow, ancho && IZQUIERDA]}>
        Seguimiento pediátrico inteligente
      </Text>
      <Text style={[globalStyles.lgTitulo, ancho && globalStyles.lgTituloAncho]} accessibilityRole="header">
        PediatriTrack Global
      </Text>
      <Text style={[globalStyles.lgSubtitulo, ancho && IZQUIERDA]}>
        Vacunas, vitaminas, comida y documentos de tu bebé en un solo lugar,
        con un asistente con IA que te echa la mano.
      </Text>

      {/* Pedi saluda con su globito */}
      <View style={[globalStyles.lgPediFila, ancho && { alignSelf: "flex-start" }]}>
        <View style={ancho ? globalStyles.lgPediFondo : undefined}>
          <MascotaRobot tamano={ancho ? 84 : 64} estado="saludando" />
        </View>
        <Animated.View
          style={[
            globalStyles.lgGlobo,
            {
              opacity: globo,
              transform: [{ scale: globo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        >
          <Text style={globalStyles.lgGloboTexto}>
            {esCrear ? "¡Bienvenido! Crea tu cuenta y empezamos 🎉" : "¡Hola! Soy Pedi 👋 ¿Le damos seguimiento a tu bebé?"}
          </Text>
        </Animated.View>
      </View>

      <View style={[globalStyles.lgChips, ancho && { justifyContent: "flex-start" }]}>
        {[
          ["💉", "Vacunas 0–6 años"],
          ["📲", "QR de salud"],
          ["🤖", "Asistente con IA"],
          ["♿", "Accesible"],
        ].map(([icono, texto], i) => (
          <Animated.View key={texto} style={[globalStyles.lgChip, !ancho && globalStyles.lgChipClaro, !quieto && flotando(i, 4)]}>
            <Text style={[globalStyles.lgChipTexto, !ancho && globalStyles.lgChipTextoClaro]}>
              {icono} {texto}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const formulario = (
    <Animated.View style={[globalStyles.lgTarjeta, ancho && globalStyles.lgTarjetaAncho, subir(entrada, 40)]}>
      {/* pestañas con indicador que se desliza */}
      <View
        style={globalStyles.lgPestanas}
        accessibilityRole="tablist"
        accessibilityLabel="Selector de modo: iniciar sesión o crear cuenta"
        onLayout={(e) => setAnchoPestanas(e.nativeEvent.layout.width)}
      >
        {anchoPestanas > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              globalStyles.lgPestanaIndicador,
              {
                width: (anchoPestanas - 8) / 2,
                transform: [
                  {
                    translateX: pestana.interpolate({ inputRange: [0, 1], outputRange: [0, (anchoPestanas - 8) / 2] }),
                  },
                ],
              },
            ]}
          />
        )}
        {(
          [
            ["iniciarSesion", "Iniciar sesión"],
            ["crearCuenta", "Crear cuenta"],
          ] as [Modo, string][]
        ).map(([valor, texto]) => (
          <TouchableOpacity
            key={valor}
            style={globalStyles.lgPestana}
            onPress={() => setModo(valor)}
            accessibilityRole="tab"
            accessibilityLabel={texto}
            accessibilityState={{ selected: modo === valor }}
          >
            <Text style={[globalStyles.lgPestanaTexto, modo === valor && globalStyles.lgPestanaTextoActiva]}>
              {texto}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={globalStyles.lgSaludo}>{esCrear ? "Crea tu cuenta gratis ✨" : "¡Qué gusto verte! 👋"}</Text>
      <Text style={globalStyles.lgSaludoSub}>
        {esCrear
          ? "En un minuto registras a tu bebé y ves sus vacunas."
          : "Entra para ver las vacunas, vitaminas y documentos de tu bebé."}
      </Text>

      <Text style={globalStyles.lgEtiqueta} nativeID="labelPais">
        País del esquema de vacunación
      </Text>
      <View style={globalStyles.lgPaises} accessibilityRole="radiogroup" accessibilityLabelledBy="labelPais">
        {(["México", "Estados Unidos"] as const).map((opcion) => (
          <TouchableOpacity
            key={opcion}
            style={[globalStyles.lgPais, pais === opcion && globalStyles.lgPaisActivo]}
            onPress={() => setPais(opcion)}
            accessibilityRole="radio"
            accessibilityLabel={opcion}
            accessibilityState={{ selected: pais === opcion }}
          >
            <Text style={[globalStyles.lgPaisTexto, pais === opcion && globalStyles.lgPaisTextoActivo]}>
              {opcion === "México" ? "🇲🇽 México" : "🇺🇸 Estados Unidos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={globalStyles.lgEtiqueta} nativeID="labelCorreo">
        Correo electrónico
      </Text>
      <View style={[globalStyles.lgCampo, enfocado === "correo" && globalStyles.lgCampoEnfocado]}>
        <Text style={globalStyles.lgCampoIcono}>✉️</Text>
        <TextInput
          placeholder="ejemplo@correo.com"
          placeholderTextColor="#90A4AE"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onFocus={() => setEnfocado("correo")}
          onBlur={() => setEnfocado(null)}
          style={globalStyles.lgCampoInput}
          accessibilityLabel="Correo electrónico"
          accessibilityLabelledBy="labelCorreo"
        />
      </View>

      <Text style={globalStyles.lgEtiqueta} nativeID="labelPassword">
        Contraseña
      </Text>
      <View style={[globalStyles.lgCampo, enfocado === "password" && globalStyles.lgCampoEnfocado]}>
        <Text style={globalStyles.lgCampoIcono}>🔒</Text>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor="#90A4AE"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!mostrarPassword}
          autoComplete={esCrear ? "new-password" : "current-password"}
          onFocus={() => setEnfocado("password")}
          onBlur={() => setEnfocado(null)}
          onSubmitEditing={continuar}
          style={globalStyles.lgCampoInput}
          accessibilityLabel="Contraseña"
          accessibilityLabelledBy="labelPassword"
        />
        <TouchableOpacity
          onPress={() => setMostrarPassword(!mostrarPassword)}
          style={globalStyles.lgOjo}
          accessibilityRole="button"
          accessibilityLabel={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <Text style={globalStyles.lgCampoIcono}>{mostrarPassword ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      {esCrear && (
        <Text style={globalStyles.passwordHint}>Mínimo 8 caracteres, con letras y números.</Text>
      )}

      {!esCrear && (
        <TouchableOpacity
          onPress={recuperarContrasena}
          disabled={cargando}
          style={globalStyles.lgOlvide}
          accessibilityRole="button"
          accessibilityLabel="¿Olvidaste tu contraseña?"
          accessibilityHint="Envía un correo para restablecer tu contraseña"
        >
          <Text style={globalStyles.lgOlvideTexto}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      )}

      <Animated.View style={{ transform: [{ scale: presion }] }}>
        <Pressable
          style={[globalStyles.lgBoton, cargando && { opacity: 0.75 }]}
          onPress={continuar}
          onPressIn={() => apretar(0.96)}
          onPressOut={() => apretar(1)}
          disabled={cargando}
          accessibilityRole="button"
          accessibilityLabel={esCrear ? "Crear cuenta" : "Iniciar sesión"}
          accessibilityState={{ disabled: cargando, busy: cargando }}
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={globalStyles.lgBotonTexto}>{esCrear ? "Crear mi cuenta  →" : "Entrar  →"}</Text>
          )}
        </Pressable>
      </Animated.View>

      <Text style={globalStyles.lgSeguro}>🔒 Tus datos viajan cifrados y solo tú puedes verlos.</Text>

      {/* en la versión web (PWA) pongo el acceso al APK de Android, para
          quien prefiera tener la app instalada con todas sus funciones */}
      {Platform.OS === "web" && (
        <TouchableOpacity
          style={globalStyles.apkBoton}
          onPress={() => window.open(URL_APK, "_blank", "noopener")}
          accessibilityRole="link"
          accessibilityLabel="Descargar la app para Android (APK)"
          accessibilityHint="Abre la página para instalar la última versión en Android"
        >
          <Text style={globalStyles.apkBotonTexto}>🤖 ¿Tienes Android? Descarga la app (APK)</Text>
          <Text style={globalStyles.apkBotonSub}>Última versión · se descarga el archivo .apk para instalarlo</Text>
        </TouchableOpacity>
      )}

      <Text style={globalStyles.lgPie}>© 2026 PediatriTrack Global · Versión 2.0</Text>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView style={globalStyles.lgPantalla} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* fondo: manchas de color suaves y figuritas que flotan */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[globalStyles.lgFondoArriba, ancho && globalStyles.lgFondoArribaAncho]} />
        <Animated.View style={[globalStyles.lgMancha, globalStyles.lgManchaRosa, !quieto && flotando(1, 18)]} />
        <Animated.View style={[globalStyles.lgMancha, globalStyles.lgManchaCielo, !quieto && flotando(0, 22)]} />
        {[
          { icono: "🍼", top: "9%", left: "6%" },
          { icono: "⭐", top: "6%", left: "82%" },
          { icono: "💉", top: "30%", left: "90%" },
          { icono: "🧸", top: "78%", left: "4%" },
          { icono: "🍎", top: "88%", left: "86%" },
          { icono: "💊", top: "52%", left: "2%" },
        ].map((f, i) => (
          <Animated.Text
            key={f.icono}
            style={[globalStyles.lgFigura, { top: f.top as any, left: f.left as any }, !quieto && flotando(i, 14)]}
          >
            {f.icono}
          </Animated.Text>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[globalStyles.lgContenido, ancho && globalStyles.lgContenidoAncho]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {presentacion}
        {formulario}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
