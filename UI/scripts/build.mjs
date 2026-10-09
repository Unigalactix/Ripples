import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const uiRoot = fileURLToPath(new URL("..", import.meta.url));
const chapterIds = ["impact", "first-ripple", "crest", "trough", "still-water"];
const labelKeys = [
  "subtitle", "status", "language", "map", "wave", "perspective", "both",
  "aarna", "mukund", "previous", "next", "skip", "credit", "error",
];

function requireText(value, location) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${location} must contain nonempty text.`);
  }
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
    const files = (await readdir(folder)).filter(file => file.endsWith(".json")).sort();
    if (files.length !== chapterIds.length) {
      throw new Error(`${locale.code} must contain exactly five chapter JSON files.`);
    }
    const chapters = [];
    for (const [index, file] of files.entries()) {
      const chapter = JSON.parse(await readFile(path.join(folder, file), "utf8"));
      if (chapter?.id !== chapterIds[index]) {
        throw new Error(`${locale.code}/${file} must use chapter ID ${chapterIds[index]}.`);
      }
      for (const key of ["title", "scene"]) {
        requireText(chapter[key], `${file}.${key}`);
      }
      for (const key of ["together", "aarna", "mukund"]) {
        if (!Array.isArray(chapter[key]) || chapter[key].length === 0) {
          throw new Error(`${file}.${key} must contain paragraphs.`);
        }
        chapter[key].forEach(text => requireText(text, `${file}.${key}`));
      }
      chapters.push(chapter);
    }
    result.push({ ...locale, chapters });
  }
  return result;
}

export async function build({
  storyRoot = path.resolve(uiRoot, "..", "STORY"),
  outputRoot = path.join(uiRoot, "dist"),
} = {}) {
  const story = await loadStory(storyRoot);
  await mkdir(outputRoot, { recursive: true });
  for (const file of ["index.html", "styles.css", "app.js"]) {
    await copyFile(path.join(uiRoot, "src", file), path.join(outputRoot, file));
  }
  await writeFile(
    path.join(outputRoot, "content.js"),
    `globalThis.RIPPLES_CONTENT = ${JSON.stringify(story, null, 2)};\n`,
    "utf8",
  );
  await writeFile(path.join(outputRoot, ".nojekyll"), "", "utf8");
  return story;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const story = await build();
  console.log(`Built ${story.length} language(s), five chapters each, in UI\\dist.`);
}
