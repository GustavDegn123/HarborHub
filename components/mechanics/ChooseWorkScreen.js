// /components/mechanics/ChooseWorkScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";

import styles from "../../styles/mechanics/chooseWorkStyles";
import { getAvailableServices, saveProviderServices } from "../../services/providersService";

// (Android needs this to animate accordion open/close)
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = "hh.servicesSelection";
const RECOMMENDED = [
  "engine.service",
  "hull.antifoul",
  "winter.layup",
  "electrical.troubleshoot",
];

/* =========================
   Helpers (MANGLEDE)
========================= */

/** Returnér true hvis node ligner et "leaf" (har id+name og ingen children) */
function isLeaf(node) {
  return !!node && !!node.id && !!node.name && !Array.isArray(node.children);
}

/** Flad liste af leaf-noder (id+name) */
function flattenLeaves(nodes, acc = []) {
  if (!Array.isArray(nodes)) return acc;

  for (const n of nodes) {
    if (!n) continue;

    if (Array.isArray(n.children) && n.children.length > 0) {
      flattenLeaves(n.children, acc);
    } else if (n.id && n.name) {
      acc.push({ id: String(n.id), name: String(n.name) });
    }
  }

  return acc;
}

/** Saml leaf-ids under en node (category/subcategory/leaf) */
function collectLeafIds(node) {
  if (!node) return [];
  if (Array.isArray(node.children) && node.children.length > 0) {
    return flattenLeaves(node.children).map((x) => x.id);
  }
  return node.id ? [String(node.id)] : [];
}

/** Normaliser query */
function norm(s) {
  return String(s || "").trim().toLowerCase();
}

/**
 * Filtrér kataloget på søgning:
 * - matcher kategori -> behold hele kategorien
 * - matcher subkategori -> behold kun den subkategori (evt. filtreret)
 * - matcher leaf -> behold leaf
 */
function filterCatalog(catalog, query) {
  const q = norm(query);
  if (!q) return Array.isArray(catalog) ? catalog : [];

  const walk = (node) => {
    if (!node) return null;

    const name = norm(node.name);
    const selfMatch = name.includes(q);

    // Har children -> kategori/subkategori
    if (Array.isArray(node.children)) {
      // Hvis kategorien selv matcher, behold alt (bedre UX)
      if (selfMatch) return node;

      const kids = node.children
        .map((c) => walk(c))
        .filter(Boolean);

      if (kids.length === 0) return null;

      return { ...node, children: kids };
    }

    // Leaf
    if (isLeaf(node)) {
      return selfMatch ? node : null;
    }

    return null;
  };

  return (Array.isArray(catalog) ? catalog : [])
    .map((c) => walk(c))
    .filter(Boolean);
}

/**
 * Hvis du modtager et “fladt” katalog (fx [{id,name}, ...] uden children),
 * så wrap det i en kategori så UI stadig virker.
 */
function normalizeCatalogShape(data) {
  if (!Array.isArray(data)) return [];

  const hasAnyChildren = data.some((x) => Array.isArray(x?.children));
  if (hasAnyChildren) return data;

  // flad liste -> wrap som én kategori
  return [
    {
      id: "all_services",
      name: "Ydelser",
      children: data.map((x) => ({
        id: String(x.id),
        name: String(x.name || x.title || x.id),
      })),
    },
  ];
}

/* =========================
   Screen
========================= */

