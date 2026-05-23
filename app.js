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
  exportStateBtn: document.querySelector("#exportStateBtn"),
  importStateBtn: document.querySelector("#importStateBtn"),
  stateFileInput: document.querySelector("#stateFileInput"),
  noteBtn: document.querySelector("#noteBtn"),
  noteModal: document.querySelector("#noteModal"),
  noteText: document.querySelector("#noteText"),
  noteCardPreview: document.querySelector("#noteCardPreview"),
  saveNoteBtn: document.querySelector("#saveNoteBtn"),
  deleteNoteBtn: document.querySelector("#deleteNoteBtn"),
  closeNoteBtn: document.querySelector("#closeNoteBtn"),
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
  settingsBtn: document.querySelector("#settingsBtn"),
  settingsModal: document.querySelector("#settingsModal"),
  closeSettingsBtn: document.querySelector("#closeSettingsBtn"),
  settingsSheetBtn: document.querySelector("#settingsSheetBtn"),
  settingsCsvBtn: document.querySelector("#settingsCsvBtn"),
  settingsImagesBtn: document.querySelector("#settingsImagesBtn"),
  settingsImageCount: document.querySelector("#settingsImageCount"),
  pasteNotesBtn: document.querySelector("#pasteNotesBtn"),
  sheetModal: document.querySelector("#sheetModal"),
  sheetUrlInput: document.querySelector("#sheetUrlInput"),
  sheetAddDirectBtn: document.querySelector("#sheetAddDirectBtn"),
  sheetReviewBtn: document.querySelector("#sheetReviewBtn"),
  sheetCancelBtn: document.querySelector("#sheetCancelBtn"),
  pasteModal: document.querySelector("#pasteModal"),
  pasteInput: document.querySelector("#pasteInput"),
  pasteSuggestBtn: document.querySelector("#pasteSuggestBtn"),
  pasteCancelBtn: document.querySelector("#pasteCancelBtn"),
  reviewModal: document.querySelector("#reviewModal"),
  reviewTitle: document.querySelector("#reviewTitle"),
  reviewSummary: document.querySelector("#reviewSummary"),
  reviewCards: document.querySelector("#reviewCards"),
  reviewAddBtn: document.querySelector("#reviewAddBtn"),
  reviewCancelBtn: document.querySelector("#reviewCancelBtn"),
  fixCardBtn: document.querySelector("#fixCardBtn"),
  fixModal: document.querySelector("#fixModal"),
  fixText: document.querySelector("#fixText"),
  mergePreview: document.querySelector("#mergePreview"),
  fixSaveBtn: document.querySelector("#fixSaveBtn"),
  mergePrevBtn: document.querySelector("#mergePrevBtn"),
  mergeNextBtn: document.querySelector("#mergeNextBtn"),
  deleteCardBtn: document.querySelector("#deleteCardBtn"),
  fixCancelBtn: document.querySelector("#fixCancelBtn"),
  backupLibraryBtn: document.querySelector("#backupLibraryBtn"),
  restoreLibraryBtn: document.querySelector("#restoreLibraryBtn"),
  restoreFileInput: document.querySelector("#restoreFileInput"),
  toast: document.querySelector("#toast"),
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
window.addEventListener("DOMContentLoaded", bootFromIndexedDbIfNeeded);

