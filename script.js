const STORAGE_KEY = "boris-web-studio-discounts";
const CONTENT_KEY = "boris-web-studio-content";
const THEME_KEY = "boris-web-studio-theme";
const LANGUAGE_KEY = "boris-web-studio-language";
const HIDDEN_ORDERS_KEY = "boris-web-studio-hidden-orders";
const LOCAL_ORDER_STATUSES_KEY = "boris-web-studio-local-order-statuses";
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
const languageButtons = Array.from(document.querySelectorAll("[data-language-toggle]"));
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
const orderPriceInput = document.querySelector("[data-order-price]");
const orderServiceKeyInput = document.querySelector("[data-order-service-key]");
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

  applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
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
      element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.originalBgText = node.textContent.trim();
        }
      });
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

function getCurrentServicePrice(service) {
  const card = document.querySelector(`[data-service="${service}"]`);
  const price = card?.querySelector("[data-price-output]")?.textContent?.trim();

  return price || "";
}

function updateOrderPriceFromSelection() {
  if (!orderForm || !orderPriceInput || !orderServiceKeyInput) {
    return;
  }

  const serviceSelect = orderForm.elements.service;
  const selectedOption = serviceSelect?.selectedOptions?.[0];
  const serviceKey = selectedOption?.dataset.serviceKey || "";
  const price = serviceKey ? getCurrentServicePrice(serviceKey) : "";

  orderServiceKeyInput.value = serviceKey;
  orderPriceInput.value = price;
}

function applyDiscounts(discounts) {
  const language = localStorage.getItem(LANGUAGE_KEY) || "bg";

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
      if (settings.discount > 0) {
        discountNote.textContent = language === "en"
          ? `-${settings.discount}% discount${settings.duration ? ` for ${settings.duration}` : ""}, old price ${formatPrice(basePrice)}`
          : `-${settings.discount}% отстъпка${durationText}, стара цена ${formatPrice(basePrice)}`;
      } else {
        discountNote.textContent = "";
      }
    }
  });

  updateOrderPriceFromSelection();
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

