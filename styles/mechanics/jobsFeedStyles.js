import { StyleSheet } from "react-native";

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },

  /* Header + segmented */
  header: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 6,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    padding: 3,
    alignSelf: "flex-start",
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: { fontWeight: "600", color: "#374151" },
  segmentTextActive: { color: "#111827" },

  /* Notices */
  notice: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#E6F1F8",
  },
  noticeText: { color: "#0B5FA5" },

  radiusNotice: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
  },
  radiusNoticeText: { color: "#9A3412" },

  /* List */
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#D1D5DB",
  },
  cardTitle: { fontSize: 18, fontWeight: "800", marginBottom: 2, color: "#0F172A" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  cardPrice: { fontSize: 16, fontWeight: "700", color: "#0B3B57" },
  cardRating: { fontSize: 14, fontWeight: "600", color: "#F59E0B" },
  cardDesc: { color: "#4B5563", marginBottom: 8 },
  cardMeta: { color: "#6B7280", marginBottom: 2 },

  btnPrimary: {
    marginTop: 10,
    backgroundColor: "#184E6E",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPrimaryText: { color: "white", fontWeight: "700" },

  /* Map */
  mapWrap: { flex: 1, margin: 16, borderRadius: 16, overflow: "hidden" },
  map: { flex: 1 },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
  },
  loaderText: { color: "#6B7280" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  emptySubtitle: { color: "#6B7280", textAlign: "center" },
});
