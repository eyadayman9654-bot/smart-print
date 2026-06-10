// Carousel functionality
const carouselTrack = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const carouselDots = document.getElementById('carouselDots');
const carouselWrapper = document.querySelector('.carousel-wrapper');

let currentPosition = 0;
let cardsPerView = getCardsPerView();
const totalCards = document.querySelectorAll('.carousel-card').length || 15;
let totalSlides = Math.ceil(totalCards / cardsPerView);
let autoplayTimer = null;

// Drag variables
let isDragging = false;
let touchStartX = 0;
let touchCurrentX = 0;
let dragOffset = 0;
let velocity = 0;
let lastX = 0;
let lastTime = 0;

function getCardsPerView() {
  const width = window.innerWidth;
  if (width <= 640) return 1;
  if (width <= 900) return 2;
  return 3;
}

function updateTrackSize() {
  if (!carouselTrack) return;
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
    carouselTrack.style.transform = `translateX(${baseOffset - dragPercentage}%)`;
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
    const diff = touchStartX - touchCurrentX;
    
    // Check if there's enough momentum or drag distance
    // In RTL, dragging left (diff > 0) or negative velocity triggers nextSlide
    if (Math.abs(velocity) > momentumThreshold || Math.abs(diff) > dragThreshold) {
      if (diff > 0 || velocity < -momentumThreshold) {
        nextSlide();
      } else {
        prevSlide();
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
    totalSlides = Math.ceil(totalCards / cardsPerView);
    currentPosition = Math.min(currentPosition, totalSlides - 1);
    buildDots();
  }
  updateCarousel();
}

window.addEventListener('resize', handleResize);

// Initialize
buildDots();
updateCarousel();
startAutoplay();