const translations = {
  bg: {
    navServices: "Услуги",
    navGallery: "Галерия",
    navReviews: "Мнения",
    navProcess: "Процес",
    navWhy: "Защо аз",
    navContact: "Контакт",
    navSite: "Сайт",
    lightTheme: "Светла тема",
    darkTheme: "Тъмна тема",
    languageButton: "EN",
    seePackages: "Виж пакетите",
    discordWrite: "Пиши в Discord",
    availableSite: "достъпен сайт",
    readyPackages: "готови пакета",
    galleryEyebrow: "Галерия",
    galleryTitle: "Preview идеи за бъдещи сайтове",
    galleryText: "Примерни визии, които показват как може да изглежда един готов проект.",
    reviewsEyebrow: "Мнения",
    reviewsTitle: "Какво казват клиентите",
    packagesEyebrow: "Пакети",
    packagesTitle: "Избери сайт според проекта си",
    packagesText: "Цените могат да се обновяват от admin панела, включително временни отстъпки.",
    orderButton: "Поръчай",
    processEyebrow: "Процес",
    processTitle: "Лесно от идея до готов сайт",
    stepOneTitle: "Пишеш ми",
    stepOneText: "Казваш какъв сайт искаш, какви секции ти трябват и какъв стил харесваш.",
    stepTwoTitle: "Правя дизайна",
    stepTwoText: "Подреждам страницата, цветовете, бутоните и съдържанието да изглеждат професионално.",
    stepThreeTitle: "Получаваш готово",
    stepThreeText: "Сайтът е responsive, подреден и готов да го показваш на хората си.",
    whyEyebrow: "Предимства",
    whyTitle: "Защо да избереш Boris Web Studio?",
    faqTitle: "Често задавани въпроси",
    faqText: "Най-важното преди да поръчаш сайт.",
    contactEyebrow: "Готов ли си?",
    contactTitle: "Направи проекта си да изглежда по-сериозно.",
    orderDiscord: "Поръчай в Discord",
    requestEyebrow: "Заявка",
    requestTitle: "Изпрати кратка поръчка",
    requestText: "Заявката ще се запази в admin панела, за да не се губи информацията.",
    nameLabel: "Име",
    namePlaceholder: "Твоето име",
    siteTypeLabel: "Тип сайт",
    choosePackage: "Избери пакет",
    customSite: "Сайт по избор",
    priceLabel: "Цена",
    descriptionLabel: "Описание",
    descriptionPlaceholder: "Какво искаш да има в сайта?",
    submitRequest: "Изпрати заявка",
    checkoutEyebrow: "Поръчка",
    checkoutTitle: "Избери начин за поръчка",
    checkoutNote: "За най-сигурно може да минеш през Discord, а ако имаш активен payment link, можеш да платиш веднага онлайн.",
    payNow: "Плати сега в сайта",
    aiTitle: "AI помощник",
    aiSubtitle: "Питай за сайт, цена или поръчка",
    aiGreeting: "Здрасти! Питай ме за пакетите, сроковете, отстъпки или как да поръчаш сайт.",
    aiPlaceholder: "Напиши въпрос...",
    send: "Изпрати",
  },
  en: {
    navServices: "Services",
    navGallery: "Gallery",
    navReviews: "Reviews",
    navProcess: "Process",
    navWhy: "Why me",
    navContact: "Contact",
    navSite: "Site",
    lightTheme: "Light theme",
    darkTheme: "Dark theme",
    languageButton: "BG",
    seePackages: "View packages",
    discordWrite: "Message on Discord",
    availableSite: "available website",
    readyPackages: "ready packages",
    galleryEyebrow: "Gallery",
    galleryTitle: "Preview ideas for future websites",
    galleryText: "Example visuals that show how a finished project can look.",
    reviewsEyebrow: "Reviews",
    reviewsTitle: "What clients say",
    packagesEyebrow: "Packages",
    packagesTitle: "Choose a website for your project",
    packagesText: "Prices can be updated from the admin panel, including temporary discounts.",
    orderButton: "Order",
    processEyebrow: "Process",
    processTitle: "Easy from idea to finished website",
    stepOneTitle: "You message me",
    stepOneText: "Tell me what website you want, what sections you need and what style you like.",
    stepTwoTitle: "I design it",
    stepTwoText: "I arrange the page, colors, buttons and content so everything looks professional.",
    stepThreeTitle: "You get it ready",
    stepThreeText: "The website is responsive, organized and ready to show to your community.",
    whyEyebrow: "Benefits",
    whyTitle: "Why choose Boris Web Studio?",
    faqTitle: "Frequently asked questions",
    faqText: "The important things before ordering a website.",
    contactEyebrow: "Ready?",
    contactTitle: "Make your project look more serious.",
    orderDiscord: "Order in Discord",
    requestEyebrow: "Request",
    requestTitle: "Send a short order request",
    requestText: "The request will be saved in the admin panel so the details are not lost.",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    siteTypeLabel: "Website type",
    choosePackage: "Choose package",
    customSite: "Custom website",
    priceLabel: "Price",
    descriptionLabel: "Description",
    descriptionPlaceholder: "What do you want the website to include?",
    submitRequest: "Send request",
    checkoutEyebrow: "Order",
    checkoutTitle: "Choose how to order",
    checkoutNote: "For the safest flow you can use Discord, or pay online immediately if an active payment link is set.",
    payNow: "Pay now on site",
    aiTitle: "AI assistant",
    aiSubtitle: "Ask about website, price or order",
    aiGreeting: "Hi! Ask me about packages, delivery time, discounts or how to order a website.",
    aiPlaceholder: "Write a question...",
    send: "Send",
  },
};

