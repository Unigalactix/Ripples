import { readFile } from "node:fs/promises";

export async function loadBookFonts() {
  const root = new URL("../node_modules/@fontsource/cormorant-garamond/", import.meta.url);
  const faces = await Promise.all(["normal", "italic"].map(async style => {
    const name = `cormorant-garamond-latin-400-${style}.woff`;
    return { name, style, bytes: await readFile(new URL(`files/${name}`, root)) };
  }));
  return { faces, license: await readFile(new URL("LICENSE", root), "utf8") };
}

export function bookFontCss(fonts, location) {
  return fonts.faces.map(face => `@font-face{
font-family:"Cormorant Garamond";font-style:${face.style};font-weight:400;font-display:swap;
src:url("${location(face)}") format("woff");
}`).join("\n");
}
