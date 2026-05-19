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
  "En idé behöver ibland bara överleva som en rad i ett arkiv."
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
  cardText: document.querySelector("#cardText"),
  rowMeta: document.querySelector("#rowMeta"),
  statusMeta: document.querySelector("#statusMeta"),
  lessBtn: document.querySelector("#lessBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  starBtn: document.querySelector("#starBtn"),
};

let deck = [];
let current = null;
let deckKey = "scrollwise:demo";
let pointerStart = null;

init();

function init() {
  const savedUrl = localStorage.getItem("scrollwise:lastUrl");
  if (savedUrl) els.csvUrl.value = savedUrl;

  els.loadBtn.addEventListener("click", loadFromInput);
  els.demoBtn.addEventListener("click", () => loadDeckFromRows(DEMO_CARDS, "scrollwise:demo", "Demofeed"));
  els.backBtn.addEventListener("click", showSetup);
  els.resetBtn.addEventListener("click", resetLocalMemory);

  els.nextBtn.addEventListener("click", () => actOnCard("next"));
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
  showNextCard();
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

function showNextCard() {
  current = pickWeightedRandomCard();
  const memory = getCardMemory(current.id);

  els.card.className = "card";
  els.cardText.textContent = current.text;
  els.rowMeta.textContent = `rad ${current.row}`;
  els.statusMeta.textContent = formatStatus(memory);
  els.starBtn.classList.toggle("starred", Boolean(memory.starred));

  markSeen(current.id);
}

function pickWeightedRandomCard() {
  const now = Date.now();

  const weighted = deck.map(card => {
    const memory = getCardMemory(card.id);
    const seenRecentlyMs = memory.lastSeen ? now - memory.lastSeen : Infinity;

    let weight = 1;

    if (memory.starred) weight *= 2.4;
    if (memory.less) weight *= 0.35;

    // Inte spaced repetition: bara en mild broms så samma kort inte loopar direkt.
    if (seenRecentlyMs < 90 * 1000) weight *= 0.08;
    else if (seenRecentlyMs < 8 * 60 * 1000) weight *= 0.35;

    // Små slumpvågor för att flödet ska kännas mindre mekaniskt.
    weight *= 0.75 + Math.random() * 0.75;

    return { card, weight };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.card;
  }

  return deck[Math.floor(Math.random() * deck.length)];
}

function actOnCard(action) {
  if (!current) return;

  if (action === "star") {
    const memory = getCardMemory(current.id);
    saveCardMemory(current.id, {
      ...memory,
      starred: !memory.starred,
      less: false,
    });
    animateAndNext("flyRight");
  }

  if (action === "less") {
    const memory = getCardMemory(current.id);
    saveCardMemory(current.id, {
      ...memory,
      less: true,
      starred: false,
    });
    animateAndNext("flyLeft");
  }

  if (action === "next") {
    animateAndNext("flyUp");
  }
}

function animateAndNext(className) {
  els.card.classList.add(className);
  setTimeout(showNextCard, 170);
}

function onPointerDown(event) {
  pointerStart = {
    x: event.clientX,
    y: event.clientY,
  };
}

function onPointerUp(event) {
  if (!pointerStart) return;

  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absY > 55 && dy < 0 && absY > absX) {
    actOnCard("next");
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
  showNextCard();
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