const staticTextTranslations = {
  "Услуги": "Services",
  "Галерия": "Gallery",
  "Мнения": "Reviews",
  "Процес": "Process",
  "Защо аз": "Why me",
  "Контакт": "Contact",
  "Сайт": "Site",
  "Светла тема": "Light theme",
  "Тъмна тема": "Dark theme",
  "Виж пакетите": "View packages",
  "Пиши в Discord": "Message on Discord",
  "Поръчай": "Order",
  "Поръчай в Discord": "Order in Discord",
  "достъпен сайт": "available website",
  "готови пакета": "ready packages",
  "Preview идеи за бъдещи сайтове": "Preview ideas for future websites",
  "Примерни визии, които показват как може да изглежда един готов проект.": "Example visuals that show how a finished project can look.",
  "Какво казват клиентите": "What clients say",
  "Пакети": "Packages",
  "Избери сайт според проекта си": "Choose a website for your project",
  "Цените могат да се обновяват от admin панела, включително временни отстъпки.": "Prices can be updated from the admin panel, including temporary discounts.",
  "Лесно от идея до готов сайт": "Easy from idea to finished website",
  "Пишеш ми": "You message me",
  "Казваш какъв сайт искаш, какви секции ти трябват и какъв стил харесваш.": "Tell me what website you want, what sections you need and what style you like.",
  "Правя дизайна": "I design it",
  "Подреждам страницата, цветовете, бутоните и съдържанието да изглеждат професионално.": "I arrange the page, colors, buttons and content so everything looks professional.",
  "Получаваш готово": "You get it ready",
  "Сайтът е responsive, подреден и готов да го показваш на хората си.": "The website is responsive, organized and ready to show to your community.",
  "Предимства": "Benefits",
  "Защо да избереш Boris Web Studio?": "Why choose Boris Web Studio?",
  "Бърза изработка": "Fast delivery",
  "Не чакаш седмици. Получаваш чист сайт, направен за твоя проект.": "You do not wait for weeks. You get a clean website made for your project.",
  "Модерен стил": "Modern style",
  "Тъмен зелен дизайн, ясни секции, добри бутони и силно първо впечатление.": "Dark green design, clear sections, good buttons and a strong first impression.",
  "Работи на телефон": "Works on mobile",
  "Страницата се адаптира за телефон, таблет и компютър без странни размествания.": "The page adapts to phone, tablet and desktop without awkward layout shifts.",
  "Лесни промени": "Easy changes",
  "Admin страницата позволява да сменяш отстъпки и срокове без да пипаш кода.": "The admin page lets you change discounts and durations without touching code.",
  "Често задавани въпроси": "Frequently asked questions",
  "Най-важното преди да поръчаш сайт.": "The important things before ordering a website.",
  "Колко време отнема изработката?": "How long does it take?",
  "Обикновено няколко дни, според сложността и колко съдържание трябва да се добави.": "Usually a few days, depending on complexity and how much content needs to be added.",
  "Какво трябва да изпратя?": "What should I send?",
  "Име на проекта, цветове, текстове, снимки или лого, Discord линк и пример за стил, който харесваш.": "Project name, colors, texts, images or logo, Discord link and an example style you like.",
  "Може ли сайтът да работи на телефон?": "Can the website work on mobile?",
  "Да. Дизайнът е responsive и се адаптира за телефон, таблет и компютър.": "Yes. The design is responsive and adapts to phone, tablet and desktop.",
  "Може ли после да се правят промени?": "Can changes be made later?",
  "Готов ли си?": "Ready?",
  "Направи проекта си да изглежда по-сериозно.": "Make your project look more serious.",
  "Заявка": "Request",
  "Изпрати кратка поръчка": "Send a short order request",
  "Заявката ще се запази в admin панела, за да не се губи информацията.": "The request will be saved in the admin panel so the details are not lost.",
  "Име": "Name",
  "Тип сайт": "Website type",
  "Избери пакет": "Choose package",
  "Сайт по избор": "Custom website",
  "Цена": "Price",
  "Описание": "Description",
  "Изпрати заявка": "Send request",
  "Поръчка": "Order",
  "Избери начин за поръчка": "Choose how to order",
  "За най-сигурно може да минеш през Discord, а ако имаш активен payment link, можеш да платиш веднага онлайн.": "For the safest flow you can use Discord, or pay online immediately if an active payment link is set.",
  "Плати сега в сайта": "Pay now on site",
  "AI помощник": "AI assistant",
  "Питай за сайт, цена или поръчка": "Ask about website, price or order",
  "Изпрати": "Send",
  "Admin панел": "Admin panel",
  "Защитена зона": "Protected area",
  "Вход за админ": "Admin login",
  "Потребител": "User",
  "Парола": "Password",
  "Отключи панела": "Unlock panel",
  "Управление на сайта": "Website management",
  "Текстове": "Texts",
  "Снимки": "Images",
  "Отстъпки": "Discounts",
  "Поръчки": "Orders",
  "Акаунти": "Accounts",
  "Логове": "Logs",
  "Редакция на текстове и цени": "Edit texts and prices",
  "Лента най-горе на сайта": "Top site banner",
  "Цвят на лентата": "Banner color",
  "Цвят на текста": "Text color",
  "Запази текстовете": "Save texts",
  "Качи снимките": "Upload images",
  "Запази отстъпките": "Save discounts",
  "Изчисти": "Clear",
  "Изход": "Logout",
  "История на заявките": "Order history",
  "Обнови": "Refresh",
  "Admin потребители": "Admin users",
  "Създай акаунт": "Create account",
  "История на действията": "Action history",
  "Смени парола": "Change password",
  "Изтрий": "Delete",
  "Готова": "Done",
  "Отказана": "Cancelled",
  "Нова": "New",
  "Зареждане...": "Loading...",
  "Все още няма заявки.": "There are no requests yet.",
  "Няма създадени акаунти.": "No accounts created.",
  "Още няма логове.": "No logs yet.",
  "Няма заредени заявки.": "No loaded requests.",
  "Няма заредени акаунти.": "No loaded accounts.",
  "Няма заредени логове.": "No loaded logs.",
  "Име:": "Name:",
  "Discord:": "Discord:",
  "Бюджет:": "Budget:",
  "Източник:": "Source:",
  "Плащане:": "Payment:",
  "Описание:": "Description:",
  "Дата:": "Date:",
  "Създаден:": "Created:",
  "Последна промяна:": "Last change:",
  "Потребител:": "User:",
  "Детайли:": "Details:",
  "Страница:": "Page:",
  "Език:": "Language:",
  "Браузър:": "Browser:",
  "Нова цена:": "New price:",
  "Без срок": "No duration",
  "1 ден": "1 day",
  "1 седмица": "1 week",
  "1 месец": "1 month",
  "Друго": "Other",
  "Отстъпка %": "Discount %",
  "Срок": "Duration",
  "Новa заявка": "New request",
  "Нова заявка": "New request",
  "Base": "Base",
  "Малък текст в hero": "Small hero text",
  "Главно заглавие": "Main title",
  "Описание в hero": "Hero description",
  "CS 2 име": "CS 2 name",
  "CS 2 цена": "CS 2 price",
  "CS 2 описание": "CS 2 description",
  "Minecraft име": "Minecraft name",
  "Minecraft цена": "Minecraft price",
  "Minecraft описание": "Minecraft description",
  "Custom име": "Custom name",
  "Custom цена": "Custom price",
  "Custom описание": "Custom description",
  "Галерия 1 заглавие": "Gallery 1 title",
  "Галерия 1 описание": "Gallery 1 description",
  "Галерия 2 заглавие": "Gallery 2 title",
  "Галерия 2 описание": "Gallery 2 description",
  "Галерия 3 заглавие": "Gallery 3 title",
  "Галерия 3 описание": "Gallery 3 description",
  "Мнение 1": "Review 1",
  "Мнение 2": "Review 2",
  "Мнение 3": "Review 3",
  "Автор 1": "Author 1",
  "Автор 2": "Author 2",
  "Автор 3": "Author 3",
  "Лого / favicon": "Logo / favicon",
  "Hero снимка": "Hero image",
  "Галерия 1": "Gallery 1",
  "Галерия 2": "Gallery 2",
  "Галерия 3": "Gallery 3",
  "Качи ново лого, hero снимка или gallery изображения. След upload се виждат от всички посетители.": "Upload a new logo, hero image or gallery images. After upload they are visible to all visitors.",
  "Избери таб и редактирай текстове, снимки, цени, отстъпки или заявки. Промените се пазят за всички посетители чрез cloud синхронизация.": "Choose a tab and edit texts, images, prices, discounts or requests. Changes are saved for all visitors through cloud sync.",
  "Проверка на синхронизацията...": "Checking sync...",
  "Управлявай отстъпките и срока им. Промяната се вижда веднага като preview.": "Manage discounts and their duration. The change is visible immediately as a preview.",
  "Създай акаунт": "Create account",
  "Въведи нова парола.": "Enter a new password.",
  "Акаунтът е създаден и вече може да се ползва.": "The account was created and can now be used.",
  "Паролата е сменена.": "The password was changed.",
  "Акаунтът е изтрит.": "The account was deleted.",
  "Грешен потребител или парола.": "Wrong username or password.",
  "Запазено за всички посетители.": "Saved for all visitors.",
  "Отстъпките са изчистени за всички.": "Discounts were cleared for all visitors.",
  "Преглед преди запазване.": "Preview before saving.",
  "© 2026 Всички права запазени.": "© 2026 All rights reserved.",
  "Заявката е изпратена успешно.": "The request was sent successfully.",
  "Изпращане...": "Sending...",
  "Първо избери пакет, за да се зададе цената.": "Choose a package first so the price can be set.",
  "Първо напиши име и Discord, за да продължиш.": "Enter your name and Discord first to continue.",
  "Избери Revolut или PayPal, за да продължиш към плащане.": "Choose Revolut or PayPal to continue to payment.",
  "Натисни плащане и избери Revolut или PayPal. Discord остава вариант, ако искаш първо да уточним проекта.": "Click payment and choose Revolut or PayPal. Discord remains an option if you want to discuss the project first.",
  "Бързи, модерни и зелени уебсайтове": "Fast, modern and green websites",
  "Сайт, който изглежда сериозно още от първия клик.": "A website that looks serious from the first click.",
  "Правя чисти, responsive сайтове за CS 2, Minecraft, лични проекти и малки бизнеси. Получаваш дизайн, структура и готов линк за поръчки през Discord.": "I build clean, responsive websites for CS 2, Minecraft, personal projects and small businesses. You get design, structure and a ready order flow through Discord.",
  "Gaming пакет": "Gaming package",
  "Страница за CS 2 сървър с IP, Discord, правила, статус и силна първа визия.": "A page for a CS 2 server with IP, Discord, rules, status and a strong first impression.",
  "Community пакет": "Community package",
  "Сайт за Minecraft сървър с секции за режимите, снимки, правила и join бутон.": "A website for a Minecraft server with sections for modes, images, rules and a join button.",
  "Custom пакет": "Custom package",
  "Персонален сайт според твоята идея: портфолио, магазин, landing page или проект.": "A personal website based on your idea: portfolio, shop, landing page or project.",
  "Hero секция, IP адрес, Discord бутон, правила и сървър статус.": "Hero section, IP address, Discord button, rules and server status.",
  "Minecraft community": "Minecraft community",
  "Режими, снимки, правила, join секция и информация за играчите.": "Modes, images, rules, join section and player information.",
  "Custom project": "Custom project",
  "Портфолио, бизнес сайт или online presence с уникална структура.": "Portfolio, business website or online presence with a unique structure.",
  "“Сайтът стана бързо и изглежда много по-сериозно от стария ни Discord invite.”": "\"The website was finished quickly and looks much more serious than our old Discord invite.\"",
  "CS 2 клиент": "CS 2 client",
  "“Хареса ми, че работи добре на телефон и всичко е подредено ясно.”": "\"I liked that it works well on mobile and everything is clearly arranged.\"",
  "Minecraft проект": "Minecraft project",
  "“Получих точния стил, който исках, плюс лесен начин хората да поръчват.”": "\"I got the exact style I wanted, plus an easy way for people to order.\"",
  "Custom сайт": "Custom website",
};

