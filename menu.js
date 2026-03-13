/* ============================================
   CUPPA HOOCH — Digital Menu
   menu.js  |  v2 — fixes for slow load, swipe delay, blank viewer
   ============================================ */

'use strict';

/* ── DOM references ── */
const viewerScreen  = document.getElementById('viewer-screen');
const viewerCtr     = document.getElementById('viewer-counter');
const slidesTrack   = document.getElementById('slides-track');
const dotRow        = document.getElementById('dot-row');
const prevBtn       = document.getElementById('prev-btn');
const nextBtn       = document.getElementById('next-btn');
const closeBtn      = document.getElementById('close-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const fullscreenIcon= document.getElementById('fullscreen-icon');
const slideArea     = document.getElementById('slide-area');

let current     = 0;
let total       = 0;
let isCover     = false;
let isAnimating = false;

/* ══════════════════════════════
   IMAGE PRELOADER
   Loads all images in the background as soon
   as the page opens so clicking a category
   feels instant instead of blank/slow.
══════════════════════════════ */
function preloadAll() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    const srcs = btn.dataset.images.split(',').map(s => s.trim()).filter(Boolean);
    srcs.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  });
}

window.addEventListener('load', preloadAll);

/* ══════════════════════════════
   OPEN VIEWER
══════════════════════════════ */
function openViewer(label, images) {
  current = 0;
  total   = images.length;

  /* Disable transition while building to prevent flash/jump on first open */
  slidesTrack.style.transition = 'none';
  slidesTrack.style.transform  = 'translateX(0%)';
  slidesTrack.innerHTML = '';

  images.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide';

    /* Show spinner while image loads */
    slide.innerHTML = '<div class="slide-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>';

    const img = document.createElement('img');
    img.alt      = label + ' — page ' + (i + 1);
    img.decoding = 'async';
    img.draggable = false;

    img.onload = function () {
      slide.innerHTML = '';
      if (isCover) img.classList.add('cover');
      slide.appendChild(img);
    };

    img.onerror = function () {
      slide.innerHTML = '';
      slide.appendChild(makePlaceholder(label, i + 1));
    };

    img.src = src;

    /* Handle already-cached images (onload won't fire) */
    if (img.complete && img.naturalWidth > 0) {
      slide.innerHTML = '';
      if (isCover) img.classList.add('cover');
      slide.appendChild(img);
    }

    slidesTrack.appendChild(slide);
  });

  /* Build dots */
  dotRow.innerHTML = '';
  images.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot';
    d.addEventListener('click', () => goTo(i));
    dotRow.appendChild(d);
  });

  /* Show/hide navigation */
  const multi = total > 1;
  prevBtn.style.display   = multi ? '' : 'none';
  nextBtn.style.display   = multi ? '' : 'none';
  dotRow.style.display    = multi ? '' : 'none';
  viewerCtr.style.display = multi ? '' : 'none';

  updateUI();

  viewerScreen.classList.add('open');
  document.body.style.overflow = 'hidden';

  /* Re-enable transition after two frames so first show has no slide animation */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      slidesTrack.style.transition = '';
    });
  });
}

/* ══════════════════════════════
   CLOSE VIEWER
══════════════════════════════ */
function closeViewer() {
  viewerScreen.classList.remove('open');
  document.body.style.overflow = '';
  resetFitMode();
  isAnimating = false;
}

/* ══════════════════════════════
   NAVIGATE SLIDES
══════════════════════════════ */
function goTo(index) {
  if (isAnimating) return;
  const next = Math.max(0, Math.min(index, total - 1));
  if (next === current) return;

  isAnimating = true;
  current = next;
  slidesTrack.style.transform = 'translateX(-' + current * 100 + '%)';
  updateUI();

  /* Unlock after slide transition completes (matches CSS 0.4s) */
  setTimeout(() => { isAnimating = false; }, 420);
}

/* ── Sync counter, arrows, dots to current slide ── */
function updateUI() {
  viewerCtr.textContent = (current + 1) + ' / ' + total;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === total - 1;
  document.querySelectorAll('.dot').forEach((d, i) =>
    d.classList.toggle('active', i === current)
  );
}

/* ── Placeholder for missing images ── */
function makePlaceholder(label, page) {
  const div = document.createElement('div');
  div.className = 'slide-placeholder';
  div.innerHTML =
    '<i class="fa-regular fa-image"></i>' +
    '<span class="ph-title">' + label + ' — Page ' + page + '</span>' +
    '<span class="ph-sub">Add filename in data-images</span>';
  return div;
}

/* ══════════════════════════════
   FIT / FILL TOGGLE
══════════════════════════════ */
fullscreenBtn.addEventListener('click', () => {
  isCover = !isCover;
  document.querySelectorAll('.slide img').forEach(img =>
    img.classList.toggle('cover', isCover)
  );
  fullscreenIcon.className = isCover ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
  fullscreenBtn.title = isCover ? 'Fit to screen' : 'Fill screen';
});

function resetFitMode() {
  isCover = false;
  document.querySelectorAll('.slide img').forEach(img => img.classList.remove('cover'));
  fullscreenIcon.className = 'fa-solid fa-expand';
  fullscreenBtn.title = 'Fill screen';
}

/* ══════════════════════════════
   EVENTS
══════════════════════════════ */

/* Category button click */
document.getElementById('cat-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;
  const label  = btn.dataset.label;
  const images = btn.dataset.images.split(',').map(s => s.trim()).filter(Boolean);
  if (images.length) openViewer(label, images);
});

/* Arrow buttons */
prevBtn.addEventListener('click', () => goTo(current - 1));
nextBtn.addEventListener('click', () => goTo(current + 1));

/* Close button */
closeBtn.addEventListener('click', closeViewer);

/* Keyboard navigation */
document.addEventListener('keydown', (e) => {
  if (!viewerScreen.classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  goTo(current - 1);
  if (e.key === 'ArrowRight') goTo(current + 1);
  if (e.key === 'Escape')     closeViewer();
});

/* ══════════════════════════════
   TOUCH SWIPE
   Fixed: proper reset, animation guard,
   touchcancel handling, stricter threshold
══════════════════════════════ */
let txStart  = 0;
let txDelta  = 0;
let txActive = false;

slideArea.addEventListener('touchstart', (e) => {
  if (isAnimating) return;
  txStart  = e.touches[0].clientX;
  txDelta  = 0;
  txActive = true;
}, { passive: true });

slideArea.addEventListener('touchmove', (e) => {
  if (!txActive) return;
  txDelta = e.touches[0].clientX - txStart;
}, { passive: true });

slideArea.addEventListener('touchend', () => {
  if (!txActive) return;
  txActive = false;
  if (Math.abs(txDelta) > 60) {
    txDelta < 0 ? goTo(current + 1) : goTo(current - 1);
  }
  txDelta = 0;
});

/* Handle interrupted swipes (e.g. incoming call, notification) */
slideArea.addEventListener('touchcancel', () => {
  txActive = false;
  txDelta  = 0;
});
