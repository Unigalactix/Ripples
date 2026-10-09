import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { loadStory } from "../scripts/build.mjs";
import { renderEpub } from "../scripts/export-epub.mjs";
import { renderBookSections } from "../scripts/export-book.mjs";
import { loadBookFonts } from "../scripts/book-fonts.mjs";

const storyRoot = fileURLToPath(new URL("../../STORY/", import.meta.url));
const cover = await readFile(new URL("../../Assets/cover.svg", import.meta.url), "utf8");
const modified = "2026-10-09T00:00:00Z";
const fonts = await loadBookFonts();

test("EPUB starts with uncompressed mimetype and resolves all package resources", async () => {
  const [locale] = await loadStory(storyRoot);
  const epub = Buffer.from(renderEpub(locale, cover, fonts, modified));
  assert.equal(epub.readUInt32LE(0), 0x04034b50);
  assert.equal(epub.readUInt16LE(8), 0, "mimetype compression must be STORE");
  assert.equal(epub.readUInt16LE(28), 0, "mimetype must have no extra field");
  const filenameLength = epub.readUInt16LE(26);
  assert.equal(epub.subarray(30, 30 + filenameLength).toString(), "mimetype");
  assert.equal(epub.subarray(30 + filenameLength, 30 + filenameLength + 20).toString(), "application/epub+zip");
  const files = unzipSync(epub);
  const container = strFromU8(files["META-INF/container.xml"]);
  const packagePath = container.match(/full-path="([^"]+)"/)[1];
  assert.ok(files[packagePath]);
  const opf = strFromU8(files[packagePath]);
  assert.ok(opf.includes('version="3.0"'));
  assert.ok(opf.includes(`<meta property="dcterms:modified">${modified}</meta>`));
  assert.ok(opf.includes('properties="cover-image"'));
  assert.ok(opf.includes('properties="nav"'));
  for (const match of opf.matchAll(/<item id="([^"]+)" href="([^"]+)"/g)) {
    assert.ok(files[`EPUB/${match[2]}`], `Missing manifest resource ${match[2]}`);
  }
  assert.ok(opf.includes('<itemref idref="book"'));
  assert.equal(strFromU8(files["EPUB/cover.svg"]), cover);
  for (const face of fonts.faces) {
    assert.deepEqual(Buffer.from(files[`EPUB/fonts/${face.name}`]), face.bytes);
  }
  assert.equal(strFromU8(files["EPUB/fonts/OFL.txt"]), fonts.license);
});

test("EPUB includes complete shared manuscript rendering and valid navigation anchors", async () => {
  const [locale] = await loadStory(storyRoot);
  const files = unzipSync(renderEpub(locale, cover, fonts, modified));
  const book = strFromU8(files["EPUB/book.xhtml"]);
  assert.ok(book.includes(renderBookSections(locale, "cover.svg")));
  assert.ok(book.includes('xmlns="http://www.w3.org/1999/xhtml"'));
  assert.ok(!book.includes("<script"));
  assert.ok(!/src="https?:/.test(book));
  const nav = strFromU8(files["EPUB/nav.xhtml"]);
  const toc = nav.match(/<nav epub:type="toc"[\s\S]*?<\/nav>/)[0];
  const anchors = [...toc.matchAll(/href="book.xhtml#([^"]+)"/g)].map(match => match[1]);
  assert.equal(anchors.length, 11);
  for (const id of anchors) assert.ok(book.includes(`id="${id}"`));
  assert.ok(book.includes("B(L)IND"));
  assert.ok(book.includes('src="cover.svg" />'));
});

test("EPUB declares language and reading direction for translated editions", async () => {
  const [locale] = await loadStory(storyRoot);
  locale.code = "ar";
  locale.dir = "rtl";
  const files = unzipSync(renderEpub(locale, cover, fonts, modified));
  assert.ok(strFromU8(files["EPUB/package.opf"]).includes('page-progression-direction="rtl"'));
  assert.ok(strFromU8(files["EPUB/book.xhtml"]).includes('xml:lang="ar" dir="rtl"'));
  assert.ok(!strFromU8(files["EPUB/book.xhtml"]).includes('src="cover.svg"'));
});
