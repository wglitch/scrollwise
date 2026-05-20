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
  "Det du stjärnmarkerar är inte viktigast. Bara mer magnetiskt just nu.",
  "Det här är ett mycket längre testkort för att kontrollera att stora textsjok faktiskt får plats på kortet utan att klippas av. Texten ska hellre bli mindre än att försvinna utanför ytan, även om det gör att den visuella affischkänslan blir lugnare."
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
  loadLocalCsvBtn: document.querySelector("#loadLocalCsvBtn"),
  csvFileInput: document.querySelector("#csvFileInput"),
  demoBtn: document.querySelector("#demoBtn"),
  pickImagesBtn: document.querySelector("#pickImagesBtn"),
  pickImagesBtnFeed: document.querySelector("#pickImagesBtnFeed"),
  imageInput: document.querySelector("#imageInput"),
  imageStatus: document.querySelector("#imageStatus"),
  imageStatusFeed: document.querySelector("#imageStatusFeed"),
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
let userImages = [];

init();

function init() {
  const savedUrl = localStorage.getItem("scrollwise:lastUrl");
  if (savedUrl) els.csvUrl.value = savedUrl;

  els.loadBtn.addEventListener("click", loadFromInput);
  els.loadLocalCsvBtn?.addEventListener("click", () => els.csvFileInput.click());
  els.csvFileInput?.addEventListener("change", handleLocalCsvPick);
  els.demoBtn.addEventListener("click", () => loadDeckFromRows(DEMO_CARDS, "scrollwise:demo", "Demofeed"));
  els.pickImagesBtn.addEventListener("click", () => els.imageInput.click());
  els.pickImagesBtnFeed.addEventListener("click", () => els.imageInput.click());
  els.imageInput.addEventListener("change", handleImagePick);

  els.backBtn.addEventListener("click", showSetup);
  els.resetBtn.addEventListener("click", resetLocalMemory);

  els.nextBtn.addEventListener("click", () => advance("up"));
  els.prevBtn.addEventListener("click", goBack);
  els.starBtn.addEventListener("click", starAndAdvance);
  els.lessBtn.addEventListener("click", lessAndAdvance);

  els.card.addEventListener("pointerdown", onPointerDown);
  els.card.addEventListener("pointerup", onPointerUp);
  els.card.addEventListener("pointercancel", () => pointerStart = null);

  updateImageStatus();

  const urlDeck = new URLSearchParams(location.search).get("deck");
  if (urlDeck) {
    els.csvUrl.value = urlDeck;
    loadFromInput();
  }
}

function handleImagePick(event) {
  releaseUserImages();

  const files = Array.from(event.target.files || [])
    .filter(file => file.type.startsWith("image/"));

  userImages = files.map((file, index) => ({
    id: `${file.name}-${file.size}-${index}`,
    name: file.name,
    url: URL.createObjectURL(file),
  }));

  updateImageStatus();

  if (current) {
    current = refreshVisualCardImage(current);
    renderCurrent();
  }

  if (next) {
    next = refreshVisualCardImage(next);
    renderNext();
  }
}

function releaseUserImages() {
  userImages.forEach(image => URL.revokeObjectURL(image.url));
  userImages = [];
}

function updateImageStatus() {
  const text = userImages.length
    ? `${userImages.length} bildminnen valda för den här sessionen.`
    : "Inga egna bilder valda. Appen använder blekta stock-fragment.";

  els.imageStatus.textContent = text;
  els.imageStatusFeed.textContent = userImages.length
    ? `${userImages.length} bildminnen`
    : "stock-fragment";
}


async function handleLocalCsvPick(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  try {
    els.loadBtn.textContent = "Laddar…";

    const rawText = await file.text();

    if (looksLikeHtml(rawText)) {
      throw new Error(
        "Filen verkar innehålla HTML, inte CSV.\n\n" +
        "Kontrollera att du laddade ner arket som CSV."
      );
    }

    const parsed = parseAndCleanCsv(rawText);

    if (!parsed.rows.length) {
      throw new Error(
        "Hittade inga användbara kort i första kolumnen.\n\n" +
        "Kontrollera att CSV-filen har en kolumn med korttext."
      );
    }

    const ignoredText = parsed.ignored
      ? ` · ${parsed.ignored} skräprader ignorerades`
      : "";

    loadDeckFromRows(
      parsed.rows,
      makeDeckKey(`local:${file.name}:${file.size}:${file.lastModified}`),
      `${file.name} · ${parsed.rows.length} kort${ignoredText}`
    );

    // Gör det möjligt att välja samma fil igen senare.
    event.target.value = "";
  } catch (err) {
    const message = err?.message || String(err);
    const extra = message.includes("Failed to fetch") || message.includes("NetworkError")
      ? "\n\nDet kan vara Google/CORS som stoppar länken. Testa knappen “Ladda lokal CSV-fil” i stället."
      : "";
    alert(message + extra);
  } finally {
    els.loadBtn.textContent = "Ladda feed";
  }
}

