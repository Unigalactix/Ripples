import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const root = new URL("../dist/", import.meta.url);
const routes = new Map([
  ["/Ripples/", ["index.html", "text/html; charset=utf-8"]],
  ["/Ripples/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/Ripples/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/Ripples/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/Ripples/content.js", ["content.js", "text/javascript; charset=utf-8"]],
]);

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/" || pathname === "/Ripples") {
    response.writeHead(302, { Location: "/Ripples/" }).end();
    return;
  }
  const asset = routes.get(pathname);
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
