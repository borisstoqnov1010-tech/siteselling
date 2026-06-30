const STORAGE_KEY = "boris-web-studio-discounts";
const CONTENT_KEY = "boris-web-studio-content";
const THEME_KEY = "boris-web-studio-theme";
const REMOTE_SETTINGS_URL = "settings.php";
const SETTINGS_SYNC_INTERVAL = 8000;
const ADMIN_PASSWORD = "kuchki55";
const ADMIN_SESSION_KEY = "boris-web-studio-admin-unlocked";
const ADMIN_USER_KEY = "boris-web-studio-admin-user";
const SERVICES = ["cs2", "minecraft", "custom"];
let currentSettingsSignature = "";
let settingsSyncTimer = null;
let currentCheckoutOrder = null;
let currentAdminUser = "owner";

const defaultContent = {
  announcementText: "",
  announcementBg: "#22c55e",
  announcementTextColor: "#031008",
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
  galleryOneTitle: "CS 2 landing page",
  galleryOneDescription: "Hero секция, IP адрес, Discord бутон, правила и сървър статус.",
  galleryTwoTitle: "Minecraft community",
  galleryTwoDescription: "Режими, снимки, правила, join секция и информация за играчите.",
  galleryThreeTitle: "Custom project",
  galleryThreeDescription: "Портфолио, бизнес сайт или online presence с уникална структура.",
  reviewOneText: "“Сайтът стана бързо и изглежда много по-сериозно от стария ни Discord invite.”",
  reviewOneAuthor: "CS 2 клиент",
  reviewTwoText: "“Хареса ми, че работи добре на телефон и всичко е подредено ясно.”",
  reviewTwoAuthor: "Minecraft проект",
  reviewThreeText: "“Получих точния стил, който исках, плюс лесен начин хората да поръчват.”",
  reviewThreeAuthor: "Custom сайт",
  logoImage: "favicon.png",
  heroImage: "favicon.png",
  galleryOneImage: "",
  galleryTwoImage: "",
  galleryThreeImage: "",
};

const adminLogin = document.querySelector("#adminLogin");
const adminUsername = document.querySelector("#adminUsername");
const adminPassword = document.querySelector("#adminPassword");
const passwordStatus = document.querySelector("#passwordStatus");
const adminPanel = document.querySelector("#adminPanel");
const form = document.querySelector("#discountForm");
const resetButton = document.querySelector("#resetDiscounts");
const lockAdminButton = document.querySelector("#lockAdmin");
const statusText = document.querySelector("#adminStatus");
const syncStatus = document.querySelector("[data-sync-status]");
const serviceCards = Array.from(document.querySelectorAll(".service-card"));
const adminItems = Array.from(document.querySelectorAll(".discount-item"));
const themeButtons = Array.from(document.querySelectorAll("[data-theme-toggle]"));
const chatToggle = document.querySelector("[data-chat-toggle]");
const chatPanel = document.querySelector("[data-chat-panel]");
const chatClose = document.querySelector("[data-chat-close]");
const chatForm = document.querySelector("[data-chat-form]");
const chatMessages = document.querySelector("[data-chat-messages]");
const orderChoiceButtons = Array.from(document.querySelectorAll("[data-order-choice]"));
const checkoutModal = document.querySelector("[data-checkout-modal]");
const checkoutTitle = document.querySelector("[data-checkout-title]");
const checkoutPrice = document.querySelector("[data-checkout-price]");
const checkoutStatus = document.querySelector("[data-checkout-status]");
const checkoutNameInput = document.querySelector("[data-checkout-name]");
const checkoutDiscordInput = document.querySelector("[data-checkout-discord]");
const payNowLink = document.querySelector("[data-pay-now]");
const paymentMethods = document.querySelector("[data-payment-methods]");
const payRevolutLink = document.querySelector("[data-pay-revolut]");
const payPaypalLink = document.querySelector("[data-pay-paypal]");
const discordOrderLink = document.querySelector("[data-discord-order]");
const checkoutCloseButtons = Array.from(document.querySelectorAll("[data-checkout-close]"));
const orderForm = document.querySelector("[data-order-form]");
const orderStatus = document.querySelector("[data-order-status]");
const ordersPanel = document.querySelector("#ordersPanel");
const ordersList = document.querySelector("[data-orders-list]");
const refreshOrdersButton = document.querySelector("[data-refresh-orders]");
const accountForm = document.querySelector("[data-account-form]");
const accountStatus = document.querySelector("[data-account-status]");
const accountsList = document.querySelector("[data-accounts-list]");
const refreshAccountsButton = document.querySelector("[data-refresh-accounts]");
const logsList = document.querySelector("[data-logs-list]");
const refreshLogsButton = document.querySelector("[data-refresh-logs]");
const uploadImagesButton = document.querySelector("[data-upload-images]");
const uploadStatus = document.querySelector("[data-upload-status]");
const announcementBar = document.querySelector("[data-announcement-bar]");
const announcementText = document.querySelector("[data-announcement-text]");
const adminTabButtons = Array.from(document.querySelectorAll("[data-admin-tab]"));
const adminTabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));
const IMAGE_KEYS = ["logoImage", "heroImage", "galleryOneImage", "galleryTwoImage", "galleryThreeImage"];

