const content = globalThis.RIPPLES_CONTENT;
const byId = id => document.getElementById(id);
const dialog = byId("book");
const profilesDialog = byId("profiles");
const landingAnchors = new Set(["", "story", "people", "premise", "chapters", "edition"]);
let locale;
let pageIndex = 0;
let textSize = 18;
let opener;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let pageTurn;
let waterPaused = false;
let waterVisible = true;
let rippleCount = 0;
let profileOpener;
const readingMemoryKey = "ripples.reading.v1";
let savedReading = null;
let readerTheme = "paper";
let memoryDisabled = false;
let hasRead = false;
let pendingResume;
let saveTimer;

function decodeReadingState(raw) {
  if (raw === null) return null;
  const value = JSON.parse(raw);
  const position = value?.position;
  if (value?.version !== 1 || typeof value.language !== "string" || value.language.length > 30
      || !Number.isInteger(value.textSize) || value.textSize < 16 || value.textSize > 24
      || !["paper", "night"].includes(value.theme)
      || (position !== null && (!position || typeof position.sectionId !== "string" || !/^[a-z][a-z-]*$/.test(position.sectionId)
        || !Number.isInteger(position.index) || position.index < 0 || position.index > 1000000
        || (position.text !== null && (typeof position.text !== "string" || position.text.length > 100000))))) {
    throw new TypeError("Invalid Ripples reading memory.");
  }
  return value;
}

function makeReadingState(edition, index, offset, size, theme) {
  const page = edition.pages[index];
  const paragraphs = page.blocks.flatMap(block => block.paragraphs);
  const withinPage = Math.max(0, Math.min(offset, paragraphs.length - 1));
  const before = edition.pages.slice(0, index).filter(item => item.sectionId === page.sectionId)
    .reduce((count, item) => count + item.blocks.reduce((sum, block) => sum + block.paragraphs.length, 0), 0);
  return {
    version: 1, language: edition.code, textSize: size, theme,
    position: { sectionId: page.sectionId, index: before + withinPage, text: paragraphs[withinPage] ?? null },
  };
}

function resolveReadingState(editions, state) {
  const edition = editions.find(item => item.code === state.language) ?? editions[0];
  const sectionPages = edition.pages.map((page, index) => ({ page, index }))
    .filter(item => item.page.sectionId === state.position.sectionId);
  if (!sectionPages.length) return { edition, index: 0, offset: 0, moved: true };
  const records = sectionPages.flatMap(({ page, index }) =>
    page.blocks.flatMap(block => block.paragraphs).map((text, offset) => ({ text, index, offset })));
  const first = { edition, index: sectionPages[0].index, offset: 0, moved: edition.code !== state.language };
  if (!records.length || state.position.text === null) return first;
  // Match the passage, not its old page number; use proximity for repeated dialogue.
  const matches = records.map((record, index) => ({ ...record, distance: Math.abs(index - state.position.index) }))
    .filter(record => record.text === state.position.text).sort((a, b) => a.distance - b.distance);
  const record = matches[0] ?? records[Math.min(state.position.index, records.length - 1)];
  return { edition, index: record.index, offset: record.offset, moved: first.moved || matches.length === 0 };
}

function memoryNotice(key, error) {
  if (error) console.warn("Ripples reading memory:", error);
  for (const id of ["memory-notice", "reader-memory-notice"]) {
    const notice = byId(id);
    notice.dataset.memoryLabel = key;
    notice.textContent = locale.labels[key];
    notice.hidden = false;
  }
}

function updateResumeButtons() {
  const resumable = Boolean(savedReading?.position);
  document.querySelectorAll('[data-open="title"]:not(.cover-preview)').forEach(button => {
    button.textContent = locale.labels[resumable ? "continueReading" : "read"];
  });
  document.querySelectorAll("[data-start-again]").forEach(button => { button.hidden = !resumable; });
}

function applyReaderPreferences() {
  dialog.dataset.theme = readerTheme;
  dialog.style.setProperty("--reading-size", `${textSize}px`);
  byId("reader-theme").value = readerTheme;
  byId("smaller").disabled = textSize === 16;
  byId("larger").disabled = textSize === 24;
}

