import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { GUIAS_MODULOS, ModuloAyuda } from "../constants/guiasModulos";
import { explicarModulo, MensajeChat } from "../services/chatbotService";
import { colors, globalStyles } from "../styles/globalStyles";

type Props = {
  modulo: ModuloAyuda;
};

// botón "¿Cómo funciona este módulo?" que va arriba de cada pantalla. Al
// tocarlo, la IA explica el módulo con palabras sencillas y deja hacerle
// preguntas. Lo pensé sobre todo para papás o abuelos que no están tan
// acostumbrados a usar apps
export default function AyudaModulo({ modulo }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [sinIA, setSinIA] = useState(false);

  const titulo = GUIAS_MODULOS[modulo].titulo;

  const abrir = async () => {
    setAbierto(true);
    // si ya lo había explicado no vuelvo a gastar una llamada a la IA
    if (mensajes.length > 0) return;

    setCargando(true);
    const { texto, deRespaldo } = await explicarModulo(modulo, []);
    setSinIA(deRespaldo);
    setMensajes([{ rol: "asistente", texto }]);
    setCargando(false);
  };

  const preguntar = async () => {
    const texto = pregunta.trim();
    if (!texto || cargando) return;

    const historial = mensajes;
    const conPregunta: MensajeChat[] = [...historial, { rol: "usuario", texto }];
    setMensajes(conPregunta);
    setPregunta("");
    setCargando(true);

    const respuesta = await explicarModulo(modulo, historial, texto);
    setSinIA(respuesta.deRespaldo);
    setMensajes([...conPregunta, { rol: "asistente", texto: respuesta.texto }]);
    setCargando(false);
  };

  if (!abierto) {
    return (
      <TouchableOpacity
        style={globalStyles.ayudaBoton}
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={`¿Cómo funciona el módulo de ${titulo}?`}
        accessibilityHint="La inteligencia artificial te explica este módulo paso a paso"
      >
        <Text style={globalStyles.ayudaBotonTexto}>
          ✨ ¿Cómo funciona este módulo?
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={globalStyles.ayudaCard} accessibilityLabel={`Ayuda de ${titulo}`}>
      <View style={globalStyles.ayudaEncabezado}>
        <Text style={globalStyles.ayudaTitulo} accessibilityRole="header">
          ✨ Cómo funciona: {titulo}
        </Text>
        <TouchableOpacity
          onPress={() => setAbierto(false)}
          accessibilityRole="button"
          accessibilityLabel="Cerrar la ayuda"
        >
          <Text style={globalStyles.ayudaCerrar}>✕</Text>
        </TouchableOpacity>
      </View>

      {mensajes.map((mensaje, indice) => (
        <Text
          key={indice}
          style={
            mensaje.rol === "usuario"
              ? globalStyles.ayudaPreguntaTexto
              : globalStyles.ayudaRespuestaTexto
          }
        >
          {mensaje.rol === "usuario" ? `Tú: ${mensaje.texto}` : mensaje.texto}
        </Text>
      ))}

      {cargando && (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[globalStyles.ayudaEtiqueta, { marginLeft: 8 }]}>
            Preparando la explicación...
          </Text>
        </View>
      )}

      <Text style={globalStyles.ayudaEtiqueta}>
        {sinIA
          ? "Guía escrita del módulo (la IA no está disponible ahora)."
          : "Explicación generada con IA (Google Gemini) a partir de la guía del módulo."}
      </Text>

      <View style={globalStyles.ayudaFilaPregunta}>
        <TextInput
          placeholder="Pregunta algo sobre este módulo..."
          placeholderTextColor={colors.muted}
          value={pregunta}
          onChangeText={setPregunta}
          onSubmitEditing={preguntar}
          style={globalStyles.ayudaInput}
          accessibilityLabel={`Escribe una pregunta sobre el módulo de ${titulo}`}
        />
        <TouchableOpacity
          style={[
            globalStyles.ayudaEnviar,
            (cargando || !pregunta.trim()) && { opacity: 0.5 },
          ]}
          onPress={preguntar}
          disabled={cargando || !pregunta.trim()}
          accessibilityRole="button"
          accessibilityLabel="Enviar pregunta"
        >
          <Text style={globalStyles.ayudaEnviarTexto}>Preguntar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
