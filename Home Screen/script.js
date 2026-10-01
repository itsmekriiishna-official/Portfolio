const track = document.querySelector('#carousel-track');
const gallery = document.querySelector('.photo-gallery');
const slides = track ? [...track.querySelectorAll('img')] : [];
const dots = gallery ? [...gallery.querySelectorAll('.carousel-dots button')] : [];
const menuToggle = document.querySelector('.menu-toggle');
const mobileNavigation = document.querySelector('#mobile-navigation');
let activeSlide = 0;
let pointerStartX = null;
let activePointerId = null;
let autoAdvanceTimer = null;

function selectSlide(index) {
  if (!slides.length || !track) return;
  activeSlide = (index + slides.length) % slides.length;
  track.style.transform = `translate3d(-${activeSlide * 100}%, 0, 0)`;
  slides.forEach((slide, slideIndex) => {
    slide.setAttribute('aria-hidden', String(slideIndex !== activeSlide));
  });
  dots.forEach((dot, dotIndex) => {
    const active = dotIndex === activeSlide;
    dot.setAttribute('aria-current', String(active));
    dot.classList.toggle('is-active', active);
  });
}

function stopAutoAdvance() {
  window.clearInterval(autoAdvanceTimer);
  autoAdvanceTimer = null;
}

function startAutoAdvance() {
  stopAutoAdvance();
  if (slides.length < 2 || document.hidden) return;
  autoAdvanceTimer = window.setInterval(() => selectSlide(activeSlide + 1), 5000);
}

if (gallery && track && slides.length > 1) {
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      selectSlide(Number(dot.dataset.slide));
      startAutoAdvance();
    });
  });

  gallery.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button') || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointerStartX = event.clientX;
    activePointerId = event.pointerId;
    stopAutoAdvance();
    try {
      gallery.setPointerCapture(event.pointerId);
    } catch {
      // The browser may release the pointer before capture; pointer events still work without capture.
    }
  });

  gallery.addEventListener('pointerup', (event) => {
    if (activePointerId !== event.pointerId || pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    activePointerId = null;
    if (Math.abs(distance) > 35) selectSlide(activeSlide + (distance < 0 ? 1 : -1));
    startAutoAdvance();
  });

  const cancelDrag = () => {
    pointerStartX = null;
    activePointerId = null;
    startAutoAdvance();
  };
  gallery.addEventListener('pointercancel', cancelDrag);
  gallery.addEventListener('lostpointercapture', cancelDrag);
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') selectSlide(activeSlide + 1);
    if (event.key === 'ArrowLeft') selectSlide(activeSlide - 1);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoAdvance();
    else startAutoAdvance();
  });

  selectSlide(0);
  startAutoAdvance();
}

function setMenuOpen(open) {
  if (!menuToggle || !mobileNavigation) return;
  menuToggle.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileNavigation.hidden = !open;
  document.body.classList.toggle('menu-open', open);
}
menuToggle?.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') setMenuOpen(false);
});
mobileNavigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});

const clockValue = document.querySelector('#local-time .local-clock-value');
const clockZone = document.querySelector('#local-time .local-clock-zone');
const localTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
});
const localZoneFormatter = new Intl.DateTimeFormat(undefined, { timeZoneName: 'shortOffset' });
function updateClock() {
  const now = new Date();
  if (clockValue) clockValue.textContent = localTimeFormatter.format(now);
  if (clockZone) clockZone.textContent = localZoneFormatter.formatToParts(now).find((part) => part.type === 'timeZoneName')?.value ?? '';
}
updateClock();
window.setInterval(updateClock, 1000);

// Navigate to Sunset Studio
const sunsetCard = document.querySelector('.card-sunset');
sunsetCard?.addEventListener('click', (event) => {
  if (event.target.closest('a')) return;
  window.location.href = '../Sunset/index.html';
});