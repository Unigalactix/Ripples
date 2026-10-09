import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { build, loadStory } from "../scripts/build.mjs";

const storyRoot = fileURLToPath(new URL("../../STORY/", import.meta.url));

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ripples-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(storyRoot, root, { recursive: true });
  return root;
}

test("English contains the five ordered chapters and both perspectives", async () => {
  const story = await loadStory(storyRoot);
  const english = story.find(locale => locale.code === "en");
  assert.deepEqual(english.chapters.map(chapter => chapter.id), [
    "impact", "first-ripple", "crest", "trough", "still-water",
  ]);
  assert.match(english.labels.status, /outlines/);
  for (const chapter of english.chapters) {
    assert.ok(chapter.together.length && chapter.aarna.length && chapter.mukund.length);
  }
});

test("build emits only static assets and usable content", async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ripples-build-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const story = await build({ outputRoot: root });
  assert.deepEqual((await readdir(root)).sort(), [
    ".nojekyll", "app.js", "content.js", "index.html", "styles.css",
  ]);
  const html = await readFile(path.join(root, "index.html"), "utf8");
  assert.ok(html.includes('src="./content.js"'));
  assert.ok(html.includes('src="./app.js"'));
  assert.ok(html.includes('href="./styles.css"'));
  assert.ok(!/(?:src|href)="\/[^/]/.test(html), "Assets must not assume domain-root hosting.");
  const context = vm.createContext({});
  vm.runInContext(await readFile(path.join(root, "content.js"), "utf8"), context);
  assert.equal(JSON.stringify(context.RIPPLES_CONTENT), JSON.stringify(story));
});

test("additional locale preserves Unicode, direction and chapter IDs", async t => {
  const root = await fixture(t);
  const locales = JSON.parse(await readFile(path.join(root, "locales.json"), "utf8"));
  // Synthetic locale tests plumbing only; it is never included in the published site.
  locales.push({ ...locales[0], code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", dir: "rtl" });
  await cp(path.join(root, "en"), path.join(root, "ar"), { recursive: true });
  await writeFile(path.join(root, "locales.json"), JSON.stringify(locales));
  const story = await loadStory(root);
  assert.equal(story[1].name, "\u0627\u0644\u0639\u0631\u0628\u064a\u0629");
  assert.equal(story[1].dir, "rtl");
  assert.deepEqual(story[1].chapters.map(item => item.id), story[0].chapters.map(item => item.id));
});

test("missing translations fail rather than silently falling back", async t => {
  const root = await fixture(t);
  await rm(path.join(root, "en", "03-crest.json"));
  await assert.rejects(loadStory(root), /exactly five/);
});

test("missing localized labels fail with the offending key", async t => {
  const root = await fixture(t);
  const locales = JSON.parse(await readFile(path.join(root, "locales.json"), "utf8"));
  delete locales[0].labels.next;
  await writeFile(path.join(root, "locales.json"), JSON.stringify(locales));
  await assert.rejects(loadStory(root), /en.labels.next/);
});

test("wrong chapter IDs and unsafe language tags are rejected", async t => {
  const root = await fixture(t);
  const file = path.join(root, "en", "01-impact.json");
  const chapter = JSON.parse(await readFile(file, "utf8"));
  chapter.id = "wrong";
  await writeFile(file, JSON.stringify(chapter));
  await assert.rejects(loadStory(root), /chapter ID impact/);
  await writeFile(path.join(root, "locales.json"), JSON.stringify([{ code: "../en" }]));
  await assert.rejects(loadStory(root), /path-safe/);
});
