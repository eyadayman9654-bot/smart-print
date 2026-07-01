// Mobile Menu Toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Optional: change icon to an 'X' when open
    const icon = mobileToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      }
    });
  });
}

// Carousel functionality
const carouselTrack = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const carouselDots = document.getElementById('carouselDots');
const carouselWrapper = document.querySelector('.carousel-wrapper');
const siteApiBase = 'https://whitesmoke-jaguar-842419.hostingersite.com/api';
const dashboardSettingsKey = 'smartPrintSiteSettings';
const dashboardDefaultsKey = 'smartPrintDefaultSettings';
const dashboardToggle = document.getElementById('dashboardToggle');
const dashboardPanel = document.getElementById('dashboardPanel');
const dashboardBackdrop = document.getElementById('dashboardBackdrop');
const dashboardClose = document.getElementById('dashboardClose');
const dashboardForm = document.getElementById('dashboardForm');
const dashboardReset = document.getElementById('dashboardReset');
const dashboardStatus = document.getElementById('dashboardStatus');
const serviceEditorList = document.getElementById('serviceEditorList');
const addServiceBtn = document.getElementById('addServiceBtn');
const dashboardTabs = document.querySelectorAll('[data-dashboard-tab]');
const dashboardSections = document.querySelectorAll('[data-dashboard-section]');

let currentPosition = 0;
let cardsPerView = getCardsPerView();
let totalCards = carouselTrack ? carouselTrack.children.length : 0;
let totalSlides = Math.max(1, Math.ceil(totalCards / cardsPerView));
let autoplayTimer = null;

// Drag variables
let isDragging = false;
let touchStartX = 0;
let touchCurrentX = 0;
let dragOffset = 0;
let velocity = 0;
let lastX = 0;
let lastTime = 0;

function readDefaultSettingsFromPage() {
  const heroTitle = document.querySelector('.hero-copy h1');
  const heroText = document.querySelector('.hero-copy p');
  const priceCards = document.querySelectorAll('.printer-card');
  const serviceCards = document.querySelectorAll('.carousel-card');
  const whatsappLink = document.querySelector('a[href*="wa.me"]');
  const emailLink = document.querySelector('a[href^="mailto:"]');
  const locationLink = document.querySelector('.footer-map-link');

  return {
    heroTitle: heroTitle ? heroTitle.textContent.trim() : '',
    heroText: heroText ? heroText.textContent.trim() : '',
    prices: Array.from(priceCards).map((card) => ({
      value: card.querySelector('span') ? card.querySelector('span').textContent.trim() : '',
      label: card.querySelector('small') ? card.querySelector('small').textContent.trim() : '',
    })),
    products: Array.from(serviceCards).map((card, index) => ({
      title: card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : '',
      description: card.querySelector('p') ? card.querySelector('p').textContent.trim() : '',
      icon: ['print', 'ad', 'award'][index] || 'print',
      price: '',
      active: true,
    })),
    whatsapp: whatsappLink ? whatsappLink.href.replace(/\D/g, '') : '96565683725',
    phone: whatsappLink ? whatsappLink.textContent.trim() : '+965 6568 3725',
    email: emailLink ? emailLink.textContent.trim() : 'info@smartprint.com',
    location: locationLink ? locationLink.textContent.trim() : '',
  };
}

function getDefaultSettings() {
  try {
    const saved = localStorage.getItem(dashboardDefaultsKey);
    if (saved) return JSON.parse(saved);
    const defaults = readDefaultSettingsFromPage();
    localStorage.setItem(dashboardDefaultsKey, JSON.stringify(defaults));
    return defaults;
  } catch (error) {
    console.error('Unable to prepare dashboard defaults:', error);
    return readDefaultSettingsFromPage();
  }
}

function getDashboardSettings() {
  try {
    const saved = localStorage.getItem(dashboardSettingsKey);
    return saved ? JSON.parse(saved) : getDefaultSettings();
  } catch (error) {
    console.error('Unable to read dashboard settings:', error);
    return getDefaultSettings();
  }
}

function saveDashboardSettings(settings) {
  localStorage.setItem(dashboardSettingsKey, JSON.stringify(settings));
}

function isZeroValue(value) {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().replace(/٠/g, '0');
  return normalized === '0';
}

function containsDigit(value) {
  if (value === null || value === undefined) return false;
  return /[0-9٠-٩]/.test(String(value));
}

