const DEMO_CARDS = [
  "Prasa betyder gris. Av någon anledning borde det vara omöjligt att glömma.",
  "En bra fråga: vad skulle få mig att ändra uppfattning?",
  "Hus - doma. Hem är inte alltid byggnaden, ibland är det riktningen.",
  "Skriv ner små idéer innan de försöker smita.",
  "Ett bra verktyg gör nästa steg lite mer lockande.",
  "Det oväntade är ofta bättre än det perfekta.",
  "Klättring: titta med fötterna först, händerna sen.",
  "Journalistik: vad är det starkaste motargumentet mot min vinkel?",
  "När något känns krångligt: minska systemet tills det går att röra vid.",
  "En idé behöver ibland bara överleva som en rad i ett arkiv.",
  "Allt behöver inte bli ett projekt. Vissa tankar vill bara cirkulera lite.",
  "Det du stjärnmarkerar är inte viktigast. Bara mer magnetiskt just nu."
];

const VISUAL_STYLES = [
  { className: "v-center-bold", badges: ["✦", "※", "◎"] },
  { className: "v-small-note", badges: ["noterat", "sparat", "minne"] },
  { className: "v-quote", badges: ["“", "”", "❧"] },
  { className: "v-catalog", badges: ["arkivkort", "index", "rad"] },
  { className: "v-margin", badges: ["marginalia", "kom ihåg", "fältanteckning"] },
  { className: "v-scrap", badges: ["✂", "✶", "◇"] },
  { className: "v-whisper", badges: ["...", "fragment", "återfunnet"] },
  { className: "v-photo-clip", badges: ["foto", "urklipp", "minnesbild"] },
  { className: "v-corner-photo", badges: ["arkivfoto", "spår", "funnet"] },
  { className: "v-full-photo", badges: ["bildminne", "återblick", "fält"] },
];

