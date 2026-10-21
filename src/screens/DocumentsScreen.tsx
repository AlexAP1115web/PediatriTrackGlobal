import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AyudaModulo from "../components/AyudaModulo";
import BottomNav from "../components/BottomNav";
import {
  actualizarDocumentoFirebase,
  DocumentoFirebase,
  eliminarArchivoStorage,
  eliminarDocumentoFirebase,
  guardarDocumentoFirebase,
  obtenerDocumentosFirebase,
  subirArchivoStorage,
} from "../firebase/firebaseService";
import { globalStyles } from "../styles/globalStyles";
import { Alert } from "../utils/alerta";

type Props = {
  onGo: (screen: string) => void;
};

export default function DocumentsScreen({ onGo }: Props) {
  const [tipo, setTipo] = useState("Cartilla");
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [documentos, setDocumentos] = useState<DocumentoFirebase[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const tiposDocumento = [
    "Acta",
    "Cartilla",
    "Consulta",
    "Estudio",
    "Laboratorio",
    "Receta",
  ];

  useEffect(() => {
    cargarDocumentos();
  }, []);

  const cargarDocumentos = async () => {
    try {
      const datos = await obtenerDocumentosFirebase();
      setDocumentos(datos);
    } catch (error) {
      console.log("Error al cargar documentos:", error);
    }
  };

  const seleccionarArchivo = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (resultado.canceled) return;

      const archivo = resultado.assets?.[0];
      if (!archivo) return;

      setArchivoSeleccionado(archivo);
      setNombreArchivo(archivo.name);
    } catch (error) {
      console.log("Error al seleccionar PDF:", error);
      Alert.alert("Error", "No se pudo abrir el selector de archivos.");
    }
  };

  const guardarDocumento = async () => {
    if (nombre.trim() === "" || fecha.trim() === "") {
      Alert.alert(
        "Datos incompletos",
        "Ingresa nombre del documento y fecha."
      );
      return;
    }

    setGuardando(true);

    try {
      let urlArchivo: string | undefined;
      let rutaStorage: string | undefined;

      if (archivoSeleccionado) {
        const subida = await subirArchivoStorage(
          archivoSeleccionado.uri,
          archivoSeleccionado.name
        );
        urlArchivo = subida.url;
        rutaStorage = subida.ruta;
      }

      await guardarDocumentoFirebase({
        tipo,
        nombre: nombre.trim(),
        fecha: fecha.trim(),
        descripcion: descripcion.trim() || "Sin descripción adicional.",
        nombreArchivo:
          nombreArchivo.trim() || "Archivo pendiente por subir",
        estado: "Guardado",
        urlArchivo,
        rutaStorage,
      });

      await cargarDocumentos();

      setNombre("");
      setFecha("");
      setDescripcion("");
      setNombreArchivo("");
      setArchivoSeleccionado(null);

      Alert.alert(
        "Documento guardado",
        urlArchivo
          ? "El documento y su PDF fueron guardados correctamente."
          : "La información del documento fue registrada en Firebase."
      );
    } catch (error) {
      console.log("Error al guardar documento:", error);

      Alert.alert(
        "Error",
        "No se pudo guardar el documento en Firebase."
      );
    } finally {
      setGuardando(false);
    }
  };

  const verPdf = async (documento: DocumentoFirebase) => {
    if (!documento.urlArchivo) {
      Alert.alert(
        "Sin archivo",
        "Aún no se ha subido un PDF para este documento."
      );
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(documento.urlArchivo);
    } catch (error) {
      console.log("Error al abrir PDF:", error);
      Alert.alert("Error", "No se pudo abrir el PDF.");
    }
  };

  const compartirDocumento = async (documento: DocumentoFirebase) => {
    if (!documento.urlArchivo) {
      Alert.alert(
        "Sin archivo",
        "Aún no se ha subido un PDF para este documento."
      );
      return;
    }

    try {
      await Share.share({
        title: documento.nombre,
        message: `${documento.nombre}: ${documento.urlArchivo}`,
      });
    } catch (error) {
      console.log("Error al compartir documento:", error);
    }
  };

  const actualizarPdf = async (documento: DocumentoFirebase) => {
    if (!documento.id) return;

    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (resultado.canceled) return;

      const archivo = resultado.assets?.[0];
      if (!archivo) return;

      setProcesandoId(documento.id);

      const rutaAnterior = documento.rutaStorage;
      const subida = await subirArchivoStorage(archivo.uri, archivo.name);

      await actualizarDocumentoFirebase(documento.id, {
        nombreArchivo: archivo.name,
        urlArchivo: subida.url,
        rutaStorage: subida.ruta,
        estado: "Guardado",
      });

      if (rutaAnterior) {
        try {
          await eliminarArchivoStorage(rutaAnterior);
        } catch (errorLimpieza) {
          console.log("No se pudo limpiar el PDF anterior:", errorLimpieza);
        }
      }

      await cargarDocumentos();

      Alert.alert("PDF actualizado", "El archivo fue actualizado en Firebase Storage.");
    } catch (error) {
      console.log("Error al actualizar PDF:", error);
      Alert.alert("Error", "No se pudo actualizar el PDF.");
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarEliminar = (documento: DocumentoFirebase) => {
    Alert.alert(
      "Eliminar documento",
      `¿Seguro que quieres eliminar "${documento.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => eliminarDocumento(documento),
        },
      ]
    );
  };

  const eliminarDocumento = async (documento: DocumentoFirebase) => {
    if (!documento.id) return;

    setProcesandoId(documento.id);

    try {
      if (documento.rutaStorage) {
        await eliminarArchivoStorage(documento.rutaStorage);
      }

      await eliminarDocumentoFirebase(documento.id);
      await cargarDocumentos();
    } catch (error) {
      console.log("Error al eliminar documento:", error);
      Alert.alert("Error", "No se pudo eliminar el documento.");
    } finally {
      setProcesandoId(null);
    }
  };

  const obtenerIcono = (tipoDoc: string) => {
    if (tipoDoc === "Receta") return "🧾";
    if (tipoDoc === "Estudio") return "🧪";
    if (tipoDoc === "Acta") return "📜";
    if (tipoDoc === "Cartilla") return "💉";
    if (tipoDoc === "Laboratorio") return "🔬";
    if (tipoDoc === "Consulta") return "👨‍⚕️";
    return "📁";
  };

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={globalStyles.headerCard}>
          <Text style={globalStyles.title} accessibilityRole="header">📄 Documentos</Text>

          <Text style={globalStyles.subtitle}>
            Administra acta de nacimiento, cartilla de salud, estudios,
            consultas, recetas y documentos médicos importantes del bebé.
          </Text>
        </View>

        {/* ayuda con IA: explica cómo funciona este módulo */}
        <AyudaModulo modulo="documentos" />

        <View style={globalStyles.summaryRow}>
          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>
              {documentos.length}
            </Text>
            <Text style={globalStyles.summaryText}>Documentos</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>
              {tiposDocumento.length}
            </Text>
            <Text style={globalStyles.summaryText}>Categorías</Text>
          </View>

          <View style={globalStyles.summaryCard}>
            <Text style={globalStyles.summaryNumber}>🔥</Text>
            <Text style={globalStyles.summaryText}>Firebase</Text>
          </View>
        </View>

        <View style={globalStyles.formCard}>
          <Text style={globalStyles.sectionTitle} accessibilityRole="header">
            Registrar documento médico
          </Text>

          <Text style={globalStyles.label}>Tipo de documento</Text>

          <View style={globalStyles.typesContainer}>
            {tiposDocumento.map((item) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={item}
                style={[
                  globalStyles.typeButton,
                  tipo === item && globalStyles.typeActive,
                ]}
                onPress={() => setTipo(item)}
              >
                <Text
                  style={[
                    globalStyles.typeText,
                    tipo === item && globalStyles.typeTextActive,
                  ]}
                >
                  {obtenerIcono(item)} {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={globalStyles.label}>Nombre del documento</Text>
          <TextInput
            placeholder="Ej. Cartilla nacional de salud"
            placeholderTextColor="#90A4AE"
            value={nombre}
            onChangeText={setNombre}
            style={globalStyles.input}
          />

          <Text style={globalStyles.label}>Fecha</Text>
          <TextInput
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#90A4AE"
            value={fecha}
            onChangeText={setFecha}
            style={globalStyles.input}
          />

          <Text style={globalStyles.label}>Archivo PDF</Text>

          <TouchableOpacity
            accessibilityRole="button"
            style={globalStyles.viewButton}
            onPress={seleccionarArchivo}
          >
            <Text style={globalStyles.viewButtonText}>
              {archivoSeleccionado
                ? "📎 Cambiar PDF seleccionado"
                : "📎 Seleccionar PDF del dispositivo"}
            </Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Ej. cartilla_aurora.pdf"
            placeholderTextColor="#90A4AE"
            value={nombreArchivo}
            onChangeText={setNombreArchivo}
            style={[globalStyles.input, { marginTop: 10 }]}
          />

          <Text style={globalStyles.label}>Descripción</Text>
          <TextInput
            placeholder="Agrega notas, consulta, laboratorio o indicaciones."
            placeholderTextColor="#90A4AE"
            value={descripcion}
            onChangeText={setDescripcion}
            style={[globalStyles.input, globalStyles.textArea]}
            multiline
          />

          <TouchableOpacity
            accessibilityRole="button"
            style={globalStyles.buttonPrimary}
            onPress={guardarDocumento}
            disabled={guardando}
          >
            <Text style={globalStyles.buttonText}>
              {guardando
                ? archivoSeleccionado
                  ? "Subiendo PDF..."
                  : "Guardando..."
                : "Guardar documento"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          Categorías principales
        </Text>

        <View style={globalStyles.categoryGrid}>
          <View style={globalStyles.categoryCard}>
            <Text style={globalStyles.categoryIcon}>📜</Text>
            <Text style={globalStyles.categoryTitle}>Acta</Text>
            <Text style={globalStyles.categorySubtitle}>
              Identificación oficial
            </Text>
          </View>

          <View style={globalStyles.categoryCard}>
            <Text style={globalStyles.categoryIcon}>💉</Text>
            <Text style={globalStyles.categoryTitle}>Cartilla</Text>
            <Text style={globalStyles.categorySubtitle}>
              Vacunación y control
            </Text>
          </View>

          <View style={globalStyles.categoryCard}>
            <Text style={globalStyles.categoryIcon}>🔬</Text>
            <Text style={globalStyles.categoryTitle}>Laboratorio</Text>
            <Text style={globalStyles.categorySubtitle}>
              Resultados clínicos
            </Text>
          </View>

          <View style={globalStyles.categoryCard}>
            <Text style={globalStyles.categoryIcon}>👨‍⚕️</Text>
            <Text style={globalStyles.categoryTitle}>Consultas</Text>
            <Text style={globalStyles.categorySubtitle}>
              Historial médico
            </Text>
          </View>
        </View>

        <Text style={globalStyles.sectionTitle} accessibilityRole="header">
          Documentos registrados
        </Text>

        {documentos.length === 0 && (
          <View style={globalStyles.helpCard}>
            <Text style={globalStyles.helpTitle}>
              Sin documentos todavía
            </Text>

            <Text style={globalStyles.helpText}>
              Registra actas, cartillas, estudios o consultas para comenzar el
              expediente digital del bebé.
            </Text>
          </View>
        )}

        {documentos.map((doc) => {
          const enProceso = procesandoId === doc.id;

          return (
            <View key={doc.id} style={globalStyles.documentCard}>
              <View style={globalStyles.documentHeader}>
                <View style={globalStyles.documentIconBox}>
                  <Text style={globalStyles.documentIcon}>
                    {obtenerIcono(doc.tipo)}
                  </Text>
                </View>

                <View style={globalStyles.documentInfo}>
                  <Text style={globalStyles.documentName}>
                    {doc.nombre}
                  </Text>

                  <Text style={globalStyles.documentType}>
                    {doc.tipo} • {doc.fecha}
                  </Text>
                </View>

                <View
                  style={globalStyles.statusBadgeGreen}
                  accessible
                  accessibilityLabel={`Estado: ${doc.estado}`}
                >
                  <Text style={globalStyles.statusTextGreen}>
                    ✓ {doc.estado}
                  </Text>
                </View>
              </View>

              <Text style={globalStyles.documentDescription}>
                {doc.descripcion}
              </Text>

              <Text style={globalStyles.documentDescription}>
                Archivo: {doc.nombreArchivo}
                {doc.urlArchivo ? " • Subido a Firebase Storage" : ""}
              </Text>

              <View style={globalStyles.documentActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={globalStyles.viewButton}
                  onPress={() => verPdf(doc)}
                >
                  <Text style={globalStyles.viewButtonText}>
                    👁 Ver PDF
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  style={globalStyles.deleteButton}
                  disabled={enProceso}
                  onPress={() => confirmarEliminar(doc)}
                >
                  <Text style={globalStyles.deleteButtonText}>
                    {enProceso ? "Eliminando..." : "🗑 Eliminar"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={globalStyles.documentActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={globalStyles.viewButton}
                  onPress={() => compartirDocumento(doc)}
                >
                  <Text style={globalStyles.viewButtonText}>
                    📤 Compartir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  style={globalStyles.viewButton}
                  disabled={enProceso}
                  onPress={() => actualizarPdf(doc)}
                >
                  <Text style={globalStyles.viewButtonText}>
                    {enProceso
                      ? "Subiendo..."
                      : doc.urlArchivo
                      ? "🔄 Actualizar PDF"
                      : "📎 Subir PDF"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={globalStyles.helpCard}>
          <Text style={globalStyles.helpTitle}>
            🔐 Firebase Storage
          </Text>

          <Text style={globalStyles.helpText}>
            Los archivos PDF se guardan de forma segura en Firebase Storage y
            la información del documento se guarda en Firestore para poder
            consultarla dentro de la app.
          </Text>
        </View>

        <View style={globalStyles.bottomSpace} />
      </ScrollView>

      <BottomNav onGo={onGo} active="documentos" />
    </View>
  );
}