function applyRemoteSettings(settings) {
  if (!settings) return;

  const heroTitle = document.querySelector('.hero-copy h1');
  const heroText = document.querySelector('.hero-copy p');
  const footerIntro = document.querySelector('.footer-section p');
  const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
  const remoteTitle = settings.hero_title || settings.heroTitle;
  const remoteText = settings.hero_text || settings.heroText;
  const remoteWhatsapp = settings.whatsapp_number || settings.whatsapp;

  if (heroTitle && remoteTitle) heroTitle.textContent = remoteTitle;
  if (heroText && remoteText) heroText.textContent = remoteText;
  if (footerIntro && remoteText) footerIntro.textContent = remoteText;

  if (remoteWhatsapp) {
    const cleanNumber = String(remoteWhatsapp).replace(/\D/g, '');
    whatsappLinks.forEach((link) => {
      link.href = `https://wa.me/${cleanNumber}`;
      if (link.textContent.trim()) {
        link.innerHTML = `<i class="fab fa-whatsapp"></i> ${remoteWhatsapp}`;
      }
    });
  }
}

async function getSiteSettings() {
  try {
    const response = await fetch(`${siteApiBase}/settings`);
    const res = await response.json();
    if (res && res.success && res.data) {
      applyRemoteSettings(res.data);
    }
  } catch (error) {
    console.error('Unable to load settings:', error);
  }
}

function getIconClass(icon) {
  if (icon === 'ad') return 'fas fa-bullhorn';
  if (icon === 'award') return 'fas fa-award';
  return 'fas fa-print';
}