function init() {
  const savedUrl = localStorage.getItem("scrollwise:lastUrl");
  if (savedUrl) els.csvUrl.value = savedUrl;

  els.loadBtn.addEventListener("click", loadFromInput);
  els.loadLocalCsvBtn?.addEventListener("click", () => els.csvFileInput.click());
  els.csvFileInput?.addEventListener("change", handleLocalCsvPick);
  els.demoBtn.addEventListener("click", () => loadDeckFromRows(DEMO_CARDS, "scrollwise:demo", "Demofeed"));
  els.pickImagesBtn.addEventListener("click", () => els.imageInput.click());
  els.pickImagesBtnFeed?.addEventListener("click", () => els.imageInput.click());
  els.imageInput.addEventListener("change", handleImagePick);
  els.exportStateBtn?.addEventListener("click", exportScrollwiseState);
  els.importStateBtn?.addEventListener("click", () => els.stateFileInput.click());
  els.stateFileInput?.addEventListener("change", importScrollwiseState);
  els.noteBtn?.addEventListener("click", openNoteModal);
  els.saveNoteBtn?.addEventListener("click", saveCurrentNote);
  els.deleteNoteBtn?.addEventListener("click", deleteCurrentNote);
  els.closeNoteBtn?.addEventListener("click", closeNoteModal);
  els.noteModal?.addEventListener("click", event => {
    if (event.target === els.noteModal) closeNoteModal();
  });

  els.backBtn?.addEventListener("click", showSetup);
  els.resetBtn?.addEventListener("click", resetLocalMemory);

  els.nextBtn.addEventListener("click", () => advance("up"));
  els.prevBtn.addEventListener("click", goBack);
  els.starBtn.addEventListener("click", starAndAdvance);
  els.settingsBtn?.addEventListener("click", openSettings);
  els.closeSettingsBtn?.addEventListener("click", closeSettings);
  els.settingsModal?.addEventListener("click", e => { if (e.target === els.settingsModal) closeSettings(); });
  els.settingsCsvBtn?.addEventListener("click", () => { closeSettings(); els.csvFileInput?.click(); });
  els.settingsImagesBtn?.addEventListener("click", () => { closeSettings(); els.imageInput?.click(); });
  els.settingsSheetBtn?.addEventListener("click", openSheetModal);
  els.sheetCancelBtn?.addEventListener("click", closeSheetModal);
  els.sheetAddDirectBtn?.addEventListener("click", () => addSheetCollection(false));
  els.sheetReviewBtn?.addEventListener("click", () => addSheetCollection(true));
  els.pasteNotesBtn?.addEventListener("click", openPasteModal);
  els.pasteCancelBtn?.addEventListener("click", closePasteModal);
  els.pasteSuggestBtn?.addEventListener("click", reviewPastedNotes);
  els.reviewCancelBtn?.addEventListener("click", closeReviewModal);
  els.reviewAddBtn?.addEventListener("click", commitReviewRows);
  els.fixCardBtn?.addEventListener("click", openFixModal);
  els.fixCancelBtn?.addEventListener("click", closeFixModal);
  els.fixSaveBtn?.addEventListener("click", saveFixedCard);
  els.mergePrevBtn?.addEventListener("click", () => mergeCurrentCard("prev"));
  els.mergeNextBtn?.addEventListener("click", () => mergeCurrentCard("next"));
  els.deleteCardBtn?.addEventListener("click", deleteCurrentCard);
  els.backupLibraryBtn?.addEventListener("click", backupFullLibrary);
  els.restoreLibraryBtn?.addEventListener("click", () => els.restoreFileInput.click());
  els.restoreFileInput?.addEventListener("change", restoreFullLibrary);


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

async function handleImagePick(event) {
  const files = Array.from(event.target.files || [])
    .filter(file => file.type.startsWith("image/"));

  if (!files.length) return;

  try {
    updateImageStatus("Bearbetar bildminnen…");

    const processed = [];

    for (const [index, file] of files.entries()) {
      const dataUrl = await resizeImageFileToDataUrl(file, 600, 0.76);
      processed.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        name: file.name,
        url: dataUrl,
        stored: true,
      });
    }

    userImages = [...userImages, ...processed].slice(-100);
    await idbSet("userImages", userImages);
    if (userImages.length >= 100) showToast("100 bildminnen används. Nya bilder ersätter de äldsta.");

    updateImageStatus();

    if (current) {
      current = refreshVisualCardImage(current);
      renderCurrent();
    }

    if (next) {
      next = refreshVisualCardImage(next);
      renderNext();
    }

    event.target.value = "";
  } catch (err) {
    alert("Kunde inte spara bilderna: " + (err.message || String(err)));
    updateImageStatus();
  }
}

function releaseUserImages() {
  userImages.forEach(image => {
    if (image.url && image.url.startsWith("blob:")) {
      URL.revokeObjectURL(image.url);
    }
  });
}

