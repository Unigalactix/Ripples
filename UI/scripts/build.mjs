import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderBookEdition } from "./export-book.mjs";
import { renderEpub } from "./export-epub.mjs";
import { loadBookFonts } from "./book-fonts.mjs";

const uiRoot = fileURLToPath(new URL("..", import.meta.url));
const chapterIds = ["impact", "first-ripple", "crest", "trough", "still-water"];
const openingIds = ["before", "pebble"];
const labelKeys = [
  "subtitle", "status", "language", "wave", "aarna", "mukund", "together",
  "previous", "next", "skip", "credit", "error", "read", "explore", "home",
  "close", "contents", "page", "of", "titlePage", "dedication", "dedicationPending",
  "draft", "outline", "pending", "smaller", "larger", "reading", "hint",
  "premiseLabel", "premiseTitle", "premise", "characters", "aarnaRole",
  "aarnaDescription", "mukundRole", "mukundDescription", "structure",
  "openingDescription", "wavesDescription", "readSection", "edition",
  "waterHint", "makeRipple", "pauseWater", "resumeWater", "reducedWater",
  "downloadBook", "printBook", "downloadCover", "downloadHint", "cover", "exportError",
  "downloadEpub", "profiles", "fullProfile", "closeProfile", "profileNote", "howTheyMet",
  "age", "occupation", "edgePrevious", "edgeNext",
  "siteNav", "navStory", "navPeople", "navWaves", "navBook", "heroEyebrow",
  "heroThought", "heroDescription", "waterCaption", "measureDay", "measurePeople",
  "measureWaves", "premiseDeck", "aarnaNeed", "mukundNeed", "peopleDeck",
  "aarnaArt", "mukundArt", "originTitle", "editionDeck",
  "continueReading", "startAgain", "readingSettings", "keepBook", "readerTheme",
  "paperTheme", "nightTheme", "textSize", "memoryHint", "memoryError", "memoryMoved", "spoilerJourney",
];

function requireText(value, location) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${location} must contain nonempty text.`);
  }
}

function requireParagraphs(value, location) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${location} must contain paragraphs.`);
  }
  value.forEach(text => requireText(text, location));
}

async function loadChapters(folder, ids) {
  const files = (await readdir(folder)).filter(file => /^\d.*\.json$/.test(file)).sort();
  if (files.length !== ids.length) {
    throw new Error(`${folder} must contain exactly ${ids.length} numbered chapter JSON files.`);
  }
  const chapters = [];
  for (const [index, file] of files.entries()) {
    const chapter = JSON.parse(await readFile(path.join(folder, file), "utf8"));
    if (chapter?.id !== ids[index]) {
      throw new Error(`${file} must use chapter ID ${ids[index]}.`);
    }
    for (const key of ["title", "scene"]) requireText(chapter[key], `${file}.${key}`);
    if (!["draft", "outline"].includes(chapter.status)) {
      throw new Error(`${file}.status must be draft or outline.`);
    }
    if (chapter.status === "draft") {
      if (!Array.isArray(chapter.manuscript) || chapter.manuscript.length === 0) {
        throw new Error(`${file}.manuscript must contain prose blocks.`);
      }
      for (const block of chapter.manuscript) {
        if (!block || !["together", "aarna", "mukund"].includes(block.perspective)) {
          throw new Error(`${file} contains an invalid perspective.`);
        }
        requireParagraphs(block.paragraphs, `${file}.manuscript.paragraphs`);
      }
    } else {
      for (const key of ["together", "aarna", "mukund"]) {
        requireParagraphs(chapter[key], `${file}.${key}`);
      }
    }
    chapters.push(chapter);
  }
  return chapters;
}

export function paginateBlocks(blocks, wordLimit = 220) {
  const pages = [];
  let page = [];
  let words = 0;
  let paragraphs = 0;
  for (const block of blocks) {
    for (const paragraph of block.paragraphs) {
      const count = paragraph.trim().split(/\s+/u).length;
      // Preserve paragraph boundaries; pages grow rather than clipping long text.
      if (page.length && (words + count > wordLimit || paragraphs >= 7)) {
        pages.push(page);
        page = [];
        words = 0;
        paragraphs = 0;
      }
      const last = page.at(-1);
      if (last?.perspective === block.perspective) {
        last.paragraphs.push(paragraph);
      } else {
        page.push({ perspective: block.perspective, paragraphs: [paragraph] });
      }
      words += count;
      paragraphs += 1;
    }
  }
  if (page.length) pages.push(page);
  return pages;
}

