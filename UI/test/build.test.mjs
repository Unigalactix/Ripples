import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { build, loadStory, paginateBlocks } from "../scripts/build.mjs";

const storyRoot = fileURLToPath(new URL("../../STORY/", import.meta.url));
const sectionIds = [
  "title", "dedication", "waters-edge", "before", "pebble", "ripples-begin",
  "impact", "first-ripple", "crest", "trough", "still-water",
];

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ripples-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(storyRoot, root, { recursive: true });
  return root;
}

test("approved book sequence, names and stand-alone divider pages", async () => {
  const [english] = await loadStory(storyRoot);
  assert.deepEqual(english.pages.filter(page => page.pageInSection === 1).map(page => page.sectionId), sectionIds);
  assert.deepEqual(english.chapters.map(chapter => chapter.title), [
    "The First Ripple", "Crosscurrents", "The Crest", "The Trough", "Still Water",
  ]);
  assert.equal(english.book.subtitle, "A Rajesh Kodaganti's Unavailability");
  assert.equal(english.book.openingTitle, "At the Water's Edge");
  assert.equal(english.book.wavesTitle, "The Ripples Begin");
  assert.deepEqual(english.pages.slice(0, 3).map(page => page.type), ["title", "dedication", "divider"]);
  for (const id of ["title", "dedication", "waters-edge", "ripples-begin"]) {
    assert.equal(english.pages.filter(page => page.sectionId === id).length, 1);
  }
  assert.equal(english.book.dedication.status, "pending");
  assert.deepEqual(english.book.dedication.paragraphs, []);
});

test("all seven story sections contain substantial first-draft prose without pagination loss", async () => {
  const [english] = await loadStory(storyRoot);
  for (const chapter of [...english.opening, ...english.chapters]) {
    assert.equal(chapter.status, "draft");
    const paragraphs = chapter.manuscript.flatMap(block => block.paragraphs);
    assert.ok(paragraphs.join(" ").split(/\s+/).length > 300, `${chapter.title} needs substantive prose`);
    const displayed = english.pages.filter(page => page.sectionId === chapter.id)
      .flatMap(page => page.blocks.flatMap(block => block.paragraphs));
    assert.deepEqual(displayed, paragraphs, "Pagination must not omit, repeat, or reorder prose.");
  }
  assert.deepEqual(english.chapters.map(chapter => chapter.status), Array(5).fill("draft"));
  assert.match(english.labels.status, /Complete first draft/);
  assert.deepEqual([...new Set(english.chapters[0].manuscript.map(block => block.perspective))], ["mukund", "aarna"]);
});

test("pagination preserves paragraph boundaries, long paragraphs, and perspective order", () => {
  const blocks = [
    { perspective: "aarna", paragraphs: ["one two three", "four five six"] },
    { perspective: "mukund", paragraphs: ["seven eight nine ten eleven twelve"] },
  ];
  const pages = paginateBlocks(blocks, 5);
  assert.equal(pages.length, 3);
  assert.deepEqual(pages.flatMap(page => page.flatMap(block => block.paragraphs)), blocks.flatMap(block => block.paragraphs));
  assert.equal(pages[2][0].perspective, "mukund");
  const dialogue = paginateBlocks([{ perspective: "aarna", paragraphs: Array(15).fill("Yes.") }]);
  assert.deepEqual(dialogue.map(page => page[0].paragraphs.length), [7, 7, 1]);
});

test("static artifact has a root index with working relative assets and usable content", async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ripples-build-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const file of ["app.js", "styles.css", "content.js"]) {
    await writeFile(path.join(root, file), "obsolete flat-layout asset");
  }
  const story = await build({ outputRoot: root });
  assert.deepEqual((await readdir(root)).sort(), [".nojekyll", "Assets", "UI", "index.html"]);
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const sourceHtml = await readFile(fileURLToPath(new URL("../../index.html", import.meta.url)), "utf8");
  assert.equal(html, sourceHtml, "Root publishing and artifact publishing must use the same page.");
  assert.ok(!/(?:src|href)="\/[^/]/.test(html), "Assets must not assume domain-root hosting.");
  for (const asset of ["UI/src/styles.css", "UI/content.js", "UI/src/app.js"]) {
    assert.ok(html.includes(`="./${asset}"`));
    assert.ok((await readFile(path.join(root, ...asset.split("/")), "utf8")).length);
  }
  const context = vm.createContext({});
  vm.runInContext(await readFile(path.join(root, "UI", "content.js"), "utf8"), context);
  assert.equal(JSON.stringify(context.RIPPLES_CONTENT), JSON.stringify(story));
  assert.ok(html.includes('<dialog id="book"'));
  assert.ok(html.includes('href="./Assets/favicon.svg"'));
  for (const asset of ["cover.svg", "favicon.svg", path.join("books", "ripples-en.html"), path.join("books", "ripples-en.epub")]) {
    assert.ok((await readFile(path.join(root, "Assets", asset), "utf8")).length);
  }
});

