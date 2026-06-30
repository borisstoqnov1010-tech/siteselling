const STORAGE_KEY = "boris-web-studio-discounts";
const CONTENT_KEY = "boris-web-studio-content";
const THEME_KEY = "boris-web-studio-theme";
const REMOTE_SETTINGS_URL = "settings.php";
const SETTINGS_SYNC_INTERVAL = 8000;
const ADMIN_PASSWORD = "kuchki55";
const ADMIN_SESSION_KEY = "boris-web-studio-admin-unlocked";
const SERVICES = ["cs2", "minecraft", "custom"];
let currentSettingsSignature = "";
let settingsSyncTimer = null;

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
const chatToggle = document.querySelector("[data-chat-toggle]");
const chatPanel = document.querySelector("[data-chat-panel]");
const chatClose = document.querySelector("[data-chat-close]");
const chatForm = document.querySelector("[data-chat-form]");
const chatMessages = document.querySelector("[data-chat-messages]");
const orderForm = document.querySelector("[data-order-form]");
const orderStatus = document.querySelector("[data-order-status]");
const ordersPanel = document.querySelector("#ordersPanel");
const ordersList = document.querySelector("[data-orders-list]");
const refreshOrdersButton = document.querySelector("[data-refresh-orders]");
const uploadImagesButton = document.querySelector("[data-upload-images]");
const uploadStatus = document.querySelector("[data-upload-status]");
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
      return normalizeSharedState(data);
    } catch {}
  }

  try {
    const data = await requestJson(`${REMOTE_SETTINGS_URL}?v=${Date.now()}`);
    return normalizeSharedState(data);
  } catch {
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

function applyContent(content) {
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
  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
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
  const discord = "https://discord.gg/sSkQC2UmkY";

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function submitOrder(formElement) {
  const data = new FormData(formElement);
  const payload = Object.fromEntries(data.entries());
  const response = await fetch("orders.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Order request failed");
  }

  return response.json();
}

async function loadOrders() {
  if (!ordersList) {
    return;
  }

  ordersList.innerHTML = '<p class="empty-orders">Зареждане...</p>';

  try {
    const response = await fetch(`orders.php?password=${encodeURIComponent(ADMIN_PASSWORD)}&v=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Orders request failed");
    }

    const data = await response.json();
    const orders = Array.isArray(data.orders) ? data.orders : [];

    if (orders.length === 0) {
      ordersList.innerHTML = '<p class="empty-orders">Все още няма заявки.</p>';
      return;
    }

    ordersList.innerHTML = orders.map((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString("bg-BG") : "";

      return `
        <article class="order-card">
          <h4>${escapeHtml(order.service || "Нова заявка")}</h4>
          <p><strong>Име:</strong> ${escapeHtml(order.name || "-")}</p>
          <p><strong>Discord:</strong> ${escapeHtml(order.discord || "-")}</p>
          <p><strong>Бюджет:</strong> ${escapeHtml(order.budget || "-")}</p>
          <p><strong>Описание:</strong> ${escapeHtml(order.description || "-")}</p>
          <p><strong>Дата:</strong> ${escapeHtml(createdAt)}</p>
        </article>
      `;
    }).join("");
  } catch {
    ordersList.innerHTML = '<p class="empty-orders">Не успях да заредя заявките. Нужно е PHP хостинг.</p>';
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
}

async function init() {
  setTheme(localStorage.getItem(THEME_KEY) || "dark");

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    });
  });

  initChatbot();
  initOrders();
  initImageUploads();
  initAdminTabs();

  const sharedState = await loadSharedState();
  const content = sharedState.content;
  const savedDiscounts = sharedState.discounts;
  currentSettingsSignature = getSettingsSignature(content, savedDiscounts, sharedState.updatedAt);
  applySiteState(content, savedDiscounts);
  startSettingsSync();

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
        showStatus("Запазено за всички посетители.");
      } catch {
        showStatus("Запазено само при теб. Качи сайта на PHP хостинг, за да се вижда от всички.");
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
        showStatus("Отстъпките са изчистени за всички.");
      } catch {
        showStatus("Отстъпките са изчистени само при теб.");
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