const staticPlaceholderTranslations = {
  "Твоето име": "Your name",
  "Избери пакет": "Choose package",
  "Какво искаш да има в сайта?": "What do you want the website to include?",
  "Напиши въпрос...": "Write a question...",
  "admin или остави празно": "admin or leave empty",
  "Въведи парола": "Enter password",
  "Например: -20% отстъпка само тази седмица": "Example: -20% discount this week only",
  "Нова парола": "New password",
};

const englishToBgTranslations = Object.fromEntries(
  Object.entries(staticTextTranslations).map(([bg, en]) => [en, bg])
);
const englishToBgPlaceholders = Object.fromEntries(
  Object.entries(staticPlaceholderTranslations).map(([bg, en]) => [en, bg])
);

function translateText(value, language) {
  const clean = String(value || "").trim();

  if (!clean) {
    return value;
  }

  if (language === "bg") {
    return englishToBgTranslations[clean] || clean;
  }

  return staticTextTranslations[clean] || clean;
}

function applyStaticLanguage(language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;

      if (!parent || parent.closest("[data-announcement-bar], script, style")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach((node) => {
    node.originalBgText = node.originalBgText || node.textContent.trim();
    const translated = translateText(node.originalBgText, language);
    node.textContent = node.textContent.replace(node.textContent.trim(), translated);
  });

  document.querySelectorAll("[placeholder]").forEach((element) => {
    element.dataset.bgPlaceholder = element.dataset.bgPlaceholder || element.placeholder;
    const bgPlaceholder = englishToBgPlaceholders[element.dataset.bgPlaceholder] || element.dataset.bgPlaceholder;
    element.dataset.bgPlaceholder = bgPlaceholder;
    element.placeholder = language === "bg"
      ? bgPlaceholder
      : staticPlaceholderTranslations[bgPlaceholder] || bgPlaceholder;
  });
}

function setText(selector, text) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = text;
  }
}

