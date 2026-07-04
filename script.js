// Mobile Menu Toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

function setMobileMenuState(isOpen) {
  if (!navLinks || !mobileToggle) return;

  navLinks.classList.toggle('active', isOpen);
  const icon = mobileToggle.querySelector('i');
  if (!icon) return;

  icon.classList.toggle('fa-bars', !isOpen);
  icon.classList.toggle('fa-times', isOpen);
}

function closeMobileMenu() {
  setMobileMenuState(false);
}

if (mobileToggle && navLinks) {
  const shouldCloseMenu = (target) => {
    const isMenuOpen = navLinks.classList.contains('active');
    if (!isMenuOpen) return false;
    return target instanceof Element && !navLinks.contains(target) && !mobileToggle.contains(target);
  };

  mobileToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = navLinks.classList.contains('active');
    setMobileMenuState(!isOpen);
  });

  document.addEventListener('click', (event) => {
    if (shouldCloseMenu(event.target)) {
      closeMobileMenu();
    }
  });

  document.addEventListener('touchstart', (event) => {
    if (shouldCloseMenu(event.target)) {
      closeMobileMenu();
    }
  }, true);

  document.addEventListener('pointerdown', (event) => {
    if (shouldCloseMenu(event.target)) {
      closeMobileMenu();
    }
  }, true);

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });
}

// Carousel functionality
const carouselTrack = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const carouselDots = document.getElementById('carouselDots');
const carouselWrapper = document.querySelector('.carousel-wrapper');
const dashboardSettingsKey = 'smartPrintSiteSettings';

let currentPosition = 0;
let cardsPerView = getCardsPerView();
let totalCards = carouselTrack ? carouselTrack.children.length : 0;
let totalSlides = Math.max(1, Math.ceil(totalCards / cardsPerView));
let autoplayTimer = null;
let autoplayCooldownTimer = null;
const autoplayCooldownMs = 3000;
const autoplayIntervalMs = 3000;

// Drag variables
let isDragging = false;
let touchStartX = 0;
let touchCurrentX = 0;
let dragOffset = 0;
let velocity = 0;
let lastX = 0;
let lastTime = 0;

function getDashboardSettings() {
  try {
    const saved = localStorage.getItem(dashboardSettingsKey);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Unable to read dashboard settings:', error);
    return null;
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
      if (value) value.textContent = price.value || '';
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

function hasMeaningfulText(value) {
  if (value === undefined || value === null) return false;

  const normalized = String(value).trim();
  if (!normalized) return false;

  return !['blank', 'none', 'n/a', 'null', 'undefined', 'nth'].includes(normalized.toLowerCase());
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

  const descriptionText = hasMeaningfulText(product.description) ? String(product.description).trim() : '';
  const price = document.createElement('div');
  price.className = 'card-stars';
  const hasPrice = product.price !== undefined && product.price !== null && product.price !== '' && product.price !== 0;
  price.textContent = hasPrice ? `${product.price} د.ك` : '';

  const body = document.createElement('div');
  body.className = 'card-body';
  body.appendChild(title);

  if (descriptionText) {
    const description = document.createElement('p');
    description.textContent = descriptionText;
    body.appendChild(description);
  }

  if (price.textContent) body.appendChild(price);

  card.append(image, body);

  return card;
}

async function getProducts() {
  if (!carouselTrack) return;
  const dashboardSettings = getDashboardSettings();

  if (
    dashboardSettings &&
    Array.isArray(dashboardSettings.products) &&
    dashboardSettings.products.length > 0
  ) {
    const visibleProducts = dashboardSettings.products.filter((product) => product.active !== false);
    carouselTrack.innerHTML = '';
    carouselTrack.style.gridTemplateColumns = `repeat(${visibleProducts.length}, minmax(0, 1fr))`;

    visibleProducts.forEach((product) => {
      carouselTrack.appendChild(createProductCard(product));
    });

    recalculateCarousel();
    buildDots();
    updateCarousel();
    startAutoplay();
    return;
  }

  try {
    const response = await fetch(
      'https://whitesmoke-jaguar-842419.hostingersite.com/api/products',
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

function getCarouselOffset() {
  if (!totalCards || !cardsPerView) return 0;
  return currentPosition * cardsPerView * (100 / totalCards);
}

function updateCarousel() {
  updateTrackSize();
  if (!carouselTrack || !totalCards) return;
  carouselTrack.style.transform = `translateX(${getCarouselOffset()}%)`;

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
  }, autoplayIntervalMs);
}

function clearAutoplayCooldown() {
  if (autoplayCooldownTimer) {
    clearTimeout(autoplayCooldownTimer);
    autoplayCooldownTimer = null;
  }
}

function resumeAutoplayAfterCooldown() {
  clearAutoplayCooldown();
  clearInterval(autoplayTimer);
  autoplayCooldownTimer = setTimeout(() => {
    autoplayCooldownTimer = null;
    startAutoplay();
  }, autoplayCooldownMs);
}

function resetAutoplay() {
  clearAutoplayCooldown();
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
    
    const baseOffset = getCarouselOffset();
    const dragPercentage = (dragOffset / carouselWrapper.clientWidth) * 100;
    const isMobile = window.innerWidth <= 768;
    const sensitivity = isMobile ? 0.28 : 0.45;
    // In RTL, swipe directions feel inverted unless we flip the sign.
    carouselTrack.style.transform = `translateX(${baseOffset + dragPercentage * sensitivity}%)`;
  }, false);
    
  window.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    carouselWrapper.style.cursor = 'grab';
    if (carouselWrapper.releasePointerCapture) {
      carouselWrapper.releasePointerCapture(e.pointerId);
    }
    
    const isMobile = window.innerWidth <= 768;
    const transitionDuration = isMobile ? '1.1s' : '0.8s';
    carouselTrack.style.transition = `transform ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1)`;
    
    const dragThreshold = 20;
    const momentumThreshold = 0.5;
    const diff = touchStartX - touchCurrentX;

    if (Math.abs(velocity) > momentumThreshold || Math.abs(diff) > dragThreshold) {
      if (diff > 0 || velocity < -momentumThreshold) {
        prevSlide();
      } else {
        nextSlide();
      }
    } else {
      updateCarousel();
    }
    
    resumeAutoplayAfterCooldown();
  }, false);

  window.addEventListener('pointercancel', (e) => {
    if (!isDragging) return;
    isDragging = false;
    carouselWrapper.style.cursor = 'grab';
    if (carouselWrapper.releasePointerCapture) {
      carouselWrapper.releasePointerCapture(e.pointerId);
    }
    resumeAutoplayAfterCooldown();
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
recalculateCarousel();
buildDots();
updateCarousel();
startAutoplay();
getProducts();
