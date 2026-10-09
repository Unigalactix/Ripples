import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function edges(index, dir = "ltr") {
  const buttons = [];
  const location = { hash: "" };
  const context = vm.createContext({
    document: {
      getElementById: () => ({}),
      createElement: () => ({
        attributes: {}, children: [], handlers: {},
        setAttribute(key, value) { this.attributes[key] = value; },
        append(child) { this.children.push(child); },
        addEventListener(name, handler) { this.handlers[name] = handler; },
        click() { if (!this.disabled) this.handlers.click(); },
      }),
    },
    window: { matchMedia: () => ({ matches: false }) },
    location,
    paper: { append(button) { buttons.push(button); } },
  });
  vm.runInContext(source, context);
  vm.runInContext(`locale = {
    dir: "${dir}", code: "en", labels: {edgeNext: "Next", edgePrevious: "Previous"},
    pages: Array.from({length: 3}, (_, index) => ({sectionId:"before",pageInSection:index+1}))
  }; pageIndex = ${index}; addPageEdges(paper);`, context);
  return { buttons, location };
}

test("left and right edges navigate to previous and next pages with accessible names", () => {
  const { buttons, location } = edges(1);
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].attributes["aria-label"], "Previous");
  assert.equal(buttons[1].attributes["aria-label"], "Next");
  buttons[0].click();
  assert.equal(location.hash, "en/before/1");
  buttons[1].click();
  assert.equal(location.hash, "en/before/3");
});

test("edge navigation respects book boundaries and RTL direction", () => {
  const first = edges(0);
  assert.equal(first.buttons[0].disabled, true);
  first.buttons[0].click();
  assert.equal(first.location.hash, "");
  assert.equal(edges(2).buttons[1].disabled, true);
  const rtl = edges(1, "rtl");
  assert.equal(rtl.buttons[0].attributes["aria-label"], "Next");
  rtl.buttons[0].click();
  assert.equal(rtl.location.hash, "en/before/3");
  rtl.buttons[1].click();
  assert.equal(rtl.location.hash, "en/before/1");
});
