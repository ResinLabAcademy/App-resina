const brandsContainer = document.getElementById("brands");
const form = document.getElementById("form");
const pagesInput = document.getElementById("pages");
const pagesLabel = document.getElementById("pagesLabel");
const submitBtn = document.getElementById("submitBtn");
const progressSection = document.getElementById("progressSection");
const resultSection = document.getElementById("resultSection");
const errorSection = document.getElementById("errorSection");
const log = document.getElementById("log");

let selectedBrandId = null;

pagesInput.addEventListener("input", () => {
  pagesLabel.textContent = `(${pagesInput.value})`;
});

async function loadBrands() {
  const res = await fetch("/api/brands");
  const brands = await res.json();
  brandsContainer.innerHTML = "";
  brands.forEach((brand, i) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className =
      "brand-card text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 bg-white";
    card.style.setProperty("--brand-color", brand.colors.primary);
    card.dataset.brandId = brand.id;
    card.innerHTML = `
      <span class="swatch" style="background:${brand.colors.primary}"></span>
      <div class="font-semibold text-sm mt-1">${brand.name}</div>
      <div class="text-xs text-slate-500">${brand.niche}</div>
    `;
    card.addEventListener("click", () => selectBrand(brand.id));
    brandsContainer.appendChild(card);
    if (i === 0) selectBrand(brand.id);
  });
}

function selectBrand(id) {
  selectedBrandId = id;
  [...brandsContainer.children].forEach((card) => {
    card.classList.toggle("selected", card.dataset.brandId === id);
  });
}

function addLogLine(message, icon = "•") {
  const line = document.createElement("div");
  line.innerHTML = `<span class="mr-1">${icon}</span>${message}`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function resetUI() {
  progressSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  errorSection.classList.add("hidden");
  log.innerHTML = "";
  form.classList.remove("hidden");
  submitBtn.disabled = false;
  submitBtn.querySelector("span").textContent = "Generar mi ebook";
}

document.getElementById("resetBtn").addEventListener("click", resetUI);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const topic = document.getElementById("topic").value.trim();
  const pages = Number(pagesInput.value);
  const tone = document.getElementById("tone").value;
  const audience = document.getElementById("audience").value.trim();

  if (!topic) return;

  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "Generando...";
  progressSection.classList.remove("hidden");
  resultSection.classList.add("hidden");
  errorSection.classList.add("hidden");
  log.innerHTML = "";
  addLogLine("Enviando tu solicitud...", "🚀");

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: selectedBrandId, topic, pages, tone, audience })
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Error del servidor (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        handleEvent(event);
      }
    }
  } catch (err) {
    showError(err.message || "Ocurrió un error inesperado.");
  }
});

function handleEvent(event) {
  if (event.type === "progress") {
    addLogLine(event.message, "⏳");
  } else if (event.type === "done") {
    addLogLine(event.message, "✅");
    progressSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
    document.getElementById("resultTitle").textContent = event.title;
    document.getElementById("resultSubtitle").textContent = `${event.subtitle} · ${event.pages} páginas · ${event.chapterCount} capítulos`;
    document.getElementById("downloadBtn").href = event.downloadUrl;
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Generar mi ebook";
  } else if (event.type === "error") {
    showError(event.message);
  }
}

function showError(message) {
  progressSection.classList.add("hidden");
  errorSection.classList.remove("hidden");
  document.getElementById("errorText").textContent = message;
  submitBtn.disabled = false;
  submitBtn.querySelector("span").textContent = "Generar mi ebook";
}

loadBrands();
