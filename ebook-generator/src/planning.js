// Traduce "cuántas páginas quiero" en una estructura de contenido concreta:
// cuántos capítulos, cuántas palabras por capítulo e imágenes necesarias.
// Es una estimación (el PDF final puede variar +/- unas páginas según cuánto
// texto entre por página), pero mantiene el ebook proporcional a lo pedido.

const WORDS_PER_DESIGN_PAGE = 200; // páginas de ebook con imágenes/espacios, no páginas de texto denso
const NON_CHAPTER_PAGES = 3; // portada + índice + página de cierre/CTA
const MIN_CHAPTERS = 3;
const MAX_CHAPTERS = 12; // más que esto no entra cómodo en una sola página de índice
const PAGES_PER_CHAPTER_TARGET = 3.2;

export function planEbook(totalPages) {
  const pages = Math.max(6, Math.min(200, Math.round(totalPages)));
  const contentPages = Math.max(pages - NON_CHAPTER_PAGES, 3);

  let chapterCount = Math.round(contentPages / PAGES_PER_CHAPTER_TARGET);
  chapterCount = Math.max(MIN_CHAPTERS, Math.min(MAX_CHAPTERS, chapterCount));

  const totalWordsBudget = contentPages * WORDS_PER_DESIGN_PAGE;
  const wordsPerChapter = Math.round(totalWordsBudget / chapterCount);

  return {
    requestedPages: totalPages,
    pages,
    chapterCount,
    wordsPerChapter: Math.max(180, Math.min(900, wordsPerChapter)),
    imagesNeeded: chapterCount + 1 // 1 portada + 1 por capítulo
  };
}