function readJson(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function getCloudSettingsUrl() {
  const databaseUrl = String(window.BORIS_SYNC_DATABASE_URL || "").trim().replace(/\/+$/, "");

  if (!databaseUrl) {
    return "";
  }

  return `${databaseUrl}/settings.json`;
}

function getCloudOrdersUrl() {
  const databaseUrl = String(window.BORIS_SYNC_DATABASE_URL || "").trim().replace(/\/+$/, "");

  if (!databaseUrl) {
    return "";
  }

  return `${databaseUrl}/orders.json`;
}

function getCloudAccountsUrl() {
  const databaseUrl = String(window.BORIS_SYNC_DATABASE_URL || "").trim().replace(/\/+$/, "");

  if (!databaseUrl) {
    return "";
  }

  return `${databaseUrl}/adminAccounts.json`;
}

function getCloudLogsUrl() {
  const databaseUrl = String(window.BORIS_SYNC_DATABASE_URL || "").trim().replace(/\/+$/, "");

  if (!databaseUrl) {
    return "";
  }

  return `${databaseUrl}/adminLogs.json`;
}

function isGithubPages() {
  return window.location.hostname.endsWith("github.io");
}

function getSyncMode() {
  if (getCloudSettingsUrl()) {
    return "cloud";
  }

  if (isGithubPages()) {
    return "github-unconfigured";
  }

  return "php";
}

function setSyncStatus(message, type = "ok") {
  if (!syncStatus) {
    return;
  }

  syncStatus.textContent = message;
  syncStatus.classList.toggle("is-error", type === "error");
  syncStatus.classList.toggle("is-ok", type !== "error");
}

function getDiscordInvite() {
  return String(window.BORIS_DISCORD_INVITE || "https://discord.gg/sSkQC2UmkY").trim();
}

function getPaymentLink(service) {
  const methods = getPaymentMethods(service);

  return methods.revolut || methods.paypal;
}

function getPaymentMethods(service) {
  const links = window.BORIS_PAYMENT_LINKS || {};
  const serviceLinks = links[service] || {};
  const defaultLinks = links.default || {};

  if (typeof serviceLinks === "string" || typeof defaultLinks === "string") {
    return {
      revolut: "",
      paypal: String(serviceLinks || defaultLinks || "").trim(),
    };
  }

  return {
    revolut: String(serviceLinks.revolut || defaultLinks.revolut || "").trim(),
    paypal: String(serviceLinks.paypal || defaultLinks.paypal || "").trim(),
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.json();
}

function normalizeSharedState(data = {}) {
  const settings = data || {};

  return {
    content: {
      ...defaultContent,
      ...(settings.content || {}),
    },
    discounts: settings.discounts || {},
    updatedAt: settings.updatedAt || "",
    isShared: true,
  };
}

async function loadSharedState() {
  const cloudSettingsUrl = getCloudSettingsUrl();

  if (cloudSettingsUrl) {
    try {
      const data = await requestJson(`${cloudSettingsUrl}?v=${Date.now()}`);
      setSyncStatus("Cloud sync е свързан. Промените ще се виждат при всички.");
      return normalizeSharedState(data);
    } catch {
      setSyncStatus("Cloud sync URL има, но не се зарежда. Провери Firebase rules и URL-а.", "error");
    }
  }

  if (getSyncMode() === "github-unconfigured") {
    setSyncStatus("GitHub Pages няма база. Добави Firebase URL в sync-config.js, иначе промените са само локално.", "error");

    return {
      content: getContent(),
      discounts: loadDiscounts(),
      isShared: false,
    };
  }

  try {
    const data = await requestJson(`${REMOTE_SETTINGS_URL}?v=${Date.now()}`);
    setSyncStatus("PHP sync е свързан. Промените ще се виждат при всички.");
    return normalizeSharedState(data);
  } catch {
    setSyncStatus("Няма активна синхронизация. За GitHub Pages сложи Firebase URL в sync-config.js.", "error");

    return {
      content: getContent(),
      discounts: loadDiscounts(),
      isShared: false,
    };
  }
}

async function saveSharedState(content, discounts) {
  const cloudSettingsUrl = getCloudSettingsUrl();

  if (cloudSettingsUrl) {
    const settings = {
      content,
      discounts,
      updatedAt: new Date().toISOString(),
    };

    await requestJson(cloudSettingsUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    return {
      ok: true,
      settings,
    };
  }

  if (getSyncMode() === "github-unconfigured") {
    throw new Error("GitHub Pages needs a Firebase database URL in sync-config.js");
  }

  const response = await fetch(REMOTE_SETTINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: ADMIN_PASSWORD,
      content,
      discounts,
    }),
  });

  if (!response.ok) {
    throw new Error("Shared save failed");
  }

  return response.json();
}

function getSettingsSignature(content, discounts, updatedAt = "") {
  return JSON.stringify({
    content,
    discounts,
    updatedAt,
  });
}

