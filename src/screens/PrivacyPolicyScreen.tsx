import { ScrollView, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";
import { globalStyles } from "../styles/globalStyles";

type Props = {
  onGo: (screen: string) => void;
};

export default function PrivacyPolicyScreen({ onGo }: Props) {
  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* encabezado */}
        <View style={globalStyles.headerCard}>
          <Text style={globalStyles.title} accessibilityRole="header">🔒 Política de Privacidad</Text>

          <Text style={globalStyles.subtitle}>
            PediatriTrack Global protege la información de tu bebé y de tu
            cuenta. Aquí explicamos qué datos recopilamos, cómo se usan y
            cómo se resguardan.
          </Text>
        </View>

        {/* datos que recopilamos */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          📋 Datos que recopilamos
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Información de cuenta y del bebé
          </Text>

          <Text style={globalStyles.helpText}>
            • Correo electrónico y contraseña, usados únicamente para
            iniciar sesión (Firebase Authentication).
            {"\n"}• Datos del bebé: nombre, fecha de nacimiento, sexo,
            alergias y condiciones médicas que tú registras.
            {"\n"}• Registros de vacunación, vitaminas, alimentación y
            documentos médicos (por ejemplo, PDFs de cartilla o estudios)
            que subes dentro de la app.
          </Text>
        </View>

        {/* cómo usamos los datos */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          ⚙️ Cómo usamos tus datos
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Solo para el funcionamiento de la app
          </Text>

          <Text style={globalStyles.helpText}>
            • Mostrarte el esquema de vacunación, recordatorios de
            vitaminas y recomendaciones de alimentación según la edad de
            tu bebé.
            {"\n"}• Generar el resumen y las estadísticas del dashboard.
            {"\n"}• Permitir que abras, compartas o actualices tus
            documentos guardados.
            {"\n"}• Responder en el asistente virtual y en la ayuda de cada
            módulo: lo que escribes, la edad y las alergias del bebé (no su
            nombre) y las fotos de medicamentos se envían a Google Gemini
            para generar la respuesta.
            {"\n"}• Tu historial de consultas y tus opciones de accesibilidad
            se guardan solo en este dispositivo.
            {"\n"}No usamos tus datos con fines publicitarios ni los
            vendemos a terceros.
          </Text>
        </View>

        {/* dónde se guardan los datos */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          ☁️ Dónde se almacenan tus datos
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Firebase (Google Cloud)
          </Text>

          <Text style={globalStyles.helpText}>
            • Los datos de texto (bebé, vacunas, vitaminas, alimentación)
            se guardan en Cloud Firestore.
            {"\n"}• Los archivos PDF se guardan en Firebase Storage.
            {"\n"}• Ambos servicios son operados por Google bajo el plan
            Blaze de Firebase, con reglas de seguridad configuradas para
            este proyecto.
          </Text>
        </View>

        {/* seguridad */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🛡️ Cómo protegemos tu información
        </Text>

        <View style={globalStyles.alertCard}>
          <Text style={globalStyles.alertTitle}>
            Aislamiento de datos por cuenta
          </Text>

          <Text style={globalStyles.alertText}>
            • Cada usuario solo puede leer y modificar la información de su
            propia cuenta (validado con tu identificador único de Firebase
            Authentication).
            {"\n"}• Las reglas de Firestore y Storage bloquean por defecto
            cualquier acceso que no sea del dueño de los datos.
            {"\n"}• Puedes registrar más de un bebé y cambiar entre
            perfiles sin exponer la información a otras cuentas.
          </Text>
        </View>

        {/* menores de edad */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          👶 Datos de menores de edad
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Responsabilidad del tutor
          </Text>

          <Text style={globalStyles.helpText}>
            La información registrada sobre el bebé es capturada y
            administrada por el padre, madre o tutor, quien es responsable
            de la cuenta. PediatriTrack Global no recopila datos
            directamente de menores de edad; toda la información se
            ingresa manualmente por un adulto responsable.
          </Text>
        </View>

        {/* derechos del usuario */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          ✅ Tus derechos
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Acceso, corrección y eliminación
          </Text>

          <Text style={globalStyles.helpText}>
            • Puedes editar o eliminar vitaminas, documentos y registros
            desde la propia app en cualquier momento.
            {"\n"}• Puedes cerrar sesión desde el menú de cuenta (⚙️) en la
            pantalla principal.
            {"\n"}• Para solicitar la eliminación completa de tu cuenta y
            de todos los datos asociados, contáctanos con el correo abajo.
          </Text>
        </View>

        {/* contacto */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          ✉️ Contacto
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Dudas sobre privacidad
          </Text>

          <Text style={globalStyles.helpText}>
            Si tienes dudas sobre esta política o sobre el manejo de tus
            datos, escribe a: 2311080908@alumno.utpuebla.edu.mx
          </Text>
        </View>

        <View style={globalStyles.versionCard}>
          <Text style={globalStyles.versionText}>
            Última actualización: 6 de julio de 2026 • Proyecto académico
            PediatriTrack Global
          </Text>
        </View>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="info" />
    </View>
  );
}
