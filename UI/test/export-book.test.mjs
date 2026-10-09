import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadStory } from "../scripts/build.mjs";
import { escapeHtml, renderBookEdition } from "../scripts/export-book.mjs";

const storyRoot = fileURLToPath(new URL("../../STORY/", import.meta.url));
const cover = await readFile(new URL("../../Assets/cover.svg", import.meta.url), "utf8");
const favicon = await readFile(new URL("../../Assets/favicon.svg", import.meta.url), "utf8");

test("whole-book edition contains every paragraph of all seven chapters exactly in order", async () => {
  const [locale] = await loadStory(storyRoot);
  const html = renderBookEdition(locale, cover, favicon);
  const paragraphs = [...html.matchAll(/<section class="passage [^"]+">([\s\S]*?)<\/section>/g)]
    .flatMap(match => [...match[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map(item => item[1]));
  const expected = [...locale.opening, ...locale.chapters]
    .flatMap(chapter => chapter.manuscript.flatMap(block => block.paragraphs.map(escapeHtml)));
  assert.deepEqual(paragraphs, expected);
  const sectionIds = [...html.matchAll(/<(?:article|section) id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(sectionIds, [
    "title", "dedication", "waters-edge", "before", "pebble", "ripples-begin",
    "impact", "first-ripple", "crest", "trough", "still-water",
  ]);
  assert.ok(html.includes(escapeHtml(locale.labels.dedicationPending)));
  assert.ok(html.includes("window.print()"));
  assert.ok(html.includes("@media print"));
});

test("offline edition embeds its cover and has no external style, font or script requests", async () => {
  const [locale] = await loadStory(storyRoot);
  const html = renderBookEdition(locale, cover, favicon);
  const embedded = html.match(/src="data:image\/svg\+xml;base64,([^"]+)"/);
  assert.ok(embedded);
  assert.equal(Buffer.from(embedded[1], "base64").toString("utf8"), cover);
  assert.ok(!html.includes('<script src='));
  assert.ok(!html.includes('rel="stylesheet"'));
  assert.ok(html.includes(`href="data:image/svg+xml;base64,${Buffer.from(favicon).toString("base64")}"`));
  assert.ok(!/(?:src|href)="https?:/i.test(html));
});

test("export escapes manuscript markup and supports translated titles without English cover text", async () => {
  const [locale] = await loadStory(storyRoot);
  locale.code = "ar";
  locale.dir = "rtl";
  locale.title = "<script>alert('test')</script> & title";
  locale.opening[0].manuscript[0].paragraphs = ['<img src=x onerror="alert(1)">'];
  const html = renderBookEdition(locale, cover, favicon);
  assert.ok(html.includes('lang="ar" dir="rtl"'));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes('class="cover"'));
});
