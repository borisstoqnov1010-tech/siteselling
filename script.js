const STORAGE_KEY = "boris-web-studio-discounts";
const CONTENT_KEY = "boris-web-studio-content";
const THEME_KEY = "boris-web-studio-theme";
const ADMIN_PASSWORD = "kuchki55";
const ADMIN_SESSION_KEY = "boris-web-studio-admin-unlocked";
const SERVICES = ["cs2", "minecraft", "custom"];

const defaultContent = {
  heroEyebrow: "Бързи, модерни и зелени уебсайтове",
  heroTitle: "Сайт, който изглежда сериозно още от първия клик.",
  heroText: "Правя чисти, responsive сайтове за CS 2, Minecraft, лични проекти и малки бизнеси. Получаваш дизайн, структура и готов линк за поръчки през Discord.",
  cs2Badge: "Gaming пакет",
  cs2Title: "CS 2 Server",
  cs2Description: "Страница за CS 2 сървър с IP, Discord, правила, статус и силна първа визия.",
  cs2Price: "4",
  minecraftBadge: "Community пакет",
  minecraftTitle: "Minecraft Server",
  minecraftDescription: "Сайт за Minecraft сървър с секции за режимите, снимки, правила и join бутон.",
  minecraftPrice: "6",
  customBadge: "Custom пакет",
  customTitle: "Сайт по избор",
  customDescription: "Персонален сайт според твоята идея: портфолио, магазин, landing page или проект.",
  customPrice: "10",
};

const adminLogin = document.querySelector("#adminLogin");
const adminPassword = document.querySelector("#adminPassword");
const passwordStatus = document.querySelector("#passwordStatus");
const adminPanel = document.querySelector("#adminPanel");
const form = document.querySelector("#discountForm");
const resetButton = document.querySelector("#resetDiscounts");
const lockAdminButton = document.querySelector("#lockAdmin");
const statusText = document.querySelector("#adminStatus");
const serviceCards = Array.from(document.querySelectorAll(".service-card"));
const adminItems = Array.from(document.querySelectorAll(".discount-item"));
const themeButtons = Array.from(document.querySelectorAll("[data-theme-toggle]"));

function readJson(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function clampDiscount(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(number)));
}

function normalizePrice(value, fallback = 0) {
  const number = Number(value);

  if (Number.isNaN(number) || number < 0) {
    return Number(fallback);
  }

  return number;
}

function formatPrice(price) {
  return `${Number(price.toFixed(2))} €`;
}

function getContent() {
  return {
    ...defaultContent,
    ...readJson(CONTENT_KEY),
  };
}

function saveContent(content) {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
}

function applyContent(content) {
  document.querySelectorAll("[data-content]").forEach((element) => {
    const key = element.dataset.content;

    if (content[key]) {
      element.textContent = content[key];
    }
  });

  SERVICES.forEach((service) => {
    const price = normalizePrice(content[`${service}Price`], defaultContent[`${service}Price`]);

    document.querySelectorAll(`[data-service="${service}"]`).forEach((card) => {
      card.dataset.price = String(price);
    });

    document.querySelectorAll(`[data-admin-service="${service}"]`).forEach((item) => {
      item.dataset.adminPrice = String(price);
      const basePrice = item.querySelector(".discount-header span");

      if (basePrice) {
        basePrice.textContent = `Base ${formatPrice(price)}`;
      }
    });
  });
}

function fillContentForm(content) {
  if (!form) {
    return;
  }

  Object.entries(content).forEach(([key, value]) => {
    if (form.elements[key]) {
      form.elements[key].value = value;
    }
  });
}

function getContentFromForm() {
  if (!form) {
    return getContent();
  }

  const content = getContent();

  Object.keys(defaultContent).forEach((key) => {
    if (!form.elements[key]) {
      return;
    }

    content[key] = String(form.elements[key].value || "").trim();
  });

  SERVICES.forEach((service) => {
    const key = `${service}Price`;
    content[key] = String(normalizePrice(content[key], defaultContent[key]));
  });

  return content;
}

function loadDiscounts() {
  return readJson(STORAGE_KEY);
}

function saveDiscounts(discounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(discounts));
}

function getServiceSettings(discounts, service) {
  const saved = discounts[service];

  if (typeof saved === "number" || typeof saved === "string") {
    return {
      discount: clampDiscount(saved),
      duration: "",
    };
  }

  return {
    discount: clampDiscount(saved?.discount),
    duration: typeof saved?.duration === "string" ? saved.duration : "",
  };
}

function getDurationFromForm(service, data) {
  const duration = data.get(`${service}Duration`);

  if (duration === "custom") {
    return String(data.get(`${service}CustomDuration`) || "").trim();
  }

  return String(duration || "").trim();
}

function getFormDiscounts() {
  const data = new FormData(form);

  return SERVICES.reduce((discounts, service) => {
    discounts[service] = {
      discount: clampDiscount(data.get(service)),
      duration: getDurationFromForm(service, data),
    };

    return discounts;
  }, {});
}

