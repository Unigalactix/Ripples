import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const root = new URL(process.argv.includes("--root") ? "../../" : "../dist/", import.meta.url);
const routes = new Map([
  ["/Ripples/", ["index.html", "text/html; charset=utf-8"]],
  ["/Ripples/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/Ripples/UI/src/styles.css", ["UI/src/styles.css", "text/css; charset=utf-8"]],
  ["/Ripples/UI/src/app.js", ["UI/src/app.js", "text/javascript; charset=utf-8"]],
  ["/Ripples/UI/content.js", ["UI/content.js", "text/javascript; charset=utf-8"]],
  ["/Ripples/Assets/cover.svg", ["Assets/cover.svg", "image/svg+xml"]],
  ["/Ripples/Assets/favicon.svg", ["Assets/favicon.svg", "image/svg+xml"]],
]);

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/" || pathname === "/Ripples") {
    response.writeHead(302, { Location: "/Ripples/" }).end();
    return;
  }
  const edition = pathname.match(/^\/Ripples\/Assets\/books\/(ripples-[a-z]{2,3}(?:-[a-z0-9]{2,8})*\.(html|epub))$/i);
  const asset = routes.get(pathname) ?? (edition ? [`Assets/books/${edition[1]}`,
    edition[2].toLowerCase() === "epub" ? "application/epub+zip" : "text/html; charset=utf-8"] : undefined);
  if (!asset) {
    response.writeHead(404).end("Not found.");
    return;
  }
  try {
    const body = await readFile(new URL(asset[0], root));
    response.writeHead(200, { "Content-Type": asset[1], "Cache-Control": "no-store" }).end(body);
  } catch (error) {
    console.error(`Unable to serve ${pathname}:`, error);
    response.writeHead(500).end("Unable to load the site. Run npm run build and try again.");
  }
});
server.on("error", error => {
  console.error("Preview server could not start:", error);
  process.exitCode = 1;
});
server.listen(4173, "127.0.0.1", () => {
  console.log("Preview ready at http://localhost:4173/Ripples/");
});
