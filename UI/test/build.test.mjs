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
  assert.equal(english.book.dedication.status, "draft");
  assert.deepEqual(english.book.dedication.paragraphs, [
    "To every pebble I have faced in my life and every ripple I have managed. To the still water that follows every ripple, and to the pebbles that will create ripples in the days to come.",
    "This book is dedicated to you all.",
  ]);
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
  for (const asset of ["cover.svg", "favicon.svg", "water-surface.svg", "aarna-study.svg", "mukund-study.svg", path.join("books", "ripples-en.html"), path.join("books", "ripples-en.epub")]) {
    assert.ok((await readFile(path.join(root, "Assets", asset), "utf8")).length);
  }
});

test("landing navigation targets exist and every new label is localized", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  const story = await loadStory(storyRoot);
  for (const [, label] of html.matchAll(/data-(?:aria-)?label="([^"]+)"/g)) {
    for (const locale of story) assert.equal(typeof locale.labels[label], "string", `${locale.code}: ${label}`);
  }
  const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)[0];
  const links = [...nav.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(links, ["premise", "people", "chapters", "edition"]);
  for (const id of links) assert.ok(html.includes(`id="${id}"`));
});

test("character profiles preserve approved ages, both perspectives and B(L)IND origin", async () => {
  const [locale] = await loadStory(storyRoot);
  assert.equal(locale.characters.origin.name, "B(L)IND");
  assert.match(locale.characters.origin.description, /random/i);
  assert.deepEqual(locale.characters.profiles.map(profile => [profile.id, profile.age]), [["aarna", 28], ["mukund", 27]]);
  for (const profile of locale.characters.profiles) {
    assert.ok(profile.sections.length >= 5);
    assert.equal(typeof profile.gesture, "string");
    assert.ok(profile.sections.some(section => section.spoiler));
    assert.ok(profile.sections.some(section => !section.spoiler));
    assert.ok(profile.sections.some(section => section.paragraphs.some(text => text.includes("B(L)IND"))));
  }
  assert.ok(locale.opening[0].manuscript.some(block => block.paragraphs.some(text => text.includes("B(L)IND"))));
});

test("weekend revision keeps the painting and mutual commitment without erasing either loss", async () => {
  const [locale] = await loadStory(storyRoot);
  const prose = chapter => chapter.manuscript.flatMap(block => block.paragraphs).join("\n");
  for (const chapter of [locale.opening[0], locale.opening[1], locale.chapters[2]]) {
    assert.ok(prose(chapter).includes("Room Enough"));
  }
  assert.ok(prose(locale.opening[0]).includes("old film song"));
  assert.ok(prose(locale.opening[0]).includes("three answers"));
  assert.ok(prose(locale.chapters[2]).includes("Maybe I'm not the person you need"));
  const ending = prose(locale.chapters[4]);
  assert.ok(!ending.includes("choosing you while we learn"));
  assert.ok(ending.includes("I don't want yesterday to disappear because we got scared about something else."));
  assert.ok(ending.includes("The show still hurts."));
  assert.ok(ending.includes("We're okay."));
  assert.ok(ending.includes("I'll ask before I start making calls."));
  assert.ok(ending.endsWith("They stayed there in the quiet hospital lobby, holding each other."));
  assert.ok(ending.indexOf("His mother was doing well after treatment") < ending.indexOf("Are we okay?"));
});