function setAllText(selector, text) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = text;
  });
}

function setPlaceholder(selector, text) {
  const element = document.querySelector(selector);

  if (element) {
    element.placeholder = text;
  }
}

function setLabelText(selector, text) {
  const label = document.querySelector(selector);

  if (!label) {
    return;
  }

  const textNode = Array.from(label.childNodes).find((node) => {
    return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
  });

  if (textNode) {
    textNode.textContent = `\n          ${text}\n          `;
  }
}

function applyLanguage(language) {
  const t = translations[language] || translations.bg;

  document.documentElement.lang = language === "en" ? "en" : "bg";
  languageButtons.forEach((button) => {
    button.textContent = t.languageButton;
  });

  setText('.main-nav a[href="#services"]', t.navServices);
  setText('.main-nav a[href="#gallery"]', t.navGallery);
  setText('.main-nav a[href="#reviews"]', t.navReviews);
  setText('.main-nav a[href="#process"]', t.navProcess);
  setText('.main-nav a[href="#why"]', t.navWhy);
  setText('.main-nav a[href="#contact"]', t.navContact);
  setText('.main-nav a[href="index.html"]', t.navSite);
  setText('.main-nav a[href="index.html#services"]', t.navServices);
  setText('.hero-actions .btn[href="#services"]', t.seePackages);
  setText('.hero-actions .secondary-btn', t.discordWrite);
  setText(".hero-stats div:first-child span", t.availableSite);
  setText(".hero-stats div:nth-child(3) span", t.readyPackages);
  setText("#gallery .section-heading .eyebrow", t.galleryEyebrow);
  setText("#gallery .section-heading h2", t.galleryTitle);
  setText("#gallery .section-heading p:last-child", t.galleryText);
  setText("#reviews .section-heading .eyebrow", t.reviewsEyebrow);
  setText("#reviews .section-heading h2", t.reviewsTitle);
  setText("#services .section-heading .eyebrow", t.packagesEyebrow);
  setText("#services .section-heading h2", t.packagesTitle);
  setText("#services .section-heading p:last-child", t.packagesText);
  setAllText(".order-btn", t.orderButton);
  setText("#process .section-heading .eyebrow", t.processEyebrow);
  setText("#process .section-heading h2", t.processTitle);
  setText("#process .steps article:first-child h3", t.stepOneTitle);
  setText("#process .steps article:first-child p", t.stepOneText);
  setText("#process .steps article:nth-child(2) h3", t.stepTwoTitle);
  setText("#process .steps article:nth-child(2) p", t.stepTwoText);
  setText("#process .steps article:nth-child(3) h3", t.stepThreeTitle);
  setText("#process .steps article:nth-child(3) p", t.stepThreeText);
  setText("#why .section-heading .eyebrow", t.whyEyebrow);
  setText("#why .section-heading h2", t.whyTitle);
  setText("#faq .section-heading h2", t.faqTitle);
  setText("#faq .section-heading p:last-child", t.faqText);
  setText("#contact .eyebrow", t.contactEyebrow);
  setText("#contact h2", t.contactTitle);
  setText("#contact .btn", t.orderDiscord);
  setText("#order .section-heading .eyebrow", t.requestEyebrow);
  setText("#order .section-heading h2", t.requestTitle);
  setText("#order .section-heading p:last-child", t.requestText);
  setLabelText('.order-form label:first-child', t.nameLabel);
  setLabelText('.order-form label:nth-child(3)', t.siteTypeLabel);
  setLabelText('.order-form label:nth-child(4)', t.priceLabel);
  setLabelText('.order-form .wide-field', t.descriptionLabel);
  setText('.order-form button[type="submit"]', t.submitRequest);
  setText('.order-form select[name="service"] option[value=""]', t.choosePackage);
  setText('.order-form select[name="service"] option[data-service-key="custom"]', t.customSite);
  setPlaceholder('.order-form input[name="name"]', t.namePlaceholder);
  setPlaceholder('.order-form input[name="budget"]', t.choosePackage);
  setPlaceholder('.order-form textarea[name="description"]', t.descriptionPlaceholder);
  setText(".checkout-dialog .eyebrow", t.checkoutEyebrow);
  setText("[data-checkout-title]", t.checkoutTitle);
  setText(".checkout-note", t.checkoutNote);
  setLabelText(".checkout-fields label:first-child", t.nameLabel);
  setText("[data-pay-now]", t.payNow);
  setText("[data-discord-order]", t.orderDiscord);
  setPlaceholder("[data-checkout-name]", t.namePlaceholder);
  setText(".chatbot-header strong", t.aiTitle);
  setText(".chatbot-header span", t.aiSubtitle);
  setText(".chatbot-messages .chat-message.bot:first-child", t.aiGreeting);
  setPlaceholder('.chatbot-form input[name="message"]', t.aiPlaceholder);
  setText(".chatbot-form button", t.send);
  applyStaticLanguage(language);
}