function updateImageStatus(overrideText = null) {
  const text = overrideText || (userImages.length
    ? `${userImages.length} bildminnen sparade lokalt.`
    : "Inga egna bilder valda. Appen använder blekta stock-fragment.");

  if (els.imageStatus) els.imageStatus.textContent = text;
  if (els.imageStatusFeed) els.imageStatusFeed.textContent = overrideText
    ? overrideText
    : userImages.length
      ? `${userImages.length}/100 bildminnen`
      : "stock-fragment";
  if (els.settingsImageCount) els.settingsImageCount.textContent = `${userImages.length} / 100 sparade`;
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

    const savedDeckKey = makeDeckKey(`local:${file.name}:${file.size}:${file.lastModified}`);
    const savedLabel = `${file.name} · ${parsed.rows.length} kort${ignoredText}`;

    await addRowsToLibrary(parsed.rows, file.name || "CSV-fil");
    showToast(`📚 ${parsed.rows.length} kort tillagda. Biblioteket innehåller ${deck.length} minnen.`);

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

    const savedDeckKey = makeDeckKey(csvUrl);
    const savedLabel = `${shortDeckName(rawUrl)} · ${parsed.rows.length} kort${ignoredText}`;

    await addRowsToLibrary(parsed.rows, shortDeckName(rawUrl));
    showToast(`📚 ${parsed.rows.length} kort tillagda. Biblioteket innehåller ${deck.length} minnen.`);
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
    .map((item, index) => {
      if (typeof item === "object" && item.text !== undefined) return { id: item.id || String(index + 1), row: item.row || index + 1, text: String(item.text || "").trim(), source: item.source || "samling" };
      return { id: String(index + 1), row: index + 1, text: String(item || "").trim(), source: "samling" };
    })
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
    toneClass: pickToneClass(),
    posterMode: shouldUsePosterMode(card.text, style.className),
    highlightWords: shouldHighlightWords(card.text),
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

  const raw = String(card?.id ?? card?.row ?? card?.text ?? "0");
  let hash = 0;

  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }

  return themes[Math.abs(hash) % themes.length];
}

function renderCurrent(extraClass = "") {
  const memory = getCardMemory(current.card.id);
  els.card.className = `card activeCard ${current.styleClass} ${current.sizeClass} ${current.toneClass} ${current.posterMode ? "posterMode" : ""} ${extraClass}`.trim();
  els.visualBadge.textContent = current.badge;
  els.cardText.innerHTML = renderCardText(current.card.text, current.highlightWords);
  els.rowMeta.textContent = `rad ${current.card.row}`;
  els.statusMeta.textContent = formatStatus(memory);
  els.starBtn.classList.toggle("starred", Boolean(memory.starred));
  els.noteBtn?.classList.toggle("hasNote", Boolean(memory.note && memory.note.trim()));
  applyImage(els.cardImage, current, memory);
}

