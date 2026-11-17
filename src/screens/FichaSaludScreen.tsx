import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import EncabezadoModulo from "../components/EncabezadoModulo";
import { FichaSalud, obtenerFichaFirebase } from "../firebase/firebaseService";
import { colors, globalStyles } from "../styles/globalStyles";

type Props = {
  token: string;
  // botón de abajo (en la web: "Abrir PediatriTrack"; en el escáner:
  // "Escanear otro QR")
  onCerrar?: () => void;
  textoCerrar?: string;
};

// busca hospitales pediátricos en Google Maps (cerca del destino del viaje
// si lo pusieron, o cerca de donde está el celular)
function abrirHospitales(destino?: string) {
  const busqueda = destino ? `hospital pediátrico cerca de ${destino}` : "hospital pediátrico";
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busqueda)}`;
  if (Platform.OS === "web") {
    window.open(url, "_blank", "noopener");
    return;
  }
  Linking.openURL(url).catch((error) => console.log("No se pudo abrir Maps:", error));
}

// un renglón "etiqueta: valor"; si el papá dejó el campo vacío no se muestra
function Fila({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  if (!valor) return null;
  return (
    <View style={globalStyles.fichaFila}>
      <Text style={globalStyles.fichaEtiqueta}>{etiqueta}</Text>
      <Text style={globalStyles.fichaValor} selectable>
        {valor}
      </Text>
    </View>
  );
}

// Esta es la ficha que ve el pediatra cuando escanea el QR. Se abre sin
// iniciar sesión (con el puro código), por eso solo muestra lo que el papá
// decidió compartir y nada más. La de viaje sale en español e inglés para
// que sirva en otro país.
export default function FichaSaludScreen({ token, onCerrar, textoCerrar }: Props) {
  const [ficha, setFicha] = useState<FichaSalud | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(false);
    obtenerFichaFirebase(token)
      .then((resultado) => {
        if (vigente) setFicha(resultado);
      })
      .catch((e) => {
        console.log("Error al abrir la ficha:", e);
        if (vigente) setError(true);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [token]);

  if (cargando) {
    return (
      <View style={[globalStyles.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.subtitle, { marginTop: 12 }]}>Abriendo la ficha...</Text>
      </View>
    );
  }

  const botonCerrar = onCerrar ? (
    <TouchableOpacity
      style={globalStyles.buttonPrimary}
      onPress={onCerrar}
      accessibilityRole="button"
    >
      <Text style={globalStyles.buttonText}>{textoCerrar || "Cerrar"}</Text>
    </TouchableOpacity>
  ) : null;

  if (!ficha) {
    return (
      <View style={globalStyles.screen}>
        <ScrollView style={globalStyles.container}>
          <View style={globalStyles.headerCard}>
            <Text style={globalStyles.title} accessibilityRole="header">
              🔒 Ficha no disponible
            </Text>
            <Text style={globalStyles.subtitle}>
              {error
                ? "No se pudo conectar. Revisa tu internet e intenta otra vez."
                : "Esta ficha ya venció, la desactivaron o el código no es válido. Pídele a la familia que genere un QR nuevo desde PediatriTrack Global."}
            </Text>
            <Text style={[globalStyles.subtitle, { fontStyle: "italic" }]}>
              This health card has expired, was turned off, or the code is not valid.
            </Text>
          </View>
          {botonCerrar}
          <View style={globalStyles.bottomSpace} />
        </ScrollView>
      </View>
    );
  }

  const esViaje = ficha.tipo === "viaje";
  // en la de viaje cada etiqueta lleva su traducción
  const et = (es: string, en: string) => (esViaje ? `${es} · ${en}` : es);
  const traducir = (valor: string) => {
    if (!esViaje) return valor;
    const ingles: Record<string, string> = {
      Masculino: "Male",
      Femenino: "Female",
      México: "Mexico",
      "Estados Unidos": "United States",
      "No sé": "Unknown",
    };
    return ingles[valor] ? `${valor} · ${ingles[valor]}` : valor;
  };

  const edadConTraduccion = (edad: string) => {
    if (!esViaje || !edad) return edad;
    const ingles = edad
      .replace("Recién nacido", "Newborn")
      .replace("meses", "months")
      .replace("mes", "month");
    return ingles === edad ? edad : `${edad} · ${ingles}`;
  };

  const vence = ficha.expiraEn?.toDate?.() as Date | undefined;
  const bebe = ficha.bebe;
  const tieneAlergias = !!(bebe.alergias || bebe.alergiasAlimentarias);

  return (
    <View style={globalStyles.screen}>
      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
        <EncabezadoModulo
          icono={esViaje ? "✈️" : "🩺"}
          titulo={esViaje ? "Ficha de viaje" : "Pre-consulta"}
          etiqueta={esViaje ? "Travel health card" : "PediatriTrack Global"}
          tono="turquesa"
          subtitulo={
            esViaje
              ? "Datos de salud del bebé para emergencias durante el viaje."
              : "Información que la familia llenó antes de la consulta."
          }
        />

        {tieneAlergias ? (
          <View style={globalStyles.fichaAlerta} accessibilityRole="alert">
            <Text style={globalStyles.fichaAlertaTitulo}>⚠️ {et("Alergias", "Allergies")}</Text>
            {!!bebe.alergias && (
              <Text style={globalStyles.fichaAlertaTexto}>
                {et("Medicamentos / otras", "Drugs / other")}: {bebe.alergias}
              </Text>
            )}
            {!!bebe.alergiasAlimentarias && (
              <Text style={globalStyles.fichaAlertaTexto}>
                {et("Alimentos", "Food")}: {bebe.alergiasAlimentarias}
              </Text>
            )}
          </View>
        ) : (
          <View style={globalStyles.fichaSeccion}>
            <Text style={globalStyles.fichaValor}>
              ✅ {et("Sin alergias registradas", "No known allergies recorded")}
            </Text>
          </View>
        )}

        {!esViaje && !!ficha.resumenIA && (
          <View style={[globalStyles.fichaSeccion, { borderWidth: 2, borderColor: colors.primaryLight }]}>
            <Text style={globalStyles.fichaSeccionTitulo}>✨ Resumen para el pediatra</Text>
            <Text style={globalStyles.fichaValor} selectable>
              {ficha.resumenIA}
            </Text>
            <Text style={[globalStyles.fichaEtiqueta, { marginTop: 8, textTransform: "none" }]}>
              Hecho con IA a partir de lo que escribió la familia. Verifícalo con los datos de abajo.
            </Text>
          </View>
        )}

        <View style={globalStyles.fichaSeccion}>
          <Text style={globalStyles.fichaSeccionTitulo}>{et("👶 Bebé", "Child")}</Text>
          <Fila etiqueta={et("Nombre", "Name")} valor={bebe.nombre} />
          <Fila etiqueta={et("Edad", "Age")} valor={edadConTraduccion(bebe.edad)} />
          <Fila etiqueta={et("Fecha de nacimiento", "Date of birth")} valor={bebe.fechaNacimiento} />
          <Fila etiqueta={et("Sexo", "Sex")} valor={traducir(bebe.sexo)} />
          <Fila etiqueta={et("País", "Country")} valor={traducir(bebe.pais)} />
        </View>

        {esViaje ? (
          <View style={globalStyles.fichaSeccion}>
            <Text style={globalStyles.fichaSeccionTitulo}>{et("🆘 Emergencias", "Emergency")}</Text>
            <Fila etiqueta={et("Destino", "Destination")} valor={ficha.destino} />
            <Fila etiqueta={et("Grupo sanguíneo", "Blood type")} valor={traducir(ficha.grupoSanguineo || "")} />
            <Fila etiqueta={et("Condiciones médicas", "Medical conditions")} valor={bebe.condiciones} />
            <Fila etiqueta={et("Contacto de emergencia", "Emergency contact")} valor={ficha.contactoNombre} />
            {!!ficha.contactoTelefono && (
              <TouchableOpacity
                style={globalStyles.fichaFila}
                onPress={() => Linking.openURL(`tel:${ficha.contactoTelefono?.replace(/[^\d+]/g, "")}`)}
                accessibilityRole="link"
                accessibilityLabel={`Llamar a ${ficha.contactoTelefono}`}
              >
                <Text style={globalStyles.fichaEtiqueta}>{et("Teléfono", "Phone")}</Text>
                <Text style={[globalStyles.fichaValor, { color: colors.primaryDark }]}>
                  📞 {ficha.contactoTelefono}
                </Text>
              </TouchableOpacity>
            )}
            <Fila etiqueta={et("Seguro médico", "Health insurance")} valor={ficha.seguro} />
            <Fila etiqueta={et("Notas", "Notes")} valor={ficha.notas} />
            <TouchableOpacity
              style={[globalStyles.qrBoton, { marginTop: 12, flexGrow: 0 }]}
              onPress={() => abrirHospitales(ficha.destino)}
              accessibilityRole="link"
            >
              <Text style={globalStyles.qrBotonTexto}>
                🏥 Hospitales pediátricos cerca · Nearby children's hospitals
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={globalStyles.fichaSeccion}>
            <Text style={globalStyles.fichaSeccionTitulo}>📝 Motivo de la consulta</Text>
            <Fila etiqueta="Motivo" valor={ficha.motivo} />
            <Fila etiqueta="Dónde le molesta" valor={ficha.zonas} />
            <Fila etiqueta="Desde cuándo" valor={ficha.desdeCuando} />
            <Fila etiqueta="Lo que ha notado la familia" valor={ficha.descripcion} />
            <Fila etiqueta="Temperatura" valor={ficha.temperatura ? `${ficha.temperatura} °C` : ""} />
            <Fila etiqueta="Peso" valor={ficha.peso ? `${ficha.peso} kg` : ""} />
            <Fila etiqueta="Medicamentos que le han dado" valor={ficha.medicamentos} />
            <Fila etiqueta="Condiciones médicas" valor={bebe.condiciones} />
            <Fila etiqueta="Preguntas para el pediatra" valor={ficha.preguntas} />
          </View>
        )}

        <View style={globalStyles.fichaSeccion}>
          <Text style={globalStyles.fichaSeccionTitulo}>
            💉 {et("Vacunas aplicadas", "Vaccines given")} ({ficha.vacunas?.length || 0})
          </Text>
          {ficha.vacunas?.length ? (
            ficha.vacunas.map((vacuna, indice) => (
              <Text key={indice} style={globalStyles.fichaVacuna}>
                • {vacuna}
              </Text>
            ))
          ) : (
            <Text style={globalStyles.fichaVacuna}>
              {et("No se compartieron vacunas.", "No vaccines shared.")}
            </Text>
          )}
        </View>

        <Text style={globalStyles.fichaPie}>
          {vence ? `${et("Vigente hasta", "Valid until")}: ${vence.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}\n` : ""}
          {esViaje
            ? "Datos capturados por la familia en PediatriTrack Global. No sustituye la valoración médica.\nEntered by the family in PediatriTrack Global. Not a substitute for medical assessment."
            : "Datos capturados por la familia en PediatriTrack Global. No sustituye la valoración médica."}
        </Text>

        {botonCerrar}
        <View style={globalStyles.bottomSpace} />
      </ScrollView>
    </View>
  );
}