function setLanguage(language) {
  localStorage.setItem(LANGUAGE_KEY, language);
  applyLanguage(language);
  setTheme(localStorage.getItem(THEME_KEY) || "dark");
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const language = localStorage.getItem(LANGUAGE_KEY) || "bg";
  const t = translations[language] || translations.bg;

  themeButtons.forEach((button) => {
    button.textContent = theme === "light" ? t.darkTheme : t.lightTheme;
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

function escapeSelector(value) {
  if (window.CSS?.escape) {
    return CSS.escape(value);
  }

  return String(value).replace(/["\\]/g, "\\$&");
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
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deleted: true,
        status: "deleted",
        updatedAt: new Date().toISOString(),
      }),
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
  const localAccounts = normalizeRecordList(getLocalAccounts());

  if (cloudAccountsUrl) {
    try {
      const cloudAccounts = normalizeRecordList(await requestJson(`${cloudAccountsUrl}?v=${Date.now()}`));
      const merged = new Map();

      cloudAccounts.forEach((account) => {
        merged.set(account.username || account.storageId, account);
      });

      localAccounts.forEach((account) => {
        merged.set(account.username || account.storageId, account);
      });

      return Array.from(merged.values());
    } catch {
      return localAccounts;
    }
  }

  return localAccounts;
}

async function saveAccount(username, password) {
  const account = {
    username,
    password,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const cloudAccountsUrl = getCloudAccountsUrl();

  if (cloudAccountsUrl) {
    try {
      await requestJson(`${cloudAccountsUrl}/${encodeURIComponent(username)}.json`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(account),
      });
      return account;
    } catch {}
  }

  const accounts = getLocalAccounts();
  accounts[username] = account;
  saveLocalAccounts(accounts);
  return account;
}

async function updateAccountPassword(username, password) {
  const accounts = getLocalAccounts();
  const existing = accounts[username] || {};
  const account = {
    ...existing,
    username,
    password,
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const cloudAccountsUrl = getCloudAccountsUrl();

  if (cloudAccountsUrl) {
    try {
      await requestJson(`${cloudAccountsUrl}/${encodeURIComponent(username)}.json`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          updatedAt: account.updatedAt,
        }),
      });
    } catch {}
  }

  accounts[username] = account;
  saveLocalAccounts(accounts);
  return account;
}

async function deleteAccount(username) {
  const cloudAccountsUrl = getCloudAccountsUrl();

  if (cloudAccountsUrl) {
    try {
      await requestJson(`${cloudAccountsUrl}/${encodeURIComponent(username)}.json`, {
        method: "DELETE",
      });
    } catch {}
  }

  const accounts = getLocalAccounts();
  delete accounts[username];
  saveLocalAccounts(accounts);
}

async function saveAccountEverywhere(username, password) {
  const account = await saveAccount(username, password);

  return account;
}

async function deleteAccountEverywhere(username) {
  await deleteAccount(username);
}

async function addAdminLog(action, details = "") {
  const log = {
    action,
    details,
    user: currentAdminUser || "owner",
    page: window.location.pathname || "admin",
    url: window.location.href,
    userAgent: navigator.userAgent,
    language: navigator.language || "",
    createdAt: new Date().toISOString(),
  };
  const cloudLogsUrl = getCloudLogsUrl();

  if (cloudLogsUrl) {
    try {
      await requestJson(cloudLogsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(log),
      });
      return;
    } catch {}
  }

  const logs = getLocalLogs();
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...log,
  });
  saveLocalLogs(logs);
}