function persistState(content, discounts) {
  saveContent(content);
  saveDiscounts(discounts);
}

function applySiteState(content, discounts, options = {}) {
  const shouldFillForms = options.fillForms ?? true;
  const shouldPersist = options.persist ?? true;

  if (shouldPersist) {
    persistState(content, discounts);
  }

  applyContent(content);
  applyDiscounts(discounts);
  updateDurationFields();
  updateAdminPreview(discounts);

  if (shouldFillForms) {
    fillContentForm(content);
    fillDiscountForm(discounts);
  }
}

function isAdminUnlocked() {
  return Boolean(adminPanel && !adminPanel.classList.contains("is-hidden"));
}

async function refreshSharedState(options = {}) {
  const sharedState = await loadSharedState();

  if (!sharedState.isShared) {
    return false;
  }

  const signature = getSettingsSignature(
    sharedState.content,
    sharedState.discounts,
    sharedState.updatedAt
  );

  if (!options.force && signature === currentSettingsSignature) {
    return true;
  }

  currentSettingsSignature = signature;
  applySiteState(sharedState.content, sharedState.discounts, {
    fillForms: !isAdminUnlocked() || options.fillForms === true,
    persist: true,
  });

  return true;
}

function startSettingsSync() {
  if (settingsSyncTimer) {
    clearInterval(settingsSyncTimer);
  }

  settingsSyncTimer = setInterval(() => {
    refreshSharedState().catch(() => {});
  }, SETTINGS_SYNC_INTERVAL);
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

function applyImages(content) {
  if (content.logoImage) {
    document.querySelectorAll('link[rel="icon"]').forEach((link) => {
      link.href = content.logoImage;
    });
  }

  document.querySelectorAll("[data-image]").forEach((element) => {
    const key = element.dataset.image;
    const imageUrl = content[key] || defaultContent[key] || "";

    if (!imageUrl) {
      element.classList.add("is-hidden");
      return;
    }

    if (element.tagName === "IMG") {
      element.src = imageUrl;
    }

    element.classList.remove("is-hidden");
  });
}

function applyAnnouncement(content) {
  if (!announcementBar || !announcementText) {
    return;
  }

  const text = String(content.announcementText || "").trim();

  if (!text) {
    announcementBar.classList.add("is-hidden");
    document.body.classList.remove("has-announcement");
    document.documentElement.style.setProperty("--announcement-height-active", "0");
    return;
  }

  const background = content.announcementBg || defaultContent.announcementBg;
  const textColor = content.announcementTextColor || defaultContent.announcementTextColor;

  announcementText.textContent = text;
  announcementBar.style.setProperty("--announcement-bg", background);
  announcementBar.style.setProperty("--announcement-text", textColor);
  announcementBar.classList.remove("is-hidden");
  document.body.classList.add("has-announcement");
  document.documentElement.style.setProperty("--announcement-height-active", "var(--announcement-height, 42px)");
}

function applyContent(content) {
  applyAnnouncement(content);

  document.querySelectorAll("[data-content]").forEach((element) => {
    const key = element.dataset.content;

    if (content[key]) {
      element.textContent = content[key];
    }
  });

  applyImages(content);

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
    if (IMAGE_KEYS.includes(key)) {
      return;
    }

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
    if (IMAGE_KEYS.includes(key)) {
      return;
    }

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
  if (adminUsername) {
    adminUsername.value = "";
  }
  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  sessionStorage.setItem(ADMIN_USER_KEY, currentAdminUser);
  activateAdminTab("content");
}

function lockAdmin() {
  if (!adminLogin || !adminPanel) {
    return;
  }

  adminLogin.classList.remove("is-hidden");
  adminPanel.classList.add("is-hidden");
  if (ordersPanel) {
    ordersPanel.classList.add("is-hidden");
  }
  showStatus("");
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_USER_KEY);
}

function activateAdminTab(tabName) {
  adminTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.adminTab === tabName);
  });

  adminTabPanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.tabPanel !== tabName);
  });

  if (tabName === "orders") {
    loadOrders();
  }

  if (tabName === "accounts") {
    loadAccounts();
  }

  if (tabName === "logs") {
    loadLogs();
  }
}

function initAdminTabs() {
  if (adminTabButtons.length === 0) {
    return;
  }

  adminTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateAdminTab(button.dataset.adminTab);
    });
  });
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