function saveReading(offset = 0) {
  if (!hasRead) return;
  savedReading = makeReadingState(locale, pageIndex, offset, textSize, readerTheme);
  if (!memoryDisabled) {
    try {
      localStorage.setItem(readingMemoryKey, JSON.stringify(savedReading));
    } catch (error) {
      memoryDisabled = true;
      memoryNotice("memoryError", error);
    }
  }
  updateResumeButtons();
}

function visibleParagraphOffset() {
  const top = dialog.getBoundingClientRect().top + 16;
  const paragraphs = [...byId("book-page").querySelectorAll(".passage p")];
  const offset = paragraphs.findIndex(paragraph => paragraph.getBoundingClientRect().bottom > top);
  return Math.max(0, offset);
}

function resumeReading() {
  const target = resolveReadingState(content, savedReading);
  if (target.moved) memoryNotice("memoryMoved");
  opener = document.activeElement;
  pendingResume = target;
  const route = `#${pageRoute(target.edition.pages[target.index], target.edition.code)}`;
  if (location.hash === route) readLocation();
  else location.hash = route;
}

function updateWaterMotion() {
  const paused = waterPaused || reducedMotion.matches;
  document.body.classList.toggle("water-paused", paused || !waterVisible || document.hidden || dialog.open || profilesDialog.open);
  const toggle = byId("toggle-water");
  toggle.textContent = locale.labels[reducedMotion.matches ? "reducedWater" : waterPaused ? "resumeWater" : "pauseWater"];
  toggle.disabled = reducedMotion.matches;
  byId("make-ripple").disabled = paused;
}

function makeRipple(x, y) {
  if (waterPaused || reducedMotion.matches || dialog.open) return;
  const water = document.querySelector(".water-art");
  const pulses = water.querySelectorAll(".water-pulse");
  if (pulses.length >= 8) pulses[0].remove();
  const pulse = element("span", undefined, "water-pulse");
  pulse.style.left = `${x * 100}%`;
  pulse.style.top = `${y * 100}%`;
  pulse.style.setProperty("--ripple-color", rippleCount++ % 2 === 0 ? "var(--aarna)" : "var(--mukund)");
  pulse.addEventListener("animationend", () => pulse.remove(), { once: true });
  water.append(pulse);
}

function cancelPageTurn() {
  if (!pageTurn) return;
  pageTurn.animations.forEach(animation => animation.cancel());
  pageTurn.leaf.remove();
  pageTurn = undefined;
}