function getLocalLogs() {
  return readJson("boris-web-studio-admin-logs", []);
}

function saveLocalLogs(logs) {
  localStorage.setItem("boris-web-studio-admin-logs", JSON.stringify(logs.slice(0, 100)));
}

function getHiddenOrderIds() {
  return readJson(HIDDEN_ORDERS_KEY, []);
}

function hideOrderLocally(orderId) {
  const hiddenIds = new Set(getHiddenOrderIds());
  hiddenIds.add(orderId);
  localStorage.setItem(HIDDEN_ORDERS_KEY, JSON.stringify(Array.from(hiddenIds)));
}

function getLocalOrderStatuses() {
  return readJson(LOCAL_ORDER_STATUSES_KEY, {});
}

function setOrderStatusLocally(orderId, status) {
  const statuses = getLocalOrderStatuses();
  statuses[orderId] = status;
  localStorage.setItem(LOCAL_ORDER_STATUSES_KEY, JSON.stringify(statuses));
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

    const hiddenOrderIds = new Set(getHiddenOrderIds());
    const localOrderStatuses = getLocalOrderStatuses();
    orders = orders.filter((order) => {
      const orderId = order.storageId || order.id;
      return !order.deleted && order.status !== "deleted" && !hiddenOrderIds.has(orderId);
    }).map((order) => {
      const orderId = order.storageId || order.id;

      return {
        ...order,
        status: localOrderStatuses[orderId] || order.status,
      };
    });
    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (orders.length === 0) {
      ordersList.innerHTML = '<p class="empty-orders">Все още няма заявки.</p>';
      applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
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
    applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
  } catch {
    ordersList.innerHTML = '<p class="empty-orders">Не успях да заредя заявките. Провери Firebase URL/rules или PHP хостинга.</p>';
    applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
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
      applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
      return;
    }

    accountsList.innerHTML = accounts.map((account) => {
      const createdAt = account.createdAt ? new Date(account.createdAt).toLocaleString("bg-BG") : "";
      const updatedAt = account.updatedAt ? new Date(account.updatedAt).toLocaleString("bg-BG") : "";
      const username = account.username || account.storageId || "";

      return `
        <article class="order-card">
          <h4>${escapeHtml(username || "-")}</h4>
          <p><strong>Създаден:</strong> ${escapeHtml(createdAt || "-")}</p>
          <p><strong>Последна промяна:</strong> ${escapeHtml(updatedAt || "-")}</p>
          <label class="account-password-field">
            Нова парола
            <input type="password" data-account-password="${escapeHtml(username)}" placeholder="Нова парола">
          </label>
          <div class="order-actions-row">
            <button type="button" data-account-password-save="${escapeHtml(username)}">Смени парола</button>
            <button type="button" class="danger-button" data-account-delete="${escapeHtml(username)}">Изтрий</button>
          </div>
        </article>
      `;
    }).join("");
    applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
  } catch {
    accountsList.innerHTML = '<p class="empty-orders">Не успях да заредя акаунтите. Провери Firebase rules.</p>';
    applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
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
      applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
      return;
    }

    logsList.innerHTML = logs.slice(0, 100).map((log) => {
      const createdAt = log.createdAt ? new Date(log.createdAt).toLocaleString("bg-BG") : "";

      return `
        <article class="order-card log-card">
          <h4>${escapeHtml(log.action || "-")}</h4>
          <p><strong>Потребител:</strong> ${escapeHtml(log.user || "-")}</p>
          <p><strong>Детайли:</strong> ${escapeHtml(log.details || "-")}</p>
          <p><strong>Страница:</strong> ${escapeHtml(log.page || "-")}</p>
          <p><strong>Език:</strong> ${escapeHtml(log.language || "-")}</p>
          <p><strong>Браузър:</strong> ${escapeHtml(log.userAgent || "-")}</p>
          <time>${escapeHtml(createdAt)}</time>
        </article>
      `;
    }).join("");
    applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
  } catch {
    logsList.innerHTML = '<p class="empty-orders">Не успях да заредя логовете. Провери Firebase rules.</p>';
    applyLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
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
    orderForm.addEventListener("change", (event) => {
      if (event.target.name === "service") {
        updateOrderPriceFromSelection();
      }
    });

    orderForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      updateOrderPriceFromSelection();

      if (!orderPriceInput?.value) {
        if (orderStatus) {
          orderStatus.textContent = "Първо избери пакет, за да се зададе цената.";
        }
        return;
      }

      if (orderStatus) {
        orderStatus.textContent = "Изпращане...";
      }

      try {
        await submitOrder(orderForm);
        orderForm.reset();
        updateOrderPriceFromSelection();

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
          hideOrderLocally(orderId);
          button.closest("[data-order-card]")?.remove();
          await deleteOrder(orderId);
          await addAdminLog("Изтрита поръчка", orderId).catch(() => {});
        } else {
          setOrderStatusLocally(orderId, statusButton.dataset.orderStatus);
          await loadOrders();
          await updateOrderStatus(orderId, statusButton.dataset.orderStatus);
          await addAdminLog("Променен статус на поръчка", `${orderId}: ${statusButton.dataset.orderStatus}`).catch(() => {});
        }

        await loadOrders();
      } catch {
        button.disabled = false;

        if (deleteButton || statusButton) {
          return;
        }

        const oldError = ordersList.querySelector("[data-orders-error]");

        if (oldError) {
          oldError.remove();
        }

        ordersList.insertAdjacentHTML(
          "afterbegin",
          '<p class="empty-orders" data-orders-error>Не успях да обновя поръчката. Провери Firebase rules.</p>'
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
        await addAdminLog("Създаден admin акаунт", `username=${username}`);
        accountForm.reset();

        if (accountStatus) {
          accountStatus.textContent = "Акаунтът е създаден и вече може да се ползва.";
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
      const passwordButton = event.target.closest("[data-account-password-save]");
      const deleteButton = event.target.closest("[data-account-delete]");
      const button = passwordButton || deleteButton;

      if (!button) {
        return;
      }

      const username = button.dataset.accountDelete || button.dataset.accountPasswordSave;

      if (!username) {
        return;
      }

      button.disabled = true;

      try {
        if (passwordButton) {
          const passwordInput = accountsList.querySelector(`[data-account-password="${escapeSelector(username)}"]`);
          const nextPassword = String(passwordInput?.value || "").trim();

          if (!nextPassword) {
            if (accountStatus) {
              accountStatus.textContent = "Въведи нова парола.";
            }
            button.disabled = false;
            return;
          }

          await updateAccountPassword(username, nextPassword);
          await addAdminLog("Сменена парола на admin акаунт", username);

          if (accountStatus) {
            accountStatus.textContent = "Паролата е сменена.";
          }
        } else {
          await deleteAccount(username);
          await addAdminLog("Изтрит admin акаунт", username);

          if (accountStatus) {
            accountStatus.textContent = "Акаунтът е изтрит.";
          }
        }

        await loadAccounts();
      } catch {
        button.disabled = false;
        if (accountStatus) {
          accountStatus.textContent = "Не успях да обновя акаунта.";
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
  setLanguage(localStorage.getItem(LANGUAGE_KEY) || "bg");
  setTheme(localStorage.getItem(THEME_KEY) || "dark");

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    });
  });

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage((localStorage.getItem(LANGUAGE_KEY) || "bg") === "bg" ? "en" : "bg");
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
