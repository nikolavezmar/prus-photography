/**
 * main.js — Prus Photography v9
 * 
 * CRITICAL RULES:
 * 1) The SVG man + text IS the logo from FRAME ZERO. No PNG, no fade, no swap.
 * 2) Walking animation (slow, natural stride)
 * 3) Papers = crumpled irregular shapes (NOT spheres)
 * 4) Paper blowing = continuous natural arcing motion with flutter (NOT stopping mid-air)
 */
import { drawWatermarked, disableImageSaving } from './watermark.js';
disableImageSaving();

const categories = [
    { name: 'Portraits', desc: 'Character & emotion', link: '/gallery.html?cat=portraits' },
    { name: 'Landscape', desc: 'Horizons & light', link: '/gallery.html?cat=landscape' },
    { name: 'Street', desc: 'Urban energy', link: '/gallery.html?cat=street' },
    { name: 'Events', desc: 'Moments that matter', link: '/gallery.html?cat=events' },
    { name: 'Black & White', desc: 'Light & shadow', link: '/gallery.html?cat=bw' },
    { name: 'Architecture', desc: 'Lines & geometry', link: '/gallery.html?cat=architecture' },
    { name: 'Nature', desc: 'The wild world', link: '/gallery.html?cat=nature' },
    { name: 'Fine Art', desc: 'Beyond the ordinary', link: '/gallery.html?cat=abstract' },
];

const introScene = document.getElementById('introScene');
const manContainer = document.getElementById('manContainer');
const papersLayer = document.getElementById('papersLayer');
const windContainer = document.getElementById('windContainer');
const mainNav = document.getElementById('mainNav');
const logoText = document.getElementById('logoText');

// --- Final card grid positions ---
function getFinalPositions() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const maxW = Math.min(1400, vw - 64);
    const gap = 28;
    const cols = vw > 768 ? 4 : vw > 480 ? 2 : 1;
    const cardW = (maxW - gap * (cols - 1)) / cols;

    const cardH = cardW * (4 / 3);
    const gx = (vw - maxW) / 2, gy = vh * 0.22; // Start lower (22%) to clear Logo
    const pos = [];
    for (let i = 0; i < 8; i++) {
        pos.push({
            x: gx + (i % cols) * (cardW + gap),
            y: gy + Math.floor(i / cols) * (cardH + gap),
            w: cardW, h: cardH
        });
    }
    return pos;
}

// --- Create 8 paper elements ---
const papers = [];
function createPapers() {
    categories.forEach((cat, i) => {
        const el = document.createElement('a');
        el.className = 'anim-paper';
        el.href = cat.link;
        Object.assign(el.style, { opacity: '0', width: '18px', height: '14px', left: '0px', top: '0px' });
        const num = String(i + 1).padStart(2, '0');
        el.innerHTML = `<div class="paper-inner">
      <span class="paper-number">${num}</span>
      <span class="paper-title">${cat.name}</span>
      <span class="paper-desc">${cat.desc}</span>
    </div>`;
        papersLayer.appendChild(el);
        papers.push(el);
    });
}

// --- Generate a jagged crumpled-paper clip-path polygon ---
function crumpledPolygon(numPoints) {
    const pts = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Vary radius between 30% and 50% for jagged spikes
        const r = 30 + Math.random() * 20;
        const x = 50 + r * Math.cos(angle);
        const y = 50 + r * Math.sin(angle);
        pts.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    }
    return `polygon(${pts.join(', ')})`;
}

