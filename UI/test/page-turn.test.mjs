import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function setup({ reduced = false, rtl = false, open = true, supported = true } = {}) {
  const animations = [];
  const leaves = [];
  const preference = { matches: reduced };
  const dialog = { open };
  const error = {};
  const context = vm.createContext({
    document: { getElementById: id => id === "book" ? dialog : error },
    window: { matchMedia: () => preference },
  });
  // Without story data the application shows its load error but registers no UI handlers.
  vm.runInContext(source, context);
  vm.runInContext(`locale = { dir: "${rtl ? "rtl" : "ltr"}" };`, context);
  const animate = (frames, options) => {
    const animation = { frames, options, cancelled: false, cancel() { this.cancelled = true; } };
    animations.push(animation);
    return animation;
  };
  const paper = {
    offsetLeft: 48, offsetTop: 20, offsetWidth: 700, offsetHeight: 650,
    animate: supported ? animate : undefined,
    after(leaf) { leaves.push(leaf); },
    cloneNode() {
      const attributes = new Map([["id", "book-page"], ["tabindex", "-1"], ["aria-labelledby", "page-title"]]);
      const heading = { id: "page-title", removeAttribute() { this.id = undefined; } };
      return {
        attributes, heading, style: {}, classList: new Set(),
        removeAttribute(name) { attributes.delete(name); },
        setAttribute(name, value) { attributes.set(name, value); },
        querySelectorAll() { return [heading]; },
        remove() { this.removed = true; },
        animate,
      };
    },
  };
  context.paper = paper;
  return {
    animations, leaves, preference, context,
    start(direction) { vm.runInContext(`startPageTurn(paper, ${direction});`, context); },
    cancel() { vm.runInContext("cancelPageTurn();", context); },
  };
}

test("forward turn animates old and new pages and removes the decorative copy on finish", () => {
  const ui = setup();
  ui.start(1);
  assert.equal(ui.animations.length, 2);
  const leaf = ui.leaves[0];
  assert.equal(leaf.attributes.has("id"), false);
  assert.equal(leaf.attributes.has("tabindex"), false);
  assert.equal(leaf.attributes.has("aria-labelledby"), false);
  assert.equal(leaf.heading.id, undefined);
  assert.equal(leaf.attributes.get("aria-hidden"), "true");
  assert.equal(leaf.inert, true);
  assert.equal(leaf.style.transformOrigin, "left center");
  assert.equal(leaf.style.width, "700px");
  assert.match(ui.animations[0].frames[1].transform, /rotateY\(-88deg\)/);
  assert.equal(ui.animations[0].options.duration, 460);
  ui.animations[0].onfinish();
  assert.ok(leaf.removed);
  assert.ok(ui.animations.every(animation => animation.cancelled));
});

test("backward and RTL page turns mirror the rotation and hinge", () => {
  for (const options of [{ rtl: false, direction: -1 }, { rtl: true, direction: 1 }]) {
    const ui = setup(options);
    ui.start(options.direction);
    assert.equal(ui.leaves[0].style.transformOrigin, "right center");
    assert.match(ui.animations[0].frames[1].transform, /rotateY\(88deg\)/);
  }
  const ui = setup({ rtl: true });
  ui.start(-1);
  assert.equal(ui.leaves[0].style.transformOrigin, "left center");
});

test("rapid turns cancel earlier animations and stale completion cannot remove a newer turn", () => {
  const ui = setup();
  ui.start(1);
  const staleFinish = ui.animations[0].onfinish;
  ui.start(-1);
  assert.ok(ui.leaves[0].removed);
  assert.ok(ui.animations[0].cancelled);
  staleFinish();
  assert.ok(!ui.leaves[1].removed);
  ui.cancel();
  ui.cancel();
  assert.ok(ui.leaves[1].removed);
  assert.ok(ui.animations.every(animation => animation.cancelled));
});

test("reduced motion, initial display, closed reader and unavailable animation support are instant", () => {
  for (const options of [{ reduced: true }, { open: false }, { supported: false }]) {
    const ui = setup(options);
    ui.start(1);
    assert.equal(ui.leaves.length, 0);
  }
  const ui = setup();
  ui.start(1);
  ui.preference.matches = true;
  ui.start(-1);
  assert.ok(ui.leaves[0].removed);
  assert.equal(ui.leaves.length, 1);
  ui.preference.matches = false;
  ui.start(0);
  assert.equal(ui.leaves.length, 1);
});
