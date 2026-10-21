import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AyudaModulo from "../components/AyudaModulo";
import BottomNav from "../components/BottomNav";
import {
  AlimentoFirebase,
  guardarAlimentoFirebase,
  obtenerAlimentosFirebase,
  obtenerUltimoBebeFirebase,
} from "../firebase/firebaseService";
import { globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";

type Props = {
  onGo: (screen: string) => void;
};

type Textura = "Papilla" | "Molido" | "En trozos" | "Otro";

type Receta = {
  id: number;
  mes: string;
  nombre: string;
  estilo: "BLW" | "Papilla" | "Molido" | "Trozos";
  ingredientes: string[];
  preparacion: string;
  alergenos: string[];
};

const recetas: Receta[] = [
  {
    id: 1,
    mes: "6 meses",
    nombre: "Papilla de plátano y manzana",
    estilo: "Papilla",
    ingredientes: ["Plátano maduro", "Manzana cocida"],
    preparacion:
      "Cuece la manzana hasta suavizar y machácala junto con el plátano hasta obtener una papilla homogénea.",
    alergenos: [],
  },
  {
    id: 2,
    mes: "6 meses",
    nombre: "Puré de calabaza y zanahoria",
    estilo: "Papilla",
    ingredientes: ["Calabaza", "Zanahoria"],
    preparacion:
      "Cuece al vapor ambos vegetales y tritura hasta lograr una textura suave y sin grumos.",
    alergenos: [],
  },
  {
    id: 3,
    mes: "7 meses",
    nombre: "Puré de pera con avena",
    estilo: "Molido",
    ingredientes: ["Pera", "Avena cocida"],
    preparacion:
      "Cuece la pera, mezcla con avena bien cocida y machaca hasta lograr grumos pequeños.",
    alergenos: ["avena", "gluten"],
  },
  {
    id: 4,
    mes: "7 meses",
    nombre: "Pollo deshebrado con papa",
    estilo: "Molido",
    ingredientes: ["Pechuga de pollo", "Papa"],
    preparacion:
      "Cuece el pollo y la papa por separado, deshebra finamente el pollo y machaca la papa; mezcla ambos.",
    alergenos: [],
  },
  {
    id: 5,
    mes: "8 meses",
    nombre: "Barritas de camote (BLW)",
    estilo: "BLW",
    ingredientes: ["Camote"],
    preparacion:
      "Cuece el camote al vapor y corta en barritas suaves del tamaño de un dedo para que el bebé las sostenga.",
    alergenos: [],
  },
  {
    id: 6,
    mes: "8 meses",
    nombre: "Verduras machacadas con carne",
    estilo: "Molido",
    ingredientes: ["Chayote", "Carne de res"],
    preparacion:
      "Cuece el chayote y la carne, machaca dejando pequeños grumos para estimular la masticación.",
    alergenos: [],
  },
  {
    id: 7,
    mes: "9 meses",
    nombre: "Trocitos de huevo cocido con aguacate",
    estilo: "Trozos",
    ingredientes: ["Huevo", "Aguacate"],
    preparacion:
      "Cuece el huevo hasta que esté bien cocido, corta en trozos pequeños junto con aguacate maduro.",
    alergenos: ["huevo"],
  },
  {
    id: 8,
    mes: "9 meses",
    nombre: "Pasta pequeña con verduras (BLW)",
    estilo: "BLW",
    ingredientes: ["Pasta pequeña", "Verduras suaves"],
    preparacion:
      "Cuece la pasta hasta que esté muy suave y mezcla con verduras cocidas cortadas en trozos pequeños.",
    alergenos: ["gluten"],
  },
  {
    id: 9,
    mes: "10-12 meses",
    nombre: "Tiritas de pollo y verduras (BLW)",
    estilo: "BLW",
    ingredientes: ["Pollo", "Verduras variadas"],
    preparacion:
      "Corta el pollo cocido en tiras suaves y acompaña con verduras al vapor en trozos pequeños.",
    alergenos: [],
  },
  {
    id: 10,
    mes: "10-12 meses",
    nombre: "Pescado suave con puré de papa",
    estilo: "Trozos",
    ingredientes: ["Pescado blanco", "Papa"],
    preparacion:
      "Cuece el pescado y desmenuza bien verificando que no tenga espinas; acompaña con puré de papa.",
    alergenos: ["pescado"],
  },
  {
    id: 11,
    mes: "12-24 meses",
    nombre: "Comida familiar adaptada",
    estilo: "Trozos",
    ingredientes: ["Arroz", "Verduras", "Proteína a elección"],
    preparacion:
      "Adapta la comida familiar sin sal excesiva ni azúcar añadida, en trozos pequeños y blandos.",
    alergenos: [],
  },
  {
    id: 12,
    mes: "12-24 meses",
    nombre: "Pan suave con crema de cacahuate (BLW)",
    estilo: "BLW",
    ingredientes: ["Pan suave", "Crema de cacahuate"],
    preparacion:
      "Unta una capa delgada de crema de cacahuate en pan suave y corta en tiras pequeñas. Introduce con precaución y bajo vigilancia.",
    alergenos: ["cacahuate", "gluten"],
  },
];

function esRecetaSegura(receta: Receta, alergiasTexto: string): boolean {
  const texto = alergiasTexto.trim().toLowerCase();
  if (!texto || texto === "ninguna") return true;

  return !receta.alergenos.some((alergeno) =>
    texto.includes(alergeno.toLowerCase())
  );
}

export default function FoodScreen({ onGo }: Props) {
  const [mes, setMes] = useState("6 meses");
  const [alimento, setAlimento] = useState("");
  const [textura, setTextura] = useState<Textura>("Papilla");
  const [categoria, setCategoria] = useState("Fruta");
  const [observaciones, setObservaciones] = useState("");
  const [esAlergeno, setEsAlergeno] = useState(false);

  const [alergiasBebe, setAlergiasBebe] = useState("Ninguna");
  const [alimentos, setAlimentos] = useState<AlimentoFirebase[]>([]);

  const meses = [
    "6 meses",
    "7 meses",
    "8 meses",
    "9 meses",
    "10-12 meses",
    "12-24 meses",
  ];
  const categorias = ["Fruta", "Verdura", "Cereal", "Proteína", "Lácteo"];
  const texturas: Textura[] = ["Papilla", "Molido", "En trozos", "Otro"];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const bebe = await obtenerUltimoBebeFirebase();
      const datos = await obtenerAlimentosFirebase();

      if (bebe?.alergiasAlimentarias) {
        setAlergiasBebe(bebe.alergiasAlimentarias);
      }

      setAlimentos(datos);
    } catch (error) {
      console.log("Error al cargar alimentación:", error);
    }
  };

  const guardarAlimento = async () => {
    if (!alimento.trim()) {
      Alert.alert("Datos incompletos", "Escribe el nombre del alimento.");
      return;
    }

    try {
      await guardarAlimentoFirebase({
        mes,
        alimento: alimento.trim(),
        textura,
        categoria,
        esAlergeno,
        recomendado: !esAlergeno,
        observaciones: observaciones.trim() || "Sin observaciones.",
      });

      await cargarDatos();

      setAlimento("");
      setTextura("Papilla");
      setCategoria("Fruta");
      setObservaciones("");
      setEsAlergeno(false);

      Alert.alert(
        "Alimento guardado",
        "El alimento fue registrado correctamente en Firebase."
      );
    } catch (error) {
      console.log("Error al guardar alimento:", error);
      Alert.alert("Error", "No se pudo guardar el alimento.");
    }
  };

  const alimentosSugeridos = [
    {
      mes: "6 meses",
      titulo: "Inicio de alimentación",
      detalle: "Papillas suaves: plátano, manzana cocida, zanahoria, calabaza.",
    },
    {
      mes: "7 meses",
      titulo: "Nuevas combinaciones",
      detalle: "Pera, papa, chayote, arroz, avena y pollo bien cocido.",
    },
    {
      mes: "8 meses",
      titulo: "Más textura",
      detalle: "Alimentos machacados, verduras suaves y carnes deshebradas.",
    },
    {
      mes: "9 meses",
      titulo: "Mayor variedad",
      detalle: "Leguminosas suaves, pasta pequeña, frutas maduras y huevo bien cocido.",
    },
    {
      mes: "10-12 meses",
      titulo: "Trozos blandos",
      detalle: "Comida familiar adaptada, sin sal excesiva ni azúcar añadida.",
    },
    {
      mes: "12-24 meses",
      titulo: "Comida familiar",
      detalle: "Incorporación progresiva a la dieta familiar, en trozos pequeños.",
    },
  ];

  const recetasDelMes = recetas.filter((receta) => receta.mes === mes);
  const recetasSeguras = recetasDelMes.filter((receta) =>
    esRecetaSegura(receta, alergiasBebe)
  );
  const recetasExcluidas = recetasDelMes.filter(
    (receta) => !esRecetaSegura(receta, alergiasBebe)
  );

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={globalStyles.headerCard}>
          <Text style={globalStyles.title} accessibilityRole="header">🍎 Alimentación Complementaria</Text>

          <Text style={globalStyles.subtitle}>
            Panel para registrar alimentos por edad, textura y alergias
            alimentarias del bebé.
          </Text>
        </View>

        {/* ayuda con IA: explica cómo funciona este módulo */}
        <AyudaModulo modulo="alimentacion" />

        <View style={globalStyles.summaryRow}>
          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>{alimentos.length}</Text>
            <Text style={globalStyles.summaryText}>Alimentos</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>👶</Text>
            <Text style={globalStyles.summaryText}>Por mes</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>⚠️</Text>
            <Text style={globalStyles.summaryText}>Alergias</Text>
          </View>
        </View>

        <View style={globalStyles.alertCard}>
          <Text style={globalStyles.alertTitle}>Alergias alimentarias registradas</Text>
          <Text style={globalStyles.alertText}>{alergiasBebe}</Text>
        </View>

        <View style={globalStyles.formCard}>
          <Text style={globalStyles.sectionTitle} accessibilityRole="header">Registrar alimento</Text>

          <Text style={globalStyles.label}>Edad / mes recomendado</Text>

          <View style={globalStyles.typesContainer}>
            {meses.map((item) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={item}
                style={[
                  globalStyles.typeButton,
                  mes === item && globalStyles.typeActive,
                ]}
                onPress={() => setMes(item)}
              >
                <Text
                  style={[
                    globalStyles.typeText,
                    mes === item && globalStyles.typeTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={globalStyles.label}>Nombre del alimento</Text>
          <TextInput
            placeholder="Ej. Manzana cocida, zanahoria, pollo"
            placeholderTextColor="#90A4AE"
            value={alimento}
            onChangeText={setAlimento}
            style={globalStyles.input}
          />

          <Text style={globalStyles.label}>Categoría</Text>

          <View style={globalStyles.typesContainer}>
            {categorias.map((item) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={item}
                style={[
                  globalStyles.typeButton,
                  categoria === item && globalStyles.typeActive,
                ]}
                onPress={() => setCategoria(item)}
              >
                <Text
                  style={[
                    globalStyles.typeText,
                    categoria === item && globalStyles.typeTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={globalStyles.label}>Textura recomendada</Text>

          <View style={globalStyles.typesContainer}>
            {texturas.map((item) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={item}
                style={[
                  globalStyles.typeButton,
                  textura === item && globalStyles.typeActive,
                ]}
                onPress={() => setTextura(item)}
              >
                <Text
                  style={[
                    globalStyles.typeText,
                    textura === item && globalStyles.typeTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={globalStyles.label}>¿Este alimento causó alergia?</Text>

          <View style={globalStyles.optionRow}>
            <TouchableOpacity
              accessibilityRole="button"
              style={[
                globalStyles.optionButton,
                !esAlergeno && globalStyles.optionActive,
              ]}
              onPress={() => setEsAlergeno(false)}
            >
              <Text
                style={[
                  globalStyles.optionText,
                  !esAlergeno && globalStyles.optionTextActive,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={[
                globalStyles.optionButton,
                esAlergeno && globalStyles.optionActive,
              ]}
              onPress={() => setEsAlergeno(true)}
            >
              <Text
                style={[
                  globalStyles.optionText,
                  esAlergeno && globalStyles.optionTextActive,
                ]}
              >
                Sí
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={globalStyles.label}>Observaciones</Text>
          <TextInput
            placeholder="Ej. Le gustó, presentó ronchas, textura aceptada..."
            placeholderTextColor="#90A4AE"
            value={observaciones}
            onChangeText={setObservaciones}
            style={[globalStyles.input, globalStyles.textArea]}
            multiline
          />

          <TouchableOpacity
            accessibilityRole="button"
            style={globalStyles.buttonGreen}
            onPress={guardarAlimento}
          >
            <Text style={globalStyles.buttonText}>Guardar alimento</Text>
          </TouchableOpacity>
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">Guía por meses</Text>

        {alimentosSugeridos.map((item) => (
          <View key={item.mes} style={globalStyles.foodCard}>
            <Text style={globalStyles.foodTitle}>
              {item.mes} • {item.titulo}
            </Text>

            <Text style={globalStyles.foodDescription}>{item.detalle}</Text>
          </View>
        ))}

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          Recetas recomendadas • {mes}
        </Text>

        {recetasSeguras.length === 0 && (
          <View style={globalStyles.helpCard}>
            <Text style={globalStyles.helpTitle}>
              Sin recetas seguras para este mes
            </Text>

            <Text style={globalStyles.helpText}>
              Todas las recetas sugeridas para {mes} contienen alérgenos
              registrados para el bebé. Consulta con el pediatra alternativas
              seguras.
            </Text>
          </View>
        )}

        {recetasSeguras.map((receta) => (
          <View key={receta.id} style={globalStyles.foodCard}>
            <Text style={globalStyles.foodTitle}>
              {receta.estilo === "BLW" ? "🍽️" : "🥣"} {receta.nombre}
            </Text>

            <Text style={globalStyles.foodDescription}>
              Estilo: {receta.estilo} • Ingredientes:{" "}
              {receta.ingredientes.join(", ")}
            </Text>

            <Text style={globalStyles.foodDescription}>
              {receta.preparacion}
            </Text>
          </View>
        ))}

        {recetasExcluidas.length > 0 && (
          <View style={globalStyles.alertCard}>
            <Text style={globalStyles.alertTitle}>
              ⚠️ Recetas ocultas por alergias
            </Text>

            <Text style={globalStyles.alertText}>
              {recetasExcluidas.map((r) => r.nombre).join(", ")} no se
              muestran porque contienen ingredientes relacionados con las
              alergias alimentarias registradas del bebé.
            </Text>
          </View>
        )}

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">Alimentos registrados</Text>

        {alimentos.length === 0 && (
          <View style={globalStyles.helpCard}>
            <Text style={globalStyles.helpTitle}>Sin alimentos registrados</Text>
            <Text style={globalStyles.helpText}>
              Agrega alimentos para crear un historial personalizado de
              alimentación complementaria.
            </Text>
          </View>
        )}

        {alimentos.map((item) => (
          <View key={item.id} style={globalStyles.foodCard}>
            <Text style={globalStyles.foodTitle}>
              {item.esAlergeno ? "⚠️" : "✅"} {item.alimento}
            </Text>

            <Text style={globalStyles.foodDescription}>
              Mes: {item.mes} • Categoría: {item.categoria}
            </Text>

            <Text style={globalStyles.foodDescription}>
              Textura: {item.textura}
            </Text>

            <Text style={globalStyles.foodDescription}>
              Estado:{" "}
              {item.esAlergeno
                ? "Evitar en recetas del bebé"
                : "Permitido en recetas"}
            </Text>

            <Text style={globalStyles.foodDescription}>
              Observaciones: {item.observaciones}
            </Text>
          </View>
        ))}

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>📌 Recomendación</Text>

          <Text style={globalStyles.helpText}>
            Introduce alimentos uno por uno y observa posibles reacciones. Los
            alimentos marcados como alérgenos deben evitarse en papillas,
            molidos o trozos dentro de las recetas del bebé.
          </Text>
        </View>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="alimentacion" />
    </View>
  );
}
