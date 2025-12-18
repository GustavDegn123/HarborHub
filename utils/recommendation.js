// utils/recommendation.js

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  
  function safeNum(n, fallback = 0) {
    const v = Number(n);
    return Number.isFinite(v) ? v : fallback;
  }
  
  function tsToMs(ts) {
    // Firestore Timestamp eller Date/string/number
    if (!ts) return 0;
    if (typeof ts?.toMillis === "function") return ts.toMillis();
    const d = new Date(ts);
    const t = d.getTime();
    return Number.isFinite(t) ? t : 0;
  }
  
  export function recommendBid(bids) {
    if (!Array.isArray(bids) || bids.length === 0) {
      return { bestId: null, scores: {}, explanation: "Ingen bud at anbefale." };
    }
  
    // Saml prisdata til normalisering
    const prices = bids
      .map((b) => safeNum(b.price, NaN))
      .filter((x) => Number.isFinite(x))
      .sort((a, b) => a - b);
  
    const median =
      prices.length === 0
        ? 0
        : prices.length % 2 === 1
        ? prices[(prices.length - 1) / 2]
        : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;
  
    // Vægte (kan justeres)
    const W = {
      price: 0.45, // billigere end median = højere score
      rating: 0.35, // høj rating er vigtigt
      reviews: 0.15, // flere reviews er godt (aftagende effekt)
      recency: 0.05, // lidt plus for nyere bud
    };
  
    const now = Date.now();
    const scores = {};
    let bestId = null;
    let bestScore = -Infinity;
  
    for (const b of bids) {
      const price = safeNum(b.price, NaN);
      const rating = clamp(safeNum(b?.provider?.avgRating, 0), 0, 5);
      const reviewCount = clamp(safeNum(b?.provider?.reviewCount, 0), 0, 9999);
      const createdMs = tsToMs(b.created_at);
  
      // Pris-score: median -> 0.5, billigere -> op til 1, dyrere -> ned mod 0
      let priceScore = 0.5;
      if (Number.isFinite(price) && median > 0) {
        const ratio = price / median; // <1 = billigere
        // map ratio (0.5..1.5) til (1..0) m. clamp
        priceScore = clamp(1.5 - ratio, 0, 1);
      }
  
      // Rating-score: 0..5 -> 0..1
      const ratingScore = rating / 5;
  
      // Review-score: aftagende—brug log2(1+n)/log2(1+50) så 50 reviews ~ 1
      const reviewScore = clamp(Math.log2(1 + reviewCount) / Math.log2(1 + 50), 0, 1);
  
      // Recency-score: indenfor 72h = bedst
      let recencyScore = 0.5;
      if (createdMs > 0) {
        const hours = (now - createdMs) / (1000 * 60 * 60);
        // < 1h ≈ 1.0, 72h+ ≈ 0.0
        recencyScore = clamp(1 - hours / 72, 0, 1);
      }
  
      const score =
        W.price * priceScore +
        W.rating * ratingScore +
        W.reviews * reviewScore +
        W.recency * recencyScore;
  
      scores[b.id] = score;
      if (score > bestScore) {
        bestScore = score;
        bestId = b.id;
      }
    }
  
    // Forklaring (kort, forståelig)
    const best = bids.find((x) => x.id === bestId);
    const name = best?.provider?.name || "leverandøren";
    const pr = Number.isFinite(best?.price) ? best.price : null;
    const r = Number(best?.provider?.avgRating ?? 0);
    const c = Number(best?.provider?.reviewCount ?? 0);
  
    const parts = [];
    if (pr != null && median > 0) {
      const diff = Math.round(((median - pr) / median) * 100);
      if (diff >= 5) parts.push(`${diff}% under medianpris`);
      else if (diff <= -5) parts.push(`${Math.abs(diff)}% over medianpris`);
      else parts.push(`pris tæt på medianen`);
    }
    if (r > 0) parts.push(`${r.toFixed(1)}★`);
    if (c > 0) parts.push(`${c} anmeldelser`);
  
    const explanation =
      parts.length > 0
        ? `Anbefaler ${name} pga. ${parts.join(", ")}.`
        : `Anbefaler ${name} ud fra samlet vurdering.`;
  
    return { bestId, scores, explanation };
  }