const content = globalThis.RIPPLES_CONTENT;
const byId = id => document.getElementById(id);
let locale;
let chapterIndex = 0;

function paragraphs(container, texts) {
  container.replaceChildren(...texts.map(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }));
}

function showError(message) {
  byId("error").textContent = message;
  byId("error").hidden = false;
}

function renderPerspectives() {
  const chapter = locale.chapters[chapterIndex];
  const selected = byId("perspective").value;
  const people = selected === "both" ? ["aarna", "mukund"] : [selected];
  byId("perspectives").replaceChildren(...people.map(person => {
    const section = document.createElement("section");
    section.className = `voice ${person}`;
    const heading = document.createElement("h3");
    heading.textContent = locale.labels[person];
    const body = document.createElement("div");
    paragraphs(body, chapter[person]);
    section.append(heading, body);
    return section;
  }));
}

function navigate(index) {
  location.hash = `${locale.code}/${locale.chapters[index].id}`;
}

function render() {
  const chapter = locale.chapters[chapterIndex];
  document.documentElement.lang = locale.code;
  document.documentElement.dir = locale.dir;
  document.title = `${locale.title} - ${chapter.title}`;
  byId("book-title").textContent = locale.title;
  document.querySelectorAll("[data-label]").forEach(element => {
    element.textContent = locale.labels[element.dataset.label];
  });
  byId("language").value = locale.code;
  byId("waves").replaceChildren(...locale.chapters.map((item, index) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${locale.code}/${item.id}`;
    if (index === chapterIndex) link.setAttribute("aria-current", "step");
    const number = document.createElement("span");
    number.className = "wave-circle";
    number.textContent = new Intl.NumberFormat(locale.code).format(index + 1);
    const title = document.createElement("span");
    title.textContent = item.title;
    const scene = document.createElement("small");
    scene.textContent = item.scene;
    link.append(number, title, scene);
    li.append(link);
    return li;
  }));
  const number = new Intl.NumberFormat(locale.code);
  byId("wave-number").textContent = `${locale.labels.wave} ${number.format(chapterIndex + 1)}`;
  byId("chapter-title").textContent = chapter.title;
  byId("scene").textContent = chapter.scene;
  paragraphs(byId("shared"), chapter.together);
  renderPerspectives();
  byId("progress").textContent = `${number.format(chapterIndex + 1)} / ${number.format(locale.chapters.length)}`;
  byId("previous").disabled = chapterIndex === 0;
  byId("next").disabled = chapterIndex === locale.chapters.length - 1;
}

function readLocation(focus = false) {
  // The skip link is an in-page focus target, not a chapter route.
  if (location.hash === "#chapter") {
    byId("chapter").focus();
    return;
  }
  const route = location.hash.slice(1);
  const [languageCode, chapterId, extra] = route.split("/");
  const targetLocale = route ? content.find(item => item.code === languageCode) : content[0];
  const targetIndex = route
    ? targetLocale?.chapters.findIndex(item => item.id === chapterId)
    : 0;
  if (!targetLocale || targetIndex === undefined || targetIndex < 0 || extra !== undefined) {
    showError(locale.labels.error);
    return;
  }
  locale = targetLocale;
  chapterIndex = targetIndex;
  byId("error").hidden = true;
  render();
  if (focus) byId("chapter").focus();
}

if (!Array.isArray(content) || content.length === 0) {
  showError("The story content could not be loaded. Rebuild the site or reload the page.");
} else {
  locale = content[0];
  byId("language").replaceChildren(...content.map(item => {
    const option = document.createElement("option");
    option.value = item.code;
    option.lang = item.code;
    option.textContent = item.name;
    return option;
  }));
  byId("language").disabled = content.length === 1;
  byId("language").addEventListener("change", event => {
    location.hash = `${event.target.value}/${locale.chapters[chapterIndex].id}`;
  });
  byId("perspective").addEventListener("change", renderPerspectives);
  byId("previous").addEventListener("click", () => navigate(chapterIndex - 1));
  byId("next").addEventListener("click", () => navigate(chapterIndex + 1));
  window.addEventListener("hashchange", () => readLocation(true));
  render();
  readLocation();
}