// --- Drop a crumpled paper from briefcase to ground with parabolic arc ---
function dropPaper(index) {
    const p = papers[index];
    if (!p || !manContainer) return;

    // 1. Open briefcase — front panel swings fully open
    const lid = manContainer.querySelector('.briefcase-lid');
    if (lid) {
        lid.classList.add('open');
        // Keep it open — don't remove
    }

    // DROP ORIGIN: Bottom of the briefcase body (where papers spill out)
    const briefcaseBody = manContainer.querySelector('.briefcase-g');
    const lidEl = manContainer.querySelector('.briefcase-lid');
    let bcX, bcY;

    if (briefcaseBody) {
        const bcRect = briefcaseBody.getBoundingClientRect();
        // Papers spill from the center of the briefcase opening
        bcX = bcRect.left + bcRect.width / 2;
        bcY = bcRect.top + bcRect.height * 0.5;
    } else {
        const rect = manContainer.getBoundingClientRect();
        bcX = rect.left + 150;
        bcY = rect.top + 130;
    }

    // Ground Y: near man's feet
    const manRect = manContainer.getBoundingClientRect();
    const scale = manRect.height / 340;
    const feetY = manRect.top + 255 * scale;
    const groundY = feetY - 5 - (Math.random() * 20);

    // Jagged crumpled paper shape via clip-path
    const numSpikes = 8 + Math.floor(Math.random() * 4);
    const clipPath = crumpledPolygon(numSpikes);
    const startRot = (Math.random() - 0.5) * 360;

    // Crinkle texture
    const crinkleShadow = [
        `inset ${1 + Math.random() * 2}px ${1 + Math.random() * 2}px 2px rgba(0,0,0,0.12)`,
        `inset ${-1 - Math.random() * 2}px ${-1 - Math.random()}px 2px rgba(0,0,0,0.08)`,
        `inset 0px ${Math.random() * 2}px 1px rgba(0,0,0,0.06)`,
        `1px 2px 3px rgba(0,0,0,0.25)`,
    ].join(', ');

    // Start at briefcase — crumpled ball with jagged edges
    Object.assign(p.style, {
        left: bcX + 'px',
        top: bcY + 'px',
        opacity: '1',
        transition: 'none',
        width: '22px',
        height: '20px',
        borderRadius: '0',
        clipPath: clipPath,
        background: `linear-gradient(${Math.random() * 360}deg, #f5f5f5, #e8e8e8, #f0f0f0)`,
        boxShadow: crinkleShadow,
        transform: `rotate(${startRot}deg) scale(0.4)`,
        zIndex: 10,
    });
    p.offsetHeight; // reflow

    // --- Projectile motion via requestAnimationFrame ---
    // Initial velocities: slight upward pop + leftward drift
    const vx = -(40 + Math.random() * 60);   // px/s leftward  (behind man)
    const vy = -(120 + Math.random() * 80);   // px/s upward pop (arc)
    const gravity = 600 + Math.random() * 200; // px/s² downward
    const spinRate = (150 + Math.random() * 250) * (Math.random() < 0.5 ? 1 : -1); // deg/s

    let x = bcX;
    let y = bcY;
    let currentVy = vy;
    let currentRot = startRot;
    let currentScale = 0.4;
    let lastTime = null;

    function animate(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = (timestamp - lastTime) / 1000; // seconds
        lastTime = timestamp;

        // Physics step
        x += vx * dt;
        currentVy += gravity * dt;
        y += currentVy * dt;
        currentRot += spinRate * dt;

        // Scale up from 0.4 to 1.0 during arc
        if (currentScale < 1) {
            currentScale = Math.min(1, currentScale + dt * 1.5);
        }

        // Apply position
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.transform = `rotate(${currentRot}deg) scale(${currentScale.toFixed(2)})`;

        // Check if hit ground
        if (y >= groundY) {
            // Snap to ground
            p.style.top = groundY + 'px';
            p.style.left = x + 'px';
            p.style.transition = 'none';

            // Bounce animation
            const finalRot = currentRot % 360;
            p.style.setProperty('--r', finalRot + 'deg');
            p.style.transform = `rotate(${finalRot}deg) scale(1)`;
            p.style.animation = 'paperBounceHit 0.8s ease-out forwards';

            setTimeout(() => {
                p.classList.add('grounded');
                p.dataset.groundX = x.toString();
                p.dataset.groundY = groundY.toString();
            }, 800);
            return; // stop animation loop
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

// --- Wind swirls ---
function showWindSwirls() {
    if (!windContainer) return;
    windContainer.classList.add('visible');
    [10, 25, 40, 60, 80, 15, 35, 55, 75, 90, 20, 50, 80].forEach((y, i) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 220 30');
        svg.setAttribute('width', Math.min(600, window.innerWidth));
        svg.setAttribute('height', '50');
        svg.classList.add('wind-swirl');

        // OMNI-DIRECTIONAL WIND
        const angle = Math.random() * 360;
        const top = Math.random() * 100;
        const left = Math.random() * 100;

        svg.style.top = top + '%';
        svg.style.left = left + '%';
        svg.style.transform = `rotate(${angle}deg)`;

        svg.style.setProperty('--ws-dur', (1.0 + Math.random() * 0.5) + 's');
        svg.style.setProperty('--ws-delay', (i * 0.05) + 's');

        const w = 4 + Math.random() * 3;
        const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // Smoother wind lines - DARKER FOR VISIBILITY
        p1.setAttribute('d', `M0,15 Q60,${15 - w} 110,15 T220,15`);
        p1.setAttribute('fill', 'none'); p1.setAttribute('stroke', 'rgba(0,0,0,0.3)'); // Explicit visibility
        p1.setAttribute('stroke-width', '2.5');
        p1.setAttribute('stroke-linecap', 'round');
        p1.setAttribute('opacity', '0.6');
        svg.appendChild(p1);
        windContainer.appendChild(svg);
        requestAnimationFrame(() => svg.classList.add('active'));
    });
    setTimeout(() => {
        windContainer.classList.add('fade-out');
        setTimeout(() => { windContainer.innerHTML = ''; }, 800);
    }, 2800);
}

// --- SMOOTH PAPER SWIRL using requestAnimationFrame ---
// Cubic Bezier interpolation for perfectly smooth curves
function cubicBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function blowPapersToFinal() {
    const finals = getFinalPositions();
    const rots = [-1.5, 1.2, -0.8, 2, -1, 0.5, -1.8, 1];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    papers.forEach((p, i) => {
        const delay = i * 60;
        const gx = parseFloat(p.dataset.groundX) || parseFloat(p.style.left);
        const gy = parseFloat(p.dataset.groundY) || parseFloat(p.style.top);
        const f = finals[i];

        setTimeout(() => {
            p.classList.remove('grounded');
            p.style.animation = 'none';
            p.style.clipPath = 'none';
            p.classList.add('transitioning');

            // Generate smooth Bezier control points + circular orbit for sweeping arc
            // Control point 1: sweep up and to one side
            const cp1x = gx + (Math.random() - 0.3) * vw * 0.5;
            const cp1y = gy - vh * (0.3 + Math.random() * 0.4);
            // Control point 2: arc across screen toward final position
            const cp2x = f.x + (Math.random() - 0.5) * vw * 0.4;
            const cp2y = f.y - vh * (0.1 + Math.random() * 0.3);

            const duration = 3800 + Math.random() * 600; // Even longer flight
            const startTime = performance.now();
            const startRot = Math.random() * 360;
            // Circular orbit parameters — wide and chaotic
            const orbitRadius = vw * (0.22 + Math.random() * 0.18);
            const orbitSpeed = 3.5 + Math.random() * 2; // more revolutions
            const orbitPhase = i * Math.PI * 0.25; // offset per paper

            function animateSwirl(now) {
                const elapsed = now - startTime;
                let t = Math.min(elapsed / duration, 1);

                // Smooth ease-in-out
                const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                // Position along Bezier curve + circular orbit overlay
                let curX = cubicBezier(gx, cp1x, cp2x, f.x, easeT);
                let curY = cubicBezier(gy, cp1y, cp2y, f.y, easeT);

                // Add circular orbit that fades out as paper approaches destination
                const orbitFade = Math.sin(easeT * Math.PI); // peaks at 50%, 0 at start/end
                const orbitAngle = easeT * Math.PI * 2 * orbitSpeed + orbitPhase;
                curX += Math.cos(orbitAngle) * orbitRadius * orbitFade;
                curY += Math.sin(orbitAngle) * orbitRadius * orbitFade * 0.6;

                // Seamless unraveling in the final 20%
                let br, w, h, bg, rot, shadow, border;
                if (easeT < 0.8) {
                    // Crumpled ball flying through air
                    br = 50;
                    w = 24;
                    h = 22;
                    rot = startRot + easeT * 1080; // Spinning
                    bg = '#e8e8e8';
                    shadow = '1px 2px 4px rgba(0,0,0,0.15)';
                    border = 'none';
                } else {
                    // Unraveling into final card — smooth morph
                    const localT = (easeT - 0.8) / 0.2;
                    const smoothLocal = localT * localT * (3 - 2 * localT); // smoothstep
                    br = 50 - 44 * smoothLocal; // 50% → 6%
                    w = 24 + (f.w - 24) * smoothLocal;
                    h = 22 + (f.h - 22) * smoothLocal;
                    rot = startRot + 0.8 * 1080 + (rots[i] - (startRot + 0.8 * 1080) % 360) * smoothLocal;
                    bg = `rgb(${Math.floor(232 + 13 * smoothLocal)}, ${Math.floor(232 + 8 * smoothLocal)}, ${Math.floor(232 - 0 * smoothLocal)})`;
                    shadow = `${3 * smoothLocal}px ${3 * smoothLocal}px 0 #111`;
                    border = smoothLocal > 0.5 ? '2px solid #111' : 'none';
                }

                Object.assign(p.style, {
                    left: curX + 'px',
                    top: curY + 'px',
                    width: w + 'px',
                    height: h + 'px',
                    borderRadius: br + '%',
                    background: bg,
                    transform: `rotate(${rot}deg)`,
                    boxShadow: shadow,
                    border: border,
                    transition: 'none',
                });

                if (t < 1) {
                    requestAnimationFrame(animateSwirl);
                } else {
                    // Final state
                    Object.assign(p.style, {
                        left: f.x + 'px', top: f.y + 'px',
                        width: f.w + 'px', height: f.h + 'px',
                        background: '',
                        borderRadius: '6px',
                        transform: `rotate(${rots[i]}deg)`,
                        boxShadow: '',
                        border: '',
                    });
                    p.classList.remove('transitioning');
                    p.classList.add('final');
                }
            }

            requestAnimationFrame(animateSwirl);
        }, delay);
    });
}


// ===========================
// ANIMATION TIMELINE
// ===========================
if (introScene && manContainer) {
    // ALWAYS play animation on every page load
    createPapers();

    // === THE SVG MAN + TEXT IS ALREADY VISIBLE AS THE LOGO ===
    // No fade-in. No swap. It just IS the logo.

    const LINGER = 2500; // 2.5s Linger

    // After linger → swap silhouette for articulated body, then start walking
    setTimeout(() => {
        // Swap layers: hide traced silhouette, show articulated body for animation
        const silhouette = document.getElementById('lingerSilhouette');
        const articulated = document.getElementById('articulatedBody');
        if (silhouette) silhouette.style.display = 'none';
        if (articulated) articulated.style.display = '';
        manContainer.classList.add('walking');
    }, LINGER);

    // Papers drop from briefcase HALFWAY through the run
    const WALK_START = 2500;
    const WALK_DUR = 4000;
    const MAN_EXIT = WALK_START + WALK_DUR;
    const PAPER_DROP = WALK_START + WALK_DUR * 0.33; // One-third through run

    // All 8 papers drop within 100ms
    for (let i = 0; i < 8; i++) {
        setTimeout(() => dropPaper(i), PAPER_DROP + i * 12);
    }

    // Man walks off screen
    setTimeout(() => {
        manContainer.style.transition = 'opacity 0.4s ease';
        manContainer.style.opacity = '0';
        setTimeout(() => { manContainer.style.display = 'none'; }, 450);
    }, MAN_EXIT);

    // Wind blows + papers fly + LOGO BLOWS AWAY
    const WIND_START = MAN_EXIT + 200;
    setTimeout(() => {
        showWindSwirls();
        blowPapersToFinal();
        logoText.classList.add('blown');
        // Animate text with JS circular swirl (same technique as paper balls)
        const textStartX = window.innerWidth / 2;
        const textStartY = window.innerHeight / 2 + 130; // margin-top offset
        const textEndX = window.innerWidth / 2;
        const textEndY = 40;
        const textDuration = 4000;
        const textStartTime = performance.now();
        const textOrbitRadius = window.innerWidth * 0.3;

        function animateText(now) {
            const elapsed = now - textStartTime;
            let t = Math.min(elapsed / textDuration, 1);
            // Smooth ease-in-out
            const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            // Base path from center to top
            let curX = textStartX + (textEndX - textStartX) * easeT;
            let curY = textStartY + (textEndY - textStartY) * easeT;

            // Circular orbit overlay (fades in then out)
            const orbitFade = Math.sin(easeT * Math.PI);
            const orbitAngle = easeT * Math.PI * 2 * 3; // 3 full loops
            curX += Math.cos(orbitAngle) * textOrbitRadius * orbitFade;
            curY += Math.sin(orbitAngle) * textOrbitRadius * orbitFade * 0.5;

            const rot = Math.sin(orbitAngle) * 20 * orbitFade;
            const scale = 1 - 0.1 * orbitFade;

            logoText.style.top = curY + 'px';
            logoText.style.left = curX + 'px';
            logoText.style.transform = `translate(-50%, 0) rotate(${rot}deg) scale(${scale})`;

            if (t < 1) {
                requestAnimationFrame(animateText);
            } else {
                logoText.style.top = '40px';
                logoText.style.left = '50%';
                logoText.style.transform = 'translate(-50%, 0) rotate(0deg) scale(1)';
            }
        }
        requestAnimationFrame(animateText);
    }, WIND_START);
} else {
    if (mainNav && !mainNav.classList.contains('visible')) mainNav.classList.add('visible');
    // Ensure logo is at top if skipped
    if (logoText) logoText.classList.add('blown');
}

// --- Mobile Menu ---
const navHamburger = document.getElementById('navHamburger');
const navLinks = document.getElementById('navLinks');
if (navHamburger && navLinks) {
    navHamburger.addEventListener('click', () => {
        navHamburger.classList.toggle('open');
        navLinks.classList.toggle('open');
        document.body.classList.toggle('no-scroll');
    });
    navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
        navHamburger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.classList.remove('no-scroll');
    }));
}

// --- Scroll Reveal ---
const revealEls = document.querySelectorAll('.reveal-on-scroll');
if (revealEls.length) {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => obs.observe(el));
}

// --- About Canvas ---
const ac = document.getElementById('aboutPhoto');
if (ac && ac.dataset.src) {
    drawWatermarked(ac, ac.dataset.src, { opacity: 0.1, position: 'bottom-right', scale: 0.12 }).catch(() => {
        const img = document.createElement('img'); img.src = ac.dataset.src; img.alt = 'About';
        ac.parentNode.replaceChild(img, ac);
    });
}