test("character profiles preserve approved ages, both perspectives and B(L)IND origin", async () => {
  const [locale] = await loadStory(storyRoot);
  assert.equal(locale.characters.origin.name, "B(L)IND");
  assert.match(locale.characters.origin.description, /random/i);
  assert.deepEqual(locale.characters.profiles.map(profile => [profile.id, profile.age]), [["aarna", 28], ["mukund", 27]]);
  for (const profile of locale.characters.profiles) {
    assert.ok(profile.sections.length >= 5);
    assert.ok(profile.sections.some(section => section.paragraphs.some(text => text.includes("B(L)IND"))));
  }
  assert.ok(locale.opening[0].manuscript.some(block => block.paragraphs.some(text => text.includes("B(L)IND"))));
});

test("cover uses the author's subtitle as its only visible author credit", async () => {
  const svg = await readFile(new URL("../../Assets/cover.svg", import.meta.url), "utf8");
  const lettering = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(match => match[1]).join(" ");
  assert.equal((lettering.match(/Rajesh Kodaganti/gi) ?? []).length, 1);
  assert.ok(lettering.includes("A Rajesh Kodaganti's Unavailability"));
});

test("additional locale preserves Unicode, direction and section IDs", async t => {
  const root = await fixture(t);
  const locales = JSON.parse(await readFile(path.join(root, "locales.json"), "utf8"));
  // This synthetic locale is a test fixture, never a published translation.
  locales.push({ ...locales[0], code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", dir: "rtl" });
  await cp(path.join(root, "en"), path.join(root, "ar"), { recursive: true });
  await writeFile(path.join(root, "locales.json"), JSON.stringify(locales));
  const story = await loadStory(root);
  assert.equal(story[1].name, "\u0627\u0644\u0639\u0631\u0628\u064a\u0629");
  assert.equal(story[1].dir, "rtl");
  assert.deepEqual(story[1].pages.map(page => page.sectionId), story[0].pages.map(page => page.sectionId));
});

test("missing chapters, opening sections and labels fail explicitly", async t => {
  const root = await fixture(t);
  const chapterPath = path.join(root, "en", "03-crest.json");
  const chapter = await readFile(chapterPath);
  await rm(chapterPath);
  await assert.rejects(loadStory(root), /exactly 5/);
  await writeFile(chapterPath, chapter);
  const openingPath = path.join(root, "en", "opening", "00-before.json");
  const opening = await readFile(openingPath);
  await rm(openingPath);
  await assert.rejects(loadStory(root), /exactly 2/);
  await writeFile(openingPath, opening);
  const locales = JSON.parse(await readFile(path.join(root, "locales.json"), "utf8"));
  delete locales[0].labels.next;
  await writeFile(path.join(root, "locales.json"), JSON.stringify(locales));
  await assert.rejects(loadStory(root), /en.labels.next/);
});

test("invalid prose, IDs, and unsafe language tags are rejected", async t => {
  const root = await fixture(t);
  const file = path.join(root, "en", "01-first-ripple.json");
  const chapter = JSON.parse(await readFile(file, "utf8"));
  chapter.manuscript[0].paragraphs = [];
  await writeFile(file, JSON.stringify(chapter));
  await assert.rejects(loadStory(root), /must contain paragraphs/);
  chapter.id = "wrong";
  await writeFile(file, JSON.stringify(chapter));
  await assert.rejects(loadStory(root), /chapter ID impact/);
  await writeFile(path.join(root, "locales.json"), JSON.stringify([{ code: "../en" }]));
  await assert.rejects(loadStory(root), /path-safe/);
});