function fillDiscountForm(discounts) {
  if (!form) {
    return;
  }

  SERVICES.forEach((service) => {
    const settings = getServiceSettings(discounts, service);
    const durationSelect = form.elements[`${service}Duration`];
    const customDuration = form.elements[`${service}CustomDuration`];

    if (form.elements[service]) {
      form.elements[service].value = settings.discount;
    }

    if (!durationSelect || !customDuration) {
      return;
    }

    const optionExists = Array.from(durationSelect.options).some((option) => {
      return option.value === settings.duration;
    });

    if (settings.duration && optionExists) {
      durationSelect.value = settings.duration;
      customDuration.value = "";
      customDuration.classList.add("is-hidden");
    } else if (settings.duration) {
      durationSelect.value = "custom";
      customDuration.value = settings.duration;
      customDuration.classList.remove("is-hidden");
    } else {
      durationSelect.value = "";
      customDuration.value = "";
      customDuration.classList.add("is-hidden");
    }
  });
}

function getDiscountedPrice(basePrice, discount) {
  return basePrice - (basePrice * discount) / 100;
}

function applyDiscounts(discounts) {
  serviceCards.forEach((card) => {
    const service = card.dataset.service;
    const basePrice = normalizePrice(card.dataset.price);
    const settings = getServiceSettings(discounts, service);
    const finalPrice = getDiscountedPrice(basePrice, settings.discount);
    const priceOutput = card.querySelector("[data-price-output]");
    const discountNote = card.querySelector("[data-discount-note]");
    const durationText = settings.duration ? ` за ${settings.duration}` : "";

    if (priceOutput) {
      priceOutput.textContent = formatPrice(finalPrice);
    }

    if (discountNote) {
      discountNote.textContent = settings.discount > 0
        ? `-${settings.discount}% отстъпка${durationText}, стара цена ${formatPrice(basePrice)}`
        : "";
    }
  });
}

function updateDurationFields() {
  if (!form) {
    return;
  }

  SERVICES.forEach((service) => {
    const durationSelect = form.elements[`${service}Duration`];
    const customDuration = form.elements[`${service}CustomDuration`];

    if (!durationSelect || !customDuration) {
      return;
    }

    customDuration.classList.toggle("is-hidden", durationSelect.value !== "custom");
  });
}

function updateAdminPreview(discounts) {
  adminItems.forEach((item) => {
    const service = item.dataset.adminService;
    const basePrice = normalizePrice(item.dataset.adminPrice);
    const settings = getServiceSettings(discounts, service);
    const finalPrice = getDiscountedPrice(basePrice, settings.discount);
    const preview = item.querySelector("[data-price-preview]");
    const durationText = settings.duration ? `, срок: ${settings.duration}` : "";

    if (!preview) {
      return;
    }

    preview.textContent = settings.discount > 0
      ? `Нова цена: ${formatPrice(finalPrice)} вместо ${formatPrice(basePrice)} (${settings.discount}% отстъпка${durationText})`
      : `Нова цена: ${formatPrice(basePrice)} без отстъпка`;
  });
}

function showStatus(message) {
  if (statusText) {
    statusText.textContent = message;
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  themeButtons.forEach((button) => {
    button.textContent = theme === "light" ? "Тъмна тема" : "Светла тема";
  });
}

function unlockAdmin() {
  if (!adminLogin || !adminPanel || !adminPassword || !passwordStatus) {
    return;
  }

  adminLogin.classList.add("is-hidden");
  adminPanel.classList.remove("is-hidden");
  passwordStatus.textContent = "";
  adminPassword.value = "";
  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
}

function lockAdmin() {
  if (!adminLogin || !adminPanel) {
    return;
  }

  adminLogin.classList.remove("is-hidden");
  adminPanel.classList.add("is-hidden");
  showStatus("");
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function resetDiscounts() {
  return SERVICES.reduce((discounts, service) => {
    discounts[service] = {
      discount: 0,
      duration: "",
    };

    return discounts;
  }, {});
}

setTheme(localStorage.getItem(THEME_KEY) || "dark");

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  });
});

const content = getContent();
const savedDiscounts = loadDiscounts();
applyContent(content);
fillContentForm(content);
fillDiscountForm(savedDiscounts);
applyDiscounts(savedDiscounts);
updateDurationFields();
updateAdminPreview(savedDiscounts);

if (adminLogin && sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
  unlockAdmin();
}

if (adminLogin) {
  adminLogin.addEventListener("submit", (event) => {
    event.preventDefault();

    if (adminPassword.value === ADMIN_PASSWORD) {
      unlockAdmin();
      return;
    }

    passwordStatus.textContent = "Грешна парола.";
    adminPassword.value = "";
    adminPassword.focus();
  });
}

if (form) {
  form.addEventListener("input", () => {
    const draftContent = getContentFromForm();
    const discounts = getFormDiscounts();

    applyContent(draftContent);
    updateDurationFields();
    updateAdminPreview(discounts);
    applyDiscounts(discounts);
    showStatus("Преглед преди запазване.");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nextContent = getContentFromForm();
    const discounts = getFormDiscounts();

    applyContent(nextContent);
    fillContentForm(nextContent);
    fillDiscountForm(discounts);
    updateDurationFields();
    updateAdminPreview(discounts);
    applyDiscounts(discounts);
    saveContent(nextContent);
    saveDiscounts(discounts);
    showStatus("Текстовете, цените и отстъпките са запазени.");
  });
}

if (resetButton) {
  resetButton.addEventListener("click", () => {
    const discounts = resetDiscounts();

    fillDiscountForm(discounts);
    updateDurationFields();
    updateAdminPreview(discounts);
    applyDiscounts(discounts);
    saveDiscounts(discounts);
    showStatus("Отстъпките са изчистени.");
  });
}

if (lockAdminButton) {
  lockAdminButton.addEventListener("click", () => {
    lockAdmin();
  });
}
