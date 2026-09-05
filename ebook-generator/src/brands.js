// Presets de las 8 marcas de Denisse.
// Cada marca define paleta de color, tipografías, instructor/autor,
// palabra clave del funnel (Meta/ManyChat) y el tono sugerido para el CTA final.

export const BRANDS = {
  resina: {
    id: "resina",
    name: "Resina Lab",
    author: "Yuly Rivas",
    niche: "resina epóxica y arte en resina",
    keyword: "RESINA",
    colors: { primary: "#006064", accent: "#ff8a3d", ink: "#161a32", paper: "#fbf8ff", soft: "#e5e6ff" },
    fontHeading: "Manrope",
    fontBody: "Work Sans",
    imageStyle: "fotografía macro editorial de resina epóxica líquida, curvas orgánicas, tonos teal y ámbar suaves, luz de estudio difusa, alta gama, minimalista",
    ctaText: "Si quieres dominar el arte de la resina paso a paso, con acompañamiento en vivo, escribe la palabra RESINA a nuestro WhatsApp y te contamos cómo entrar a la próxima clase en vivo con Yuly Rivas."
  },
  teje: {
    id: "teje",
    name: "Teje Premium",
    author: "Ana",
    niche: "crochet y tejido a mano",
    keyword: "TEJE",
    colors: { primary: "#7a4a2b", accent: "#e9a23b", ink: "#2b1d12", paper: "#fff8f0", soft: "#f3e3d0" },
    fontHeading: "Manrope",
    fontBody: "Work Sans",
    imageStyle: "fotografía cálida y hogareña de hilos y piezas de crochet artesanal, tonos tierra y mostaza, luz natural suave, textura tejida en primer plano",
    ctaText: "Si quieres aprender a tejer piezas que se venden solas, escribe la palabra TEJE a nuestro WhatsApp y entra a la comunidad de Teje Premium con Ana."
  },
  velas: {
    id: "velas",
    name: "Naturalmente Velas",
    author: "Denisse Loibl",
    niche: "elaboración artesanal de velas",
    keyword: "VELAS",
    colors: { primary: "#5b4636", accent: "#c98a4b", ink: "#2a2016", paper: "#fdf6ee", soft: "#ecd9c2" },
    fontHeading: "Manrope",
    fontBody: "Work Sans",
    imageStyle: "fotografía cálida de velas artesanales encendidas, cera derretida, tonos crema y caramelo, ambiente cozy, luz dorada de atardecer",
    ctaText: "Si quieres convertir esto en un negocio de velas rentable, escribe la palabra VELAS a nuestro WhatsApp y recibe el acceso a la próxima masterclass en vivo con Denisse Loibl."
  },
  nails: {
    id: "nails",
    name: "Nails Master Pro",
    author: "Gerimar Pérez",
    niche: "uñas y nail art profesional",
    keyword: "UÑAS",
    colors: { primary: "#9c1d5f", accent: "#ffb6d9", ink: "#2a1420", paper: "#fff5fa", soft: "#ffe0ef" },
    fontHeading: "Manrope",
    fontBody: "Work Sans",
    imageStyle: "fotografía de nail art profesional, manicura editorial, fondo rosa y magenta, luz de estudio brillante, detalle de esmaltado impecable",
    ctaText: "Si quieres vivir de tu talento con las uñas, escribe la palabra UÑAS a nuestro WhatsApp y entra a la formación profesional con Gerimar Pérez."
  },
  bisuteria: {
    id: "bisuteria",
    name: "Bisutería",
    author: "Denisse",
    niche: "bisutería y accesorios hechos a mano",
    keyword: "BISUTERÍA",
    colors: { primary: "#8a6d3b", accent: "#d4af37", ink: "#241f12", paper: "#fffaf0", soft: "#f0e4c2" },
    fontHeading: "Manrope",
    fontBody: "Work Sans",
    imageStyle: "fotografía editorial de joyería artesanal y accesorios, dorados y cobres, fondo neutro elegante, luz de producto premium",
    ctaText: "Si quieres aprender a crear y vender bisutería con margen alto, escribe la palabra BISUTERÍA a nuestro WhatsApp y accede al curso completo con 75% de descuento y 2 años de acceso."
  },
  mama: {
    id: "mama",
    name: "Mamá Millennial CR",
    author: "Denisse",
    niche: "maternidad y recuperación de identidad después de ser mamá",
    keyword: "MAMÁ",
    colors: { primary: "#5b7a8c", accent: "#f2a488", ink: "#22303a", paper: "#f7fbfc", soft: "#dcebf0" },
    fontHeading: "Manrope",
    fontBody: "Work Sans",
    imageStyle: "fotografía cálida y honesta de maternidad real, tonos suaves azul grisáceo y durazno, luz natural, ambiente íntimo y emocional",
    ctaText: "Si quieres seguir este camino acompañada, escribe la palabra MAMÁ a nuestro WhatsApp y únete a la comunidad de Mamá Millennial CR."
  },
  cima: {
    id: "cima",
    name: "CIMA Digital Pro",
    author: "Denisse",
    niche: "marketing digital y consultoría de negocios",
    keyword: "CIMA",
    colors: { primary: "#1f2a44", accent: "#3ad6c0", ink: "#10131f", paper: "#f5f8fb", soft: "#dbe6f2" },
    fontHeading: "Manrope",
    fontBody: "Work Sans",
    imageStyle: "fotografía corporativa moderna, tonos azul marino y turquesa, minimalista, elementos de dashboards y crecimiento, luz de estudio limpia",
    ctaText: "Si quieres implementar este sistema en tu propio negocio, escribe la palabra CIMA a nuestro WhatsApp y agenda una sesión de consultoría con CIMA Digital Pro."
  },
  dulce: {
    id: "dulce",
    name: "El Dulce Studio",
    author: "Denisse",
    niche: "repostería y pastelería artesanal",
    keyword: "POSTRE",
    colors: { primary: "#a34a5c", accent: "#f2c94c", ink: "#30181d", paper: "#fff7f2", soft: "#fbe1c9" },
    fontHeading: "Manrope",
    fontBody: "Work Sans",
    imageStyle: "fotografía gourmet de repostería artesanal, tonos rosados y dorados, luz suave de cocina, estilo editorial de food photography",
    ctaText: "Si quieres aprender a crear postres que enamoran (y vender), escribe la palabra POSTRE a nuestro WhatsApp y entra al próximo taller en vivo de El Dulce Studio."
  }
};

export const DEFAULT_BRAND_ID = "resina";

export function getBrand(id) {
  return BRANDS[id] || BRANDS[DEFAULT_BRAND_ID];
}

export function listBrands() {
  return Object.values(BRANDS).map(({ id, name, author, niche, keyword, colors }) => ({
    id, name, author, niche, keyword, colors
  }));
}