export function createPages(locale) {
  const sections = [
    { id: "title", title: locale.labels.titlePage, type: "title" },
    { id: "dedication", title: locale.labels.dedication, type: "dedication", status: locale.book.dedication.status },
    { id: "waters-edge", title: locale.book.openingTitle, type: "divider" },
    ...locale.opening.map(chapter => ({ ...chapter, type: "chapter" })),
    { id: "ripples-begin", title: locale.book.wavesTitle, type: "divider" },
    ...locale.chapters.map((chapter, index) => ({ ...chapter, type: "chapter", wave: index + 1 })),
  ];
  return sections.flatMap(section => {
    const blocks = section.type !== "chapter" ? [] : section.status === "draft"
      ? section.manuscript
      : ["together", "aarna", "mukund"].map(perspective => ({
        perspective, paragraphs: section[perspective],
      }));
    const pages = blocks.length ? paginateBlocks(blocks) : [[]];
    return pages.map((pageBlocks, index) => ({
      sectionId: section.id,
      title: section.title,
      type: section.type,
      status: section.status ?? null,
      wave: section.wave ?? null,
      pageInSection: index + 1,
      blocks: pageBlocks,
    }));
  });
}

export async function loadStory(storyRoot) {
  const locales = JSON.parse(await readFile(path.join(storyRoot, "locales.json"), "utf8"));
  if (!Array.isArray(locales) || locales.length === 0) {
    throw new Error("locales.json must contain at least one language.");
  }
  const seen = new Set();
  const result = [];
  for (const locale of locales) {
    if (!locale || typeof locale !== "object"
        || typeof locale.code !== "string"
        || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(locale.code)
        || seen.has(locale.code.toLowerCase())) {
      throw new Error("Each locale must have a unique, path-safe language tag.");
    }
    // Reject tags that look path-safe but are not valid language identifiers.
    Intl.getCanonicalLocales(locale.code);
    seen.add(locale.code.toLowerCase());
    requireText(locale.name, `${locale.code}.name`);
    requireText(locale.title, `${locale.code}.title`);
    if (!["ltr", "rtl"].includes(locale.dir)) {
      throw new Error(`${locale.code}.dir must be ltr or rtl.`);
    }
    for (const key of labelKeys) {
      requireText(locale.labels?.[key], `${locale.code}.labels.${key}`);
    }
    const folder = path.join(storyRoot, locale.code);
    const book = JSON.parse(await readFile(path.join(folder, "book.json"), "utf8"));
    for (const key of ["subtitle", "openingTitle", "wavesTitle"]) {
      requireText(book?.[key], `${locale.code}.book.${key}`);
    }
    if (!["pending", "draft"].includes(book.dedication?.status)
        || !Array.isArray(book.dedication.paragraphs)) {
      throw new Error(`${locale.code}.book.dedication must have a status and paragraphs.`);
    }
    if (book.dedication.status === "draft") {
      requireParagraphs(book.dedication.paragraphs, `${locale.code}.book.dedication`);
    } else if (book.dedication.paragraphs.length) {
      throw new Error(`${locale.code}.book.dedication cannot be pending with text.`);
    }
    const chapters = await loadChapters(folder, chapterIds);
    const opening = await loadChapters(path.join(folder, "opening"), openingIds);
    const characters = JSON.parse(await readFile(path.join(folder, "characters.json"), "utf8"));
    requireText(characters?.origin?.name, `${locale.code}.characters.origin.name`);
    requireText(characters?.origin?.description, `${locale.code}.characters.origin.description`);
    if (!Array.isArray(characters.profiles) || characters.profiles.length !== 2) {
      throw new Error(`${locale.code}.characters must contain both profiles.`);
    }
    for (const [index, profile] of characters.profiles.entries()) {
      if (profile?.id !== ["aarna", "mukund"][index]
          || profile.age !== [28, 27][index]) {
        throw new Error(`${locale.code}.characters profile ID or age does not match the story.`);
      }
      for (const key of ["name", "occupation", "tagline", "gesture"]) requireText(profile[key], `characters.${profile.id}.${key}`);
      requireParagraphs(profile.traits, `characters.${profile.id}.traits`);
      if (!Array.isArray(profile.sections) || profile.sections.length === 0) {
        throw new Error(`characters.${profile.id}.sections must contain profile details.`);
      }
      for (const section of profile.sections) {
        if (typeof section?.spoiler !== "boolean") throw new Error(`characters.${profile.id}.section.spoiler must be boolean.`);
        requireText(section?.title, `characters.${profile.id}.section.title`);
        requireParagraphs(section.paragraphs, `characters.${profile.id}.section.paragraphs`);
      }
    }
    const complete = { ...locale, book, chapters, opening, characters };
    result.push({ ...complete, pages: createPages(complete) });
  }
  return result;
}

