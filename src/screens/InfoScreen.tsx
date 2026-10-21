import { ScrollView, Text, View } from "react-native";
import AyudaModulo from "../components/AyudaModulo";
import BottomNav from "../components/BottomNav";
import { globalStyles } from "../styles/globalStyles";

type Props = {
  onGo: (screen: string) => void;
};

export default function InfoScreen({ onGo }: Props) {
  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* encabezado */}
        <View style={globalStyles.headerCard}>
          <Text style={globalStyles.title} accessibilityRole="header">
            ℹ️ Información Pediátrica
          </Text>

          <Text style={globalStyles.subtitle}>
            Información basada en recomendaciones pediátricas
            internacionales para apoyar el cuidado diario del bebé.
          </Text>
        </View>

        {/* ayuda con IA: explica cómo funciona este módulo */}
        <AyudaModulo modulo="info" />

        {/* Atragantamiento */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🚨 ¿Qué hacer si mi bebé se atraganta?
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Primeros auxilios
          </Text>

          <Text style={globalStyles.helpText}>
            • Mantén la calma.
            {"\n"}• Coloca al bebé boca abajo sobre tu antebrazo.
            {"\n"}• Da 5 golpes firmes entre los omóplatos.
            {"\n"}• Si no funciona, realiza 5 compresiones torácicas.
            {"\n"}• Solicita atención médica inmediata si continúa la obstrucción.
          </Text>
        </View>

        {/* Esterimar */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          👃 Esterimar Pediátrico
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Uso recomendado
          </Text>

          <Text style={globalStyles.helpText}>
            El suero fisiológico nasal puede ayudar a eliminar
            secreciones y mejorar la respiración. Se recomienda
            especialmente durante resfriados y congestión nasal.
          </Text>
        </View>

        {/* Vacunas */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          💉 Efectos secundarios comunes de las vacunas
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Reacciones esperadas
          </Text>

          <Text style={globalStyles.helpText}>
            • Dolor en la zona de aplicación.
            {"\n"}• Enrojecimiento.
            {"\n"}• Fiebre leve.
            {"\n"}• Irritabilidad.
            {"\n"}• Somnolencia temporal.
          </Text>
        </View>

        {/* Fiebre */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🌡️ Fiebre en el bebé
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Cuidados en casa
          </Text>

          <Text style={globalStyles.helpText}>
            • Se considera fiebre a partir de 38°C.
            {"\n"}• Viste al bebé con ropa ligera y mantén el ambiente fresco.
            {"\n"}• Ofrece líquidos con frecuencia para evitar deshidratación.
            {"\n"}• Usa el medicamento antipirético solo bajo indicación médica y a la dosis exacta por peso.
            {"\n"}• Evita baños con agua fría o alcohol.
          </Text>
        </View>

        <View style={globalStyles.alertCard}>
          <Text style={globalStyles.alertTitle}>
            Acude al médico si...
          </Text>

          <Text style={globalStyles.alertText}>
            • El bebé tiene menos de 3 meses y presenta fiebre.
            {"\n"}• La fiebre supera los 39°C.
            {"\n"}• Dura más de 24-48 horas.
            {"\n"}• Se acompaña de decaimiento importante, erupciones en la piel o llanto inconsolable.
          </Text>
        </View>

        {/* Diarrea */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          💧 Diarrea e hidratación
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Cuidados en casa
          </Text>

          <Text style={globalStyles.helpText}>
            • Continúa con la lactancia o fórmula habitual.
            {"\n"}• Ofrece suero de hidratación oral en pequeñas cantidades y con frecuencia.
            {"\n"}• Introduce alimentos astringentes (ver sección siguiente) si ya inició ablactación.
            {"\n"}• Evita jugos industrializados y bebidas azucaradas.
          </Text>
        </View>

        <View style={globalStyles.alertCard}>
          <Text style={globalStyles.alertTitle}>
            Acude al médico si...
          </Text>

          <Text style={globalStyles.alertText}>
            • Hay sangre o moco en las evacuaciones.
            {"\n"}• Signos de deshidratación: boca seca, pocas lágrimas, orina escasa.
            {"\n"}• Vómito persistente que impide la hidratación oral.
            {"\n"}• La diarrea dura más de 3-5 días.
          </Text>
        </View>

        {/* Astringentes */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🍌 Alimentos Astringentes
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Recomendados en diarrea
          </Text>

          <Text style={globalStyles.helpText}>
            • Plátano
            {"\n"}• Arroz
            {"\n"}• Manzana cocida
            {"\n"}• Zanahoria cocida
            {"\n"}• Pan tostado
          </Text>
        </View>

        {/* No astringentes */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🥝 Alimentos No Astringentes
        </Text>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Dieta habitual
          </Text>

          <Text style={globalStyles.helpText}>
            • Papaya
            {"\n"}• Pera
            {"\n"}• Avena
            {"\n"}• Yogurt natural
            {"\n"}• Verduras variadas
          </Text>
        </View>

        {/* Signos de alarma */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          ⚠️ Signos de alarma
        </Text>

        <View style={globalStyles.alertCard}>
          <Text style={globalStyles.alertTitle}>
            Atención médica inmediata
          </Text>

          <Text style={globalStyles.alertText}>
            Busca atención médica urgente si el bebé presenta:
            {"\n\n"}
            • Dificultad respiratoria.
            {"\n"}• Convulsiones.
            {"\n"}• Deshidratación.
            {"\n"}• Fiebre persistente.
            {"\n"}• Rechazo total de alimentos.
          </Text>
        </View>

        {/* Urgencias */}
        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          🚑 Urgencias: cuándo acudir de inmediato
        </Text>

        <View style={globalStyles.alertCard}>
          <Text style={globalStyles.alertTitle}>
            Ve a urgencias ahora si el bebé presenta
          </Text>

          <Text style={globalStyles.alertText}>
            • Labios o piel morados o muy pálidos.
            {"\n"}• Dificultad para respirar o pausas en la respiración.
            {"\n"}• Convulsiones o pérdida de conciencia.
            {"\n"}• Fontanela (mollera) muy hundida o abombada.
            {"\n"}• Llanto agudo inconsolable por más de 2 horas.
            {"\n"}• Golpe fuerte en la cabeza con vómito o somnolencia excesiva.
          </Text>
        </View>

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            Llama al pediatra si...
          </Text>

          <Text style={globalStyles.helpText}>
            Los síntomas son persistentes pero sin señales de gravedad
            inmediata: fiebre leve prolongada, diarrea sin sangre,
            irritabilidad tras vacunas o dudas sobre alimentación. Un
            profesional de salud puede orientar si se necesita valoración
            presencial.
          </Text>
        </View>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav
        onGo={onGo}
        active="info"
      />
    </View>
  );
}