export default function ChooseWorkScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]);
  const [expanded, setExpanded] = useState({}); // categoryId -> open
  const [selected, setSelected] = useState({}); // leafId -> boolean
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  // Hent katalog + lokalt gemt valg
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getAvailableServices();
        const shaped = normalizeCatalogShape(data);

        if (!cancelled) setCatalog(Array.isArray(shaped) ? shaped : []);

        // preload saved
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const obj = JSON.parse(raw);
          if (obj && typeof obj === "object") setSelected(obj);
        }
      } catch (err) {
        console.warn("Kunne ikke hente services:", err);
        if (!cancelled) setCatalog([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fladt indeks (bruges til tællere m.m.)
  const leaves = useMemo(() => flattenLeaves(catalog), [catalog]); // <-- nu findes flattenLeaves

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const onToggleLeaf = useCallback((leafId) => {
    setSelected((prev) => {
      const next = { ...prev, [leafId]: !prev[leafId] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const onToggleCategory = useCallback((category) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => ({ ...e, [category.id]: !e[category.id] }));
  }, []);

  const onSelectCategoryAll = useCallback((category) => {
    const ids = collectLeafIds(category);
    setSelected((prev) => {
      const next = { ...prev };
      const allOn = ids.every((id) => next[id]);
      ids.forEach((id) => (next[id] = !allOn));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setRecommended = useCallback(() => {
    const pre = {};
    RECOMMENDED.forEach((id) => (pre[id] = true));
    setSelected(pre);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pre)).catch(() => {});
  }, []);

  const clearAll = useCallback(() => {
    setSelected({});
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const onDone = useCallback(async () => {
    if (!user) return Alert.alert("Ikke logget ind", "Log ind først.");
    const chosen = Object.keys(selected).filter((k) => selected[k]);
    if (chosen.length === 0) {
      return Alert.alert("Vælg mindst én ydelse", "Vælg fra listen eller brug ‘Anbefalet’.");
    }
    try {
      setSaving(true);
      await saveProviderServices(user.uid, chosen);
      navigation.reset({
        index: 0,
        routes: [{ name: "ProviderRoot", params: { screen: "JobsFeed" } }],
      });
    } catch (e) {
      Alert.alert("Fejl ved gem", e?.message ?? "Noget gik galt.");
    } finally {
      setSaving(false);
    }
  }, [navigation, selected, user]);

  // Søgning
  const filteredCatalog = useMemo(
    () => filterCatalog(catalog, query),
    [catalog, query]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Henter ydelser…</Text>
      </View>
    );
  }

  /* --------- RENDER --------- */

  const renderLeaf = (leaf) => {
    const on = !!selected[leaf.id];
    return (
      <TouchableOpacity
        key={leaf.id}
        onPress={() => onToggleLeaf(leaf.id)}
        style={[styles.leafRow, on ? styles.leafRowOn : styles.leafRowOff]}
      >
        <Text style={styles.leafText}>{leaf.name}</Text>
        <Text style={[styles.tick, on ? styles.tickOn : styles.tickOff]}>
          {on ? "✓" : "＋"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item: cat }) => {
    const leafIds = collectLeafIds(cat);
    const chosenInCat = leafIds.filter((id) => selected[id]).length;
    const allOn = chosenInCat === leafIds.length && leafIds.length > 0;
    const someOn = !allOn && chosenInCat > 0;

    return (
      <View style={styles.categoryCard}>
        <TouchableOpacity
          onPress={() => onToggleCategory(cat)}
          style={styles.categoryHeader}
          activeOpacity={0.8}
        >
          <Text style={styles.categoryTitle}>{cat.name}</Text>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryCount}>
              {chosenInCat}/{leafIds.length}
            </Text>
            <Text style={styles.chevron}>{expanded[cat.id] ? "▾" : "▸"}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.categoryActions}>
          <TouchableOpacity
            onPress={() => onSelectCategoryAll(cat)}
            style={styles.smallBtn}
          >
            <Text style={styles.smallBtnText}>
              {allOn ? "Fravælg alle" : someOn ? "Fuldfør alle" : "Vælg alle"}
            </Text>
          </TouchableOpacity>
        </View>

        {expanded[cat.id] &&
          (cat.children || []).map((node) =>
            node.children?.length ? (
              <View key={node.id} style={styles.subCategoryBlock}>
                <View style={styles.subHeaderRow}>
                  <Text style={styles.subHeader}>{node.name}</Text>
                  <TouchableOpacity
                    onPress={() => onSelectCategoryAll(node)}
                    style={styles.subSmallBtn}
                  >
                    <Text style={styles.subSmallBtnText}>Vælg alle</Text>
                  </TouchableOpacity>
                </View>
                {node.children.map((leaf) => renderLeaf(leaf))}
              </View>
            ) : (
              renderLeaf(node)
            )
          )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Arbejde</Text>
      <Text style={styles.title}>Hvilke opgaver kan du udføre?</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Søg fx 'motor', 'polering'…"
        style={styles.search}
        returnKeyType="search"
      />

      <View style={styles.quickRow}>
        <TouchableOpacity onPress={setRecommended} style={styles.quickBtn}>
          <Text style={styles.quickBtnText}>Anbefalet</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearAll} style={[styles.quickBtn, styles.quickBtnGhost]}>
          <Text style={[styles.quickBtnText, styles.quickBtnGhostText]}>Ryd alle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCatalog}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
      />

      <Text style={styles.selectedInfo}>
        {selectedCount === 0 ? "Ingen valgt" : `${selectedCount} valgt`}
      </Text>

      <View style={styles.spacer} />

      <TouchableOpacity
        onPress={onDone}
        disabled={selectedCount === 0 || saving}
        style={[
          styles.doneButton,
          selectedCount === 0 || saving ? styles.doneButtonDisabled : styles.doneButtonEnabled,
        ]}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.doneButtonText}>Færdig</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("StartTakingJobs")}
        style={styles.cancelButton}
        disabled={saving}
      >
        <Text style={styles.cancelButtonText}>Tilbage</Text>
      </TouchableOpacity>
    </View>
  );
}