function applyDashboardSettings() {
  const settings = getDashboardSettings();
  if (!settings) return null;

  const heroTitle = document.querySelector('.hero-copy h1');
  const heroText = document.querySelector('.hero-copy p');
  const priceCards = document.querySelectorAll('.printer-card');
  const footerSections = document.querySelectorAll('.footer-section');
  const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
  const emailLinks = document.querySelectorAll('a[href^="mailto:"]');

  if (heroTitle && settings.heroTitle) heroTitle.textContent = settings.heroTitle;
  if (heroText && settings.heroText) heroText.textContent = settings.heroText;

  if (Array.isArray(settings.prices)) {
    settings.prices.forEach((price, index) => {
      const card = priceCards[index];
      if (!card) return;
      const value = card.querySelector('span');
      const label = card.querySelector('small');
      if (value) value.textContent = !containsDigit(price.value) ? price.value || '' : '';
      if (label) label.textContent = price.label || '';
    });
  }

  if (settings.whatsapp) {
    whatsappLinks.forEach((link) => {
      link.href = `https://wa.me/${settings.whatsapp}`;
      if (link.textContent.trim()) {
        link.innerHTML = `<i class="fab fa-whatsapp"></i> ${settings.phone || settings.whatsapp}`;
      }
    });
  }

  if (settings.email) {
    emailLinks.forEach((link) => {
      link.href = `mailto:${settings.email}`;
      link.innerHTML = `<i class="fas fa-envelope"></i> ${settings.email}`;
    });
  }

  if (footerSections[0] && settings.heroText) {
    const paragraph = footerSections[0].querySelector('p');
    if (paragraph) paragraph.textContent = settings.heroText;
  }

  if (footerSections[2] && settings.location) {
    const locationLink = footerSections[2].querySelector('a');
    if (locationLink) {
      locationLink.innerHTML = `<i class="fas fa-location-dot"></i> ${settings.location}`;
      locationLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.location)}`;
    }
  }

  return settings;
}

function getMergedSettings() {
  const defaults = getDefaultSettings();
  const saved = getDashboardSettings();

  return {
    ...defaults,
    ...saved,
    prices: Array.isArray(saved.prices) ? saved.prices : defaults.prices,
    products: Array.isArray(saved.products) ? saved.products : defaults.products,
  };
}

function getCardsPerView() {
  const width = window.innerWidth;
  if (width <= 640) return 1;
  if (width <= 900) return 2;
  return 3;
}

function recalculateCarousel() {
  totalCards = carouselTrack ? carouselTrack.children.length : 0;
  totalSlides = Math.max(1, Math.ceil(totalCards / cardsPerView));
  currentPosition = Math.min(currentPosition, totalSlides - 1);
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'carousel-card';

  const image = document.createElement('div');
  image.className = 'card-image';
  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.title || 'Product image';
    image.appendChild(img);
  } else {
    image.innerHTML = `<i class="${getIconClass(product.icon)}"></i>`;
  }

  const title = document.createElement('h3');
  title.textContent = product.title || 'خدمة طباعة';

  const description = document.createElement('p');
  description.textContent = product.description || '';

  const price = document.createElement('div');
  price.className = 'card-stars';
  price.textContent = product.price !== undefined && product.price !== null && !containsDigit(product.price)
    ? String(product.price).trim()
    : '';

  card.append(image, title, description);
  if (price.textContent) {
    card.appendChild(price);
  }

  return card;
}

function renderProducts(products) {
  if (!carouselTrack) return;

  const visibleProducts = products.filter((product) => product.active !== false);
  carouselTrack.innerHTML = '';
  carouselTrack.style.gridTemplateColumns = `repeat(${Math.max(visibleProducts.length, 1)}, minmax(0, 1fr))`;

  visibleProducts.forEach((product) => {
    carouselTrack.appendChild(createProductCard(product));
  });

  currentPosition = 0;
  recalculateCarousel();
  buildDots();
  updateCarousel();
  startAutoplay();
}

async function getProducts() {
  if (!carouselTrack) return;
  const dashboardSettings = getDashboardSettings();

  if (
    dashboardSettings &&
    Array.isArray(dashboardSettings.products) &&
    dashboardSettings.products.length > 0
  ) {
    renderProducts(dashboardSettings.products);
    return;
  }

  try {
    const response = await fetch(
      `${siteApiBase}/products`,
    );
    const res = await response.json();
    console.log(res);

    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      carouselTrack.innerHTML = '';
      carouselTrack.style.gridTemplateColumns = `repeat(${res.data.length}, minmax(0, 1fr))`;

      res.data.forEach((product) => {
        carouselTrack.appendChild(createProductCard(product));
      });

      recalculateCarousel();
      buildDots();
      updateCarousel();
      startAutoplay();
    }
  } catch (error) {
    console.error('Unable to load products:', error);
  }
}

function setDashboardOpen(isOpen) {
  if (!dashboardPanel || !dashboardBackdrop) return;
  dashboardPanel.classList.toggle('active', isOpen);
  dashboardBackdrop.classList.toggle('active', isOpen);
  dashboardPanel.setAttribute('aria-hidden', String(!isOpen));
  document.body.classList.toggle('dashboard-open', isOpen);
}

function setDashboardStatus(message) {
  if (!dashboardStatus) return;
  dashboardStatus.textContent = message;
  clearTimeout(setDashboardStatus.timer);
  setDashboardStatus.timer = setTimeout(() => {
    dashboardStatus.textContent = '';
  }, 2400);
}

function setActiveDashboardTab(tabName) {
  dashboardTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.dashboardTab === tabName);
  });

  dashboardSections.forEach((section) => {
    section.classList.toggle('active', section.dataset.dashboardSection === tabName);
  });
}

function createServiceEditor(product = {}, index = 0) {
  const editor = document.createElement('div');
  editor.className = 'service-editor';
  editor.dataset.serviceIndex = index;
  editor.innerHTML = `
    <div class="service-editor-top">
      <strong>Service ${index + 1}</strong>
      <button class="service-remove" type="button" aria-label="Remove service">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <label>
      Title
      <input data-service-field="title" type="text" value="${escapeHtml(product.title || '')}">
    </label>
    <label>
      Description
      <textarea data-service-field="description" rows="3">${escapeHtml(product.description || '')}</textarea>
    </label>
    <div class="dashboard-grid">
      <label>
        Icon
        <select data-service-field="icon">
          <option value="print">Print</option>
          <option value="ad">Ads</option>
          <option value="award">Awards</option>
        </select>
      </label>
      <label>
        Price
        <input data-service-field="price" type="text" value="${escapeHtml(product.price || '')}">
      </label>
    </div>
    <label class="dashboard-check">
      <input data-service-field="active" type="checkbox" ${product.active === false ? '' : 'checked'}>
      <span>Show on website</span>
    </label>
  `;

  const iconSelect = editor.querySelector('[data-service-field="icon"]');
  if (iconSelect) iconSelect.value = product.icon || 'print';

  return editor;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderServiceEditors(products) {
  if (!serviceEditorList) return;
  serviceEditorList.innerHTML = '';

  products.forEach((product, index) => {
    serviceEditorList.appendChild(createServiceEditor(product, index));
  });
}

function collectServiceEditors() {
  if (!serviceEditorList) return [];

  return Array.from(serviceEditorList.querySelectorAll('.service-editor')).map((editor) => {
    const getField = (name) => editor.querySelector(`[data-service-field="${name}"]`);
    return {
      title: getField('title') ? getField('title').value.trim() : '',
      description: getField('description') ? getField('description').value.trim() : '',
      icon: getField('icon') ? getField('icon').value : 'print',
      price: getField('price') ? getField('price').value.trim() : '',
      active: getField('active') ? getField('active').checked : true,
    };
  });
}

function fillDashboardForm() {
  if (!dashboardForm) return;
  const settings = getMergedSettings();

  dashboardForm.heroTitle.value = settings.heroTitle || '';
  dashboardForm.heroText.value = settings.heroText || '';
  dashboardForm.whatsapp.value = settings.whatsapp || '';
  dashboardForm.phone.value = settings.phone || '';
  dashboardForm.email.value = settings.email || '';
  dashboardForm.location.value = settings.location || '';

  (settings.prices || []).forEach((price, index) => {
    const valueField = dashboardForm[`priceValue${index}`];
    const labelField = dashboardForm[`priceLabel${index}`];
    if (valueField) valueField.value = price.value || '';
    if (labelField) labelField.value = price.label || '';
  });

  renderServiceEditors(settings.products || []);
}

function collectDashboardForm() {
  const current = getMergedSettings();
  return {
    ...current,
    heroTitle: dashboardForm.heroTitle.value.trim(),
    heroText: dashboardForm.heroText.value.trim(),
    whatsapp: dashboardForm.whatsapp.value.replace(/\D/g, ''),
    phone: dashboardForm.phone.value.trim(),
    email: dashboardForm.email.value.trim(),
    location: dashboardForm.location.value.trim(),
    prices: [0, 1, 2].map((index) => ({
      value: dashboardForm[`priceValue${index}`].value.trim(),
      label: dashboardForm[`priceLabel${index}`].value.trim(),
    })),
    products: collectServiceEditors(),
  };
}

function previewDashboardChanges() {
  if (!dashboardForm) return;
  const settings = collectDashboardForm();
  saveDashboardSettings(settings);
  applyDashboardSettings();
  renderProducts(settings.products);
}

function initDashboard() {
  if (!dashboardForm || !dashboardPanel) return;

  fillDashboardForm();

  if (dashboardToggle) {
    dashboardToggle.addEventListener('click', () => setDashboardOpen(true));
  }

  [dashboardClose, dashboardBackdrop].forEach((element) => {
    if (element) element.addEventListener('click', () => setDashboardOpen(false));
  });

  dashboardTabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveDashboardTab(tab.dataset.dashboardTab));
  });

  dashboardForm.addEventListener('input', previewDashboardChanges);
  dashboardForm.addEventListener('change', previewDashboardChanges);

  dashboardForm.addEventListener('submit', (event) => {
    event.preventDefault();
    previewDashboardChanges();
    setDashboardStatus('Saved. Your website is updated.');
  });

  if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => {
      const products = collectServiceEditors();
      products.push({
        title: 'New service',
        description: 'Describe this service here.',
        icon: 'print',
        price: '',
        active: true,
      });
      renderServiceEditors(products);
      previewDashboardChanges();
    });
  }

  if (serviceEditorList) {
    serviceEditorList.addEventListener('click', (event) => {
      const removeButton = event.target.closest('.service-remove');
      if (!removeButton) return;
      removeButton.closest('.service-editor').remove();
      renderServiceEditors(collectServiceEditors());
      previewDashboardChanges();
    });
  }

  if (dashboardReset) {
    dashboardReset.addEventListener('click', () => {
      const defaults = getDefaultSettings();
      saveDashboardSettings(defaults);
      fillDashboardForm();
      applyDashboardSettings();
      renderProducts(defaults.products || []);
      setDashboardStatus('Reset to the original content.');
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setDashboardOpen(false);
  });
}

function updateTrackSize() {
  if (!carouselTrack) return;
  if (!totalCards) return;
  carouselTrack.style.width = `${(totalCards / cardsPerView) * 100}%`;
}

function buildDots() {
  if (!carouselDots) return;
  carouselDots.innerHTML = '';

  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = `dot ${i === currentPosition ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      goToSlide(i);
      resetAutoplay();
    });
    carouselDots.appendChild(dot);
  }
}