async function loadFromInput() {
  const rawUrl = els.csvUrl.value.trim();

  if (!rawUrl) {
    alert("Klistra in en Google Sheet-länk, CSV-länk, eller testa demofeeden.");
    return;
  }

  try {
    els.loadBtn.textContent = "Laddar…";

    const csvUrl = normalizeCsvUrl(rawUrl);
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`Kunde inte ladda datan (${response.status}). Kontrollera att arket är publicerat, eller använd knappen “Ladda lokal CSV-fil”.`);
    }

    const rawText = await response.text();

    if (looksLikeHtml(rawText)) {
      throw new Error(
        "Det där verkar vara en Google Sheets-webbsida, inte CSV-data.\n\n" +
        "Testa att dela arket så att alla med länken kan läsa, eller använd Arkiv → Dela → Publicera på webben → CSV."
      );
    }

    const parsed = parseAndCleanCsv(rawText);

    if (!parsed.rows.length) {
      throw new Error(
        "Hittade inga användbara kort i första kolumnen.\n\n" +
        "Kontrollera att första kolumnen innehåller dina rader, och att länken verkligen ger CSV."
      );
    }

    localStorage.setItem("scrollwise:lastUrl", rawUrl);
    els.csvUrl.value = rawUrl;

    const ignoredText = parsed.ignored
      ? ` · ${parsed.ignored} skräprader ignorerades`
      : "";

    loadDeckFromRows(
      parsed.rows,
      makeDeckKey(csvUrl),
      `${shortDeckName(rawUrl)} · ${parsed.rows.length} kort${ignoredText}`
    );
  } catch (err) {
    alert(err.message);
  } finally {
    els.loadBtn.textContent = "Ladda feed";
  }
}

function normalizeCsvUrl(rawUrl) {
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Länken ser inte ut som en giltig URL.");
  }

  const isGoogleSheets =
    url.hostname === "docs.google.com" &&
    url.pathname.includes("/spreadsheets/");

  if (!isGoogleSheets) {
    return rawUrl;
  }

  // Publicerade Google Sheets-länkar av typen:
  // /spreadsheets/d/e/2PACX.../pub?output=csv
  // är redan färdiga publiceringslänkar och ska INTE skrivas om till /export.
  if (url.pathname.includes("/spreadsheets/d/e/")) {
    if (!url.searchParams.has("output")) {
      url.searchParams.set("output", "csv");
    }
    return url.toString();
  }

  // Andra redan färdiga CSV-/exportlänkar ska också lämnas i fred.
  if (
    url.pathname.includes("/pub") ||
    url.pathname.includes("/export") ||
    url.searchParams.get("format") === "csv" ||
    url.searchParams.get("output") === "csv"
  ) {
    return rawUrl;
  }

  // Vanlig redigeringslänk:
  // /spreadsheets/d/<sheetId>/edit?gid=...
  const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) {
    return rawUrl;
  }

  const sheetId = match[1];
  const gid =
    url.searchParams.get("gid") ||
    (url.hash.match(/gid=(\d+)/) || [])[1] ||
    "0";

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function looksLikeHtml(text) {
  const start = text.trim().slice(0, 500).toLowerCase();

  return (
    start.includes("<!doctype html") ||
    start.includes("<html") ||
    start.includes("<head") ||
    start.includes("<body") ||
    start.includes("#sheets-viewport") ||
    start.includes("grid-container") ||
    start.includes("widget-overflow")
  );
}

function parseAndCleanCsv(csv) {
  const rawRows = parseCsvFirstColumn(csv);
  const rows = [];
  let ignored = 0;

  for (const row of rawRows) {
    const cleaned = String(row || "").trim();

    if (!cleaned) continue;

    if (looksLikeJunkRow(cleaned)) {
      ignored++;
      continue;
    }

    rows.push(cleaned);
  }

  return { rows, ignored };
}

