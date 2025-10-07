import { StyleSheet } from "react-native";
 
const C = {
  bg: "#F5F9FF",
  surface: "#FFFFFF",
  border: "#D9E6F6",
  text: "#0B1220",
  muted: "#667085",
  primary: "#0B5FA5",      // HarborHub blå
  primaryDark: "#094C85",
  navy: "#0E223A",         // sekundær knap
};
 
export default StyleSheet.create({
  /* Layout */
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: C.bg,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 10,
    color: C.text,
  },
 
  /* Empty / loader */
  emptyCard: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
  },
  emptyText: { color: C.muted, textAlign: "center" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
 
  /* List */
  listContent: { paddingBottom: 16 },
  separator: { height: 12 },
 
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
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: { fontWeight: "800", fontSize: 16, color: C.text },
 
  /* Status pill */
  pillWrap: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: {
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },
 
  /* Meta */
  metaRowTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 4, // lidt luft til linjen under
  },
  metaBelowStatus: {
    marginBottom: 10,
  },
 
  price: { fontWeight: "800", color: C.text },
  badgePaid: { color: C.primary, fontWeight: "700" },
 
  /* Actions */
  actionsRow: { flexDirection: "row", gap: 10 },
 
  // Primær (blå) – til betaling
  btnPrimary: {
    flex: 1,
    backgroundColor: C.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: C.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  btnPrimaryText: { color: "#FFFFFF", fontWeight: "800" },
 
  // Sekundær (mørk navy) – detaljer
  btnSecondary: {
    flex: 1,
    backgroundColor: C.navy,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  btnSecondaryText: { color: "#FFFFFF", fontWeight: "700" },
 
  // Outline (blå kant) – anmeld
  btnOutline: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: C.primary,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  btnOutlineText: { color: C.primary, fontWeight: "800" },
});
 