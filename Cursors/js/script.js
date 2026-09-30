const menuToggle = document.querySelector('.menu-toggle');
const mobileNavigation = document.querySelector('#mobile-navigation');

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
const malaysiaTimeFormatter = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

function updateClock() {
  if (clockValue) clockValue.textContent = malaysiaTimeFormatter.format(new Date());
  if (clockZone) clockZone.textContent = 'MYT';
}

updateClock();
window.setInterval(updateClock, 1000);