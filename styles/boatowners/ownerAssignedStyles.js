// styles/boatowners/ownerAssignedStyles.js
import { StyleSheet } from "react-native";
 
/**
* Vælg farvetema: "marine" | "teal" | "slate"
*/
const PALETTE = "marine";
 
const palettes = {
  marine: {
    detail: "#0B2942",
    detailPressed: "#092235",
    chat: "#0077B6",
    chatPressed: "#026AA7",
    surface: "#FFFFFF",
    background: "#F7F8FB",
    border: "#E6EAF0",
    text: "#0B1220",
    muted: "#6B7280",
  },
  teal: {
    detail: "#0F766E",
    detailPressed: "#115E59",
    chat: "#06B6D4",
    chatPressed: "#0891B2",
    surface: "#FFFFFF",
    background: "#F7F8FB",
    border: "#E6EAF0",
    text: "#0B1220",
    muted: "#6B7280",
  },
  slate: {
    detail: "#334155",
    detailPressed: "#1F2937",
    chat: "#2563EB",
    chatPressed: "#1D4ED8",
    surface: "#FFFFFF",
    background: "#F7F8FB",
    border: "#E6EAF0",
    text: "#0B1220",
    muted: "#6B7280",
  },
};
 
const C = palettes[PALETTE];
 
export default StyleSheet.create({
  /* Layout */
  container: { flex: 1, backgroundColor: C.background },
  contentContainer: { padding: 16, gap: 16, paddingBottom: 28 },
 
  /* Loader */
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  loaderText: { marginTop: 8, color: C.muted },
 
  /* Titles */
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: C.text,
  },
  sectionTitle: {
    marginTop: 4,
    fontWeight: "700",
    fontSize: 16,
    color: "#111827",
  },
 
  /* Empty & error */
  emptyCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 18,
    backgroundColor: C.surface,
  },
  emptyText: { color: C.muted, textAlign: "center" },
  errorText: { color: "#EF4444", marginTop: 8 },
 
  /* Card */
  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: C.surface,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: { fontWeight: "800", fontSize: 16, color: C.text },
 
  /* Status pill */
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
  },
 
  /* Tekst under titel */
  cardDescription: { color: C.muted, marginTop: 2, fontSize: 14 },
 
  /* Meta/price */
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    alignItems: "center",
  },
  price: { fontWeight: "800", fontSize: 16, color: C.text },
  location: { color: "#374151", fontSize: 13 },
 
  /* Billede */
  imageWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  image: { width: "100%", height: 140 },
 
  /* Next step boxes */
  nextBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  nextInfo: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  nextInfoTitle: { color: "#1D4ED8", fontWeight: "700", marginBottom: 6 },
 
  nextSuccess: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  nextSuccessTitle: { color: "#047857", fontWeight: "700", marginBottom: 6 },
 
  nextNeutral: { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" },
  nextNeutralText: { color: "#374151" },
 
  /* Actions */
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
 
  /* Buttons */
  btnDark: {
    flex: 1,
    backgroundColor: C.detail,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: C.detail,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  btnDarkPressed: { backgroundColor: C.detailPressed },
  btnDarkText: { color: "#FFFFFF", fontWeight: "700", letterSpacing: 0.2 },
 
  btnPrimary: {
    flex: 1,
    backgroundColor: C.chat,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: C.chat,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  btnPrimaryPressed: { backgroundColor: C.chatPressed },
  btnPrimaryLarge: {
    marginTop: 10,
    backgroundColor: C.chat,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: C.chat,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  btnPrimaryText: { color: "#FFFFFF", fontWeight: "800", letterSpacing: 0.2 },
 
  btnSuccess: {
    marginTop: 10,
    backgroundColor: "#10B981",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  btnSuccessText: { color: "#FFFFFF", fontWeight: "800", letterSpacing: 0.2 },
});