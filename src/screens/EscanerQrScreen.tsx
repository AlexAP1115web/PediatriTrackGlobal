import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import BottomNav from "../components/BottomNav";
import { colors, globalStyles } from "../styles/globalStyles";
import { tokenDeTexto } from "../utils/qr";
import FichaSaludScreen from "./FichaSaludScreen";

type Props = {
  onGo: (screen: string) => void;
};

// en el navegador solo se puede leer el QR si tiene BarcodeDetector
// (Chrome en Android sí; Safari y Chrome de Windows no). Si no hay, dejo
// pegar el enlace y recomiendo usar la cámara normal del celular.
const PUEDE_ESCANEAR =
  Platform.OS !== "web" || (typeof globalThis !== "undefined" && "BarcodeDetector" in globalThis);

// Escáner para el pediatra (o la enfermera): lee el QR de PediatriTrack de
// una familia y abre su ficha de pre-consulta o de viaje aquí mismo.
export default function EscanerQrScreen({ onGo }: Props) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [token, setToken] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [textoManual, setTextoManual] = useState("");
  // para no leer el mismo QR 20 veces por segundo
  const leyendo = useRef(false);

  const alLeer = (dato: string) => {
    if (leyendo.current) return;
    leyendo.current = true;
    const encontrado = tokenDeTexto(dato);
    if (encontrado) {
      setAviso("");
      setToken(encontrado);
      return;
    }
    setAviso("Ese QR no es de una ficha de PediatriTrack. Intenta con otro.");
    setTimeout(() => {
      leyendo.current = false;
    }, 2000);
  };

  const abrirManual = () => {
    const encontrado = tokenDeTexto(textoManual);
    if (!encontrado) {
      setAviso("No reconozco ese enlace. Debe ser el que empieza con pediatritrack-global.expo.app/?ficha=");
      return;
    }
    setAviso("");
    setToken(encontrado);
  };

  if (token) {
    return (
      <FichaSaludScreen
        token={token}
        textoCerrar="📷 Escanear otro QR"
        onCerrar={() => {
          setToken(null);
          setTextoManual("");
          leyendo.current = false;
        }}
      />
    );
  }

  const camara = () => {
    if (!PUEDE_ESCANEAR) {
      return (
        <Text style={globalStyles.qrCamaraTexto}>
          Este navegador no puede leer QR. Abre la cámara de tu celular y
          apunta al código, o pega el enlace aquí abajo.
        </Text>
      );
    }
    if (!permiso) {
      return <Text style={globalStyles.qrCamaraTexto}>Preparando la cámara...</Text>;
    }
    if (!permiso.granted) {
      return (
        <View style={{ alignItems: "center" }}>
          <Text style={globalStyles.qrCamaraTexto}>
            Necesito permiso para usar la cámara y leer el código QR. No se
            toman ni guardan fotos.
          </Text>
          <TouchableOpacity
            style={[globalStyles.buttonPrimary, { marginTop: 16, paddingHorizontal: 24 }]}
            onPress={pedirPermiso}
            accessibilityRole="button"
          >
            <Text style={globalStyles.buttonText}>Permitir cámara</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <>
        <CameraView
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={(resultado) => alLeer(resultado.data)}
        />
        <View style={globalStyles.qrCamaraMarco} pointerEvents="none" />
      </>
    );
  };

  return (
    <View style={globalStyles.screen}>
      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
        <View style={globalStyles.headerCard}>
          <Text style={globalStyles.title} accessibilityRole="header">
            📷 Escanear QR
          </Text>
          <Text style={globalStyles.subtitle}>
            Para el pediatra o personal de salud: apunta al QR que te enseña la
            familia y verás su pre-consulta o su ficha de viaje.
          </Text>
        </View>

        <View style={globalStyles.qrCamaraCaja}>{camara()}</View>

        {!!aviso && (
          <View style={globalStyles.noticeCard} accessibilityRole="alert">
            <Text style={globalStyles.noticeText}>{aviso}</Text>
          </View>
        )}

        <View style={globalStyles.formCard}>
          <Text style={globalStyles.label}>¿No funciona la cámara? Pega el enlace</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="https://pediatritrack-global.expo.app/?ficha=..."
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            value={textoManual}
            onChangeText={setTextoManual}
            onSubmitEditing={abrirManual}
          />
          <TouchableOpacity style={globalStyles.buttonPrimary} onPress={abrirManual} accessibilityRole="button">
            <Text style={globalStyles.buttonText}>Abrir ficha</Text>
          </TouchableOpacity>
        </View>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="escaner" />
    </View>
  );
}