function startPageTurn(paper, direction) {
  cancelPageTurn();
  if (!direction || !dialog.open || reducedMotion.matches || typeof paper.animate !== "function") return;

  const physicalDirection = direction * (locale.dir === "rtl" ? -1 : 1);
  const origin = physicalDirection > 0 ? "left center" : "right center";
  const leaf = paper.cloneNode(true);
  leaf.removeAttribute("id");
  leaf.removeAttribute("tabindex");
  leaf.removeAttribute("aria-labelledby");
  leaf.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
  leaf.setAttribute("aria-hidden", "true");
  leaf.inert = true;
  leaf.classList.add("page-turn-leaf");
  Object.assign(leaf.style, {
    left: `${paper.offsetLeft}px`,
    top: `${paper.offsetTop}px`,
    width: `${paper.offsetWidth}px`,
    height: `${paper.offsetHeight}px`,
    transformOrigin: origin,
  });
  paper.after(leaf);

  const timing = { duration: 460, easing: "cubic-bezier(.22,.65,.3,1)", fill: "both" };
  const departing = leaf.animate([
    { transform: "perspective(1600px) rotateY(0deg)", filter: "brightness(1)", opacity: 1 },
    { transform: `perspective(1600px) rotateY(${-physicalDirection * 88}deg)`, filter: "brightness(.7)", opacity: 0 },
  ], timing);
  const arriving = paper.animate([
    { transform: `perspective(1600px) rotateY(${physicalDirection * 12}deg)`, transformOrigin: origin, opacity: .65 },
    { transform: "perspective(1600px) rotateY(0deg)", transformOrigin: origin, opacity: 1 },
  ], timing);
  const turn = { leaf, animations: [departing, arriving] };
  pageTurn = turn;
  departing.onfinish = () => {
    // A later navigation may already have replaced this turn.
    if (pageTurn === turn) cancelPageTurn();
  };
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function showError(message) {
  const target = byId(dialog.open ? "reader-error" : "site-error");
  target.textContent = message;
  target.hidden = false;
}

function sections() {
  return locale.pages.filter(page => page.pageInSection === 1);
}

function sectionName(page) {
  return page.wave
    ? `${locale.labels.wave} ${new Intl.NumberFormat(locale.code).format(page.wave)} - ${page.title}`
    : page.title;
}

function pageRoute(page, code = locale.code) {
  return `${code}/${page.sectionId}/${page.pageInSection}`;
}

function navigate(index) {
  const page = locale.pages[index];
  if (page) location.hash = pageRoute(page);
}

function renderProfile(id) {
  const profile = locale.characters.profiles.find(item => item.id === id);
  const container = byId("profile-content");
  container.className = `profile-content ${profile.id}`;
  const name = element("h2", profile.name);
  name.id = "profile-name";
  const facts = element("dl", undefined, "profile-facts");
  for (const [label, value] of [
    [locale.labels.age, new Intl.NumberFormat(locale.code).format(profile.age)],
    [locale.labels.occupation, profile.occupation],
  ]) {
    facts.append(element("dt", label), element("dd", value));
  }
  const traits = element("ul", undefined, "profile-traits");
  profile.traits.forEach(trait => traits.append(element("li", trait)));
  container.replaceChildren(
    name, element("p", profile.tagline, "profile-tagline"), facts, traits,
  );
  const spoilers = element("details", undefined, "profile-spoilers");
  spoilers.append(element("summary", locale.labels.spoilerJourney));
  for (const detail of profile.sections) {
    const section = element("section");
    section.append(element("h3", detail.title));
    detail.paragraphs.forEach(text => section.append(element("p", text)));
    (detail.spoiler ? spoilers : container).append(section);
  }
  if (profile.sections.some(detail => detail.spoiler)) container.append(spoilers);
  document.querySelectorAll("[data-profile-choice]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.profileChoice === id));
  });
  container.focus({ preventScroll: true });
  profilesDialog.scrollTop = 0;
}

function openProfile(id) {
  profileOpener = document.activeElement;
  renderProfile(id);
  profilesDialog.showModal();
  document.body.classList.add("profile-open");
  updateWaterMotion();
  byId("profile-content").focus({ preventScroll: true });
}

function addPageEdges(paper) {
  for (const [side, step] of [["left", locale.dir === "rtl" ? 1 : -1], ["right", locale.dir === "rtl" ? -1 : 1]]) {
    const button = element("button", undefined, `page-edge edge-${side}`);
    button.type = "button";
    button.setAttribute("aria-label", locale.labels[step > 0 ? "edgeNext" : "edgePrevious"]);
    button.title = locale.labels[step > 0 ? "edgeNext" : "edgePrevious"];
    button.disabled = pageIndex + step < 0 || pageIndex + step >= locale.pages.length;
    const marker = element("span", side === "left" ? "\u2039" : "\u203a");
    marker.setAttribute("aria-hidden", "true");
    button.append(marker);
    button.addEventListener("click", () => navigate(pageIndex + step));
    paper.append(button);
  }
}

function openSection(id) {
  const index = locale.pages.findIndex(page => page.sectionId === id);
  if (index < 0) {
    showError(locale.labels.error);
    return;
  }
  opener = document.activeElement;
  const page = locale.pages[index];
  if (location.hash === `#${pageRoute(page)}`) openReader();
  else location.hash = pageRoute(page);
}

function openReader(direction = 0) {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("reading");
  hasRead = true;
  updateWaterMotion();
  renderPage(direction);
}