test("Friday-to-Saturday timeline includes shared home, dinner, walking and Saturday travel", async () => {
  const [locale] = await loadStory(storyRoot);
  const prose = chapter => chapter.manuscript.flatMap(block => block.paragraphs).join("\n");
  const before = prose(locale.opening[0]);
  assert.ok(before.startsWith("At six on Friday evening"));
  for (const detail of ["three bedrooms", "during their second year", "Chicago River", "own workspace"]) {
    const variants = detail === "own workspace" ? ["their workspaces"] : [detail];
    assert.ok(variants.some(value => before.includes(value)), `Missing shared-home detail: ${detail}`);
  }
  for (const detail of ["each had a car", "For a year", "mostly ate out", "weekends", "Hindi, English, Telugu", "earbud"]) {
    assert.ok(before.includes(detail), `Missing routine: ${detail}`);
  }
  const dinner = prose(locale.chapters[0]);
  assert.ok(dinner.includes("We can walk."));
  assert.ok(dinner.includes("small place a few blocks away"));
  assert.ok(prose(locale.chapters[1]).startsWith("They walked home beside the river."));
  assert.ok(prose(locale.chapters[2]).includes("At ten-forty"));
  const flight = prose(locale.chapters[3]);
  assert.ok(flight.includes("Before dawn on Saturday"));
  assert.ok(flight.includes("in her car"));
  assert.ok(flight.includes("His remained in the apartment garage"));
  assert.ok(flight.includes("On the flight to San Jose"));
  assert.ok(flight.includes("I don't want to pretend it didn't happen."));
  assert.ok(prose(locale.chapters[4]).includes("At nine-thirty on Saturday night, California time"));
  assert.match(locale.labels.subtitle, /weekend/i);
  assert.ok(!/one day/i.test(locale.labels.subtitle));
});

test("brother reports mild heart attack and good news precedes the lobby resolution", async () => {
  const [locale] = await loadStory(storyRoot);
  const text = locale.chapters.flatMap(chapter => chapter.manuscript.flatMap(block => block.paragraphs)).join("\n");
  assert.ok(text.includes("Mom's had a mild heart attack"));
  assert.ok(text.includes("his brother said"));
  assert.ok(text.includes("I'm with her."));
  assert.ok(text.includes("stable for now"));
  assert.ok(text.includes("continue monitoring her"));
  assert.ok(text.includes("His mother was doing well after treatment for the mild heart attack"));
  assert.ok(!/\b(minor heart stroke|minor stroke|fully recovered)\b/i.test(text));
  for (const profile of locale.characters.profiles) {
    const publicText = profile.sections.filter(section => !section.spoiler).flatMap(section => section.paragraphs).join("\n");
    assert.ok(!/\b(hospital|hospitalized|diagnosis|flight)\b/i.test(publicText), "Health turn should not appear in spoiler-free profile.");
    assert.ok(profile.sections.filter(section => section.spoiler).some(section =>
      section.paragraphs.some(paragraph => /hospital/i.test(paragraph))));
  }
});

test("Chicago and the supplied family histories remain correctly assigned", async () => {
  const [locale] = await loadStory(storyRoot);
  const profileText = id => locale.characters.profiles.find(profile => profile.id === id)
    .sections.flatMap(section => section.paragraphs).join("\n");
  const aarna = profileText("aarna");
  const mukund = profileText("mukund");
  for (const text of [aarna, mukund]) {
    assert.ok(text.includes("India"));
    assert.ok(text.includes("Chicago"));
    assert.ok(text.includes("previous relationships"));
  }
  assert.ok(aarna.includes("parents live in New Jersey"));
  assert.ok(aarna.includes("shop selling musical instruments"));
  assert.ok(aarna.includes("college in New York state"));
  assert.ok(mukund.includes("graduating from college in California"));
  assert.ok(mukund.includes("mother and elder brother live in San Jose"));
  assert.ok(mukund.includes("brother is a software engineer"));
  assert.ok(mukund.includes("mother makes podcasts"));
  assert.ok(mukund.includes("Indian celebrities"));
  const opening = locale.opening[0].manuscript.flatMap(block => block.paragraphs).join("\n");
  for (const fact of ["Chicago", "India", "New Jersey", "New York state", "California", "San Jose", "software engineer", "podcast"]) {
    assert.ok(opening.includes(fact), `Opening must integrate ${fact}, not just profiles.`);
  }
  assert.ok(opening.includes("left them in the past"));
  assert.ok(!opening.includes("California State University"));
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
