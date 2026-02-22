/**
 * watermark.js — Canvas-based watermark utility for Prus Photography
 * Composites the logo onto displayed photos to protect originals.
 */

let logoImage = null;
let logoLoaded = false;
const logoLoadPromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        logoImage = img;
        logoLoaded = true;
        resolve(img);
    };
    img.onerror = () => {
        console.warn('Watermark logo failed to load');
        resolve(null);
    };
    img.src = '/images/logo.png';
});

/**
 * Draw a photo onto a canvas with a watermark overlay.
 * @param {HTMLCanvasElement} canvas - The target canvas element
 * @param {string} imageSrc - Source URL of the photo
 * @param {object} options - { opacity, position, scale }
 * @returns {Promise<void>}
 */
export async function drawWatermarked(canvas, imageSrc, options = {}) {
    const {
        opacity = 0.15,
        position = 'center', // 'center', 'bottom-right', 'bottom-center'
        scale = 0.2,
    } = options;

    const ctx = canvas.getContext('2d');

    // Load the photo
    const photo = await loadImage(imageSrc);
    canvas.width = photo.naturalWidth;
    canvas.height = photo.naturalHeight;

    // Draw photo
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

    // Overlay the watermark
    await logoLoadPromise;
    if (!logoImage) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const logoW = canvas.width * scale;
    const logoH = (logoImage.naturalHeight / logoImage.naturalWidth) * logoW;

    let x, y;
    switch (position) {
        case 'bottom-right':
            x = canvas.width - logoW - canvas.width * 0.03;
            y = canvas.height - logoH - canvas.height * 0.03;
            break;
        case 'bottom-center':
            x = (canvas.width - logoW) / 2;
            y = canvas.height - logoH - canvas.height * 0.05;
            break;
        case 'center':
        default:
            x = (canvas.width - logoW) / 2;
            y = (canvas.height - logoH) / 2;
            break;
    }

    ctx.drawImage(logoImage, x, y, logoW, logoH);
    ctx.restore();
}

/**
 * Draw a photo onto a canvas scaled to fit, with a watermark.
 * Used in lightbox where canvas dimensions are fixed by CSS.
 */
export async function drawWatermarkedFit(canvas, imageSrc, maxW, maxH, options = {}) {
    const {
        opacity = 0.12,
        position = 'center',
        scale = 0.18,
    } = options;

    const ctx = canvas.getContext('2d');

    const photo = await loadImage(imageSrc);
    const aspect = photo.naturalWidth / photo.naturalHeight;

    let drawW, drawH;
    if (aspect > maxW / maxH) {
        drawW = maxW;
        drawH = maxW / aspect;
    } else {
        drawH = maxH;
        drawW = maxH * aspect;
    }

    canvas.width = drawW;
    canvas.height = drawH;

    ctx.drawImage(photo, 0, 0, drawW, drawH);

    await logoLoadPromise;
    if (!logoImage) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const logoW = canvas.width * scale;
    const logoH = (logoImage.naturalHeight / logoImage.naturalWidth) * logoW;

    let x, y;
    switch (position) {
        case 'bottom-right':
            x = canvas.width - logoW - 20;
            y = canvas.height - logoH - 20;
            break;
        case 'bottom-center':
            x = (canvas.width - logoW) / 2;
            y = canvas.height - logoH - 30;
            break;
        case 'center':
        default:
            x = (canvas.width - logoW) / 2;
            y = (canvas.height - logoH) / 2;
            break;
    }

    ctx.drawImage(logoImage, x, y, logoW, logoH);
    ctx.restore();
}


function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

/**
 * Disable right-click save on all canvases and images
 */
export function disableImageSaving() {
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'CANVAS' || e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
}
