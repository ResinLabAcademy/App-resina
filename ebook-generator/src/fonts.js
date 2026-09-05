import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "..", "assets", "fonts");

let _cache = null;

// Las tipografías se autohospedan (incrustadas en base64) para que el PDF
// se genere igual de bien con o sin conexión a internet en el momento del
// render, y para que coincidan exactamente con las de las landing pages
// de Denisse (Manrope + Work Sans).
export async function loadFontFaces() {
  if (_cache) return _cache;
  const manrope = (await fs.readFile(path.join(FONTS_DIR, "Manrope-Variable.woff2"))).toString("base64");
  const workSans = (await fs.readFile(path.join(FONTS_DIR, "WorkSans-Variable.woff2"))).toString("base64");

  _cache = `
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  src: url(data:font/woff2;base64,${manrope}) format('woff2');
}
@font-face {
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 400 600;
  font-display: swap;
  src: url(data:font/woff2;base64,${workSans}) format('woff2');
}`;
  return _cache;
}
