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

const tabs = [...document.querySelectorAll('.resource-tab')];
const cards = [...document.querySelectorAll('.featured-card')];
const resourceImageUrls = typeof import.meta.glob === 'function'
  ? import.meta.glob('./assets/images/*.{png,webp}', { eager: true, query: '?url', import: 'default' })
  : null;
const resourceImageUrl = (fileName) =>
  resourceImageUrls?.['./assets/images/' + fileName] ?? './assets/images/' + fileName;
function selectTab(tab) {
  const archive = tab.dataset.tab === 'archive';
  tabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  document.body.dataset.resourceView = archive ? 'archive' : 'resources';
  if (resourceBackground) resourceBackground.src = resourceImageUrl(archive ? resourceBackground.dataset.archiveBackground : resourceBackground.dataset.resourceBackground);
  cards.forEach((card) => {
    const title = card.querySelector('.featured-title');
    const image = card.querySelector('.featured-cover');
    const nextTitle = archive ? card.dataset.archiveTitle : card.dataset.resourceTitle;
    const nextImage = archive ? card.dataset.archiveImage : card.dataset.resourceImage;
    if (title) title.textContent = nextTitle;
    if (image) {
      image.src = resourceImageUrl(nextImage);
      image.alt = `${nextTitle} preview`;
    }
    card.href = archive ? card.dataset.archiveHref : card.dataset.resourceHref;
  });
  const panel = document.querySelector('#resources-panel');
  if (panel) panel.setAttribute('aria-labelledby', tab.id);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    selectTab(tabs[next]);
  });
});