function updateCarousel() {
  updateTrackSize();
  if (!carouselTrack || !totalCards) return;
  // In RTL, a positive translateX moves the track right, showing items to the left
  const offset = currentPosition * cardsPerView * (100 / totalCards);
  carouselTrack.style.transform = `translateX(${offset}%)`;
  
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentPosition);
  });
}

function goToSlide(index) {
  currentPosition = Math.max(0, Math.min(index, totalSlides - 1));
  updateCarousel();
}

function nextSlide() {
  currentPosition = (currentPosition + 1) % totalSlides;
  updateCarousel();
}

function prevSlide() {
  currentPosition = (currentPosition - 1 + totalSlides) % totalSlides;
  updateCarousel();
}

// Autoplay functionality
function startAutoplay() {
  clearInterval(autoplayTimer);
  autoplayTimer = setInterval(() => {
    nextSlide();
  }, 4000);
}

function resetAutoplay() {
  clearInterval(autoplayTimer);
  startAutoplay();
}

// Button listeners (only if buttons exist)
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoplay();
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoplay();
  });
}

// Touch/Drag functionality
if (carouselWrapper) {
  carouselWrapper.addEventListener('pointerdown', (e) => {
    isDragging = true;
    touchStartX = e.clientX;
    touchCurrentX = touchStartX;
    lastX = touchStartX;
    lastTime = Date.now();
    dragOffset = 0;
    velocity = 0;
    clearInterval(autoplayTimer);
    carouselTrack.style.transition = 'none';
    carouselWrapper.style.cursor = 'grabbing';
    if (carouselWrapper.setPointerCapture) {
      carouselWrapper.setPointerCapture(e.pointerId);
    }
  }, false);

  carouselWrapper.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const now = Date.now();
    const timeDelta = now - lastTime;
    
    touchCurrentX = e.clientX;
    dragOffset = touchCurrentX - touchStartX;
    
    // Calculate velocity
    if (timeDelta > 0) {
      velocity = (touchCurrentX - lastX) / timeDelta;
    }
    
    lastX = touchCurrentX;
    lastTime = now;
    
    const baseOffset = currentPosition * cardsPerView * (100 / totalCards);
    // dragPercentage must be relative to the track width for translateX(%) to be accurate
    const dragPercentage = (dragOffset / carouselTrack.offsetWidth) * 100;
    carouselTrack.style.transform = `translateX(${baseOffset + dragPercentage}%)`;
  }, false);
    
  window.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    carouselWrapper.style.cursor = 'grab';
    if (carouselWrapper.releasePointerCapture) {
      carouselWrapper.releasePointerCapture(e.pointerId);
    }
    
    carouselTrack.style.transition = 'transform 0.4s ease-out';
    
    const dragThreshold = 20;
    const momentumThreshold = 0.5;
    const diff = touchCurrentX - touchStartX;
    
    // Check if there's enough momentum or drag distance
    // Match the slide change to the direction the user dragged the cards.
    if (Math.abs(velocity) > momentumThreshold || Math.abs(diff) > dragThreshold) {
      if (diff < 0 || velocity < -momentumThreshold) {
        prevSlide();
      } else {
        nextSlide();
      }
    } else {
      updateCarousel();
    }
    
    resetAutoplay();
  }, false);

  window.addEventListener('pointercancel', (e) => {
    if (!isDragging) return;
    isDragging = false;
    carouselWrapper.style.cursor = 'grab';
    if (carouselWrapper.releasePointerCapture) {
      carouselWrapper.releasePointerCapture(e.pointerId);
    }
  }, false);
}

function handleResize() {
  const newCardsPerView = getCardsPerView();
  if (newCardsPerView !== cardsPerView) {
    cardsPerView = newCardsPerView;
    recalculateCarousel();
    buildDots();
  }
  updateCarousel();
}

window.addEventListener('resize', handleResize);

// Initialize fallback cards, then replace them with API products when available.
applyDashboardSettings();
getSiteSettings();
recalculateCarousel();
buildDots();
updateCarousel();
startAutoplay();
getProducts();
initDashboard();
