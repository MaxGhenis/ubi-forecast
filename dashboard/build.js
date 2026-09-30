// Bundles the app and its worker into one self-contained HTML file: dist/index.html.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

async function bundle(entry) {
  const r = await Bun.build({ entrypoints: [entry], target: "browser", format: "esm", minify: true });
  if (!r.success) { console.error(r.logs); process.exit(1); }
  return await r.outputs[0].text();
}
const app = await bundle("./src/app.js");
const worker = await bundle("./src/worker.js");
const safe = (s) => s.replaceAll("</script", "<\\/script");
const html = readFileSync("./src/template.html", "utf8")
  .replace("/*WORKER*/", () => safe(worker))
  .replace("/*APP*/", () => safe(app));
mkdirSync("./dist", { recursive: true });
writeFileSync("./dist/index.html", html);
console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB`);