function renderNext() {
  if (!next) { if (els.nextCardText) els.nextCardText.textContent = ""; return; }
  els.nextCard.className = `card previewCard ${next.styleClass} ${next.sizeClass} ${next.toneClass} ${next.posterMode ? "posterMode" : ""}`;
  els.nextVisualBadge.textContent = next.badge;
  els.nextCardText.innerHTML = renderCardText(next.card.text, next.highlightWords);
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
    const seed = visualCard.imageSeed || ["#8a5f34", "#d7bd83", "#5f3c28"];
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


function pickToneClass() {
  return pick(["tone-warm", "tone-pale", "tone-ink", "tone-blueprint", "tone-rose", ""]);
}

function shouldUsePosterMode(text, styleClass) {
  return text.length <= 70 && styleClass !== "v-full-photo" && Math.random() < 0.32;
}

function shouldHighlightWords(text) {
  if (text.length < 25 || text.length > 180 || Math.random() > 0.24) return [];
  const stopwords = new Set(["och","eller","att","det","den","detta","denna","som","för","med","till","från","inte","men","har","var","är","ett","också","bara","lite","sig","mig","dig","man","jag","du","han","hon","dom","där","här","ska","kan","hur","vad","när"]);
  const words = text.split(/\s+/);
  const candidates = words
    .map((word, index) => ({ word, index, clean: word.toLowerCase().replace(/[^\p{L}\p{N}åäö]/gu, "") }))
    .filter(item => item.clean.length >= 6 && !stopwords.has(item.clean));
  if (!candidates.length) return [];
  candidates.sort(() => Math.random() - 0.5);
  return candidates.slice(0, Math.random() < 0.65 ? 1 : 2).map(item => item.index);
}

function renderCardText(text, highlightIndexes = []) {
  const parts = String(text || "").split(/(\s+)/);
  let wordIndex = -1;
  return parts.map(part => {
    if (/^\s+$/.test(part)) return escapeHtml(part);
    wordIndex++;
    const escaped = escapeHtml(part);
    if (!highlightIndexes.includes(wordIndex)) return escaped;
    const alt = Math.random() < 0.5 ? " alt" : "";
    return `<span class="swMark${alt}">${escaped}</span>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openNoteModal() {
  if (!current) return;
  const memory = getCardMemory(current.card.id);
  els.noteCardPreview.textContent = current.card.text;
  els.noteText.value = memory.note || "";
  els.noteModal.classList.remove("hidden");
  setTimeout(() => els.noteText.focus(), 30);
}

function closeNoteModal() {
  els.noteModal.classList.add("hidden");
}

function saveCurrentNote() {
  if (!current) return;
  const memory = getCardMemory(current.card.id);
  const note = els.noteText.value.trim();
  saveCardMemory(current.card.id, { ...memory, note, noteUpdatedAt: note ? new Date().toISOString() : undefined });
  renderCurrent();
  closeNoteModal();
}

function deleteCurrentNote() {
  if (!current) return;
  const memory = getCardMemory(current.card.id);
  delete memory.note;
  delete memory.noteUpdatedAt;
  saveCardMemory(current.card.id, memory);
  renderCurrent();
  closeNoteModal();
}

function exportScrollwiseState() {
  const payload = {
    app: "Scrollwise",
    version: "v8",
    exportedAt: new Date().toISOString(),
    deckKey,
    memory: getMemoryStore(),
    lastUrl: localStorage.getItem("scrollwise:lastUrl") || ""
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scrollwise-memory-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importScrollwiseState(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (!payload || payload.app !== "Scrollwise" || !payload.memory) {
      throw new Error("Det där ser inte ut som en Scrollwise-export.");
    }
    setMemoryStore({ ...getMemoryStore(), ...payload.memory });
    if (current) renderCurrent();
    if (next) renderNext();
    alert("Import klar. Historik, stjärnor och kommentarer har slagits ihop.");
  } catch (err) {
    alert(err.message || String(err));
  } finally {
    event.target.value = "";
  }
}


// ---- IndexedDB persistence layer ----

const SW_DB_NAME = "scrollwise-db";
const SW_DB_VERSION = 1;
const SW_STORE = "kv";

function openScrollwiseDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SW_DB_NAME, SW_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SW_STORE)) {
        db.createObjectStore(SW_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key) {
  const db = await openScrollwiseDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SW_STORE, "readonly");
    const store = tx.objectStore(SW_STORE);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key, value) {
  const db = await openScrollwiseDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SW_STORE, "readwrite");
    const store = tx.objectStore(SW_STORE);
    const request = store.put(value, key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function saveLibraryToIndexedDb(rows, savedDeckKey, label, source) {
  const library = {
    rows,
    deckKey: savedDeckKey,
    label,
    source,
    savedAt: new Date().toISOString(),
  };

  try {
    await idbSet("library", library);
    localStorage.setItem("scrollwise:hasLocalLibrary", "1");
    localStorage.setItem("scrollwise:lastLocalDeckKey", savedDeckKey);
  } catch (err) {
    console.warn("Kunde inte spara biblioteket i IndexedDB", err);
    // Fallback: spara även som vanlig localStorage om biblioteket är rimligt stort.
    try {
      localStorage.setItem("scrollwise:fallbackLibrary", JSON.stringify(library));
      localStorage.setItem("scrollwise:hasLocalLibrary", "1");
    } catch (fallbackErr) {
      console.warn("Fallback-sparning misslyckades också", fallbackErr);
    }
  }
}

async function bootFromIndexedDb() {
  if (!localStorage.getItem("scrollwise:hasLocalLibrary")) return false;

  try {
    const [library, savedImages] = await Promise.all([
      idbGet("library"),
      idbGet("userImages"),
    ]);

    if (Array.isArray(savedImages) && savedImages.length) {
      userImages = savedImages;
      updateImageStatus();
    }

    if (library && Array.isArray(library.rows) && library.rows.length) {
      loadDeckFromRows(
        library.rows,
        library.deckKey || "scrollwise:indexeddb",
        library.label || `Lokalt bibliotek · ${library.rows.length} kort`
      );
      return true;
    }
  } catch (err) {
    console.warn("Kunde inte autostarta från IndexedDB", err);
  }

  // Fallback om IndexedDB av någon anledning inte svarar.
  try {
    const fallback = JSON.parse(localStorage.getItem("scrollwise:fallbackLibrary") || "null");
    if (fallback && Array.isArray(fallback.rows) && fallback.rows.length) {
      loadDeckFromRows(
        fallback.rows,
        fallback.deckKey || "scrollwise:fallback",
        fallback.label || `Lokalt bibliotek · ${fallback.rows.length} kort`
      );
      return true;
    }
  } catch (err) {
    console.warn("Kunde inte läsa fallback-bibliotek", err);
  }

  return false;
}

async function bootFromIndexedDbIfNeeded() {
  const urlDeck = new URLSearchParams(location.search).get("deck");
  if (urlDeck) return;

  // Om feed redan visas, gör inget.
  if (!els.feed.classList.contains("hidden")) return;

  await bootFromIndexedDb();
}

function resizeImageFileToDataUrl(file, maxSize = 600, quality = 0.76) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG är mindre och räcker för minnesfragment.
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Kunde inte läsa en av bilderna."));
    };

    img.src = objectUrl;
  });
}




// ---- v9.2 helpers ----
let pendingReviewRows = [];
let pendingReviewSource = "samling";
function openSettings(){ updateImageStatus(); els.settingsModal.classList.remove("hidden"); }
function closeSettings(){ els.settingsModal.classList.add("hidden"); }
function openSheetModal(){ closeSettings(); els.sheetUrlInput.value = els.csvUrl.value || ""; els.sheetModal.classList.remove("hidden"); setTimeout(()=>els.sheetUrlInput.focus(),30); }
function closeSheetModal(){ els.sheetModal.classList.add("hidden"); }
async function addSheetCollection(reviewFirst){ const rawUrl=els.sheetUrlInput.value.trim(); if(!rawUrl){alert("Klistra in en länk.");return;} try{ const rows=await fetchRowsFromUrl(rawUrl); closeSheetModal(); if(reviewFirst) openReviewModal(rows, shortDeckName(rawUrl)); else { await addRowsToLibrary(rows, shortDeckName(rawUrl)); showToast(`📚 ${rows.length} kort tillagda. Biblioteket innehåller ${deck.length} minnen.`); } }catch(err){alert(err.message||String(err));} }
async function fetchRowsFromUrl(rawUrl){ const csvUrl=normalizeCsvUrl(rawUrl); const response=await fetch(csvUrl); if(!response.ok) throw new Error(`Kunde inte ladda datan (${response.status}). Testa lokal CSV-fil.`); const rawText=await response.text(); if(looksLikeHtml(rawText)) throw new Error("Det verkar vara en webbsida, inte CSV-data."); const parsed=parseAndCleanCsv(rawText); if(!parsed.rows.length) throw new Error("Hittade inga användbara kort."); return parsed.rows; }
function openPasteModal(){ closeSettings(); els.pasteInput.value=""; els.pasteModal.classList.remove("hidden"); setTimeout(()=>els.pasteInput.focus(),30); }
function closePasteModal(){ els.pasteModal.classList.add("hidden"); }
function reviewPastedNotes(){ const rows=chunkRawNotes(els.pasteInput.value); if(!rows.length){alert("Hittade inga kortförslag.");return;} closePasteModal(); openReviewModal(rows,"anteckningar"); }
function openReviewModal(rows,source){ pendingReviewRows=rows.map(x=>String(x||"").trim()).filter(Boolean); pendingReviewSource=source||"samling"; renderReviewCards(); els.reviewModal.classList.remove("hidden"); }
function closeReviewModal(){ els.reviewModal.classList.add("hidden"); pendingReviewRows=[]; }
function renderReviewCards(){ els.reviewCards.innerHTML=""; els.reviewSummary.textContent=`${pendingReviewRows.length} kort från ${pendingReviewSource}`; pendingReviewRows.forEach((row,index)=>{ const art=document.createElement("article"); art.className="reviewCard"; const ta=document.createElement("textarea"); ta.value=row; ta.addEventListener("input",()=>{pendingReviewRows[index]=ta.value.trim();}); const tools=document.createElement("div"); tools.className="reviewTools"; const b=(label,fn)=>{const btn=document.createElement("button"); btn.type="button"; btn.textContent=label; btn.onclick=fn; return btn;}; tools.append(b("Splitta",()=>{const parts=pendingReviewRows[index].split("\n").map(x=>x.trim()).filter(Boolean); if(parts.length>1){pendingReviewRows.splice(index,1,...parts);renderReviewCards();}}), b("+ före",()=>{if(index>0){pendingReviewRows[index-1]=`${pendingReviewRows[index-1]}\n${pendingReviewRows[index]}`.trim();pendingReviewRows.splice(index,1);renderReviewCards();}}), b("+ nästa",()=>{if(index<pendingReviewRows.length-1){pendingReviewRows[index]=`${pendingReviewRows[index]}\n${pendingReviewRows[index+1]}`.trim();pendingReviewRows.splice(index+1,1);renderReviewCards();}}), b("Ta bort",()=>{pendingReviewRows.splice(index,1);renderReviewCards();})); art.append(ta,tools); els.reviewCards.appendChild(art); }); }
async function commitReviewRows(){ const rows=pendingReviewRows.map(x=>x.trim()).filter(Boolean); if(!rows.length)return; await addRowsToLibrary(rows,pendingReviewSource); closeReviewModal(); showToast(`📚 ${rows.length} kort tillagda. Biblioteket innehåller ${deck.length} minnen.`); }
async function addRowsToLibrary(rows,sourceName){ const start=deck.length; const added=rows.map((text,i)=>({id:createCardId(sourceName,start+i+1,text),row:start+i+1,text:String(text||"").trim(),source:sourceName||"samling"})).filter(c=>c.text); deck=[...deck,...added]; deckKey="scrollwise:local-library"; await saveLibraryToIndexedDb(deck,deckKey,`Lokalt bibliotek · ${deck.length} kort`,"local-library"); localStorage.setItem("scrollwise:hasLocalLibrary","1"); els.setup.classList.add("hidden"); els.feed.classList.remove("hidden"); els.deckInfo.textContent=`Lokalt bibliotek · ${deck.length} kort`; if(!current&&deck.length){current=makeVisualCard(pickWeightedRandomCard());next=makeVisualCard(pickWeightedRandomCard(current.card.id));renderCurrent();renderNext();markSeen(current.card.id);} }
function createCardId(sourceName,number,text){let base=`${sourceName||"samling"}:${number}:${String(text).slice(0,24)}`,h=0;for(let i=0;i<base.length;i++){h=((h<<5)-h)+base.charCodeAt(i);h|=0;}return `card-${number}-${Math.abs(h)}`;}
function chunkRawNotes(raw){const lines=String(raw||"").replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").map(cleanRawNoteLine);const out=[];let cur=[];for(const line of lines){if(!line.text){flush();continue;} if(looksLikeNoteHeading(line.text)){flush();cur.push(line.text);continue;} if(line.wasBullet&&cur.length>=6)flush();cur.push(line.text);if(line.wasBullet&&cur.length===1&&line.text.length>150)flush();}flush();return out;function flush(){const text=cur.join("\n").trim();if(text)out.push(text);cur=[];}}
function cleanRawNoteLine(line){let text=String(line||"").trim();const m=text.match(/^([•●▪▫◦‣⁃*-]|\d+[.)]|[a-zA-ZåäöÅÄÖ][.)])\s+/);if(m)text=text.replace(/^([•●▪▫◦‣⁃*-]|\d+[.)]|[a-zA-ZåäöÅÄÖ][.)])\s+/,"").trim();return {text,wasBullet:Boolean(m)};}
function looksLikeNoteHeading(text){const t=text.trim();if(t.length>70)return false;if(/[.!?]$/.test(t))return false;if(t.includes(":")&&t.length<80)return true;const words=t.split(/\s+/).filter(Boolean);if(words.length<=4)return true;if(/[-/–—]/.test(t)&&words.length<=7)return true;return false;}
function openFixModal(){ closeSettings(); if(!current)return; els.fixText.value=current.card.text; els.fixModal.classList.remove("hidden"); setTimeout(()=>els.fixText.focus(),30); }
function closeFixModal(){ els.fixModal.classList.add("hidden"); }
async function saveFixedCard(){ if(!current)return; current.card.text=els.fixText.value.trim(); const idx=deck.findIndex(c=>c.id===current.card.id); if(idx>=0)deck[idx].text=current.card.text; await persistCurrentDeck(); renderCurrent(); closeFixModal(); showToast("Kortet uppdaterat."); }
async function mergeCurrentCard(direction){ if(!current)return; const idx=deck.findIndex(c=>c.id===current.card.id); const oi=direction==="prev"?idx-1:idx+1; if(idx<0||oi<0||oi>=deck.length){showToast(direction==="prev"?"Det finns inget föregående kort.":"Det finns inget nästa kort.");return;} const first=direction==="prev"?deck[oi]:deck[idx]; const second=direction==="prev"?deck[idx]:deck[oi]; const merged=`${first.text}\n${second.text}`.trim(); if(!confirm(`Slå ihop korten så här?\n\n${merged.slice(0,700)}`))return; first.text=merged; deck.splice(direction==="prev"?idx:oi,1); current=makeVisualCard(first); next=deck.length>1?makeVisualCard(pickWeightedRandomCard(current.card.id)):null; previous=null; await persistCurrentDeck(); renderCurrent(); renderNext(); updatePrevButton(); closeFixModal(); showToast("Korten slogs ihop."); }
async function deleteCurrentCard(){ if(!current)return; if(!confirm("Ta bort det här kortet från biblioteket?"))return; const idx=deck.findIndex(c=>c.id===current.card.id); if(idx>=0)deck.splice(idx,1); if(!deck.length){current=null;next=null;previous=null;closeFixModal();showSetup();return;} current=makeVisualCard(pickWeightedRandomCard()); next=deck.length>1?makeVisualCard(pickWeightedRandomCard(current.card.id)):null; previous=null; await persistCurrentDeck(); renderCurrent(); renderNext(); updatePrevButton(); closeFixModal(); showToast("Kortet togs bort."); }
async function persistCurrentDeck(){ await saveLibraryToIndexedDb(deck,"scrollwise:local-library",`Lokalt bibliotek · ${deck.length} kort`,"local-library"); els.deckInfo.textContent=`Lokalt bibliotek · ${deck.length} kort`; }
async function backupFullLibrary(){ try{const library=await idbGet("library");const images=await idbGet("userImages");const payload={app:"Scrollwise",version:"v9.2",exportedAt:new Date().toISOString(),library,images:images||[],memory:getMemoryStore()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`scrollwise-library-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);}catch(err){alert(err.message||String(err));}}
async function restoreFullLibrary(event){const file=event.target.files?.[0];if(!file)return;try{const payload=JSON.parse(await file.text());if(!payload||payload.app!=="Scrollwise")throw new Error("Det där ser inte ut som en Scrollwise-säkerhetskopia.");if(payload.library){await idbSet("library",payload.library);localStorage.setItem("scrollwise:hasLocalLibrary","1");loadDeckFromRows(payload.library.rows||[],payload.library.deckKey||"scrollwise:restored",payload.library.label||"Återställt bibliotek");} if(Array.isArray(payload.images)){userImages=payload.images.slice(-100);await idbSet("userImages",userImages);updateImageStatus();} if(payload.memory)setMemoryStore({...getMemoryStore(),...payload.memory});closeSettings();showToast("Biblioteket är återställt.");}catch(err){alert(err.message||String(err));}finally{event.target.value="";}}
function showToast(message){if(!els.toast){alert(message);return;}els.toast.textContent=message;els.toast.classList.remove("hidden");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>els.toast.classList.add("hidden"),2500);}

window.addEventListener("beforeunload", releaseUserImages);
