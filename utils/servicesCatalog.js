// /utils/servicesCatalog.js
export function flattenLeaves(catalog) {
  const out = [];
  const walk = (node, path = []) => {
    if (!node) return;
    const nextPath = [...path, node.name];
    if (node.children?.length) {
      node.children.forEach((c) => walk(c, nextPath));
    } else if (node.id) {
      out.push({ id: node.id, name: node.name, path: nextPath });
    }
  };
  catalog.forEach((n) => walk(n, []));
  return out;
}

export function collectLeafIds(node) {
  const ids = [];
  const walk = (n) => {
    if (n.children?.length) n.children.forEach(walk);
    else if (n.id) ids.push(n.id);
  };
  walk(node);
  return ids;
}

export function filterCatalog(catalog, query) {
  if (!query?.trim()) return catalog;
  const q = query.trim().toLowerCase();

  const matchNode = (node) => {
    const nameHit = node.name?.toLowerCase().includes(q);
    if (nameHit) return true;
    if (node.children?.length) return node.children.some(matchNode);
    return false;
  };

  const prune = (node) => {
    if (!node.children?.length) return node; // leaf already matched
    const kids = node.children
      .filter(matchNode)
      .map((c) => prune(c))
      .filter(Boolean);
    return kids.length ? { ...node, children: kids } : null;
  };

  return catalog
    .filter(matchNode)
    .map((n) => prune(n))
    .filter(Boolean);
}
