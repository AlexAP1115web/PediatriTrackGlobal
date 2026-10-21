import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import BottomNav from "../components/BottomNav";
import { useAccesibilidad } from "../context/AccesibilidadContext";
import { colors, globalStyles } from "../styles/globalStyles";
import { textoEstado } from "../utils/estados";

type Props = {
  onGo: (screen: string) => void;
};

// pantalla de opciones de accesibilidad. La idea es que la app la pueda
// usar más gente: personas con daltonismo, con baja visión o que usan
// lector de pantalla (TalkBack en Android)
export default function AccesibilidadScreen({ onGo }: Props) {
  const { daltonismo, textoGrande, cambiarDaltonismo, cambiarTextoGrande } =
    useAccesibilidad();

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={globalStyles.headerCard}>
          <TouchableOpacity
            onPress={() => onGo("dashboard")}
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
          >
            <Text style={globalStyles.privacyLinkText}>← Volver al inicio</Text>
          </TouchableOpacity>

          <Text style={[globalStyles.title, { marginTop: 8 }]} accessibilityRole="header">
            ♿ Accesibilidad
          </Text>

          <Text style={globalStyles.subtitle}>
            Ajusta la app para que sea más cómoda de ver y de usar. Los
            cambios se guardan en este dispositivo.
          </Text>
        </View>

        {/* modo daltonismo */}
        <View style={globalStyles.helpCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={globalStyles.helpTitle}>🎨 Modo daltonismo</Text>
              <Text style={globalStyles.helpText}>
                Cambia los colores rojo y verde por azul, naranja y bermellón,
                que se distinguen con los tipos de daltonismo más comunes.
              </Text>
            </View>
            <Switch
              value={daltonismo}
              onValueChange={cambiarDaltonismo}
              trackColor={{ false: colors.border, true: colors.primary }}
              accessibilityLabel="Modo daltonismo"
              accessibilityHint="Cambia la paleta de colores de toda la app"
            />
          </View>
        </View>

        {/* texto grande */}
        <View style={globalStyles.helpCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={globalStyles.helpTitle}>🔠 Texto más grande</Text>
              <Text style={globalStyles.helpText}>
                Agranda la letra en todas las pantallas para leer con menos
                esfuerzo.
              </Text>
            </View>
            <Switch
              value={textoGrande}
              onValueChange={cambiarTextoGrande}
              trackColor={{ false: colors.border, true: colors.primary }}
              accessibilityLabel="Texto más grande"
              accessibilityHint="Agranda la letra en toda la app"
            />
          </View>
        </View>

        {/* vista previa de los estados */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          Así se ven los estados
        </Text>

        <View style={[globalStyles.helpCard, { flexDirection: "row", flexWrap: "wrap", gap: 8 }]}>
          <View style={[globalStyles.statusBadge, globalStyles.statusApplied]}>
            <Text style={globalStyles.statusText}>{textoEstado("Aplicada")}</Text>
          </View>
          <View style={[globalStyles.statusBadge, globalStyles.statusNext]}>
            <Text style={globalStyles.statusText}>{textoEstado("Próxima")}</Text>
          </View>
          <View style={[globalStyles.statusBadge, globalStyles.statusPending]}>
            <Text style={globalStyles.statusText}>{textoEstado("Atrasada")}</Text>
          </View>
        </View>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>Lo que ya viene activado</Text>
          <Text style={globalStyles.helpText}>
            • Cada estado tiene ícono y palabra, no solo color (✓ aplicada,
            ⏳ próxima, ⚠ atrasada, ○ pendiente).
            {"\n"}• Los botones, títulos y estados tienen descripciones para
            lectores de pantalla como TalkBack.
            {"\n"}• En cada módulo hay un botón "¿Cómo funciona?" donde la IA te
            explica con palabras sencillas para qué sirve y cómo usarlo.
          </Text>
        </View>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="accesibilidad" />
    </View>
  );
}
