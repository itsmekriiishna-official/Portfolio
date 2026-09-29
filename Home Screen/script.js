import '../assets/home-screen/animations/lottie.min.js';
import logoData from '../assets/home-screen/animations/rachel-logo.json';

const logoContainer = document.querySelector('#brand-animation');
const logoFallback = document.querySelector('#brand-fallback');
const logoPlayedKey = 'rh-logo-played';
if (logoContainer && logoFallback && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  try {
    if (!sessionStorage.getItem(logoPlayedKey) && window.lottie) {
      sessionStorage.setItem(logoPlayedKey, '1');
      const logoAnimation = window.lottie.loadAnimation({
        container: logoContainer,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: logoData,
      });
      logoAnimation.addEventListener('DOMLoaded', () => {
        logoFallback.hidden = true;
        logoAnimation.play();
      });
      logoAnimation.addEventListener('data_failed', () => { logoFallback.hidden = false; });
    }
  } catch {
    logoFallback.hidden = false;
  }
}
const track = document.querySelector('#carousel-track');
const gallery = document.querySelector('.photo-gallery');
const slides = [...track.querySelectorAll('img')];
const dots = [...document.querySelectorAll('.carousel-dots button')];
const menuToggle = document.querySelector('.menu-toggle');
const mobileNavigation = document.querySelector('#mobile-navigation');
let activeSlide = 0;
let pointerStartX = null;

function selectSlide(index) {
  activeSlide = (index + slides.length) % slides.length;
  track.style.transform = `translate3d(-${activeSlide * 100}%, 0, 0)`;
  dots.forEach((dot, dotIndex) => {
    const active = dotIndex === activeSlide;
    dot.setAttribute('aria-current', String(active));
    if (active) dot.classList.add('is-active');
    else dot.classList.remove('is-active');
    slides[dotIndex].setAttribute('aria-hidden', String(!active));
  });
}

dots.forEach((dot) => dot.addEventListener('click', () => selectSlide(Number(dot.dataset.slide))));
gallery.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  pointerStartX = event.clientX;
  gallery.setPointerCapture(event.pointerId);
});
gallery.addEventListener('pointerup', (event) => {
  if (pointerStartX === null) return;
  const distance = event.clientX - pointerStartX;
  pointerStartX = null;
  if (Math.abs(distance) > 40) selectSlide(activeSlide + (distance < 0 ? 1 : -1));
});
gallery.addEventListener('pointercancel', () => { pointerStartX = null; });
gallery.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') selectSlide(activeSlide + 1);
  if (event.key === 'ArrowLeft') selectSlide(activeSlide - 1);
});
selectSlide(activeSlide);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) setInterval(() => selectSlide(activeSlide + 1), 5000);

function setMenuOpen(open) {
  menuToggle.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileNavigation.hidden = !open;
  document.body.classList.toggle('menu-open', open);
}
menuToggle.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') setMenuOpen(false);
});
mobileNavigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});

const clockValue = document.querySelector('#local-time .local-clock-value');
const clockZone = document.querySelector('#local-time .local-clock-zone');
const localTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});
const localZoneFormatter = new Intl.DateTimeFormat(undefined, {
  timeZoneName: 'shortOffset',
});
const updateClock = () => {
  const now = new Date();
  if (clockValue) clockValue.textContent = localTimeFormatter.format(now);
  if (clockZone) clockZone.textContent = localZoneFormatter.formatToParts(now).find((part) => part.type === 'timeZoneName')?.value ?? '';
};
updateClock();
setInterval(updateClock, 1000);


