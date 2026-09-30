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
const localTimeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
const localZoneFormatter = new Intl.DateTimeFormat(undefined, { timeZoneName: 'shortOffset' });

function updateClock() {
  const now = new Date();
  if (clockValue) clockValue.textContent = localTimeFormatter.format(now);
  if (clockZone) clockZone.textContent = localZoneFormatter.formatToParts(now).find((part) => part.type === 'timeZoneName')?.value ?? '';
}

updateClock();
window.setInterval(updateClock, 1000);