export async function build({
  storyRoot = path.resolve(uiRoot, "..", "STORY"),
  outputRoot = path.join(uiRoot, "dist"),
  writeRootContent = false,
} = {}) {
  const story = await loadStory(storyRoot);
  const assetsRoot = path.resolve(uiRoot, "..", "Assets");
  const coverSvg = await readFile(path.join(assetsRoot, "cover.svg"), "utf8");
  const faviconSvg = await readFile(path.join(assetsRoot, "favicon.svg"), "utf8");
  const fonts = await loadBookFonts();
  await mkdir(path.join(outputRoot, "UI", "src"), { recursive: true });
  await mkdir(path.join(outputRoot, "Assets", "books"), { recursive: true });
  for (const asset of ["cover.svg", "favicon.svg", "water-surface.svg", "aarna-study.svg", "mukund-study.svg"]) {
    await copyFile(path.join(assetsRoot, asset), path.join(outputRoot, "Assets", asset));
  }
  if (writeRootContent) await mkdir(path.join(assetsRoot, "books"), { recursive: true });
  const fontDestinations = [path.join(outputRoot, "Assets", "fonts")];
  if (writeRootContent) fontDestinations.push(path.join(assetsRoot, "fonts"));
  for (const folder of fontDestinations) {
    await mkdir(folder, { recursive: true });
    for (const face of fonts.faces) await writeFile(path.join(folder, face.name), face.bytes);
    await writeFile(path.join(folder, "OFL.txt"), fonts.license, "utf8");
  }
  for (const locale of story) {
    const edition = renderBookEdition(locale, coverSvg, faviconSvg, fonts);
    const name = `ripples-${locale.code}.html`;
    await writeFile(path.join(outputRoot, "Assets", "books", name), edition, "utf8");
    if (writeRootContent) await writeFile(path.join(assetsRoot, "books", name), edition, "utf8");
    const epub = renderEpub(locale, coverSvg, fonts);
    const epubName = `ripples-${locale.code}.epub`;
    await writeFile(path.join(outputRoot, "Assets", "books", epubName), epub);
    if (writeRootContent) await writeFile(path.join(assetsRoot, "books", epubName), epub);
  }
  // Remove only known assets from the former flat deployment layout.
  await Promise.all(["app.js", "styles.css", "content.js"].map(file =>
    rm(path.join(outputRoot, file), { force: true })));
  await copyFile(path.resolve(uiRoot, "..", "index.html"), path.join(outputRoot, "index.html"));
  for (const file of ["styles.css", "app.js"]) {
    await copyFile(path.join(uiRoot, "src", file), path.join(outputRoot, "UI", "src", file));
  }
  const payload = `globalThis.RIPPLES_CONTENT = ${JSON.stringify(story, null, 2)};\n`;
  await writeFile(
    path.join(outputRoot, "UI", "content.js"),
    payload,
    "utf8",
  );
  if (writeRootContent) await writeFile(path.join(uiRoot, "content.js"), payload, "utf8");
  await writeFile(path.join(outputRoot, ".nojekyll"), "", "utf8");
  return story;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const story = await build({ writeRootContent: true });
  console.log(`Built ${story.length} language(s), opening and five waves, in UI\\dist.`);
}
