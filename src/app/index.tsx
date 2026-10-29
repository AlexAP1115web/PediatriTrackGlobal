import { Nunito_400Regular } from "@expo-google-fonts/nunito/400Regular";
import { Nunito_600SemiBold } from "@expo-google-fonts/nunito/600SemiBold";
import { Nunito_700Bold } from "@expo-google-fonts/nunito/700Bold";
import { Nunito_800ExtraBold } from "@expo-google-fonts/nunito/800ExtraBold";
import { Nunito_900Black } from "@expo-google-fonts/nunito/900Black";
import { useFonts } from "expo-font";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { auth } from "../firebase/firebaseConfig";
import { Alert } from "../utils/alerta";
import {
  cerrarSesionFirebase,
  obtenerUltimoBebeFirebase,
} from "../firebase/firebaseService";
import {
  AccesibilidadProvider,
  useAccesibilidad,
} from "../context/AccesibilidadContext";
import AccesibilidadScreen from "../screens/AccesibilidadScreen";
import BabyRegisterScreen from "../screens/BabyRegisterScreen";
import ChatbotScreen from "../screens/ChatbotScreen";
import DocumentsScreen from "../screens/DocumentsScreen";
import FoodScreen from "../screens/FoodScreen";
import InfoScreen from "../screens/InfoScreen";
import LoginScreen from "../screens/LoginScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import VaccinationScreen from "../screens/VaccinationScreen";
import VitaminsScreen from "../screens/VitaminsScreen";
import { globalStyles } from "../styles/globalStyles";

type ScreenName =
  | "login"
  | "registro"
  | "dashboard"
  | "documentos"
  | "vitaminas"
  | "alimentacion"
  | "info"
  | "privacidad"
  | "chatbot"
  | "accesibilidad";

// tiempo máximo que dejo la sesión inactiva antes de cerrarla sola (por seguridad)
const TIEMPO_MAXIMO_INACTIVIDAD_MS = 30 * 60 * 1000; // 30 minutos
const INTERVALO_REVISION_MS = 30 * 1000; // reviso cada 30 segundos si ya se pasó

// envuelvo toda la app en el provider de accesibilidad para que el modo
// daltonismo y el texto grande apliquen en todas las pantallas
export default function Index() {
  // cargo la letra Nunito antes de mostrar la app (si fallara, la app sigue
  // con la letra del sistema)
  const [fuentesListas, errorFuentes] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fuentesListas && !errorFuentes) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5FAFF" }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <AccesibilidadProvider>
      <PantallasApp />
    </AccesibilidadProvider>
  );
}

function PantallasApp() {
  const { versionTema } = useAccesibilidad();
  const [pantalla, setPantalla] = useState<ScreenName>("login");
  const [verificando, setVerificando] = useState(true);
  const ultimaActividadRef = useRef<number>(Date.now());

  const registrarActividad = () => {
    ultimaActividadRef.current = Date.now();
  };

  useEffect(() => {
    const cancelarSuscripcion = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        setPantalla("login");
        setVerificando(false);
        return;
      }

      registrarActividad();
      await irAPantallaSegunBebe();
      setVerificando(false);
    });

    return cancelarSuscripcion;
  }, []);

  // este efecto cierra la sesión sola si el usuario ya autenticado se
  // queda 30 minutos sin tocar la pantalla ni cambiar de módulo
  useEffect(() => {
    const intervalo = setInterval(async () => {
      if (!auth.currentUser) return;

      const inactivo = Date.now() - ultimaActividadRef.current;
      if (inactivo >= TIEMPO_MAXIMO_INACTIVIDAD_MS) {
        try {
          await cerrarSesionFirebase();
          Alert.alert(
            "Sesión expirada",
            "Por seguridad, cerramos tu sesión después de 30 minutos sin actividad. Inicia sesión de nuevo."
          );
        } catch (error) {
          console.log("Error al cerrar sesión por inactividad:", error);
        }
      }
    }, INTERVALO_REVISION_MS);

    return () => clearInterval(intervalo);
  }, []);

  const irAPantallaSegunBebe = async () => {
    try {
      const bebe = await obtenerUltimoBebeFirebase();
      setPantalla(bebe ? "dashboard" : "registro");
    } catch (error) {
      console.log("Error al verificar sesión guardada:", error);
      setPantalla("registro");
    }
  };

  const navegar = (screen: string) => {
    registrarActividad();
    setPantalla(screen as ScreenName);
  };

  const alIniciarSesion = async () => {
    registrarActividad();
    setVerificando(true);
    await irAPantallaSegunBebe();
    setVerificando(false);
  };

  const renderizarPantallaActual = () => {
    if (verificando) {
      return (
        <View
          style={[
            globalStyles.screen,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={[globalStyles.subtitle, { marginTop: 12 }]}>
            Verificando sesión...
          </Text>
        </View>
      );
    }

    if (pantalla === "login") {
      return <LoginScreen onLogin={alIniciarSesion} />;
    }

    if (pantalla === "registro") {
      return <BabyRegisterScreen onGo={navegar} />;
    }

    if (pantalla === "dashboard") {
      return <VaccinationScreen onGo={navegar} />;
    }

    if (pantalla === "vitaminas") {
      return <VitaminsScreen onGo={navegar} />;
    }

    if (pantalla === "documentos") {
      return <DocumentsScreen onGo={navegar} />;
    }

    if (pantalla === "alimentacion") {
      return <FoodScreen onGo={navegar} />;
    }

    if (pantalla === "info") {
      return <InfoScreen onGo={navegar} />;
    }

    if (pantalla === "privacidad") {
      return <PrivacyPolicyScreen onGo={navegar} />;
    }

    if (pantalla === "chatbot") {
      return <ChatbotScreen onGo={navegar} />;
    }

    if (pantalla === "accesibilidad") {
      return <AccesibilidadScreen onGo={navegar} />;
    }

    return <LoginScreen onLogin={alIniciarSesion} />;
  };

  // envolví todo en una View que registra actividad con cada toque, así
  // reinicio el temporizador de inactividad sin tener que meterle el
  // mismo código a cada pantalla por separado
  return (
    // el key con versionTema hace que la pantalla se vuelva a dibujar
    // cuando cambian los colores o el tamaño de letra (sin perder en qué
    // pantalla estaba el usuario)
    <View
      key={versionTema}
      style={{ flex: 1 }}
      onTouchStart={registrarActividad}
    >
      {renderizarPantallaActual()}
    </View>
  );
}
