import Anthropic from "@anthropic-ai/sdk";
// El helper zodOutputFormat del SDK usa z.toJSONSchema (API de Zod v4)
// internamente, así que los esquemas deben construirse con "zod/v4" y no con
// la raíz del paquete (que sigue siendo v3 por compatibilidad).
import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

let _client = null;
function client() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const ChapterOutlineSchema = z.object({
  title: z.string().describe("Título del capítulo, sin numerar"),
  role: z.enum(["intro", "content", "conclusion"]).describe(
    "intro = primer capítulo (engancha y presenta la promesa), content = capítulo de contenido normal, conclusion = último capítulo (resume y da siguientes pasos)"
  ),
  summary: z
    .string()
    .describe("2-3 frases de qué va a cubrir este capítulo, para que el redactor lo desarrolle"),
  keyTakeaway: z.string().describe("Una frase corta e inspiradora, apta para usarse como cita destacada dentro del capítulo"),
  imagePrompt: z
    .string()
    .describe("Descripción visual en inglés, concreta, para generar una imagen de portada de este capítulo")
});

const OutlineSchema = z.object({
  title: z.string().describe("Título principal del ebook, atractivo y claro"),
  subtitle: z.string().describe("Subtítulo de una línea que aclara el beneficio concreto"),
  targetAudienceSummary: z.string().describe("A quién va dirigido este ebook, en una frase"),
  coverImagePrompt: z
    .string()
    .describe("Descripción visual en inglés, concreta y evocadora, para la imagen de portada del ebook completo"),
  chapters: z.array(ChapterOutlineSchema)
});

function outlineSystemPrompt(brand, tone) {
  return `Eres una ghostwriter experta en copywriting narrativo para infoproductos, escribiendo para la marca "${brand.name}" (nicho: ${brand.niche}, instructora/o: ${brand.author}).
Tu estilo de referencia es Marcos Araujo: cálido, consultivo, narrativo, con transiciones emocionales suaves, cero hype barato y cero emojis excesivos.
El tono pedido para este ebook es: ${tone}.
Vas a diseñar el ESQUELETO (outline) de un ebook/lead magnet que se entregará gratis a cambio del contacto de WhatsApp, así que debe entregar valor real y dejar con ganas de más (sin ser un anuncio encubierto).
El primer capítulo (role="intro") debe enganchar con una historia o dolor identificable y prometer una transformación concreta.
El último capítulo (role="conclusion") debe resumir el camino recorrido y preparar el terreno emocional para una invitación futura, SIN vender todavía (el CTA final se agrega aparte).
Responde siempre en español de Latinoamérica, neutro y cercano.`;
}

export async function generateOutline({ brand, topic, tone, audience, chapterCount }) {
  const userPrompt = `Tema del ebook: "${topic}".
${audience ? `Público objetivo específico: ${audience}.` : ""}
Genera el outline con exactamente ${chapterCount} capítulos (el primero role="intro", el último role="conclusion", el resto role="content").
Los capítulos de contenido deben avanzar de forma lógica y progresiva (de lo más básico/fundamental a lo más avanzado o aspiracional), sin repetirse entre sí.`;

  const response = await client().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: outlineSystemPrompt(brand, tone),
    messages: [{ role: "user", content: userPrompt }],
    output_config: { format: zodOutputFormat(OutlineSchema), effort: "high" }
  });

  if (!response.parsed_output) {
    throw new Error("Claude no devolvió un outline válido. Intenta de nuevo.");
  }

  const outline = response.parsed_output;
  // Aseguramos exactamente el número de capítulos pedido, por si el modelo se desvía.
  if (outline.chapters.length > chapterCount) {
    outline.chapters = outline.chapters.slice(0, chapterCount);
  }
  if (outline.chapters.length > 0) {
    outline.chapters[0].role = "intro";
    outline.chapters[outline.chapters.length - 1].role = "conclusion";
  }
  return outline;
}

function chapterSystemPrompt(brand, tone, outline) {
  return `Eres una ghostwriter experta en copywriting narrativo, escribiendo el ebook "${outline.title}" para la marca "${brand.name}" (nicho: ${brand.niche}, instructora/o: ${brand.author}).
Estilo de referencia: Marcos Araujo — narrativo, cálido, consultivo, transiciones emocionales suaves, anti-objeción implícito (adelántate a la duda del lector y resuélvela con naturalidad), mínimo uso de emojis, sin hard-sell.
Tono pedido: ${tone}.
Formato de salida: Markdown limpio.
- Usa un H2 (##) solo si necesitas subsecciones dentro del capítulo (opcional).
- Puedes usar listas con "-" cuando ayuden a la claridad.
- Cuando quieras destacar una idea clave, ponla en una línea aparte empezando con ">" (blockquote), como si fuera una cita destacada.
- NO repitas el título del capítulo dentro del texto (ya se muestra aparte).
- NO incluyas ningún llamado a la acción de venta dentro del capítulo (eso va aparte, al final del ebook).
- Escribe en español de Latinoamérica.`;
}

export async function generateChapterBody({ brand, tone, outline, chapter, wordsTarget }) {
  const userPrompt = `Escribe el contenido completo del capítulo "${chapter.title}".
Rol del capítulo: ${chapter.role}.
De qué debe tratar: ${chapter.summary}.
Extensión objetivo: aproximadamente ${wordsTarget} palabras (puedes variar un 15% si el contenido lo pide, pero no te quedes corto).
Incluye al menos una cita destacada (blockquote con ">") que transmita la idea de: "${chapter.keyTakeaway}".`;

  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 8000,
    system: chapterSystemPrompt(brand, tone, outline),
    output_config: { effort: "medium" },
    messages: [{ role: "user", content: userPrompt }]
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || !textBlock.text.trim()) {
    throw new Error(`Claude no devolvió contenido para el capítulo "${chapter.title}".`);
  }
  return textBlock.text.trim();
}

/**
 * Traduce errores típicos de la API de Claude a un mensaje entendible para
 * quien está usando el formulario (no un desarrollador).
 */
export function friendlyClaudeError(err) {
  if (err instanceof Anthropic.AuthenticationError) {
    return "Tu ANTHROPIC_API_KEY no es válida o no está configurada. Revisa el archivo .env (ver README).";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Se alcanzó el límite de uso de la API de Claude. Espera un momento e inténtalo de nuevo.";
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "No se pudo conectar con la API de Claude. Revisa tu conexión a internet.";
  }
  if (err instanceof Anthropic.APIError) {
    return `La API de Claude devolvió un error (${err.status}): ${err.message}`;
  }
  return err.message || "Ocurrió un error inesperado generando el ebook.";
}
