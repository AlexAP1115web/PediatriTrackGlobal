import { useMemo } from "react";
import { View } from "react-native";

import { matrizQR } from "../utils/qr";

type Props = {
  valor: string;
  // ancho total en pixeles (incluye el margen blanco)
  tamano?: number;
  color?: string;
};

// Dibujo el QR con Views normales (no ocupo SVG ni canvas). Para que no
// sean miles de cuadritos, junto los cuadros negros que van seguidos en
// cada fila en una sola barra. El margen blanco de 4 cuadros alrededor es
// el que pide la norma del QR para que la cámara lo lea bien.
export default function CodigoQR({ valor, tamano = 240, color = "#0F172A" }: Props) {
  const matriz = useMemo(() => matrizQR(valor), [valor]);
  const MARGEN = 4;
  const modulos = matriz.length + MARGEN * 2;
  const celda = Math.max(2, Math.floor(tamano / modulos));
  const lado = celda * modulos;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Código QR de la ficha de salud"
      style={{
        width: lado,
        height: lado,
        padding: celda * MARGEN,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
      }}
    >
      {matriz.map((fila, indiceFila) => {
        const tramos: { inicio: number; largo: number }[] = [];
        let inicio = -1;
        fila.forEach((oscuro, columna) => {
          if (oscuro && inicio < 0) inicio = columna;
          if ((!oscuro || columna === fila.length - 1) && inicio >= 0) {
            const fin = oscuro ? columna + 1 : columna;
            tramos.push({ inicio, largo: fin - inicio });
            inicio = -1;
          }
        });

        return (
          <View key={indiceFila} style={{ height: celda, width: celda * fila.length }}>
            {tramos.map((tramo) => (
              <View
                key={tramo.inicio}
                style={{
                  position: "absolute",
                  left: tramo.inicio * celda,
                  width: tramo.largo * celda,
                  height: celda,
                  backgroundColor: color,
                }}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}
