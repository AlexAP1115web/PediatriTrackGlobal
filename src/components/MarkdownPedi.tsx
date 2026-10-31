import { Linking, StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";

import { colors } from "../styles/globalStyles";

// Markdown sencillo para las respuestas de Pedi. No usé una librería porque
// solo necesito lo básico y así no agrego más dependencias al build:
//   ### Título            -> título en negritas y más grande
//   - viñeta / 1. paso    -> viñeta de color / número en circulito
//   > aviso               -> recuadro de aviso
//   **negritas**, *cursiva*, `código` y [texto](link)
//   ---                   -> línea separadora

type Props = {
  texto: string;
  style?: StyleProp<TextStyle>;
};

type Bloque =
  | { tipo: "titulo"; nivel: number; texto: string }
  | { tipo: "vineta"; texto: string; sangria: number }
  | { tipo: "numero"; numero: string; texto: string }
  | { tipo: "aviso"; texto: string }
  | { tipo: "separador" }
  | { tipo: "espacio" }
  | { tipo: "parrafo"; texto: string };

function leerBloques(texto: string): Bloque[] {
  const bloques: Bloque[] = [];

  for (const lineaOriginal of texto.replace(/\r/g, "").split("\n")) {
    const linea = lineaOriginal.replace(/\s+$/, "");
    let m: RegExpMatchArray | null;

    if (!linea.trim()) {
      if (bloques.length && bloques[bloques.length - 1].tipo !== "espacio") {
        bloques.push({ tipo: "espacio" });
      }
    } else if ((m = linea.match(/^\s*(#{1,6})\s+(.*)$/))) {
      bloques.push({ tipo: "titulo", nivel: m[1].length, texto: m[2].replace(/#+\s*$/, "") });
    } else if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(linea)) {
      bloques.push({ tipo: "separador" });
    } else if ((m = linea.match(/^\s*>\s?(.*)$/))) {
      const anterior = bloques[bloques.length - 1];
      if (anterior && anterior.tipo === "aviso") anterior.texto += "\n" + m[1];
      else bloques.push({ tipo: "aviso", texto: m[1] });
    } else if ((m = linea.match(/^(\s*)[-*•+]\s+(.*)$/))) {
      bloques.push({ tipo: "vineta", texto: m[2], sangria: m[1].length >= 2 ? 1 : 0 });
    } else if ((m = linea.match(/^\s*(\d{1,2})[.)]\s+(.*)$/))) {
      bloques.push({ tipo: "numero", numero: m[1], texto: m[2] });
    } else {
      const anterior = bloques[bloques.length - 1];
      if (anterior && anterior.tipo === "parrafo") anterior.texto += "\n" + linea.trim();
      else bloques.push({ tipo: "parrafo", texto: linea.trim() });
    }
  }

  while (bloques.length && bloques[bloques.length - 1].tipo === "espacio") bloques.pop();
  return bloques;
}

// negritas, cursivas, código y links dentro de una línea
function TextoEnLinea({ texto }: { texto: string }) {
  const partes = texto
    .split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g)
    .filter((parte) => parte !== "");

  return (
    <>
      {partes.map((parte, i) => {
        if (/^(\*\*|__).+(\*\*|__)$/.test(parte)) {
          return (
            <Text key={i} style={{ fontFamily: "Nunito_900Black" }}>
              {parte.slice(2, -2)}
            </Text>
          );
        }
        if (/^`.+`$/.test(parte)) {
          return (
            <Text key={i} style={{ fontFamily: "Nunito_700Bold", backgroundColor: colors.soft2 }}>
              {` ${parte.slice(1, -1)} `}
            </Text>
          );
        }
        const link = parte.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          const url = link[2];
          const seguro = /^https?:\/\//i.test(url);
          return (
            <Text
              key={i}
              style={{ color: colors.primaryDark, textDecorationLine: "underline", fontFamily: "Nunito_800ExtraBold" }}
              onPress={seguro ? () => Linking.openURL(url) : undefined}
              accessibilityRole={seguro ? "link" : undefined}
            >
              {link[1]}
            </Text>
          );
        }
        if (/^(\*|_)[^*_].*(\*|_)$/.test(parte)) {
          return (
            <Text key={i} style={{ fontStyle: "italic" }}>
              {parte.slice(1, -1)}
            </Text>
          );
        }
        // asteriscos sueltos que hayan quedado
        return <Text key={i}>{parte.replace(/\*\*/g, "")}</Text>;
      })}
    </>
  );
}

const COLORES_VINETA = () => [colors.primary, colors.pink, colors.green];

export default function MarkdownPedi({ texto, style }: Props) {
  const bloques = leerBloques(texto);
  let contadorVineta = 0;
  // los títulos crecen junto con la letra (por si está activado "texto grande")
  const base = StyleSheet.flatten(style)?.fontSize || 15;

  return (
    <View>
      {bloques.map((bloque, i) => {
        switch (bloque.tipo) {
          case "titulo":
            return (
              <Text
                key={i}
                style={[
                  style,
                  {
                    fontFamily: "Nunito_900Black",
                    color: colors.primaryDark,
                    fontSize: Math.round(base * (bloque.nivel <= 2 ? 1.3 : 1.15)),
                    lineHeight: Math.round(base * (bloque.nivel <= 2 ? 1.7 : 1.5)),
                    marginBottom: 6,
                  },
                ]}
                accessibilityRole="header"
              >
                <TextoEnLinea texto={bloque.texto} />
              </Text>
            );

          case "vineta": {
            const color = COLORES_VINETA()[contadorVineta++ % 3];
            return (
              <View key={i} style={{ flexDirection: "row", marginBottom: 5, marginLeft: bloque.sangria * 16 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color, marginTop: base * 0.45, marginRight: 9 }} />
                <Text style={[style, { flex: 1 }]}>
                  <TextoEnLinea texto={bloque.texto} />
                </Text>
              </View>
            );
          }

          case "numero":
            return (
              <View key={i} style={{ flexDirection: "row", marginBottom: 6 }}>
                <View
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 9,
                    marginTop: 1,
                  }}
                >
                  <Text style={{ fontFamily: "Nunito_900Black", fontSize: 12, color: colors.primaryDark }}>
                    {bloque.numero}
                  </Text>
                </View>
                <Text style={[style, { flex: 1 }]}>
                  <TextoEnLinea texto={bloque.texto} />
                </Text>
              </View>
            );

          case "aviso":
            return (
              <View
                key={i}
                style={{
                  backgroundColor: colors.yellow,
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 11,
                  marginVertical: 4,
                  borderWidth: 1,
                  borderColor: colors.warning,
                }}
              >
                <Text style={[style, { color: colors.warning, fontFamily: "Nunito_700Bold" }]}>
                  <TextoEnLinea texto={bloque.texto} />
                </Text>
              </View>
            );

          case "separador":
            return <View key={i} style={{ height: 2, backgroundColor: colors.border, marginVertical: 8, borderRadius: 1 }} />;

          case "espacio":
            return <View key={i} style={{ height: 6 }} />;

          default:
            return (
              <Text key={i} style={[style, { marginBottom: 2 }]}>
                <TextoEnLinea texto={bloque.texto} />
              </Text>
            );
        }
      })}
    </View>
  );
}