function looksLikeJunkRow(text) {
  const t = text.trim();
  const lower = t.toLowerCase();

  if (lower === "text") return true;

  if (
    lower.startsWith("<") ||
    lower.startsWith("</") ||
    lower.startsWith("#") ||
    lower.startsWith(".") ||
    lower.startsWith("@media") ||
    lower.startsWith("body") ||
    lower.startsWith("html") ||
    lower.startsWith("script") ||
    lower.startsWith("style") ||
    lower.includes("#sheets-viewport") ||
    lower.includes("grid-container") ||
    lower.includes("widget-overflow") ||
    lower.includes("docs-titlebar") ||
    lower.includes("docs-gm") ||
    lower.includes("waffle") ||
    lower.includes("goog-") ||
    lower.includes("margin:") ||
    lower.includes("padding:") ||
    lower.includes("overflow:") ||
    lower.includes("font-family:") ||
    (lower.includes("{") && lower.includes("}") && t.length < 220)
  ) {
    return true;
  }

  if (/^[#.\w-]+\s*\{?$/.test(t) && t.length < 80) return true;
  if (/^[a-z-]+\s*:\s*[^;]+;?$/.test(lower) && t.length < 120) return true;

  return false;
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

  els.deckInfo.textContent = label.includes("kort") ? label : `${label} · ${deck.length} kort`;
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
  const visual = {
    card,
    styleClass: style.className,
    sizeClass: getTextSizeClass(card.text, style.className),
    badge: pick(style.badges),
    imageSeed: makeImageSeed(card),
    userImageUrl: null,
  };

  return refreshVisualCardImage(visual);
}

function getTextSizeClass(text, styleClass) {
  const len = text.length;

  if (len > 420) return "text-xs";
  if (len > 280) return "text-xs";
  if (len > 190) return "text-sm";
  if (len > 120) return "text-md";
  if (len > 65) return "text-lg";

  // Kort text får affischkänsla oftare, men inte när den ligger på helbild.
  if (styleClass === "v-full-photo") return "text-lg";
  return "text-xl";
}

function refreshVisualCardImage(visual) {
  const isImageStyle = visual.styleClass.includes("photo");

  return {
    ...visual,
    userImageUrl: isImageStyle && userImages.length
      ? pick(userImages).url
      : null,
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
  els.card.className = `card activeCard ${current.styleClass} ${current.sizeClass} ${extraClass}`.trim();
  els.visualBadge.textContent = current.badge;
  els.cardText.textContent = current.card.text;
  els.rowMeta.textContent = `rad ${current.card.row}`;
  els.statusMeta.textContent = formatStatus(memory);
  els.starBtn.classList.toggle("starred", Boolean(memory.starred));
  applyImage(els.cardImage, current, memory);
}

function renderNext() {
  if (!next) return;
  els.nextCard.className = `card previewCard ${next.styleClass} ${next.sizeClass}`;
  els.nextVisualBadge.textContent = next.badge;
  els.nextCardText.textContent = next.card.text;
  applyImage(els.nextImage, next, getCardMemory(next.card.id));
}

function applyImage(el, visualCard, memory) {
  el.classList.toggle("hasUserImage", Boolean(visualCard.userImageUrl));

  const seen = memory.seenCount || 0;
  const starredBoost = memory.starred ? 4 : 0;
  const memoryStrength = seen + starredBoost;
  const isFullPhoto = visualCard.styleClass === "v-full-photo";

  let saturation = Math.min(1.22, 0.44 + memoryStrength * 0.085);
  let sepia = Math.max(0.12, 0.78 - memoryStrength * 0.06);
  let brightness = Math.min(1.04, 0.93 + memoryStrength * 0.01);

  // På helbild prioriterar vi alltid läsbar text framför färg.
  if (isFullPhoto) {
    saturation = Math.min(0.75, saturation);
    sepia = Math.max(0.62, sepia);
    brightness = Math.min(0.78, brightness);
  }

  if (visualCard.userImageUrl) {
    el.style.backgroundImage = `
      linear-gradient(0deg, rgba(70,45,25,0.12), rgba(255,248,225,0.04)),
      url("${visualCard.userImageUrl}")
    `;
  } else {
    const seed = visualCard.imageSeed;
    el.style.backgroundImage = `
      radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65), transparent 18%),
      linear-gradient(135deg, ${seed[0]}, ${seed[1]} 48%, ${seed[2]})
    `;
  }

  el.style.filter = `sepia(${sepia}) saturate(${saturation}) brightness(${brightness}) contrast(0.9)`;
}

function pickVisualStyle(card) {
  const textLength = card.text.length;

  if (textLength > 180) {
    return pick(VISUAL_STYLES.filter(s => ["v-small-note", "v-whisper", "v-margin"].includes(s.className)));
  }

  const photoChance = userImages.length ? 0.46 : 0.32;

  if (Math.random() < photoChance) {
    // Fullbild bara på kort text, annars riskerar kontrast/läsbarhet att bli sämre.
    const photoStyles = textLength < 80
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

  const outgoingClass =
    direction === "left" ? "animate-left" :
    direction === "right" ? "animate-right" :
    "animate-up";

  els.card.classList.add(outgoingClass);
  els.nextCard.classList.remove("previewCard");
  els.nextCard.classList.add("activeCard", "animate-in-from-bottom");

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
    applyImage(els.cardImage, current, getCardMemory(id));
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

window.addEventListener("beforeunload", releaseUserImages);
