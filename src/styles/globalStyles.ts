import { StyleSheet } from "react-native";

// le cambié la paleta a algo más tierno para una app de bebés: azul cielo
// como color principal + un toque de rosa de acento (antes era un verde
// tipo hospital, ya no pegaba con la onda "bebé" que quería)
export const paletaNormal = {
  background: "#F5FAFF",
  white: "#FFFFFF",

  primary: "#0EA5E9",
  primaryDark: "#0369A1",
  primaryLight: "#E0F2FE",

  accent: "#EC4899",

  // rosa que uso como segundo acento en algunas tarjetas/insignias
  pink: "#EC4899",
  pinkLight: "#FCE7F3",

  green: "#14B8A6",
  greenLight: "#CCFBF1",

  red: "#F43F5E",
  redLight: "#FFE4E6",

  yellow: "#FEF3C7",
  warning: "#B45309",

  text: "#1E293B",
  muted: "#64748B",
  border: "#DCE8F5",

  soft: "#F5FAFF",
  soft2: "#E9F4FD",
};

export type Paleta = typeof paletaNormal;

// paleta para daltonismo. La armé con los colores de Okabe-Ito, que son
// los que más se recomiendan porque se distinguen con los tipos de
// daltonismo más comunes (rojo-verde). La idea principal: nunca dejar
// rojo contra verde, mejor azul (bien) contra naranja (pendiente) y
// bermellón (atrasado), y subirle un poco el contraste al texto gris
export const paletaDaltonismo: Paleta = {
  background: "#F7F9FC",
  white: "#FFFFFF",

  primary: "#0072B2",
  primaryDark: "#00507D",
  primaryLight: "#DCEBF7",

  accent: "#CC79A7",

  pink: "#CC79A7",
  pinkLight: "#F5E6EF",

  // "verde" = bien / aplicado, aquí lo cambio a azul
  green: "#0072B2",
  greenLight: "#D6E8F5",

  // "rojo" = atrasado / alerta, aquí bermellón
  red: "#D55E00",
  redLight: "#FBE1D1",

  yellow: "#FFF1CC",
  warning: "#8A5A00",

  text: "#111827",
  muted: "#4B5563",
  border: "#C9D6E3",

  soft: "#F7F9FC",
  soft2: "#E8EEF6",
};

// colors lo dejo exportado por si alguna pantalla lo ocupa; cambia junto
// con el tema
export const colors: Paleta = { ...paletaNormal };

