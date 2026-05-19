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
  lessBtn: document.querySelector("#lessBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  prevBtn: document.querySelector("#prevBtn"),
  starBtn: document.querySelector("#starBtn"),
};

let deck = [];
let current = null;
let queued = null;
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

  els.nextBtn.addEventListener("click", () => actOnCard("next"));
  els.prevBtn.addEventListener("click", goBackOneCard);
  els.starBtn.addEventListener("click", () => actOnCard("star"));
  els.lessBtn.addEventListener("click", () => actOnCard("less"));

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
    .map((text, index) => ({
      id: String(index + 1),
      row: index + 1,
      text: String(text || "").trim(),
    }))
    .filter(card => card.text.length > 0);

  if (!deck.length) {
    alert("Feeden är tom.");
    return;
  }

  els.deckInfo.textContent = `${label} · ${deck.length} kort`;
  els.setup.classList.add("hidden");
  els.feed.classList.remove("hidden");

  current = createVisualCard(pickWeightedRandomCard());
  queued = createVisualCard(pickWeightedRandomCard(current.card.id));

  renderActive(current);
  renderPreview(queued);
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
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
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

function createVisualCard(card) {
  const style = pickVisualStyle(card);
  return {
    card,
    styleClass: style.className,
    badge: pick(style.badges),
  };
}

function renderActive(visualCard, options = {}) {
  const memory = getCardMemory(visualCard.card.id);

  els.card.className = `card activeCard ${visualCard.styleClass}`;
  if (options.comeBack) els.card.classList.add("comeBack");

  els.visualBadge.textContent = visualCard.badge;
  els.cardText.textContent = visualCard.card.text;
  els.rowMeta.textContent = `rad ${visualCard.card.row}`;
  els.statusMeta.textContent = formatStatus(memory);
  els.starBtn.classList.toggle("starred", Boolean(memory.starred));

  if (options.comeBack) {
    setTimeout(() => els.card.classList.remove("comeBack"), 260);
  }
}

function renderPreview(visualCard) {
  if (!visualCard) {
    els.nextCard.className = "card previewCard";
    els.nextCardText.textContent = "";
    els.nextVisualBadge.textContent = "";
    return;
  }

  els.nextCard.className = `card previewCard ${visualCard.styleClass}`;
  els.nextVisualBadge.textContent = visualCard.badge;
  els.nextCardText.textContent = visualCard.card.text;
}

function pickVisualStyle(card) {
  const textLength = card.text.length;

  if (textLength > 180 && Math.random() < 0.55) {
    return pick(VISUAL_STYLES.filter(s => ["v-small-note", "v-whisper", "v-margin"].includes(s.className)));
  }

  if (textLength < 65 && Math.random() < 0.55) {
    return pick(VISUAL_STYLES.filter(s => ["v-center-bold", "v-scrap", "v-quote"].includes(s.className)));
  }

  return pick(VISUAL_STYLES);
}

function pickWeightedRandomCard(excludeId = null) {
  const now = Date.now();
  const candidates = deck.length > 1
    ? deck.filter(card => card.id !== excludeId)
    : deck;

  const weighted = candidates.map(card => {
    const memory = getCardMemory(card.id);
    const seenRecentlyMs = memory.lastSeen ? now - memory.lastSeen : Infinity;

    let weight = 1;

    if (memory.starred) weight *= 2.4;
    if (memory.less) weight *= 0.35;

    // Inte spaced repetition: bara en mild broms så samma kort inte loopar direkt.
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

function actOnCard(action) {
  if (!current || isAnimating) return;

  if (action === "star") {
    const memory = getCardMemory(current.card.id);
    saveCardMemory(current.card.id, {
      ...memory,
      starred: !memory.starred,
      less: false,
    });
    advanceCard("flyRight");
  }

  if (action === "less") {
    const memory = getCardMemory(current.card.id);
    saveCardMemory(current.card.id, {
      ...memory,
      less: true,
      starred: false,
    });
    advanceCard("flyLeft");
  }

  if (action === "next") {
    advanceCard("flyUp");
  }
}

function advanceCard(animationClass) {
  if (!current || !queued) return;

  isAnimating = true;
  previous = current;

  els.card.classList.add(animationClass);
  els.nextCard.classList.add("previewPromote");

  setTimeout(() => {
    current = queued;
    queued = createVisualCard(pickWeightedRandomCard(current.card.id));

    renderActive(current);
    renderPreview(queued);
    markSeen(current.card.id);
    updatePrevButton();

    isAnimating = false;
  }, 240);
}

function goBackOneCard() {
  if (!previous || isAnimating) return;

  isAnimating = true;

  // Put the current card back into the preview slot, because it is now "next" again.
  queued = current;
  current = previous;
  previous = null;

  els.card.classList.add("returnDown");

  setTimeout(() => {
    renderActive(current, { comeBack: true });
    renderPreview(queued);

    // Do not call markSeen(). Back means "bring the same artefact back", not a new viewing.
    updatePrevButton();
    isAnimating = false;
  }, 220);
}

function onPointerDown(event) {
  pointerStart = {
    x: event.clientX,
    y: event.clientY,
  };
}

function onPointerUp(event) {
  if (!pointerStart || isAnimating) return;

  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absY > 55 && dy < 0 && absY > absX) {
    actOnCard("next");
  } else if (absY > 55 && dy > 0 && absY > absX) {
    goBackOneCard();
  } else if (absX > 60 && dx > 0) {
    actOnCard("star");
  } else if (absX > 60 && dx < 0) {
    actOnCard("less");
  }
}

function getMemoryStore() {
  try {
    return JSON.parse(localStorage.getItem(deckKey) || "{}");
  } catch {
    return {};
  }
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

  saveCardMemory(id, {
    ...memory,
    seenCount: (memory.seenCount || 0) + 1,
    lastSeen: Date.now(),
  });

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
  if (current) renderActive(current);
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
