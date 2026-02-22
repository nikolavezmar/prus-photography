/**
 * gallery.js — Gallery page logic for Prus Photography
 * Category filtering, grid population, lightbox with navigation, purchase inquiry.
 */

import { drawWatermarked, drawWatermarkedFit } from './watermark.js';

// --- Photo Data ---
// Replace these with your real photos. Each entry needs: src, title, category
const photos = [
    // Portraits
    { src: '/images/photos/portraits/portrait-1.jpg', title: 'Solitude', category: 'portraits' },
    { src: '/images/photos/portraits/portrait-2.jpg', title: 'Golden Hour', category: 'portraits' },
    { src: '/images/photos/portraits/portrait-3.jpg', title: 'Reflection', category: 'portraits' },

    // Landscape
    { src: '/images/photos/landscape/landscape-1.jpg', title: 'Horizon', category: 'landscape' },
    { src: '/images/photos/landscape/landscape-2.jpg', title: 'Mountain Light', category: 'landscape' },
    { src: '/images/photos/landscape/landscape-3.jpg', title: 'Still Waters', category: 'landscape' },

    // Street
    { src: '/images/photos/street/street-1.jpg', title: 'City Pulse', category: 'street' },
    { src: '/images/photos/street/street-2.jpg', title: 'Crosswalk', category: 'street' },
    { src: '/images/photos/street/street-3.jpg', title: 'Neon Nights', category: 'street' },

    // Events
    { src: '/images/photos/events/events-1.jpg', title: 'The Moment', category: 'events' },
    { src: '/images/photos/events/events-2.jpg', title: 'Celebration', category: 'events' },
    { src: '/images/photos/events/events-3.jpg', title: 'Together', category: 'events' },

    // Black & White
    { src: '/images/photos/bw/bw-1.jpg', title: 'Contrast', category: 'bw' },
    { src: '/images/photos/bw/bw-2.jpg', title: 'Shadows', category: 'bw' },
    { src: '/images/photos/bw/bw-3.jpg', title: 'Noir', category: 'bw' },
];

// Category labels
const categoryLabels = {
    portraits: 'Portraits',
    landscape: 'Landscape',
    street: 'Street',
    events: 'Events',
    bw: 'Black & White',
};

const CONTACT_EMAIL = 'hello@prusphotography.com';

// --- State ---
let currentFilter = 'all';
let filteredPhotos = [...photos];
let lightboxIndex = -1;

// --- DOM ---
const grid = document.getElementById('galleryGrid');
const filters = document.getElementById('galleryFilters');
const lightbox = document.getElementById('lightbox');
const lightboxCanvas = document.getElementById('lightboxCanvas');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCategory = document.getElementById('lightboxCategory');
const lightboxPurchase = document.getElementById('lightboxPurchase');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

// --- Build Grid ---
function buildGrid() {
    grid.innerHTML = '';
    filteredPhotos = currentFilter === 'all'
        ? [...photos]
        : photos.filter(p => p.category === currentFilter);

    filteredPhotos.forEach((photo, i) => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.style.transitionDelay = `${i * 0.08}s`;

        const canvas = document.createElement('canvas');
        canvas.dataset.src = photo.src;
        card.appendChild(canvas);

        const overlay = document.createElement('div');
        overlay.className = 'photo-card-overlay';
        overlay.innerHTML = `
      <span class="photo-card-title">${photo.title}</span>
      <span class="photo-card-category">${categoryLabels[photo.category] || photo.category}</span>
    `;
        card.appendChild(overlay);

        card.addEventListener('click', () => openLightbox(i));
        grid.appendChild(card);

        // Draw watermarked image with slight delay per card
        setTimeout(() => {
            drawWatermarked(canvas, photo.src, { opacity: 0.12, position: 'bottom-right', scale: 0.15 })
                .then(() => {
                    card.classList.add('revealed');
                })
                .catch(() => {
                    // Fallback: use an img tag if canvas fails
                    canvas.style.display = 'none';
                    const img = document.createElement('img');
                    img.src = photo.src;
                    img.alt = photo.title;
                    card.insertBefore(img, overlay);
                    card.classList.add('revealed');
                });
        }, i * 60);
    });
}

// --- Filters ---
if (filters) {
    filters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        const category = btn.dataset.category;
        currentFilter = category;

        filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        buildGrid();
    });
}

// --- Lightbox ---
function openLightbox(index) {
    lightboxIndex = index;
    const photo = filteredPhotos[index];
    if (!photo) return;

    lightboxTitle.textContent = photo.title;
    lightboxCategory.textContent = categoryLabels[photo.category] || photo.category;
    lightboxPurchase.href = `mailto:${CONTACT_EMAIL}?subject=Purchase Inquiry — ${encodeURIComponent(photo.title)}&body=Hi, I'm interested in purchasing "${photo.title}" (${categoryLabels[photo.category]}). Could you share pricing and sizing options?`;

    const maxW = window.innerWidth * 0.85;
    const maxH = window.innerHeight * 0.7;
    drawWatermarkedFit(lightboxCanvas, photo.src, maxW, maxH, {
        opacity: 0.1,
        position: 'center',
        scale: 0.2,
    }).catch(() => { });

    lightbox.classList.add('open');
    document.body.classList.add('no-scroll');
}

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.classList.remove('no-scroll');
    lightboxIndex = -1;
}

function navigateLightbox(dir) {
    const newIndex = lightboxIndex + dir;
    if (newIndex >= 0 && newIndex < filteredPhotos.length) {
        openLightbox(newIndex);
    }
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));

document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
});

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});

// --- Export photo data for use in main.js featured grid ---
export { photos, categoryLabels, CONTACT_EMAIL };

// --- Init ---
buildGrid();