function addChatMessage(text, type = "bot") {
  if (!chatMessages) {
    return;
  }

  const message = document.createElement("div");
  message.className = `chat-message ${type}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getLocalServiceSummary() {
  if (serviceCards.length === 0) {
    return "CS 2 Server, Minecraft Server и Сайт по избор.";
  }

  return serviceCards.map((card) => {
    const title = card.querySelector("h3")?.textContent?.trim() || "Пакет";
    const price = card.querySelector("[data-price-output]")?.textContent?.trim() || "";
    const discount = card.querySelector("[data-discount-note]")?.textContent?.trim() || "";

    return `- ${title}: ${price}${discount ? ` (${discount})` : ""}`;
  }).join("\n");
}

function getLocalChatReply(text) {
  const question = text.toLowerCase();
  const services = getLocalServiceSummary();
  const discord = getDiscordInvite();

  if (question.includes("цена") || question.includes("колко") || question.includes("пакет") || question.includes("отстъп")) {
    return `Ето текущите пакети:\n${services}\n\nЗа поръчка можеш да пишеш в Discord: ${discord}`;
  }

  if (question.includes("поръч") || question.includes("discord") || question.includes("контакт")) {
    return `За поръчка пиши в Discord: ${discord}. Изпрати какъв сайт искаш, име на проекта, цветове, текстове и примерен стил.`;
  }

  if (question.includes("какво") || question.includes("трябва") || question.includes("изпрат")) {
    return "За да започнем, изпрати: име на проекта, тип сайт, Discord линк, текстове, снимки/лого, цветове и пример за стил, който харесваш.";
  }

  return `Мога да помогна с избор на пакет, цена, срок и поръчка.\n\nТекущи пакети:\n${services}\n\nПиши в Discord: ${discord}`;
}

function initChatbot() {
  if (!chatToggle || !chatPanel || !chatForm) {
    return;
  }

  chatToggle.addEventListener("click", () => {
    const isOpening = chatPanel.classList.contains("is-hidden");
    chatPanel.classList.toggle("is-hidden", !isOpening);
    chatToggle.setAttribute("aria-expanded", String(isOpening));
  });

  if (chatClose) {
    chatClose.addEventListener("click", () => {
      chatPanel.classList.add("is-hidden");
      chatToggle.setAttribute("aria-expanded", "false");
    });
  }

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = chatForm.elements.message;
    const text = String(input.value || "").trim();

    if (!text) {
      return;
    }

    addChatMessage(text, "user");
    input.value = "";
    addChatMessage("Мисля...", "bot");

    const thinkingMessage = chatMessages.lastElementChild;

    try {
      const response = await fetch("chat.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      thinkingMessage.textContent = data.reply || getLocalChatReply(text);
    } catch {
      thinkingMessage.textContent = getLocalChatReply(text);
    }
  });
}

function closeCheckout() {
  if (!checkoutModal) {
    return;
  }

  checkoutModal.classList.add("is-hidden");
  checkoutModal.setAttribute("aria-hidden", "true");
}

function openCheckout(service) {
  if (!checkoutModal) {
    return;
  }

  const card = document.querySelector(`[data-service="${service}"]`);
  const title = card?.querySelector("h3")?.textContent?.trim() || "Пакет";
  const price = card?.querySelector("[data-price-output]")?.textContent?.trim() || "";
  const paymentMethodsForService = getPaymentMethods(service);
  const hasPaymentMethod = Boolean(paymentMethodsForService.revolut || paymentMethodsForService.paypal);
  const discordInvite = getDiscordInvite();
  currentCheckoutOrder = {
    service: title,
    budget: price || "-",
    description: "Клиентът натисна Поръчай от пакетите.",
  };

  if (checkoutTitle) {
    checkoutTitle.textContent = title;
  }

  if (checkoutPrice) {
    checkoutPrice.textContent = price ? `Цена: ${price}` : "";
  }

  if (discordOrderLink) {
    discordOrderLink.href = discordInvite;
  }

  if (payNowLink) {
    payNowLink.classList.toggle("is-disabled", !hasPaymentMethod);
    payNowLink.setAttribute("aria-disabled", String(!hasPaymentMethod));
  }

  if (paymentMethods) {
    paymentMethods.classList.add("is-hidden");
  }

  if (checkoutNameInput) {
    checkoutNameInput.value = "";
  }

  if (checkoutDiscordInput) {
    checkoutDiscordInput.value = "";
  }

  if (payRevolutLink) {
    payRevolutLink.href = paymentMethodsForService.revolut || "#";
    payRevolutLink.classList.toggle("is-disabled", !paymentMethodsForService.revolut);
    payRevolutLink.setAttribute("aria-disabled", String(!paymentMethodsForService.revolut));
  }

  if (payPaypalLink) {
    payPaypalLink.href = paymentMethodsForService.paypal || "#";
    payPaypalLink.classList.toggle("is-disabled", !paymentMethodsForService.paypal);
    payPaypalLink.setAttribute("aria-disabled", String(!paymentMethodsForService.paypal));
  }

  if (checkoutStatus) {
    checkoutStatus.textContent = hasPaymentMethod
      ? "Натисни плащане и избери Revolut или PayPal. Discord остава вариант, ако искаш първо да уточним проекта."
      : "Онлайн плащането още няма зададен Revolut или PayPal линк. Избери Discord за най-сигурна поръчка.";
  }

  checkoutModal.classList.remove("is-hidden");
  checkoutModal.setAttribute("aria-hidden", "false");
}

function getCheckoutCustomer() {
  const name = String(checkoutNameInput?.value || "").trim();
  const discord = String(checkoutDiscordInput?.value || "").trim();

  if (!name || !discord) {
    if (checkoutStatus) {
      checkoutStatus.textContent = "Първо напиши име и Discord, за да продължиш.";
    }

    if (!name) {
      checkoutNameInput?.focus();
    } else {
      checkoutDiscordInput?.focus();
    }

    return null;
  }

  return {
    name,
    discord,
  };
}

function initCheckout() {
  orderChoiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openCheckout(button.dataset.orderChoice);
    });
  });

  checkoutCloseButtons.forEach((button) => {
    button.addEventListener("click", closeCheckout);
  });

  if (payNowLink && paymentMethods) {
    payNowLink.addEventListener("click", () => {
      if (payNowLink.classList.contains("is-disabled")) {
        return;
      }

      if (!getCheckoutCustomer()) {
        return;
      }

      paymentMethods.classList.toggle("is-hidden");

      if (checkoutStatus) {
        checkoutStatus.textContent = "Избери Revolut или PayPal, за да продължиш към плащане.";
      }
    });
  }

  async function openCheckoutLink(event, link, paymentMethod, description) {
    event.preventDefault();

    if (!link || link.classList.contains("is-disabled")) {
      return;
    }

    const customer = getCheckoutCustomer();

    if (!customer) {
      return;
    }

    const url = link.href;
    const nextTab = window.open("about:blank", "_blank");

    if (nextTab) {
      nextTab.opener = null;
    }

    try {
      await saveOrder({
        ...(currentCheckoutOrder || {}),
        ...customer,
        source: "Checkout popup",
        paymentMethod,
        description,
      });
    } catch {}

    if (nextTab) {
      nextTab.location.href = url;
      return;
    }

    window.location.href = url;
  }

  if (discordOrderLink) {
    discordOrderLink.addEventListener("click", (event) => {
      openCheckoutLink(event, discordOrderLink, "Discord", "Клиентът избра поръчка през Discord.");
    });
  }

  if (payRevolutLink) {
    payRevolutLink.addEventListener("click", (event) => {
      openCheckoutLink(event, payRevolutLink, "Revolut", "Клиентът избра плащане през Revolut.");
    });
  }

  if (payPaypalLink) {
    payPaypalLink.addEventListener("click", (event) => {
      openCheckoutLink(event, payPaypalLink, "PayPal", "Клиентът избра плащане през PayPal.");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCheckout();
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createOrder(payload) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(payload.name || "-").trim() || "-",
    discord: String(payload.discord || "-").trim() || "-",
    service: String(payload.service || "Нова заявка").trim() || "Нова заявка",
    budget: String(payload.budget || "-").trim() || "-",
    description: String(payload.description || "-").trim() || "-",
    source: String(payload.source || "Форма").trim(),
    paymentMethod: String(payload.paymentMethod || "").trim(),
    status: String(payload.status || "new").trim(),
    createdAt: new Date().toISOString(),
  };
}

function normalizeOrders(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  return Object.entries(data).map(([storageId, order]) => ({
    ...(order || {}),
    id: order?.id || storageId,
    storageId,
  }));
}

async function saveOrder(payload) {
  const order = createOrder(payload);
  const cloudOrdersUrl = getCloudOrdersUrl();

  if (cloudOrdersUrl) {
    await requestJson(cloudOrdersUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    return {
      ok: true,
      order,
    };
  }

  const response = await fetch("orders.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    throw new Error("Order request failed");
  }

  return response.json();
}

async function updateOrderStatus(orderId, status) {
  const cloudOrdersUrl = getCloudOrdersUrl();

  if (cloudOrdersUrl) {
    await requestJson(`${cloudOrdersUrl}/${encodeURIComponent(orderId)}.json`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        updatedAt: new Date().toISOString(),
      }),
    });

    return;
  }

  const response = await fetch("orders.php", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: ADMIN_PASSWORD,
      id: orderId,
      status,
    }),
  });

  if (!response.ok) {
    throw new Error("Order update failed");
  }
}

async function deleteOrder(orderId) {
  const cloudOrdersUrl = getCloudOrdersUrl();

  if (cloudOrdersUrl) {
    await requestJson(`${cloudOrdersUrl}/${encodeURIComponent(orderId)}.json`, {
      method: "DELETE",
    });

    return;
  }

  const response = await fetch("orders.php", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: ADMIN_PASSWORD,
      id: orderId,
    }),
  });

  if (!response.ok) {
    throw new Error("Order delete failed");
  }
}

async function submitOrder(formElement) {
  const data = new FormData(formElement);
  const payload = Object.fromEntries(data.entries());

  return saveOrder({
    ...payload,
    source: "Форма от сайта",
  });
}

function getOrderStatusLabel(status) {
  if (status === "done") {
    return "Готова";
  }

  if (status === "cancelled") {
    return "Отказана";
  }

  return "Нова";
}

function normalizeRecordList(data) {
  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      storageId: item.id || String(index),
      ...item,
    }));
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  return Object.entries(data).map(([storageId, item]) => ({
    storageId,
    ...(item || {}),
  }));
}

function getLocalAccounts() {
  return readJson("boris-web-studio-admin-accounts", {});
}

function saveLocalAccounts(accounts) {
  localStorage.setItem("boris-web-studio-admin-accounts", JSON.stringify(accounts));
}

async function loadAccountsData() {
  const cloudAccountsUrl = getCloudAccountsUrl();

  if (cloudAccountsUrl) {
    return normalizeRecordList(await requestJson(`${cloudAccountsUrl}?v=${Date.now()}`));
  }

  return normalizeRecordList(getLocalAccounts());
}

async function saveAccount(username, password) {
  const account = {
    username,
    password,
    createdAt: new Date().toISOString(),
  };
  const cloudAccountsUrl = getCloudAccountsUrl();

  if (cloudAccountsUrl) {
    await requestJson(`${cloudAccountsUrl}/${encodeURIComponent(username)}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(account),
    });
    return account;
  }

  const accounts = getLocalAccounts();
  accounts[username] = account;
  saveLocalAccounts(accounts);
  return account;
}