function renderPage(direction = 0) {
  clearTimeout(saveTimer);
  const page = locale.pages[pageIndex];
  const paper = byId("book-page");
  const number = new Intl.NumberFormat(locale.code);
  startPageTurn(paper, direction);
  paper.className = `paper ${page.type}-page`;
  paper.replaceChildren();
  if (page.type === "title" && locale.code === "en") {
    paper.classList.add("illustrated-cover");
    const image = element("img", undefined, "book-cover-image");
    image.src = "./Assets/cover.svg";
    image.alt = `${locale.title} - ${locale.book.subtitle}`;
    image.width = 1000;
    image.height = 1500;
    paper.append(element("h2", locale.title, "sr-only"), image);
  } else if (page.type === "title") {
    paper.append(
      element("p", locale.labels.reading, "paper-eyebrow"),
      element("h2", locale.title),
      element("p", locale.book.subtitle, "title-subtitle"),
      element("div", "", "cover-ripple"),
      element("p", locale.labels.credit, "title-credit"),
    );
  } else if (page.type === "divider") {
    paper.append(element("h2", page.title));
  } else if (page.type === "dedication") {
    paper.append(element("h2", page.title));
    if (locale.book.dedication.status === "pending") {
      paper.append(element("p", locale.labels.dedicationPending, "dedication-note"));
    } else {
      locale.book.dedication.paragraphs.forEach(text => paper.append(element("p", text)));
    }
  } else {
    paper.append(element("p", sectionName(page), "running-head"));
    if (page.pageInSection === 1) {
      if (page.wave) paper.append(element("p", `${locale.labels.wave} ${number.format(page.wave)}`, "paper-eyebrow"));
      paper.append(element("h2", page.title));
    } else {
      const heading = element("h2", page.title, "sr-only");
      paper.append(heading);
    }
    paper.append(element("p", locale.labels[page.status], "manuscript-status"));
    for (const block of page.blocks) {
      const passage = element("section", undefined, "passage");
      passage.dataset.perspective = block.perspective;
      if (block.perspective !== "together") {
        passage.append(element("h3", locale.labels[block.perspective], "voice-heading"));
      }
      block.paragraphs.forEach(text => passage.append(element("p", text)));
      paper.append(passage);
    }
    paper.append(element("p", number.format(pageIndex + 1), "folio"));
  }
  paper.querySelector("h2").id = "page-title";
  addPageEdges(paper);
  byId("contents").value = page.sectionId;
  byId("previous").disabled = pageIndex === 0;
  byId("next").disabled = pageIndex === locale.pages.length - 1;
  byId("progress").textContent = `${locale.labels.page} ${number.format(pageIndex + 1)} ${locale.labels.of} ${number.format(locale.pages.length)}`;
  document.title = `${locale.title} - ${page.title}`;
  paper.focus({ preventScroll: true });
  dialog.scrollTop = 0;
  saveReading();
  if (pendingResume) {
    const target = pendingResume;
    pendingResume = undefined;
    if (target.edition === locale && target.index === pageIndex) {
      requestAnimationFrame(() => {
        if (!dialog.open || target.edition !== locale || target.index !== pageIndex) return;
        const paragraph = paper.querySelectorAll(".passage p")[target.offset];
        if (paragraph && target.offset > 0) paragraph.scrollIntoView({ block: "start" });
        saveReading(target.offset);
      });
    }
  }
}

function renderLocale() {
  document.documentElement.lang = locale.code;
  document.documentElement.dir = locale.dir;
  document.querySelectorAll("[data-memory-label]").forEach(notice => {
    notice.textContent = locale.labels[notice.dataset.memoryLabel];
  });
  document.querySelectorAll("[data-label]").forEach(node => {
    node.textContent = locale.labels[node.dataset.label];
  });
  document.querySelectorAll("[data-aria-label]").forEach(node => {
    node.setAttribute("aria-label", locale.labels[node.dataset.ariaLabel]);
  });
  document.querySelectorAll("[data-book-title]").forEach(node => { node.textContent = locale.title; });
  byId("hero-subtitle").textContent = locale.book.subtitle;
  byId("structure-title").textContent = locale.book.openingTitle;
  byId("waves-title").textContent = locale.book.wavesTitle;
  byId("page-controls").setAttribute("aria-label", locale.labels.reading);
  byId("language").value = locale.code;
  document.querySelectorAll("[data-download-book], [data-print-book]").forEach(link => {
    link.href = `./Assets/books/ripples-${locale.code}.html`;
  });
  document.querySelectorAll("[data-download-epub]").forEach(link => {
    link.href = `./Assets/books/ripples-${locale.code}.epub`;
  });
  byId("dating-origin").textContent = locale.characters.origin.description;
  document.querySelector(".profile-switcher").setAttribute("aria-label", locale.labels.profiles);
  document.querySelectorAll(".profile-link").forEach(button => {
    button.setAttribute("aria-label", `${locale.labels.fullProfile}: ${locale.labels[button.dataset.profile]}`);
  });
  document.querySelectorAll("[data-traits]").forEach(list => {
    const profile = locale.characters.profiles.find(item => item.id === list.dataset.traits);
    list.replaceChildren(...profile.traits.map(trait => element("li", trait)));
  });
  document.querySelectorAll("[data-gesture]").forEach(node => {
    node.textContent = locale.characters.profiles.find(profile => profile.id === node.dataset.gesture).gesture;
  });
  document.querySelectorAll(".cover-preview").forEach(cover => { cover.hidden = locale.code !== "en"; });
  byId("contents").replaceChildren(...sections().map(page => {
    const option = element("option", sectionName(page));
    option.value = page.sectionId;
    return option;
  }));
  byId("opening-links").replaceChildren(...locale.opening.map(chapter => {
    const button = element("button", chapter.title, "chapter-link");
    button.setAttribute("aria-label", `${locale.labels.readSection}: ${chapter.title}`);
    button.addEventListener("click", () => openSection(chapter.id));
    return button;
  }));
  byId("waves").replaceChildren(...locale.chapters.map((chapter, index) => {
    const item = element("li");
    const button = element("button");
    button.append(
      element("span", new Intl.NumberFormat(locale.code, { minimumIntegerDigits: 2 }).format(index + 1), "wave-number"),
      element("span", chapter.title, "wave-title"),
      element("span", chapter.scene, "wave-scene"),
      element("span", locale.labels[chapter.status], "wave-status"),
    );
    button.addEventListener("click", () => openSection(chapter.id));
    item.append(button);
    return item;
  }));
  updateWaterMotion();
  updateResumeButtons();
}

