export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function renderBookSections(locale, coverSource) {
  const text = escapeHtml;
  const paragraphs = values => values.map(value => `<p>${text(value)}</p>`).join("\n");
  const sections = locale.pages.filter(page => page.pageInSection === 1);
  const chapterContent = chapter => {
    const blocks = chapter.status === "draft" ? chapter.manuscript
      : ["together", "aarna", "mukund"].map(perspective => ({ perspective, paragraphs: chapter[perspective] }));
    return blocks.map(block => `<section class="passage ${block.perspective}">
${block.perspective === "together" ? "" : `<h3>${text(locale.labels[block.perspective])}</h3>`}
${paragraphs(block.paragraphs)}</section>`).join("\n");
  };
  const title = `${locale.title} - ${locale.book.subtitle}`;
  const cover = locale.code === "en"
    ? `<img class="cover" alt="${text(title)}" src="${text(coverSource)}" />`
    : `<h1>${text(locale.title)}</h1><p>${text(locale.book.subtitle)}</p>`;
  return sections.map(page => {
    if (page.type === "title") return `<section id="title" class="cover-page">${cover}</section>`;
    if (page.type === "dedication") return `<section id="dedication" class="divider"><h1>${text(page.title)}</h1>
${paragraphs(locale.book.dedication.status === "pending" ? [locale.labels.dedicationPending] : locale.book.dedication.paragraphs)}</section>`;
    if (page.type === "divider") return `<section id="${page.sectionId}" class="divider"><h1>${text(page.title)}</h1></section>`;
    const chapter = [...locale.opening, ...locale.chapters].find(item => item.id === page.sectionId);
    return `<article id="${page.sectionId}" class="chapter">
${page.wave ? `<p class="wave">${text(locale.labels.wave)} ${new Intl.NumberFormat(locale.code).format(page.wave)}</p>` : ""}
<h1>${text(page.title)}</h1><p class="status">${text(locale.labels[chapter.status])}</p>
${chapterContent(chapter)}</article>`;
  }).join("\n");
}

export function renderBookEdition(locale, coverSvg, faviconSvg) {
  const text = escapeHtml;
  const title = `${locale.title} - ${locale.book.subtitle}`;
  const sections = locale.pages.filter(page => page.pageInSection === 1);
  const contents = sections.map(page => `<li><a href="#${page.sectionId}">${text(page.wave
    ? `${locale.labels.wave} ${new Intl.NumberFormat(locale.code).format(page.wave)} - ${page.title}`
    : page.title)}</a></li>`).join("\n");
  const body = renderBookSections(locale, `data:image/svg+xml;base64,${Buffer.from(coverSvg).toString("base64")}`);
  return `<!doctype html>
<html lang="${text(locale.code)}" dir="${locale.dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(faviconSvg).toString("base64")}">
<title>${text(title)}</title>
<style>
:root{color-scheme:light;font-family:Georgia,"Times New Roman",serif;color:#27303a;background:#e8e4dc;line-height:1.8}
*{box-sizing:border-box}body{margin:0}.tools{padding:1.5rem;max-width:800px;margin:auto;font-family:system-ui,sans-serif}
button{font:inherit;min-height:44px;padding:.6rem 1rem;cursor:pointer}a{color:#225a74}
main{max-width:800px;margin:auto;background:#fffaf2;box-shadow:0 3px 30px #0002}
.chapter,.divider{padding:4rem clamp(1.5rem,7vw,5rem)}h1{font-weight:normal;font-size:2.4rem;line-height:1.25}
.chapter h1{margin-block:.5rem 1rem}.chapter p{margin-block:0 1em}.wave,.status,h3{font-family:system-ui,sans-serif}
.wave,.status{font-size:.75rem}.status{color:#5e6370}.passage h3{font-size:.75rem;letter-spacing:.12em;margin-block:2rem 1rem}
.aarna h3{color:#96395b}.mukund h3{color:#205d7c}.divider{min-height:650px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.divider h1{text-transform:uppercase;letter-spacing:.08em}.cover{display:block;width:100%;height:auto}.cover-page{text-align:center}
.chapter+.chapter{border-top:1px solid #ded6cd}
@page{size:A5;margin:14mm}
@media print{
:root{background:white;font-size:11pt}body,main{margin:0;max-width:none;background:white;box-shadow:none}.tools{display:none}
.chapter,.divider,.cover-page{break-before:page;padding:0}.cover-page{break-before:auto}.cover{height:178mm;width:100%;object-fit:contain}
.divider{min-height:175mm;break-inside:avoid}.divider h1{font-size:23pt}.chapter h1{font-size:24pt}
h1,h3,.wave,.status{break-after:avoid}p{orphans:3;widows:3}.chapter+.chapter{border:0}
}
</style></head>
<body><header class="tools"><button type="button" onclick="window.print()">${text(locale.labels.printBook)}</button>
<p>${text(locale.labels.downloadHint)}</p><p>${text(locale.labels.status)}</p>
<details><summary>${text(locale.labels.contents)}</summary><ol>${contents}</ol></details></header>
<main>${body}</main></body></html>
`;
}