async function deleteAccount(username) {
  const cloudAccountsUrl = getCloudAccountsUrl();

  if (cloudAccountsUrl) {
    await requestJson(`${cloudAccountsUrl}/${encodeURIComponent(username)}.json`, {
      method: "DELETE",
    });
    return;
  }

  const accounts = getLocalAccounts();
  delete accounts[username];
  saveLocalAccounts(accounts);
}

function getLocalLogs() {
  return readJson("boris-web-studio-admin-logs", []);
}

function saveLocalLogs(logs) {
  localStorage.setItem("boris-web-studio-admin-logs", JSON.stringify(logs.slice(0, 100)));
}

async function addAdminLog(action, details = "") {
  const log = {
    action,
    details,
    user: currentAdminUser || "owner",
    createdAt: new Date().toISOString(),
  };
  const cloudLogsUrl = getCloudLogsUrl();

  if (cloudLogsUrl) {
    await requestJson(cloudLogsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(log),
    });
    return;
  }

  const logs = getLocalLogs();
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...log,
  });
  saveLocalLogs(logs);
}

async function authenticateAdmin(username, password) {
  if (password === ADMIN_PASSWORD) {
    return username || "owner";
  }

  if (!username || !password) {
    return "";
  }

  try {
    const accounts = await loadAccountsData();
    const match = accounts.find((account) => {
      return account.username === username && account.password === password;
    });

    return match ? match.username : "";
  } catch {
    return "";
  }
}

