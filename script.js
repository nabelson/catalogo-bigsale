const SITE_CONFIG = {
  brandName: "BIG SALE MODAS",
  logoText: "BS",
  logoImage: "",
  whatsappNumber: "5545999591406"
};

let PRODUCTS = [];
const state = {
  filter: "all",
  search: "",
  viewByProduct: {},
  variantByProduct: {}
};

const catalogGrid = document.getElementById("catalogGrid");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

function setupSiteConfig() {
  document.getElementById("brandName").textContent = SITE_CONFIG.brandName;
  document.getElementById("brandMark").textContent = SITE_CONFIG.logoText || "BS";

  if (SITE_CONFIG.logoImage) {
    document.getElementById("brandMark").innerHTML = `<img src="${SITE_CONFIG.logoImage}" alt="${SITE_CONFIG.brandName} logo">`;
  }

  const whatsappMessage = encodeURIComponent("Hola, me interesa el catálogo de BIG SALE MODAS.");
  const whatsappLink = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${whatsappMessage}`;

  document.getElementById("heroWhatsApp").href = whatsappLink;
  document.getElementById("footerWhatsApp").href = whatsappLink;
  document.getElementById("heroWhatsApp").target = "_blank";
  document.getElementById("footerWhatsApp").target = "_blank";
}

function getCurrentVariant(product) {
  const selectedIndex = state.variantByProduct[product.code] ?? 0;
  return product.variants[selectedIndex] || product.variants[0];
}

function getCurrentView(product) {
  return state.viewByProduct[product.code] || "model";
}

function getCurrentImage(product) {
  const variant = getCurrentVariant(product);
  return getCurrentView(product) === "model" ? variant.modelImage : variant.frontImage;
}

function createProductCard(product) {
  const variant = getCurrentVariant(product);
  const image = getCurrentImage(product);
  const currentView = getCurrentView(product);
  const usdPrice = Number(product.price_usd).toFixed(2);
  const brlPrice = Number(product.price_brl).toFixed(2);
  const stockClass = product.stock <= 0 ? "out" : product.stock <= 10 ? "low" : "in";
  const stockLabel = product.stock <= 0 ? "Agotado" : `Stock: ${product.stock}`;
  const waMessage = encodeURIComponent(
    `Hola, me interesa este producto: ${product.code} - ${product.title} - Color: ${variant.color}`
  );
  const waLink = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${waMessage}`;

  const variantDots = product.variants.map((item, index) => `
    <button
      class="color-dot ${index === (state.variantByProduct[product.code] ?? 0) ? "active" : ""}"
      style="background:${item.hex};"
      data-action="variant"
      data-product-code="${product.code}"
      data-variant-index="${index}"
      aria-label="${item.color}"
      title="${item.color}"
    ></button>
  `).join("");

  return `
    <article class="product-card">
      <div class="product-media">
        <img src="${image}" alt="${product.title} en color ${variant.color}" loading="lazy" />
        <div class="badge-row">
          <div class="badge">${product.category}</div>
          <div class="badge stock ${stockClass}">${stockLabel}</div>
        </div>
      </div>

      <div class="product-body">
        <div class="product-top">
          <div>
            <h3>${product.title}</h3>
            <div class="product-code">${product.code}</div>
          </div>
        </div>

        <p class="product-desc">${product.description}</p>

        <div class="product-prices">
          <div><strong>USD:</strong> ${usdPrice}</div>
          <div><strong>BRL:</strong> ${brlPrice}</div>
        </div>

        <div class="product-meta">
          <div><strong>Tallas:</strong> ${product.sizes}</div>
          <div><strong>Tipo:</strong> ${product.type}</div>
        </div>

        <div class="product-extra">
          <div><strong>Cantidad por caja:</strong> <span>${product.box_quantity}</span></div>
          <div><strong>Color seleccionado:</strong> <span>${variant.color}</span></div>
        </div>

        <div class="view-switch">
          <button class="switch-btn ${currentView === "front" ? "active" : ""}" data-action="view" data-product-code="${product.code}" data-view="front">Vista frontal</button>
          <button class="switch-btn ${currentView === "model" ? "active" : ""}" data-action="view" data-product-code="${product.code}" data-view="model">En modelo</button>
        </div>

        <div class="colors">${variantDots}</div>

        <div class="product-footer">
          <div class="color-name">Color: <strong>${variant.color}</strong></div>
          <div class="contact-actions">
            <a class="mini-btn" href="${waLink}" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderCatalog() {
  const filtered = PRODUCTS.filter((product) => {
    const term = state.search.toLowerCase();

    const matchesSearch =
      product.title.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.variants.some((variant) => variant.color.toLowerCase().includes(term));

    const matchesFilter =
      state.filter === "all" || product.category === state.filter;

    return matchesSearch && matchesFilter;
  });

  if (!filtered.length) {
    catalogGrid.innerHTML = `
      <div class="info-card" style="grid-column: 1 / -1; text-align: center;">
        <div class="eyebrow">Sin resultados</div>
        <h3 style="font-size: 28px;">No se encontraron productos</h3>
        <p>Probá con otra búsqueda o categoría.</p>
      </div>
    `;
    return;
  }

  catalogGrid.innerHTML = filtered.map(createProductCard).join("");
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderCatalog();
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderCatalog();
  });
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const productCode = target.dataset.productCode;

  if (action === "view") {
    state.viewByProduct[productCode] = target.dataset.view;
    renderCatalog();
  }

  if (action === "variant") {
    state.variantByProduct[productCode] = Number(target.dataset.variantIndex);
    renderCatalog();
  }
});

fetch("products.json")
  .then(response => response.json())
  .then(data => {
    PRODUCTS = data;
    setupSiteConfig();
    renderCatalog();
  })
  .catch(error => {
    console.error("Error loading products:", error);
  });
  