const els = {
  setup: document.querySelector("#setup"),
  feed: document.querySelector("#feed"),
  csvUrl: document.querySelector("#csvUrl"),
  loadBtn: document.querySelector("#loadBtn"),
  demoBtn: document.querySelector("#demoBtn"),
  backBtn: document.querySelector("#backBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  deckInfo: document.querySelector("#deckInfo"),
  card: document.querySelector("#card"),
  nextCard: document.querySelector("#nextCard"),
  cardText: document.querySelector("#cardText"),
  nextCardText: document.querySelector("#nextCardText"),
  rowMeta: document.querySelector("#rowMeta"),
  statusMeta: document.querySelector("#statusMeta"),
  visualBadge: document.querySelector("#visualBadge"),
  nextVisualBadge: document.querySelector("#nextVisualBadge"),
  cardImage: document.querySelector("#cardImage"),
  nextImage: document.querySelector("#nextImage"),
  lessBtn: document.querySelector("#lessBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  prevBtn: document.querySelector("#prevBtn"),
  starBtn: document.querySelector("#starBtn"),
};

let deck = [];
let current = null;
let next = null;
let previous = null;
let deckKey = "scrollwise:demo";
let pointerStart = null;
let isAnimating = false;

init();

function init() {
  const savedUrl = localStorage.getItem("scrollwise:lastUrl");
  if (savedUrl) els.csvUrl.value = savedUrl;

  els.loadBtn.addEventListener("click", loadFromInput);
  els.demoBtn.addEventListener("click", () => loadDeckFromRows(DEMO_CARDS, "scrollwise:demo", "Demofeed"));
  els.backBtn.addEventListener("click", showSetup);
  els.resetBtn.addEventListener("click", resetLocalMemory);

  els.nextBtn.addEventListener("click", () => advance("up"));
  els.prevBtn.addEventListener("click", goBack);
  els.starBtn.addEventListener("click", starAndAdvance);
  els.lessBtn.addEventListener("click", lessAndAdvance);

  els.card.addEventListener("pointerdown", onPointerDown);
  els.card.addEventListener("pointerup", onPointerUp);
  els.card.addEventListener("pointercancel", () => pointerStart = null);

  const urlDeck = new URLSearchParams(location.search).get("deck");
  if (urlDeck) {
    els.csvUrl.value = urlDeck;
    loadFromInput();
  }
}

async function loadFromInput() {
  const url = els.csvUrl.value.trim();

  if (!url) {
    alert("Klistra in en CSV-länk, eller testa demofeeden.");
    return;
  }

  try {
    els.loadBtn.textContent = "Laddar…";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Kunde inte ladda: ${response.status}`);

    const csv = await response.text();
    const rows = parseCsvFirstColumn(csv);
    if (!rows.length) throw new Error("Hittade inga kort i första kolumnen.");

    localStorage.setItem("scrollwise:lastUrl", url);
    loadDeckFromRows(rows, makeDeckKey(url), shortDeckName(url));
  } catch (err) {
    alert(err.message + "\n\nTips: Google Sheet behöver vara publicerad som CSV.");
  } finally {
    els.loadBtn.textContent = "Ladda feed";
  }
}

function loadDeckFromRows(rows, key, label) {
  deckKey = key;
  previous = null;

  deck = rows
    .map((text, index) => ({ id: String(index + 1), row: index + 1, text: String(text || "").trim() }))
    .filter(card => card.text.length > 0);

  if (!deck.length) {
    alert("Feeden är tom.");
    return;
  }

  els.deckInfo.textContent = `${label} · ${deck.length} kort`;
  els.setup.classList.add("hidden");
  els.feed.classList.remove("hidden");

  current = makeVisualCard(pickWeightedRandomCard());
  next = makeVisualCard(pickWeightedRandomCard(current.card.id));

  renderCurrent();
  renderNext();
  markSeen(current.card.id);
  updatePrevButton();
}

function parseCsvFirstColumn(csv) {
  const rows = [];
  let cell = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      row.push(cell);
      rows.push(row[0]);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row[0]);

  return rows
    .map(value => (value || "").trim())
    .filter(value => value && value.toLowerCase() !== "text");
}

function makeVisualCard(card) {
  const style = pickVisualStyle(card);
  return {
    card,
    styleClass: style.className,
    badge: pick(style.badges),
    imageSeed: makeImageSeed(card),
  };
}

function makeImageSeed(card) {
  const themes = [
    ["#8a5f34", "#d7bd83", "#5f3c28"],
    ["#6c7350", "#d6c087", "#76513c"],
    ["#5b6470", "#cab88b", "#8a5b38"],
    ["#7c5c47", "#e2cf9f", "#57412f"],
    ["#586b5a", "#d9c48e", "#7f4e31"],
  ];
  return themes[Number(card.id) % themes.length];
}

function renderCurrent(extraClass = "") {
  const memory = getCardMemory(current.card.id);
  els.card.className = `card activeCard ${current.styleClass} ${extraClass}`.trim();
  els.visualBadge.textContent = current.badge;
  els.cardText.textContent = current.card.text;
  els.rowMeta.textContent = `rad ${current.card.row}`;
  els.statusMeta.textContent = formatStatus(memory);
  els.starBtn.classList.toggle("starred", Boolean(memory.starred));
  applyImageSeed(els.cardImage, current.imageSeed, memory);
}

function renderNext() {
  if (!next) return;
  els.nextCard.className = `card previewCard ${next.styleClass}`;
  els.nextVisualBadge.textContent = next.badge;
  els.nextCardText.textContent = next.card.text;
  applyImageSeed(els.nextImage, next.imageSeed, getCardMemory(next.card.id));
}

function applyImageSeed(el, seed, memory) {
  const seen = memory.seenCount || 0;
  const starredBoost = memory.starred ? 4 : 0;
  const saturation = Math.min(1.15, 0.45 + (seen + starredBoost) * 0.08);
  const sepia = Math.max(0.18, 0.78 - (seen + starredBoost) * 0.06);

  el.style.background = `
    radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65), transparent 18%),
    linear-gradient(135deg, ${seed[0]}, ${seed[1]} 48%, ${seed[2]})
  `;
  el.style.filter = `sepia(${sepia}) saturate(${saturation}) contrast(0.92)`;
}

function pickVisualStyle(card) {
  const textLength = card.text.length;

  if (textLength > 180) {
    return pick(VISUAL_STYLES.filter(s => ["v-small-note", "v-whisper", "v-margin"].includes(s.className)));
  }

  if (Math.random() < 0.32) {
    const photoStyles = textLength < 110
      ? ["v-photo-clip", "v-corner-photo", "v-full-photo"]
      : ["v-photo-clip", "v-corner-photo"];
    return pick(VISUAL_STYLES.filter(s => photoStyles.includes(s.className)));
  }

  if (textLength < 65 && Math.random() < 0.55) {
    return pick(VISUAL_STYLES.filter(s => ["v-center-bold", "v-scrap", "v-quote"].includes(s.className)));
  }

  return pick(VISUAL_STYLES.filter(s => !s.className.includes("photo")));
}

function pickWeightedRandomCard(excludeId = null) {
  const now = Date.now();
  const candidates = deck.length > 1 ? deck.filter(card => card.id !== excludeId) : deck;

  const weighted = candidates.map(card => {
    const memory = getCardMemory(card.id);
    const seenRecentlyMs = memory.lastSeen ? now - memory.lastSeen : Infinity;

    let weight = 1;
    if (memory.starred) weight *= 2.4;
    if (memory.less) weight *= 0.35;
    if (seenRecentlyMs < 90 * 1000) weight *= 0.08;
    else if (seenRecentlyMs < 8 * 60 * 1000) weight *= 0.35;
    weight *= 0.75 + Math.random() * 0.75;

    return { card, weight };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.card;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function advance(direction) {
  if (isAnimating || !current || !next) return;
  isAnimating = true;

  previous = current;

  const oldCurrentEl = els.card;
  const incomingClass = direction === "up" ? "animate-in-from-bottom" : "animate-in-from-top";
  const outgoingClass =
    direction === "left" ? "animate-left" :
    direction === "right" ? "animate-right" :
    "animate-up";

  oldCurrentEl.classList.add(outgoingClass);
  els.nextCard.classList.remove("previewCard");
  els.nextCard.classList.add("activeCard", incomingClass);

  setTimeout(() => {
    current = next;
    next = makeVisualCard(pickWeightedRandomCard(current.card.id));

    renderCurrent();
    renderNext();
    markSeen(current.card.id);
    updatePrevButton();
    isAnimating = false;
  }, 220);
}

function goBack() {
  if (isAnimating || !previous) return;
  isAnimating = true;

  const future = current;
  current = previous;
  next = future;
  previous = null;

  els.card.classList.add("animate-down");

  setTimeout(() => {
    renderCurrent("animate-in-from-top");
    renderNext();
    updatePrevButton();
    isAnimating = false;
  }, 220);
}

function starAndAdvance() {
  if (!current || isAnimating) return;
  const memory = getCardMemory(current.card.id);
  saveCardMemory(current.card.id, { ...memory, starred: !memory.starred, less: false });
  advance("right");
}

function lessAndAdvance() {
  if (!current || isAnimating) return;
  const memory = getCardMemory(current.card.id);
  saveCardMemory(current.card.id, { ...memory, less: true, starred: false });
  advance("left");
}

function onPointerDown(event) {
  pointerStart = { x: event.clientX, y: event.clientY };
}

function onPointerUp(event) {
  if (!pointerStart || isAnimating) return;

  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absY > 55 && dy < 0 && absY > absX) advance("up");
  else if (absY > 55 && dy > 0 && absY > absX) goBack();
  else if (absX > 60 && dx > 0) starAndAdvance();
  else if (absX > 60 && dx < 0) lessAndAdvance();
}

function getMemoryStore() {
  try { return JSON.parse(localStorage.getItem(deckKey) || "{}"); }
  catch { return {}; }
}

function setMemoryStore(store) {
  localStorage.setItem(deckKey, JSON.stringify(store));
}

function getCardMemory(id) {
  return getMemoryStore()[id] || {};
}

function saveCardMemory(id, memory) {
  const store = getMemoryStore();
  store[id] = memory;
  setMemoryStore(store);
}

function markSeen(id) {
  const memory = getCardMemory(id);
  saveCardMemory(id, { ...memory, seenCount: (memory.seenCount || 0) + 1, lastSeen: Date.now() });

  if (current && current.card.id === id) {
    els.statusMeta.textContent = formatStatus(getCardMemory(id));
  }
}

function formatStatus(memory) {
  const parts = [];
  if (memory.starred) parts.push("★ oftare");
  if (memory.less) parts.push("mer sällan");
  if (memory.seenCount) parts.push(`${memory.seenCount} visningar`);
  return parts.join(" · ") || "nytt i arkivet";
}

function resetLocalMemory() {
  const ok = confirm("Nollställa lokal historik för den här feeden?");
  if (!ok) return;

  localStorage.removeItem(deckKey);
  if (current) renderCurrent();
  if (next) renderNext();
  updatePrevButton();
}

function updatePrevButton() {
  els.prevBtn.disabled = !previous;
}

function showSetup() {
  els.feed.classList.add("hidden");
  els.setup.classList.remove("hidden");
}

function makeDeckKey(url) {
  return "scrollwise:" + btoa(unescape(encodeURIComponent(url))).slice(0, 48);
}

function shortDeckName(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace("www.", "");
  } catch {
    return "Egen feed";
  }
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}