function closeReader() {
  cancelPageTurn();
  if (dialog.open) {
    if (hasRead) saveReading(visibleParagraphOffset());
    dialog.close();
  }
  document.body.classList.remove("reading");
  document.title = `${locale.title} - ${locale.book.subtitle}`;
}

function readLocation() {
  const route = location.hash.slice(1);
  if (landingAnchors.has(route)) {
    closeReader();
    return;
  }
  // Older reader links remain valid; #chapter formerly targeted its main article.
  if (route === "chapter") {
    openSection("impact");
    return;
  }
  const [code, sectionId, pageNumber = "1", extra] = route.split("/");
  const targetLocale = content.find(item => item.code === code);
  const index = targetLocale?.pages.findIndex(page => page.sectionId === sectionId
    && page.pageInSection === Number(pageNumber));
  if (!targetLocale || index === undefined || index < 0 || extra !== undefined || !/^[1-9]\d*$/.test(pageNumber)) {
    showError(locale.labels.error);
    return;
  }
  const direction = dialog.open && targetLocale === locale ? Math.sign(index - pageIndex) : 0;
  locale = targetLocale;
  pageIndex = index;
  byId("reader-error").hidden = true;
  byId("site-error").hidden = true;
  renderLocale();
  openReader(direction);
}

if (!Array.isArray(content) || !content[0]?.pages?.length) {
  showError("The manuscript could not be loaded. Rebuild the site or reload the page.");
} else {
  locale = content[0];
  try {
    savedReading = decodeReadingState(localStorage.getItem(readingMemoryKey));
    if (savedReading) {
      textSize = savedReading.textSize;
      readerTheme = savedReading.theme;
      locale = content.find(item => item.code === savedReading.language) ?? content[0];
      if (savedReading.position) {
        const target = resolveReadingState(content, savedReading);
        if (target.moved) memoryNotice("memoryMoved");
        if (location.hash === `#${pageRoute(target.edition.pages[target.index], target.edition.code)}`) pendingResume = target;
      }
    }
  } catch (error) {
    memoryDisabled = true;
    savedReading = null;
    memoryNotice("memoryError", error);
  }
  applyReaderPreferences();
  byId("language").replaceChildren(...content.map(item => {
    const option = element("option", item.name);
    option.value = item.code;
    option.lang = item.code;
    return option;
  }));
  byId("language").disabled = content.length === 1;
  document.querySelectorAll("[data-open]").forEach(button => {
    button.disabled = false;
    button.addEventListener("click", () => {
      if (button.dataset.open === "title" && !button.classList.contains("cover-preview") && savedReading?.position) resumeReading();
      else openSection(button.dataset.open);
    });
  });
  document.querySelectorAll("[data-start-again]").forEach(button => {
    button.addEventListener("click", () => { pendingResume = undefined; openSection("title"); });
  });
  byId("reader-theme").addEventListener("change", event => {
    cancelPageTurn();
    readerTheme = event.target.value;
    applyReaderPreferences();
    saveReading(visibleParagraphOffset());
  });
  for (const id of ["reading-settings", "keep-book"]) {
    byId(id).addEventListener("toggle", () => {
      if (byId(id).open) byId(id === "reading-settings" ? "keep-book" : "reading-settings").open = false;
    });
  }
  dialog.addEventListener("scroll", () => {
    clearTimeout(saveTimer);
    if (dialog.open) saveTimer = setTimeout(() => saveReading(visibleParagraphOffset()), 150);
  });
  document.querySelectorAll("[data-profile]").forEach(button => {
    button.disabled = false;
    button.addEventListener("click", () => openProfile(button.dataset.profile));
  });
  document.querySelectorAll("[data-profile-choice]").forEach(button => {
    button.addEventListener("click", () => renderProfile(button.dataset.profileChoice));
  });
  byId("close-profiles").addEventListener("click", () => profilesDialog.close());
  profilesDialog.addEventListener("close", () => {
    document.body.classList.remove("profile-open");
    updateWaterMotion();
    if (profileOpener?.isConnected) profileOpener.focus({ preventScroll: true });
  });
  byId("contents").addEventListener("change", event => openSection(event.target.value));
  byId("language").addEventListener("change", event => {
    const current = locale.pages[pageIndex];
    const target = content.find(item => item.code === event.target.value);
    // Translations can paginate differently; keep the section, start at its first page.
    const page = target.pages.find(item => item.sectionId === current.sectionId);
    location.hash = pageRoute(page, target.code);
  });
  byId("previous").addEventListener("click", () => navigate(pageIndex - 1));
  byId("next").addEventListener("click", () => navigate(pageIndex + 1));
  byId("close-book").addEventListener("click", () => {
    saveReading(visibleParagraphOffset());
    dialog.close();
  });
  dialog.addEventListener("cancel", () => saveReading(visibleParagraphOffset()));
  dialog.addEventListener("close", () => {
    clearTimeout(saveTimer);
    cancelPageTurn();
    document.body.classList.remove("reading");
    updateWaterMotion();
    if (!landingAnchors.has(location.hash.slice(1))) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    document.title = `${locale.title} - ${locale.book.subtitle}`;
    const returnTarget = opener?.isConnected && !dialog.contains(opener)
      ? opener : document.querySelector("[data-open]");
    returnTarget.focus({ preventScroll: true });
  });
  dialog.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        || event.target.closest("select, input, textarea, [contenteditable]")) return;
    const forward = locale.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const backward = locale.dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward || event.key === backward) {
      event.preventDefault();
      navigate(pageIndex + (event.key === forward ? 1 : -1));
    }
  });
  for (const [id, delta] of [["smaller", -1], ["larger", 1]]) {
    byId(id).addEventListener("click", () => {
      cancelPageTurn();
      textSize = Math.max(16, Math.min(24, textSize + delta));
      applyReaderPreferences();
      saveReading(visibleParagraphOffset());
    });
  }
  window.addEventListener("hashchange", readLocation);
  window.addEventListener("resize", cancelPageTurn);
  window.addEventListener("pagehide", () => {
    if (dialog.open) saveReading(visibleParagraphOffset());
  });
  reducedMotion.addEventListener("change", () => {
    cancelPageTurn();
    updateWaterMotion();
  });
  byId("toggle-water").addEventListener("click", () => {
    waterPaused = !waterPaused;
    updateWaterMotion();
  });
  byId("make-ripple").addEventListener("click", () => makeRipple(.6 + Math.random() * .3, .35 + Math.random() * .35));
  const hero = document.querySelector(".hero");
  hero.addEventListener("click", event => {
    if (event.target.closest("button, a, select")) return;
    const bounds = hero.getBoundingClientRect();
    makeRipple((event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height);
  });
  document.addEventListener("visibilitychange", updateWaterMotion);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      waterVisible = entry.isIntersecting;
      updateWaterMotion();
    });
    observer.observe(hero);
  }
  renderLocale();
  readLocation();
}
