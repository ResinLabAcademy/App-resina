import fs from "node:fs/promises";
import path from "node:path";
import { generateFallbackArt } from "./fallbackArt.js";

// Pollinations.ai: API pública de generación de imágenes por IA que no requiere
// API key. Es el proveedor por defecto para que el generador de ebooks sea
// 100% funcional sin que Denisse tenga que pagar/registrar una cuenta extra.
// Si más adelante quiere mejor calidad, puede cambiar a OpenAI/Stability
// implementando la misma interfaz generateImage().
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

function buildImageUrl(prompt, { width, height, seed, model = "flux" }) {
  const encoded = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    model,
    nologo: "true",
    safe: "true"
  });
  return `${POLLINATIONS_BASE}/${encoded}?${params.toString()}`;
}

async function fetchWithRetry(url, { retries = 3, timeoutMs = 45000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} generando imagen`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 500) throw new Error("Imagen devuelta demasiado pequeña/corrupta");
      return buffer;
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

/**
 * Genera una imagen con IA y la guarda en disco. Si el proveedor de imágenes
 * no responde (red bloqueada, rate-limit, timeout), cae automáticamente en un
 * diseño vectorial de respaldo con la paleta de la marca, para que el ebook
 * final nunca se quede sin portada/ilustraciones.
 * @returns {Promise<{type: "raster"|"svg", filePath?: string, base64?: string, mimeType?: string, svg?: string}>}
 */
export async function generateImage({
  prompt,
  outDir,
  fileName,
  width = 1024,
  height = 1536,
  seed,
  brandColors
}) {
  try {
    const url = buildImageUrl(prompt, { width, height, seed });
    const buffer = await fetchWithRetry(url);
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, fileName);
    await fs.writeFile(filePath, buffer);
    return { type: "raster", filePath, base64: buffer.toString("base64"), mimeType: "image/jpeg" };
  } catch (err) {
    const svg = generateFallbackArt({ colors: brandColors, seed, width, height });
    await fs.mkdir(outDir, { recursive: true });
    const svgPath = path.join(outDir, fileName.replace(/\.\w+$/, ".svg"));
    await fs.writeFile(svgPath, svg);
    return { type: "svg", filePath: svgPath, svg, providerError: err.message };
  }
}

/**
 * Deriva un seed numérico estable a partir de un texto (para que todas las
 * imágenes de un mismo ebook compartan una "semilla de estilo" coherente).
 */
export function seedFromString(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % 1000000;
}
