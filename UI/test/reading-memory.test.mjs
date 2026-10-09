import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function api() {
  const context = vm.createContext({
    document: { getElementById: () => ({}) },
    window: { matchMedia: () => ({ matches: false }) },
  });
  vm.runInContext(source, context);
  return context;
}

function edition(groups, code = "en") {
  return {
    code,
    pages: groups.map((paragraphs, index) => ({
      sectionId: "before", pageInSection: index + 1,
      blocks: [{ perspective: "aarna", paragraphs }],
    })),
  };
}

test("bookmark stores paragraph text, ordinal, language, size and theme", () => {
  const context = api();
  context.edition = edition([["First", "Second"], ["Third", "Fourth"]]);
  const saved = vm.runInContext('makeReadingState(edition, 1, 1, 22, "night")', context);
  assert.equal(saved.position.text, "Fourth");
  assert.equal(saved.position.index, 3);
  assert.equal(saved.language, "en");
  assert.equal(saved.textSize, 22);
  assert.equal(saved.theme, "night");
});

test("bookmark survives added paragraphs and changed page boundaries", () => {
  const context = api();
  context.old = edition([["First", "Second"], ["Third", "Fourth"]]);
  context.updated = [edition([["New", "First"], ["Second", "Third", "Fourth"]])];
  const result = vm.runInContext('resolveReadingState(updated, makeReadingState(old, 1, 1, 18, "paper"))', context);
  assert.equal(result.index, 1);
  assert.equal(result.offset, 2);
  assert.equal(result.moved, false);
});

test("duplicate dialogue uses ordinal proximity; missing text reports relocation", () => {
  const context = api();
  context.old = edition([["Yes", "Middle"], ["Yes", "Last"]]);
  context.updated = [edition([["Yes"], ["Middle", "Yes", "Last"]])];
  let result = vm.runInContext('resolveReadingState(updated, makeReadingState(old, 1, 0, 18, "paper"))', context);
  assert.equal(result.index, 1);
  assert.equal(result.offset, 1);
  context.updated = [edition([["Yes"], ["Middle", "Changed", "Last"]])];
  result = vm.runInContext('resolveReadingState(updated, makeReadingState(old, 1, 1, 18, "paper"))', context);
  assert.equal(result.moved, false);
  context.updated = [edition([["Only surviving text"]])];
  result = vm.runInContext('resolveReadingState(updated, makeReadingState(old, 1, 1, 18, "paper"))', context);
  assert.equal(result.moved, true);
  assert.equal(result.index, 0);
});

test("invalid saved data is rejected rather than silently treated as a valid bookmark", () => {
  const context = api();
  assert.equal(vm.runInContext("decodeReadingState(null)", context), null);
  for (const value of ["{bad", "null", "{}", JSON.stringify({
    version: 1, language: "en", textSize: 99, theme: "night", position: null,
  }), JSON.stringify({
    version: 1, language: "en", textSize: 18, theme: "injected", position: null,
  }), JSON.stringify({
    version: 1, language: "en", textSize: 18, theme: "paper",
    position: { sectionId: null, index: 0, text: null },
  })]) {
    context.raw = value;
    assert.throws(() => vm.runInContext("decodeReadingState(raw)", context));
  }
});

test("removed language and section relocate explicitly; front matter resumes", () => {
  const context = api();
  context.old = edition([[]]);
  context.updated = [edition([["Hello"]])];
  const front = vm.runInContext('resolveReadingState(updated, makeReadingState(old, 0, 0, 18, "paper"))', context);
  assert.equal(front.index, 0);
  assert.equal(front.moved, false);
  context.state = { version: 1, language: "te", textSize: 18, theme: "paper", position: { sectionId: "missing", text: null, index: 0 } };
  const removed = vm.runInContext("resolveReadingState(updated, state)", context);
  assert.equal(removed.moved, true);
  assert.equal(removed.index, 0);
});

test("a saved language resolves within that edition rather than the default", () => {
  const context = api();
  context.old = edition([["Translated passage"]], "te");
  context.updated = [edition([["English passage"]]), edition([["Translated passage"]], "te")];
  const result = vm.runInContext('resolveReadingState(updated, makeReadingState(old, 0, 0, 19, "night"))', context);
  assert.equal(result.edition.code, "te");
  assert.equal(result.moved, false);
});