async function loadOrders() {
  if (!ordersList) {
    return;
  }

  ordersList.innerHTML = '<p class="empty-orders">Зареждане...</p>';

  try {
    const cloudOrdersUrl = getCloudOrdersUrl();
    let orders = [];

    if (cloudOrdersUrl) {
      const data = await requestJson(`${cloudOrdersUrl}?v=${Date.now()}`);
      orders = normalizeOrders(data);
    } else {
      const response = await fetch(`orders.php?password=${encodeURIComponent(ADMIN_PASSWORD)}&v=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Orders request failed");
      }

      const data = await response.json();
      orders = Array.isArray(data.orders) ? data.orders : [];
    }

    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (orders.length === 0) {
      ordersList.innerHTML = '<p class="empty-orders">Все още няма заявки.</p>';
      return;
    }

    ordersList.innerHTML = orders.map((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString("bg-BG") : "";
      const status = order.status || "new";
      const orderId = order.storageId || order.id;

      return `
        <article class="order-card" data-order-card="${escapeHtml(orderId)}">
          <h4>${escapeHtml(order.service || "Нова заявка")}</h4>
          <span class="order-status-badge ${escapeHtml(status)}">${escapeHtml(getOrderStatusLabel(status))}</span>
          <p><strong>Име:</strong> ${escapeHtml(order.name || "-")}</p>
          <p><strong>Discord:</strong> ${escapeHtml(order.discord || "-")}</p>
          <p><strong>Бюджет:</strong> ${escapeHtml(order.budget || "-")}</p>
          <p><strong>Източник:</strong> ${escapeHtml(order.source || "-")}</p>
          <p><strong>Плащане:</strong> ${escapeHtml(order.paymentMethod || "-")}</p>
          <p><strong>Описание:</strong> ${escapeHtml(order.description || "-")}</p>
          <p><strong>Дата:</strong> ${escapeHtml(createdAt)}</p>
          <div class="order-actions-row">
            <button type="button" data-order-status="done" data-order-id="${escapeHtml(orderId)}">Готова</button>
            <button type="button" data-order-status="cancelled" data-order-id="${escapeHtml(orderId)}">Отказана</button>
            <button type="button" class="danger-button" data-order-delete data-order-id="${escapeHtml(orderId)}">Изтрий</button>
          </div>
        </article>
      `;
    }).join("");
  } catch {
    ordersList.innerHTML = '<p class="empty-orders">Не успях да заредя заявките. Провери Firebase URL/rules или PHP хостинга.</p>';
  }
}

async function loadAccounts() {
  if (!accountsList) {
    return;
  }

  accountsList.innerHTML = '<p class="empty-orders">Зареждане...</p>';

  try {
    const accounts = await loadAccountsData();

    if (accounts.length === 0) {
      accountsList.innerHTML = '<p class="empty-orders">Няма създадени акаунти.</p>';
      return;
    }

    accountsList.innerHTML = accounts.map((account) => {
      const createdAt = account.createdAt ? new Date(account.createdAt).toLocaleString("bg-BG") : "";

      return `
        <article class="order-card">
          <h4>${escapeHtml(account.username || "-")}</h4>
          <p><strong>Създаден:</strong> ${escapeHtml(createdAt || "-")}</p>
          <div class="order-actions-row">
            <button type="button" class="danger-button" data-account-delete="${escapeHtml(account.username || "")}">Изтрий</button>
          </div>
        </article>
      `;
    }).join("");
  } catch {
    accountsList.innerHTML = '<p class="empty-orders">Не успях да заредя акаунтите. Провери Firebase rules.</p>';
  }
}

async function loadLogs() {
  if (!logsList) {
    return;
  }

  logsList.innerHTML = '<p class="empty-orders">Зареждане...</p>';

  try {
    const cloudLogsUrl = getCloudLogsUrl();
    let logs = [];

    if (cloudLogsUrl) {
      logs = normalizeRecordList(await requestJson(`${cloudLogsUrl}?v=${Date.now()}`));
    } else {
      logs = normalizeRecordList(getLocalLogs());
    }

    logs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (logs.length === 0) {
      logsList.innerHTML = '<p class="empty-orders">Още няма логове.</p>';
      return;
    }

    logsList.innerHTML = logs.slice(0, 100).map((log) => {
      const createdAt = log.createdAt ? new Date(log.createdAt).toLocaleString("bg-BG") : "";

      return `
        <article class="order-card log-card">
          <h4>${escapeHtml(log.action || "-")}</h4>
          <p><strong>Потребител:</strong> ${escapeHtml(log.user || "-")}</p>
          <p><strong>Детайли:</strong> ${escapeHtml(log.details || "-")}</p>
          <time>${escapeHtml(createdAt)}</time>
        </article>
      `;
    }).join("");
  } catch {
    logsList.innerHTML = '<p class="empty-orders">Не успях да заредя логовете. Провери Firebase rules.</p>';
  }
}

async function uploadImages() {
  if (!form || !uploadImagesButton) {
    return;
  }

  const uploadData = new FormData();
  let hasFile = false;

  uploadData.append("password", ADMIN_PASSWORD);

  IMAGE_KEYS.forEach((key) => {
    const input = form.elements[key];

    if (input?.files?.[0]) {
      uploadData.append(key, input.files[0]);
      hasFile = true;
    }
  });

  if (!hasFile) {
    if (uploadStatus) {
      uploadStatus.textContent = "Избери поне една снимка.";
    }
    return;
  }

  if (uploadStatus) {
    uploadStatus.textContent = "Качване...";
  }

  const response = await fetch("upload.php", {
    method: "POST",
    body: uploadData,
  });

  if (!response.ok) {
    throw new Error("Image upload failed");
  }

  return response.json();
}

function initImageUploads() {
  if (!uploadImagesButton) {
    return;
  }

  uploadImagesButton.addEventListener("click", async () => {
    try {
      const result = await uploadImages();

      if (!result?.content) {
        return;
      }

      const content = {
        ...getContentFromForm(),
        ...result.content,
      };
      const discounts = form ? getFormDiscounts() : loadDiscounts();

      applySiteState(content, discounts);
      await refreshSharedState({
        force: true,
        fillForms: false,
      });

      IMAGE_KEYS.forEach((key) => {
        const input = form.elements[key];

        if (input) {
          input.value = "";
        }
      });

      if (uploadStatus) {
        uploadStatus.textContent = "Снимките са качени и запазени.";
      }

      await addAdminLog("Качени снимки", "Обновени изображения от admin панела").catch(() => {});
    } catch {
      if (uploadStatus) {
        uploadStatus.textContent = "Не успях да кача снимките. Нужно е PHP хостинг и writable uploads папка.";
      }
    }
  });
}

function initOrders() {
  if (orderForm) {
    orderForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (orderStatus) {
        orderStatus.textContent = "Изпращане...";
      }

      try {
        await submitOrder(orderForm);
        orderForm.reset();

        if (orderStatus) {
          orderStatus.textContent = "Заявката е изпратена успешно.";
        }
      } catch {
        if (orderStatus) {
          orderStatus.textContent = "Не успях да изпратя заявката. Пиши директно в Discord.";
        }
      }
    });
  }

  if (refreshOrdersButton) {
    refreshOrdersButton.addEventListener("click", () => {
      loadOrders();
    });
  }

  if (ordersList) {
    ordersList.addEventListener("click", async (event) => {
      const statusButton = event.target.closest("[data-order-status]");
      const deleteButton = event.target.closest("[data-order-delete]");
      const button = statusButton || deleteButton;

      if (!button) {
        return;
      }

      const orderId = button.dataset.orderId;

      if (!orderId) {
        return;
      }

      button.disabled = true;

      try {
        if (deleteButton) {
          await deleteOrder(orderId);
          await addAdminLog("Изтрита поръчка", orderId).catch(() => {});
        } else {
          await updateOrderStatus(orderId, statusButton.dataset.orderStatus);
          await addAdminLog("Променен статус на поръчка", `${orderId}: ${statusButton.dataset.orderStatus}`).catch(() => {});
        }

        await loadOrders();
      } catch {
        button.disabled = false;
        ordersList.insertAdjacentHTML(
          "afterbegin",
          '<p class="empty-orders">Не успях да обновя поръчката. Провери Firebase rules.</p>'
        );
      }
    });
  }
}

function initAccounts() {
  if (refreshAccountsButton) {
    refreshAccountsButton.addEventListener("click", () => {
      loadAccounts();
    });
  }

  if (accountForm) {
    accountForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = new FormData(accountForm);
      const username = String(data.get("username") || "").trim();
      const password = String(data.get("password") || "").trim();

      if (!username || !password) {
        if (accountStatus) {
          accountStatus.textContent = "Попълни потребител и парола.";
        }
        return;
      }

      try {
        await saveAccount(username, password);
        await addAdminLog("Създаден admin акаунт", username);
        accountForm.reset();

        if (accountStatus) {
          accountStatus.textContent = "Акаунтът е създаден.";
        }

        await loadAccounts();
      } catch {
        if (accountStatus) {
          accountStatus.textContent = "Не успях да създам акаунта. Провери Firebase rules.";
        }
      }
    });
  }

  if (accountsList) {
    accountsList.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-account-delete]");

      if (!button) {
        return;
      }

      const username = button.dataset.accountDelete;

      if (!username) {
        return;
      }

      button.disabled = true;

      try {
        await deleteAccount(username);
        await addAdminLog("Изтрит admin акаунт", username);
        await loadAccounts();
      } catch {
        button.disabled = false;
        if (accountStatus) {
          accountStatus.textContent = "Не успях да изтрия акаунта.";
        }
      }
    });
  }

  if (refreshLogsButton) {
    refreshLogsButton.addEventListener("click", () => {
      loadLogs();
    });
  }
}

async function init() {
  setTheme(localStorage.getItem(THEME_KEY) || "dark");

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    });
  });

  initChatbot();
  initCheckout();
  initOrders();
  initAccounts();
  initImageUploads();
  initAdminTabs();

  const sharedState = await loadSharedState();
  const content = sharedState.content;
  const savedDiscounts = sharedState.discounts;
  currentSettingsSignature = getSettingsSignature(content, savedDiscounts, sharedState.updatedAt);
  applySiteState(content, savedDiscounts);
  startSettingsSync();

  if (adminLogin && sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    currentAdminUser = sessionStorage.getItem(ADMIN_USER_KEY) || "owner";
    unlockAdmin();
  }

  if (adminLogin) {
    adminLogin.addEventListener("submit", async (event) => {
      event.preventDefault();

      const username = String(adminUsername?.value || "").trim();
      const password = String(adminPassword.value || "").trim();
      const authenticatedUser = await authenticateAdmin(username, password);

      if (authenticatedUser) {
        currentAdminUser = authenticatedUser;
        await addAdminLog("Вход в admin панела", authenticatedUser).catch(() => {});
        unlockAdmin();
        return;
      }

      passwordStatus.textContent = "Грешен потребител или парола.";
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

    form.addEventListener("submit", async (event) => {
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

      try {
        const result = await saveSharedState(nextContent, discounts);
        const savedSettings = result.settings || {
          content: nextContent,
          discounts,
          updatedAt: "",
        };
        currentSettingsSignature = getSettingsSignature(
          {
            ...defaultContent,
            ...(savedSettings.content || nextContent),
          },
          savedSettings.discounts || discounts,
          savedSettings.updatedAt || ""
        );
        await addAdminLog("Запазени настройки", "Текстове, цени или отстъпки").catch(() => {});
        showStatus("Запазено за всички посетители.");
      } catch {
        showStatus("Не е записано за всички. Ако сайтът е в GitHub Pages, добави Firebase URL в sync-config.js.");
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", async () => {
      const discounts = resetDiscounts();
      const currentContent = getContentFromForm();

      fillDiscountForm(discounts);
      updateDurationFields();
      updateAdminPreview(discounts);
      applyDiscounts(discounts);
      saveDiscounts(discounts);

      try {
        const result = await saveSharedState(currentContent, discounts);
        const savedSettings = result.settings || {
          content: currentContent,
          discounts,
          updatedAt: "",
        };
        currentSettingsSignature = getSettingsSignature(
          {
            ...defaultContent,
            ...(savedSettings.content || currentContent),
          },
          savedSettings.discounts || discounts,
          savedSettings.updatedAt || ""
        );
        await addAdminLog("Изчистени отстъпки", "Всички отстъпки са върнати на 0").catch(() => {});
        showStatus("Отстъпките са изчистени за всички.");
      } catch {
        showStatus("Не е изчистено за всички. Ако сайтът е в GitHub Pages, добави Firebase URL в sync-config.js.");
      }
    });
  }

  if (lockAdminButton) {
    lockAdminButton.addEventListener("click", () => {
      lockAdmin();
    });
  }
}

init();
