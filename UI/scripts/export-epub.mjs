import { strToU8, zipSync } from "fflate";
import { escapeHtml, renderBookSections } from "./export-book.mjs";
import { bookFontCss } from "./book-fonts.mjs";

export function renderEpub(locale, coverSvg, fonts, modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")) {
  const text = escapeHtml;
  const title = `${locale.title} - ${locale.book.subtitle}`;
  const sections = locale.pages.filter(page => page.pageInSection === 1);
  const document = (heading, body) => `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${text(locale.code)}" xml:lang="${text(locale.code)}" dir="${locale.dir}">
<head><title>${text(heading)}</title><link rel="stylesheet" type="text/css" href="style.css" /></head>
<body>${body}</body></html>`;
  const nav = sections.map(page => {
    const label = page.wave
      ? `${locale.labels.wave} ${new Intl.NumberFormat(locale.code).format(page.wave)} - ${page.title}` : page.title;
    return `<li><a href="book.xhtml#${page.sectionId}">${text(label)}</a></li>`;
  }).join("\n");
  const files = {
    // EPUB requires this uncompressed entry to be first, with no BOM or extra data.
    mimetype: [strToU8("application/epub+zip"), { level: 0 }],
    "META-INF/container.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml" /></rootfiles>
</container>`),
    "EPUB/package.opf": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${text(locale.code)}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">urn:unigalactix:ripples:${text(locale.code)}</dc:identifier>
<dc:title>${text(title)}</dc:title><dc:language>${text(locale.code)}</dc:language>
<dc:creator>Rajesh Kodaganti</dc:creator><dc:description>${text(locale.labels.status)}</dc:description>
<meta property="dcterms:modified">${modified}</meta>
<meta name="cover" content="cover-image" />
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
<item id="book" href="book.xhtml" media-type="application/xhtml+xml" />
<item id="css" href="style.css" media-type="text/css" />
<item id="cover-image" href="cover.svg" media-type="image/svg+xml" properties="cover-image" />
${fonts.faces.map(face => `<item id="font-${face.style}" href="fonts/${face.name}" media-type="font/woff" />`).join("\n")}
<item id="font-license" href="fonts/OFL.txt" media-type="text/plain" />
</manifest>
<spine page-progression-direction="${locale.dir}"><itemref idref="book" /></spine>
</package>`),
    "EPUB/nav.xhtml": strToU8(document(locale.labels.contents,
      `<nav epub:type="toc" id="toc"><h1>${text(locale.labels.contents)}</h1><ol>${nav}</ol></nav>
<nav epub:type="landmarks" hidden="hidden"><h2>${text(locale.labels.contents)}</h2><ol>
<li><a epub:type="cover" href="book.xhtml#title">${text(locale.labels.titlePage)}</a></li>
<li><a epub:type="bodymatter" href="book.xhtml#before">${text(locale.opening[0].title)}</a></li>
</ol></nav>`)),
    "EPUB/book.xhtml": strToU8(document(title, renderBookSections(locale, "cover.svg"))),
    "EPUB/cover.svg": strToU8(coverSvg),
    "EPUB/style.css": strToU8(`${bookFontCss(fonts, face => `fonts/${face.name}`)}
body{font-family:serif;line-height:1.65;margin:5%;color:#27303a;background:#fffaf2}
h1{font-weight:normal;line-height:1.2}h3,.wave,.status{font-family:sans-serif}
h3{font-size:.8em;letter-spacing:.08em;margin-top:1.8em}.status{font-size:.75em}
.aarna h3{color:#96395b}.mukund h3{color:#205d7c}
.chapter,.divider,.cover-page{break-before:page;page-break-before:always}.cover-page{break-before:auto;page-break-before:auto;text-align:center}
.cover{max-width:100%;max-height:95vh;object-fit:contain}.divider{text-align:center;padding-top:25%;padding-bottom:25%;min-height:60vh}
.divider h1{font-family:"Cormorant Garamond",Palatino,Georgia,serif;font-weight:400;font-size:2.6em;letter-spacing:.015em;line-height:1.2}
.dedication{padding-top:12%;padding-bottom:12%}.dedication h1{font-size:1.5em;letter-spacing:.08em;margin-bottom:2em}
.dedication p{font-family:"Cormorant Garamond",Palatino,Georgia,serif;font-style:italic;font-size:1.35em;line-height:1.6}.dedication p:last-child{margin-top:1.5em}
p{orphans:3;widows:3}h1,h3{break-after:avoid;page-break-after:avoid}a{color:#205d7c}`),
  };
  for (const face of fonts.faces) files[`EPUB/fonts/${face.name}`] = face.bytes;
  files["EPUB/fonts/OFL.txt"] = strToU8(fonts.license);
  return zipSync(files, { level: 6 });
}