// esta sombra suave la reutilizo en varias tarjetas, quería un estilo tipo
// Google Fit / Apple Health, así no tengo que crear un StyleSheet nuevo
// por cada pantalla
const sombraSuave = {
  shadowColor: "#0369A1",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

const sombraTenue = {
  shadowColor: "#0369A1",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

// antes era un StyleSheet fijo. Lo cambié a una función que arma los
// estilos con una paleta y una escala de texto, así puedo tener el modo
// daltonismo y el texto grande sin reescribir cada pantalla: todas siguen
// usando globalStyles.algo igual que antes
function crearEstilos(colors: Paleta, escala: number) {
  // t() agranda los tamaños de letra cuando está activo "texto grande"
  const t = (tamano: number) => Math.round(tamano * escala);

  return StyleSheet.create({
    // Pantalla general
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // este es el contenedor principal de casi todas las pantallas. Le puse
    // width/maxWidth/alignSelf para que se vea bien tanto en celular (usa
    // toda la pantalla, el maxWidth ni se nota) como en escritorio/web (ahí
    // sí se centra con un ancho legible en vez de estirarse toda la ventana)
    container: {
      flex: 1,
      padding: 18,
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
    },

    // Encabezado general
    headerCard: {
      backgroundColor: colors.white,
      padding: 20,
      borderRadius: 24,
      marginBottom: 16,
      borderLeftWidth: 6,
      borderLeftColor: colors.primary,
      ...sombraSuave,
    },

    title: {
      fontSize: t(29),
      fontWeight: "900",
      color: colors.primaryDark,
      letterSpacing: -0.3,
    },

    subtitle: {
      color: colors.muted,
      marginTop: 8,
      lineHeight: t(20),
      fontWeight: "600",
    },

    sectionTitle: {
      fontSize: t(21),
      fontWeight: "900",
      color: colors.text,
      marginBottom: 14,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: colors.border,
    },

    label: {
      fontWeight: "800",
      color: colors.text,
      marginBottom: 8,
      marginTop: 4,
    },

    // Inputs
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      backgroundColor: colors.soft,
      color: colors.text,
      fontWeight: "600",
    },

    textArea: {
      minHeight: 86,
      textAlignVertical: "top",
    },

    // Botones generales
    buttonPrimary: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 16,
      ...sombraTenue,
    },

    buttonGreen: {
      backgroundColor: colors.green,
      padding: 15,
      borderRadius: 16,
      ...sombraTenue,
    },

    buttonText: {
      color: colors.white,
      textAlign: "center",
      fontWeight: "900",
      fontSize: t(15),
    },

    // Resumen
    summaryRow: {
      flexDirection: "row",
      marginBottom: 18,
    },

    summaryCard: {
      flex: 1,
      backgroundColor: colors.white,
      padding: 14,
      borderRadius: 18,
      alignItems: "center",
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
      ...sombraTenue,
    },

    summaryNumber: {
      fontSize: t(24),
      fontWeight: "900",
      color: colors.primary,
    },

    summaryText: {
      color: colors.muted,
      fontSize: t(12),
      fontWeight: "800",
      marginTop: 4,
    },

    // Dashboard: tarjeta del bebé
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#BFE8D2",
      padding: 16,
      borderRadius: 24,
      marginTop: 8,
      marginBottom: 16,
      ...sombraSuave,
    },

    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      ...sombraTenue,
    },

    avatarText: {
      fontSize: t(34),
    },

    profileInfo: {
      flex: 1,
    },

    babyName: {
      fontSize: t(21),
      fontWeight: "900",
      color: colors.primaryDark,
    },

    babyAge: {
      color: colors.muted,
      fontWeight: "800",
      marginTop: 2,
    },

    countryBadge: {
      backgroundColor: colors.primaryLight,
      paddingVertical: 5,
      paddingHorizontal: 9,
      borderRadius: 12,
      marginTop: 8,
      alignSelf: "flex-start",
    },

    countryText: {
      color: colors.primaryDark,
      fontWeight: "800",
      fontSize: t(12),
    },

    configButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      ...sombraTenue,
    },

    configIcon: {
      fontSize: t(22),
    },

    // banner de bienvenida del dashboard (el saludo que cambia según la
    // hora + el nombre del tutor/padre)
    greetingBanner: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 18,
      marginTop: 8,
      marginBottom: 16,
      ...sombraSuave,
    },

    greetingTitle: {
      color: colors.white,
      fontSize: t(19),
      fontWeight: "900",
    },

    greetingSubtitle: {
      color: colors.primaryLight,
      fontSize: t(13),
      fontWeight: "600",
      marginTop: 4,
    },

    // insignia de parentesco del tutor/padre. Esta la dejé en rosa para
    // darle su propio toque distinto al badge de país (que es azul)
    relationshipBadge: {
      backgroundColor: colors.pinkLight,
      paddingVertical: 5,
      paddingHorizontal: 9,
      borderRadius: 12,
      marginTop: 8,
      alignSelf: "flex-start",
    },

    relationshipText: {
      color: colors.pink,
      fontWeight: "800",
      fontSize: t(12),
    },

    // este selector sí se puede ir a varias líneas (lo uso para parentesco,
    // que tiene 5 opciones), a diferencia de countryContainer/countryButton
    // que solo están pensados para 2 opciones nada más
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 18,
    },

    chipButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: colors.white,
    },

    chipButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    chipText: {
      color: colors.text,
      fontWeight: "700",
      fontSize: t(13),
    },

    chipTextActive: {
      color: colors.white,
    },

    // ==========================
    // ASISTENTE VIRTUAL (chatbot)
    // ==========================
    chatMessagesArea: {
      flex: 1,
    },

    chatBubbleRow: {
      flexDirection: "row",
      marginBottom: 10,
    },

    chatBubbleRowUsuario: {
      justifyContent: "flex-end",
    },

    chatBubbleRowAsistente: {
      justifyContent: "flex-start",
    },

    chatBubble: {
      maxWidth: "88%",
      borderRadius: 18,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },

    chatBubbleUsuario: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },

    chatBubbleAsistente: {
      backgroundColor: colors.white,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      ...sombraTenue,
    },

    chatBubbleTextUsuario: {
      color: colors.white,
      fontSize: t(14),
      lineHeight: t(20),
    },

    chatBubbleTextAsistente: {
      color: colors.text,
      fontSize: t(14),
      lineHeight: t(20),
    },

    chatInputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      borderRadius: 26,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...sombraSuave,
    },

    chatInput: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: t(14),
      color: colors.text,
    },

    chatSendButton: {
      backgroundColor: colors.primary,
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },

    chatSendButtonDisabled: {
      backgroundColor: colors.muted,
    },

    chatSendButtonText: {
      color: colors.white,
      fontSize: t(18),
    },

    // Dashboard: próxima vacuna
    nextVaccineCard: {
      backgroundColor: colors.primary,
      padding: 20,
      borderRadius: 24,
      marginBottom: 20,
      ...sombraSuave,
    },

    nextTitle: {
      color: colors.white,
      fontSize: t(22),
      fontWeight: "900",
    },

    nextSubtitle: {
      color: colors.primaryLight,
      marginTop: 4,
      fontWeight: "800",
    },

    nextDate: {
      color: colors.white,
      marginTop: 8,
      marginBottom: 14,
      fontWeight: "600",
    },

    scheduleButton: {
      backgroundColor: colors.white,
      padding: 13,
      borderRadius: 14,
    },

    scheduleButtonText: {
      color: colors.primaryDark,
      textAlign: "center",
      fontWeight: "900",
    },

    // Dashboard: tabla
    tableCard: {
      backgroundColor: colors.white,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
      ...sombraSuave,
    },

    tableHeader: {
      flexDirection: "row",
      backgroundColor: colors.primaryLight,
      paddingVertical: 12,
      paddingHorizontal: 10,
    },

    tableHeaderText: {
      color: colors.primaryDark,
      fontWeight: "900",
      fontSize: t(13),
    },

    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.soft2,
    },

    colLarge: {
      flex: 1.4,
    },

    colMedium: {
      flex: 1,
    },

    colSmall: {
      flex: 1,
      alignItems: "center",
    },

    vaccineName: {
      color: colors.primaryDark,
      fontWeight: "900",
      fontSize: t(14),
    },

    vaccineDose: {
      color: colors.muted,
      fontSize: t(11),
      marginTop: 2,
    },

    vaccineStage: {
      color: colors.muted,
      fontWeight: "700",
      fontSize: t(12),
    },

    statusBadge: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 12,
    },

    statusApplied: {
      backgroundColor: colors.greenLight,
    },

    statusNext: {
      backgroundColor: colors.yellow,
    },

    statusPending: {
      backgroundColor: colors.redLight,
    },

    statusText: {
      color: colors.text,
      fontWeight: "900",
      fontSize: t(11),
    },

    // Dashboard: módulos
    moduleCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      padding: 15,
      borderRadius: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...sombraSuave,
    },

    moduleIconBox: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    // estas son variantes de color para distinguir los módulos de un
    // vistazo, mismo tamaño, solo le cambio el color de fondo usando los
    // colores que ya tenía definidos arriba
    moduleIconBoxWarning: {
      backgroundColor: colors.yellow,
    },

    moduleIconBoxGreen: {
      backgroundColor: colors.greenLight,
    },

    moduleIconBoxMuted: {
      backgroundColor: colors.soft2,
    },

    moduleIcon: {
      fontSize: t(26),
    },

    moduleInfo: {
      flex: 1,
    },

    moduleTitle: {
      color: colors.primaryDark,
      fontWeight: "900",
      fontSize: t(16),
    },

    moduleDescription: {
      color: colors.muted,
      fontSize: t(12),
      marginTop: 4,
      fontWeight: "600",
    },

    arrow: {
      fontSize: t(32),
      color: colors.primary,
      fontWeight: "900",
    },

    // Documentos: formulario
    formCard: {
      backgroundColor: colors.white,
      padding: 18,
      borderRadius: 22,
      marginBottom: 22,
      ...sombraSuave,
    },

    typesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 14,
    },

    typeButton: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      marginRight: 8,
      marginBottom: 8,
    },

    typeActive: {
      backgroundColor: colors.primary,
    },

    typeText: {
      color: colors.primaryDark,
      fontWeight: "800",
      fontSize: t(12),
    },

    typeTextActive: {
      color: colors.white,
    },

    // Documentos: categorías
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 18,
    },

    categoryCard: {
      width: "48%",
      backgroundColor: colors.white,
      padding: 15,
      borderRadius: 18,
      marginRight: 8,
      marginBottom: 10,
      ...sombraTenue,
    },

    categoryIcon: {
      fontSize: t(28),
    },

    categoryTitle: {
      color: colors.primaryDark,
      fontWeight: "900",
      fontSize: t(15),
      marginTop: 8,
    },

    categorySubtitle: {
      color: colors.muted,
      fontSize: t(12),
      marginTop: 4,
    },

    // Documentos: tarjetas
    documentCard: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 20,
      marginBottom: 12,
      borderLeftWidth: 6,
      borderLeftColor: colors.green,
      ...sombraSuave,
    },

    documentHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    documentIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    documentIcon: {
      fontSize: t(25),
    },

    documentInfo: {
      flex: 1,
    },

    documentName: {
      fontSize: t(16),
      fontWeight: "900",
      color: colors.primaryDark,
    },

    documentType: {
      color: colors.muted,
      marginTop: 2,
      fontSize: t(12),
      fontWeight: "700",
    },

    documentDescription: {
      marginTop: 12,
      color: colors.muted,
      lineHeight: t(19),
      fontWeight: "600",
    },

    documentActions: {
      flexDirection: "row",
      marginTop: 14,
    },

    viewButton: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      padding: 11,
      borderRadius: 12,
      marginRight: 8,
    },

    viewButtonText: {
      color: colors.primaryDark,
      textAlign: "center",
      fontWeight: "900",
    },

    deleteButton: {
      flex: 1,
      backgroundColor: colors.redLight,
      padding: 11,
      borderRadius: 12,
    },

    deleteButtonText: {
      color: colors.red,
      textAlign: "center",
      fontWeight: "900",
    },

    statusBadgeGreen: {
      backgroundColor: colors.greenLight,
      paddingVertical: 6,
      paddingHorizontal: 9,
      borderRadius: 12,
    },

    statusTextGreen: {
      color: colors.green,
      fontWeight: "900",
      fontSize: t(11),
    },

    // Tarjeta de ayuda
    helpCard: {
      backgroundColor: colors.yellow,
      padding: 16,
      borderRadius: 18,
      marginTop: 8,
      ...sombraTenue,
    },

    helpTitle: {
      color: colors.warning,
      fontWeight: "900",
      fontSize: t(16),
    },

    helpText: {
      color: "#92400E",
      marginTop: 6,
      lineHeight: t(19),
      fontWeight: "600",
    },

    // Alerta
    alertCard: {
      backgroundColor: colors.yellow,
      padding: 16,
      borderRadius: 18,
      marginTop: 8,
      ...sombraTenue,
    },

    alertTitle: {
      color: colors.warning,
      fontWeight: "900",
      fontSize: t(16),
    },

    alertText: {
      color: "#92400E",
      marginTop: 6,
      lineHeight: t(19),
      fontWeight: "600",
    },

    // Espacio final para que no tape la barra inferior
    bottomSpace: {
      height: 30,
    },

      // Opciones para frecuencia de vitaminas
    optionRow: {
      flexDirection: "row",
      marginBottom: 12,
    },

    optionButton: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      padding: 12,
      borderRadius: 14,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.primaryLight,
    },

    optionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primaryDark,
    },

    optionText: {
      textAlign: "center",
      color: colors.primaryDark,
      fontWeight: "800",
    },

    optionTextActive: {
      color: colors.white,
    },

    // Nota dentro del formulario de vitaminas
    noticeCard: {
      backgroundColor: colors.yellow,
      padding: 13,
      borderRadius: 14,
      marginBottom: 14,
    },

    noticeText: {
      color: colors.warning,
      fontWeight: "800",
      textAlign: "center",
    },

    // Tarjetas de vitaminas
    vitaminCard: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 20,
      marginBottom: 12,
      borderLeftWidth: 6,
      borderLeftColor: colors.green,
      ...sombraSuave,
    },

    vitaminHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    vitaminIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    vitaminIcon: {
      fontSize: t(25),
    },

    vitaminInfoBox: {
      flex: 1,
    },

    vitaminName: {
      fontSize: t(17),
      fontWeight: "900",
      color: colors.primaryDark,
    },

    vitaminInfo: {
      color: colors.muted,
      marginTop: 4,
      fontWeight: "600",
    },

    vitaminDetails: {
      backgroundColor: colors.soft,
      padding: 12,
      borderRadius: 14,
      marginTop: 14,
    },

      // LOGIN SCREEN

    loginContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      padding: 24,
    },

    // esta franja de color va decorativa detrás de la tarjeta de login,
    // le da más onda de "producto real" en vez de dejar el fondo plano
    loginTopBand: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 220,
      backgroundColor: colors.primary,
      borderBottomLeftRadius: 36,
      borderBottomRightRadius: 36,
    },

    loginCard: {
      backgroundColor: colors.white,
      borderRadius: 26,
      padding: 24,
      ...sombraSuave,
    },

    loginLogo: {
      fontSize: t(54),
      textAlign: "center",
      marginBottom: 8,
    },

    // esta insignia circular blanca enmarca el logo, queda como un "avatar"
    // flotando sobre la franja de color de arriba
    loginLogoBadge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.white,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      ...sombraSuave,
    },

    loginLogoImage: {
      width: 66,
      height: 66,
      borderRadius: 16,
    },

    // este texto chiquito en mayúsculas arriba del título es el típico
    // "eyebrow" que usan las apps profesionales antes del título grande
    loginEyebrow: {
      fontSize: t(11),
      fontWeight: "800",
      letterSpacing: 1.5,
      textAlign: "center",
      textTransform: "uppercase",
      color: colors.accent,
      marginBottom: 4,
    },

    passwordHint: {
      color: colors.muted,
      fontSize: t(12),
      marginTop: -6,
      marginBottom: 12,
    },

    privacyLinkText: {
      textAlign: "center",
      color: colors.primary,
      marginTop: 10,
      fontSize: t(13),
      fontWeight: "700",
    },

    loginTitle: {
      fontSize: t(28),
      fontWeight: "900",
      textAlign: "center",
      color: colors.primaryDark,
      marginBottom: 8,
    },

    loginSubtitle: {
      fontSize: t(14),
      textAlign: "center",
      color: colors.muted,
      marginBottom: 24,
      lineHeight: t(20),
    },

    countryContainer: {
      flexDirection: "row",
      marginBottom: 18,
    },

    countryButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#BFE8D2",
      borderRadius: 14,
      padding: 12,
      backgroundColor: "#F3FBF6",
      marginRight: 8,
    },

    countryActive: {
      backgroundColor: "#BFE8D2",
      borderColor: colors.primary,
    },

    loginButton: {
      backgroundColor: colors.primary,
      padding: 17,
      borderRadius: 16,
      marginTop: 8,
      ...sombraSuave,
    },

    loginButtonText: {
      color: colors.white,
      textAlign: "center",
      fontWeight: "900",
      fontSize: t(16),
      letterSpacing: 0.4,
    },

    footer: {
      textAlign: "center",
      color: colors.muted,
      marginTop: 18,
      fontSize: t(12),
    },

    versionCard: {
      backgroundColor: colors.primaryLight,
      padding: 12,
      borderRadius: 14,
      marginTop: 16,
    },

    versionText: {
      textAlign: "center",
      color: colors.primaryDark,
      fontWeight: "700",
    },

      // Growth Screen

    growthCard: {
      backgroundColor: colors.white,
      padding: 18,
      borderRadius: 18,
      marginBottom: 12,
      ...sombraTenue,
    },

    growthTitle: {
      color: colors.primaryDark,
      fontWeight: "800",
      fontSize: t(16),
    },

    growthValue: {
      fontSize: t(28),
      fontWeight: "900",
      color: colors.primary,
      marginTop: 8,
    },

    historyCard: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 18,
      marginBottom: 12,
      ...sombraTenue,
    },

    historyDate: {
      fontSize: t(16),
      fontWeight: "900",
      color: colors.primaryDark,
      marginBottom: 8,
    },

    historyText: {
      color: colors.muted,
      marginBottom: 4,
      fontWeight: "600",
    },

      // FOOD SCREEN

    foodCard: {
      backgroundColor: colors.white,
      padding: 18,
      borderRadius: 18,
      marginBottom: 12,
      ...sombraTenue,
    },

    foodTitle: {
      fontSize: t(18),
      fontWeight: "900",
      color: colors.primaryDark,
    },

    foodDescription: {
      marginTop: 8,
      color: colors.muted,
      lineHeight: t(20),
    },

    scheduleCard: {
      backgroundColor: colors.white,
      padding: 18,
      borderRadius: 18,
      marginBottom: 18,
      ...sombraTenue,
    },

    scheduleText: {
      fontSize: t(15),
      color: colors.muted,
      marginBottom: 8,
      fontWeight: "600",
    },

    foodStatusCard: {
      backgroundColor: colors.greenLight,
      padding: 18,
      borderRadius: 18,
      marginBottom: 18,
      ...sombraTenue,
    },

    foodStatusTitle: {
      fontSize: t(18),
      fontWeight: "900",
      color: colors.green,
    },

    foodStatusText: {
      marginTop: 8,
      color: colors.green,
      lineHeight: t(20),
      fontWeight: "600",
    },

      // CALENDAR SCREEN

    calendarCard: {
      backgroundColor: colors.white,
      padding: 18,
      borderRadius: 18,
      marginBottom: 12,
      ...sombraTenue,
    },

    calendarTitle: {
      fontSize: t(18),
      fontWeight: "900",
      color: colors.primaryDark,
    },

    calendarDate: {
      fontSize: t(16),
      fontWeight: "800",
      color: colors.primary,
      marginTop: 8,
    },

    calendarDescription: {
      marginTop: 8,
      color: colors.muted,
      lineHeight: t(20),
      fontWeight: "600",
    },

    timelineCard: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 18,
      marginBottom: 10,
      borderLeftWidth: 5,
      borderLeftColor: colors.primary,
      ...sombraTenue,
    },

    timelineDate: {
      fontSize: t(14),
      fontWeight: "900",
      color: colors.primaryDark,
      marginBottom: 6,
    },

    timelineText: {
      color: colors.muted,
      fontWeight: "600",
    },

      // ==========================
    // BOTTOM NAVIGATION
    // ==========================

    bottomNav: {
      flexDirection: "row",
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 12,
      paddingBottom: 14,
      shadowColor: "#006C32",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 8,
    },

    bottomNavItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    bottomNavIconWrap: {
      width: 42,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },

    bottomNavIconWrapActive: {
      backgroundColor: colors.primaryLight,
    },

    bottomNavText: {
      fontSize: t(20),
      color: colors.muted,
    },

    bottomNavLabel: {
      fontSize: t(10),
      fontWeight: "700",
      color: colors.muted,
      marginTop: 2,
    },

    bottomNavActive: {
      color: colors.primary,
    },

    // ==========================
    // PROGRESO DE VACUNACIÓN
    // ==========================

    progressBarTrack: {
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.primaryLight,
      overflow: "hidden",
      marginTop: 10,
    },

    progressBarFill: {
      height: "100%",
      borderRadius: 7,
      backgroundColor: colors.green,
    },

    progressLabel: {
      color: colors.white,
      fontWeight: "800",
      fontSize: t(12),
      marginTop: 8,
    },

    unmarkButton: {
      flex: 1,
      backgroundColor: colors.redLight,
      padding: 11,
      borderRadius: 12,
      marginTop: 10,
    },

    unmarkButtonText: {
      color: colors.red,
      textAlign: "center",
      fontWeight: "900",
    },

    applyButton: {
      flex: 1,
      backgroundColor: colors.green,
      padding: 11,
      borderRadius: 12,
      marginTop: 10,
      ...sombraTenue,
    },

    applyButtonText: {
      color: colors.white,
      textAlign: "center",
      fontWeight: "900",
    },

    // ==========================
    // MODAL: selector de cuenta / bebé
    // ==========================

    // ya no uso el <Modal> de React Native para esto: en la versión web se
    // me juntó con un bug feo donde los botones de adentro no respondían al
    // toque/click (problema conocido de react-native-web con Modal). Ahora
    // esta View se pone directo encima de todo con position absolute, así
    // funciona igual en celular y en la versión web.
    modalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 108, 50, 0.35)",
      justifyContent: "flex-end",
      zIndex: 999,
    },

    modalSheet: {
      backgroundColor: colors.white,
      padding: 20,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      ...sombraSuave,
    },

    modalCancelText: {
      textAlign: "center",
      color: colors.muted,
      fontWeight: "800",
      marginTop: 14,
    },

    // ayuda con IA de cada módulo ("¿Cómo funciona?")
    ayudaBoton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    ayudaBotonTexto: {
      color: colors.primaryDark,
      fontWeight: "800",
      fontSize: t(15),
    },
    ayudaCard: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
    },
    ayudaEncabezado: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    ayudaTitulo: {
      flex: 1,
      color: colors.primaryDark,
      fontWeight: "900",
      fontSize: t(16),
    },
    ayudaCerrar: {
      color: colors.muted,
      fontSize: t(18),
      fontWeight: "800",
      paddingHorizontal: 6,
    },
    ayudaRespuestaTexto: {
      color: colors.text,
      fontSize: t(15),
      lineHeight: t(22),
      marginTop: 6,
    },
    ayudaPreguntaTexto: {
      color: colors.primaryDark,
      fontSize: t(14),
      fontWeight: "700",
      marginTop: 10,
    },
    ayudaEtiqueta: {
      color: colors.muted,
      fontSize: t(12),
      marginTop: 8,
    },
    ayudaFilaPregunta: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      gap: 8,
    },
    ayudaInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: t(14),
      color: colors.text,
      backgroundColor: colors.soft,
    },
    ayudaEnviar: {
      backgroundColor: colors.primaryDark,
      borderRadius: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
    },
    ayudaEnviarTexto: {
      color: colors.white,
      fontWeight: "800",
      fontSize: t(14),
    },

    // chatbot con diseño tipo MediCore: encabezado, tarjeta principal y
    // columna lateral ("Cómo responde" e historial)
    chatEncabezado: {
      paddingBottom: 10,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chatEncabezadoFila: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 6,
    },
    chatEncabezadoTitulo: {
      fontSize: t(22),
      fontWeight: "900",
      color: colors.primaryDark,
    },
    chatEncabezadoSub: {
      fontSize: t(13),
      lineHeight: t(19),
      color: colors.muted,
      marginTop: 4,
    },
    chatInsignia: {
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    chatInsigniaTexto: {
      color: colors.primaryDark,
      fontSize: t(12),
      fontWeight: "800",
    },
    chatPrincipalCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...sombraTenue,
    },
    chatContextoFila: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 6,
    },
    chatBebesLista: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    chatContextoEtiqueta: {
      fontSize: t(13),
      fontWeight: "800",
      color: colors.text,
      paddingTop: 9,
    },
    chatAlergiaBanner: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderTopWidth: 1,
      borderBottomWidth: 1,
    },
    chatAlergiaBannerOk: {
      backgroundColor: colors.greenLight,
      borderColor: colors.green,
    },
    chatAlergiaBannerAviso: {
      backgroundColor: colors.yellow,
      borderColor: colors.warning,
    },
    chatAlergiaTexto: {
      fontSize: t(13),
      fontWeight: "700",
      color: colors.text,
    },
    chatFoto: {
      width: 180,
      height: 180,
      borderRadius: 12,
      marginBottom: 6,
    },
    chatReportar: {
      color: colors.muted,
      fontSize: t(11),
      fontWeight: "700",
      marginTop: 6,
    },
    chatSugerenciasTitulo: {
      fontSize: t(11),
      fontWeight: "700",
      color: colors.muted,
      paddingHorizontal: 14,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    chatSugerencias: {
      flexGrow: 0,
      paddingTop: 6,
    },
    chatSugerenciaChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 8,
      backgroundColor: colors.soft,
    },
    chatSugerenciaTexto: {
      fontSize: t(12),
      color: colors.text,
      fontWeight: "600",
    },
    chatEntradaFila: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 10,
    },
    chatCamaraBoton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white,
    },
    chatCamaraIcono: {
      fontSize: t(18),
    },
    chatEntradaInput: {
      flex: 1,
      minWidth: 0,
      minHeight: 44,
      maxHeight: 110,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: t(14),
      color: colors.text,
      backgroundColor: colors.white,
    },
    chatEnviarBoton: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.primaryDark,
      alignItems: "center",
      justifyContent: "center",
    },
    chatEnviarTexto: {
      color: colors.white,
      fontWeight: "800",
      fontSize: t(14),
    },
    chatLateralCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 12,
    },
    chatLateralTitulo: {
      fontSize: t(15),
      fontWeight: "900",
      color: colors.text,
      marginBottom: 10,
    },
    chatPasoFila: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    chatPasoNumero: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    chatPasoNumeroTexto: {
      fontSize: t(12),
      fontWeight: "900",
      color: colors.primaryDark,
    },
    chatPasoTexto: {
      flex: 1,
      fontSize: t(13),
      lineHeight: t(19),
      color: colors.text,
    },
    chatLateralNota: {
      fontSize: t(12),
      lineHeight: t(17),
      color: colors.muted,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    chatConsultaFila: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chatConsultaPregunta: {
      fontSize: t(13),
      fontWeight: "800",
      color: colors.text,
    },
    chatConsultaDetalle: {
      fontSize: t(11),
      color: colors.muted,
      marginTop: 3,
    },
  });
}

export const globalStyles = crearEstilos(paletaNormal, 1);

// esta la llama el index cuando cambian las opciones de accesibilidad.
// Reemplaza el contenido de colors y globalStyles (mismo objeto), y luego
// el index vuelve a montar la pantalla para que tome los estilos nuevos
export function aplicarTema(daltonismo: boolean, textoGrande: boolean) {
  const paleta = daltonismo ? paletaDaltonismo : paletaNormal;
  Object.assign(colors, paleta);
  Object.assign(globalStyles, crearEstilos(paleta, textoGrande ? 1.2 : 1));
}
