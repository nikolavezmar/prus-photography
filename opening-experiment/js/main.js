/**
 * main.js — Prus Photography (Opening Experiment)
 *
 * Animation timeline:
 * 1) Man lingers for 1.5s on photo background
 * 2) Man runs across screen, papers drop from briefcase
 * 3) Papers land on ground, wind blows them to small positions on the white wall
 * 4) Brief pause, then camera zooms into the wall — cards grow to full size
 * 5) Nav bar fades in
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
const photoTracker = document.getElementById('photoTracker');
const introBg = document.getElementById('introBg');

// --- Final card grid positions ---
function getFinalPositions() {
    const NUM_CARDS = 8;
    const vw = window.innerWidth;
    const maxW = Math.min(1400, vw - 64);
    const gap = 28;
    const cols = vw > 768 ? 4 : vw > 480 ? 2 : 1;
    const rows = Math.ceil(NUM_CARDS / cols);
    const cardW = (maxW - gap * (cols - 1)) / cols;
    const cardH = cardW * (4 / 3);
    const gy = 125;
    const gx = (vw - maxW) / 2;
    const pos = [];
    for (let i = 0; i < NUM_CARDS; i++) {
        pos.push({
            x: gx + (i % cols) * (cardW + gap),
            y: gy + Math.floor(i / cols) * (cardH + gap),
            w: cardW, h: cardH
        });
    }
    // Ensure the intro scene is tall enough to fit all card rows + padding
    const totalGridHeight = gy + rows * cardH + (rows - 1) * gap + 80;
    const introScene = document.getElementById('introScene');
    if (introScene) introScene.style.minHeight = totalGridHeight + 'px';
    return pos;
}

// --- Create paper elements: 8 category cards + 7 extra visual-only sheets ---
const TOTAL_PAPERS = 15;
const papers = [];
function createPapers() {
    for (let i = 0; i < TOTAL_PAPERS; i++) {
        const isCard = i < categories.length;
        const el = document.createElement(isCard ? 'a' : 'div');
        el.className = 'anim-paper';
        if (isCard) {
            const cat = categories[i];
            el.href = cat.link;
            const num = String(i + 1).padStart(2, '0');
            el.innerHTML = `<div class="paper-inner">
      <span class="paper-number">${num}</span>
      <span class="paper-title">${cat.name}</span>
      <span class="paper-desc">${cat.desc}</span>
    </div>`;
        }
        Object.assign(el.style, { opacity: '0', width: '18px', height: '14px', left: '0px', top: '0px' });
        papersLayer.appendChild(el);
        papers.push(el);
    }
}

// --- Paper style: all pieces of paper (rectangular sheets) with variety ---
function getPaperStyle(index) {
    const angle = Math.random() * 360;
    const w = 30;
    const h = 40;
    const tl = Math.random() * 3;
    const tr = Math.random() * 3;
    const bl = Math.random() * 3;
    const br = Math.random() * 3;
    const clipPath = `polygon(${tl}% ${tl}%, ${100-tr}% ${tr}%, ${100-br}% ${100-br}%, ${bl}% ${100-bl}%)`;
    return {
        width: w,
        height: h,
        borderRadius: '1px',
        clipPath: clipPath,
        background: `linear-gradient(${angle}deg, #fff, #f6f6f6 30%, #eee 70%, #f4f4f4)`,
        boxShadow: `1px 2px 4px rgba(0,0,0,0.1)`,
    };
}

function getPaperPhysics(index) {
    const isMobile = window.innerWidth <= 768;
    if (index === 0) {
        // Slow floater — takes ~4s (1 extra second), lazy drift with big sway
        return {
            vx: (Math.random() - 0.5) * (isMobile ? 20 : 40),
            vy: -(150 + Math.random() * 50),
            gravity: 120 + Math.random() * 30,
            spinRate: (40 + Math.random() * 60) * (Math.random() < 0.5 ? 1 : -1),
            scaleSpeed: 0.8,
            drag: 0.45 + Math.random() * 0.15,
            swayAmp: isMobile ? 20 + Math.random() * 30 : 50 + Math.random() * 60,
            swayFreq: 1.5 + Math.random() * 1,
        };
    }
    // Normal papers: burst upward in a plume, land within ~3s
    return {
        vx: (Math.random() - 0.5) * (isMobile ? 60 : 120),
        vy: -(200 + Math.random() * (isMobile ? 100 : 200)),
        gravity: 400 + Math.random() * 200,
        spinRate: (80 + Math.random() * 200) * (Math.random() < 0.5 ? 1 : -1),
        scaleSpeed: 1.5,
        drag: 0.2 + Math.random() * 0.25,
        swayAmp: isMobile ? 15 + Math.random() * 30 : 30 + Math.random() * 70,
        swayFreq: 2 + Math.random() * 2,
    };
}

// --- Track grounded papers; fire callback when all settled ---
let groundedCount = 0;
let onAllPapersGrounded = null;

function paperLanded(p, x, groundY) {
    p.style.top = groundY + 'px';
    p.style.left = x + 'px';
    p.style.transition = 'none';
    p.style.animation = 'none';
    const finalRot = parseFloat(p.style.transform.match(/rotate\(([-\d.]+)/)?.[1] || 0) % 360;
    p.style.transform = `rotate(${finalRot}deg) scale(1)`;
    setTimeout(() => {
        p.classList.add('grounded');
        p.dataset.groundX = x.toString();
        p.dataset.groundY = groundY.toString();
        groundedCount++;
        if (groundedCount >= TOTAL_PAPERS && onAllPapersGrounded) {
            onAllPapersGrounded();
        }
    }, 800);
}

function animateSinglePaper(p, startX, startY, physics, startRot, groundY) {
    let x = startX, y = startY;
    let vx = physics.vx, vy = physics.vy;
    let rot = startRot, scale = 0.4;
    let lastTime = null, totalTime = 0;

    function animate(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        totalTime += dt;

        if (physics.drag && vy > 0) {
            vy *= (1 - physics.drag * dt * 3);
        }

        vy += physics.gravity * dt;
        y += vy * dt;

        const sway = physics.swayAmp * Math.sin(totalTime * physics.swayFreq * Math.PI * 2);
        x += vx * dt + sway * dt;

        rot += physics.spinRate * dt;
        if (scale < 1) scale = Math.min(1, scale + dt * physics.scaleSpeed);

        const flip = Math.cos(totalTime * physics.swayFreq * Math.PI * 1.5);
        const sx = scale * (0.4 + 0.6 * Math.abs(flip));
        // Clamp X to stay within viewport
        const clampedX = Math.max(-10, Math.min(x, window.innerWidth - 20));
        p.style.transform = `rotate(${rot}deg) scale(${sx.toFixed(2)}, ${scale.toFixed(2)})`;
        p.style.left = clampedX + 'px';
        p.style.top = y + 'px';

        if (y >= groundY) {
            paperLanded(p, x, groundY);
            return;
        }
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

// --- Drop ALL papers at once from briefcase in a burst/plume ---
function dropAllPapers() {
    const briefcase = document.getElementById('briefcase-group');
    if (!briefcase) return;

    const bcRect = briefcase.getBoundingClientRect();
    const bcX = bcRect.left + bcRect.width / 2;
    const bcY = bcRect.top + bcRect.height / 2;

    const sceneRect = introScene.getBoundingClientRect();

    for (let index = 0; index < TOTAL_PAPERS; index++) {
        const p = papers[index];
        if (!p) continue;

        const groundY = sceneRect.bottom - 80 - (Math.random() * 40);
        const style = getPaperStyle(index);
        const physics = getPaperPhysics(index);
        const startRot = (Math.random() - 0.5) * 360;

        p.dataset.paperWidth = style.width;
        p.dataset.paperHeight = style.height;
        p.dataset.paperBorderRadius = style.borderRadius;
        p.dataset.paperClipPath = style.clipPath;
        p.dataset.paperBackground = style.background;
        p.dataset.paperBoxShadow = style.boxShadow;

        Object.assign(p.style, {
            left: bcX + 'px', top: bcY + 'px',
            opacity: '1', transition: 'none',
            width: style.width + 'px', height: style.height + 'px',
            borderRadius: style.borderRadius, clipPath: style.clipPath,
            background: style.background, boxShadow: style.boxShadow,
            transform: `rotate(${startRot}deg) scale(0.4)`,
            zIndex: 10,
        });

        animateSinglePaper(p, bcX, bcY, physics, startRot, groundY);
    }
}

// --- Wind swirls ---
function showWindSwirls() {
    if (!windContainer) return;
    windContainer.classList.add('visible');
    [10, 25, 40, 60, 80, 15, 35, 55, 75, 90, 20, 50, 80].forEach((yVal, i) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 220 30');
        svg.setAttribute('width', Math.min(600, window.innerWidth));
        svg.setAttribute('height', '50');
        svg.classList.add('wind-swirl');
        const angle = Math.random() * 360;
        svg.style.top = (Math.random() * 100) + '%';
        svg.style.left = (Math.random() * 100) + '%';
        svg.style.transform = `rotate(${angle}deg)`;
        svg.style.setProperty('--ws-dur', (1.0 + Math.random() * 0.5) + 's');
        svg.style.setProperty('--ws-delay', (i * 0.05) + 's');
        const w = 4 + Math.random() * 3;
        const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p1.setAttribute('d', `M0,15 Q60,${15 - w} 110,15 T220,15`);
        p1.setAttribute('fill', 'none');
        p1.setAttribute('stroke', 'rgba(0,0,0,0.3)');
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

// --- Cubic Bezier interpolation ---
function cubicBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

// --- Wall grid positions (small cards pinned to the white wall) ---
function getWallPositions() {
    const NUM_CARDS = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cols = vw > 768 ? 4 : vw > 480 ? 2 : 1;
    const rows = Math.ceil(NUM_CARDS / cols);
    const cardW = vw > 768 ? 80 : 60;
    const cardH = cardW * (4 / 3);
    const gap = vw > 768 ? 12 : 8;
    const gridW = cols * cardW + (cols - 1) * gap;
    const gridH = rows * cardH + (rows - 1) * gap;
    const startX = (vw - gridW) / 2;
    const startY = vh * 0.28 - gridH / 2;
    const pos = [];
    for (let i = 0; i < NUM_CARDS; i++) {
        pos.push({
            x: startX + (i % cols) * (cardW + gap),
            y: startY + Math.floor(i / cols) * (cardH + gap),
            w: cardW, h: cardH,
        });
    }
    return pos;
}

// --- Blow papers from ground to wall positions ---
let onAllCardsOnWall = null;
function blowPapersToWall() {
    const wallPos = getWallPositions();
    const rots = [-1.5, 1.2, -0.8, 2, -1, 0.5, -1.8, 1];
    const vw = window.innerWidth, vh = window.innerHeight;
    let cardsSettled = 0;

    papers.forEach((p, i) => {
        const delay = i * 30;
        const gx = parseFloat(p.dataset.groundX) || parseFloat(p.style.left);
        const gy = parseFloat(p.dataset.groundY) || parseFloat(p.style.top);
        const isCard = i < 8;
        const f = isCard ? wallPos[i] : null;

        setTimeout(() => {
            p.classList.remove('grounded');
            p.style.animation = 'none';
            p.classList.add('transitioning');

            const pW = parseFloat(p.dataset.paperWidth) || 30;
            const pH = parseFloat(p.dataset.paperHeight) || 26;
            const pBR = p.dataset.paperBorderRadius || '0';
            const pClip = p.dataset.paperClipPath || 'none';
            const pBG = p.dataset.paperBackground || '#e8e8e8';
            const pShadow = p.dataset.paperBoxShadow || '1px 2px 3px rgba(0,0,0,0.25)';

            if (!isCard) {
                // Extra papers: blow upward and fade out
                const blowX = gx + (Math.random() - 0.5) * vw * 0.8;
                const blowY = -100 - Math.random() * 200;
                const duration = 2000 + Math.random() * 1500;
                const startTime = performance.now();
                const startRot = Math.random() * 360;

                function animateBlow(now) {
                    const elapsed = now - startTime;
                    let t = Math.min(elapsed / duration, 1);
                    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

                    const curX = gx + (blowX - gx) * easeT;
                    const curY = gy + (blowY - gy) * easeT;
                    const rot = startRot + easeT * 720;
                    const opacity = 1 - easeT;

                    Object.assign(p.style, {
                        left: curX + 'px', top: curY + 'px',
                        transform: `rotate(${rot}deg)`,
                        opacity: opacity, transition: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: pShadow,
                    });

                    if (t < 1) {
                        requestAnimationFrame(animateBlow);
                    } else {
                        p.style.display = 'none';
                    }
                }
                requestAnimationFrame(animateBlow);
                return;
            }

            // Card papers: swirl to wall position (small)
            const cp1x = gx + (Math.random() - 0.3) * vw * 0.5;
            const cp1y = gy - vh * (0.3 + Math.random() * 0.4);
            const cp2x = f.x + (Math.random() - 0.5) * vw * 0.4;
            const cp2y = f.y - vh * (0.1 + Math.random() * 0.3);

            const duration = 3800 + Math.random() * 600;
            const startTime = performance.now();
            const startRot = Math.random() * 360;
            const orbitRadius = vw * (0.22 + Math.random() * 0.18);
            const orbitSpeed = 3.5 + Math.random() * 2;
            const orbitPhase = i * Math.PI * 0.25;

            const MORPH_START = 0.75;

            function animateSwirl(now) {
                const elapsed = now - startTime;
                let t = Math.min(elapsed / duration, 1);
                const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                let curX = cubicBezier(gx, cp1x, cp2x, f.x, easeT);
                let curY = cubicBezier(gy, cp1y, cp2y, f.y, easeT);

                const orbitFade = Math.sin(easeT * Math.PI);
                const orbitAngle = easeT * Math.PI * 2 * orbitSpeed + orbitPhase;
                curX += Math.cos(orbitAngle) * orbitRadius * orbitFade;
                curY += Math.sin(orbitAngle) * orbitRadius * orbitFade * 0.6;

                let w, h, br, bg, rot, shadow, border, clipPath;

                if (easeT < MORPH_START) {
                    w = pW; h = pH;
                    br = pBR; clipPath = pClip;
                    bg = pBG; shadow = pShadow;
                    border = '1px solid rgba(0,0,0,0.08)';
                    rot = startRot + easeT * 1080;
                } else {
                    const localT = (easeT - MORPH_START) / (1 - MORPH_START);
                    const s = localT * localT * (3 - 2 * localT);

                    w = pW + (f.w - pW) * s;
                    h = pH + (f.h - pH) * s;
                    br = s > 0.5 ? '4px' : pBR;
                    clipPath = s > 0.3 ? 'none' : pClip;
                    bg = s > 0.5 ? '#f5f0e8' : pBG;
                    shadow = s > 0.5 ? `1px 1px 4px rgba(0,0,0,0.15)` : pShadow;
                    border = s > 0.5 ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.08)';
                    rot = startRot + MORPH_START * 1080 + (rots[i] - (startRot + MORPH_START * 1080) % 360) * s;
                }

                Object.assign(p.style, {
                    left: curX + 'px', top: curY + 'px',
                    width: w + 'px', height: h + 'px',
                    borderRadius: br, background: bg,
                    clipPath: clipPath,
                    transform: `rotate(${rot}deg)`,
                    boxShadow: shadow, border: border,
                    transition: 'none',
                });

                if (t < 1) {
                    requestAnimationFrame(animateSwirl);
                } else {
                    Object.assign(p.style, {
                        left: f.x + 'px', top: f.y + 'px',
                        width: f.w + 'px', height: f.h + 'px',
                        background: '#f5f0e8', borderRadius: '4px',
                        clipPath: 'none',
                        transform: `rotate(${rots[i]}deg)`,
                        boxShadow: '1px 1px 4px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(0,0,0,0.12)',
                    });
                    p.classList.remove('transitioning');
                    cardsSettled++;
                    if (cardsSettled >= 8 && onAllCardsOnWall) onAllCardsOnWall();
                }
            }
            requestAnimationFrame(animateSwirl);
        }, delay);
    });
}

// --- Zoom from wall to full card view ---
function zoomFromWall() {
    const wallPos = getWallPositions();
    const finals = getFinalPositions();
    const rots = [-1.5, 1.2, -0.8, 2, -1, 0.5, -1.8, 1];
    const duration = 2000;

    // Zoom + fade the background photo into the wall
    if (introBg) introBg.classList.add('zoom-to-wall');

    // Animate each card from wall size to final card size
    const startTime = performance.now();

    function animateZoom(now) {
        const elapsed = now - startTime;
        let t = Math.min(elapsed / duration, 1);
        const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        for (let i = 0; i < 8; i++) {
            const p = papers[i];
            if (!p) continue;
            const w = wallPos[i];
            const f = finals[i];

            const curX = w.x + (f.x - w.x) * easeT;
            const curY = w.y + (f.y - w.y) * easeT;
            const curW = w.w + (f.w - w.w) * easeT;
            const curH = w.h + (f.h - w.h) * easeT;

            Object.assign(p.style, {
                left: curX + 'px', top: curY + 'px',
                width: curW + 'px', height: curH + 'px',
                transform: `rotate(${rots[i]}deg)`,
                transition: 'none',
            });
        }

        if (t < 1) {
            requestAnimationFrame(animateZoom);
        } else {
            for (let i = 0; i < 8; i++) {
                const p = papers[i];
                if (!p) continue;
                const f = finals[i];
                Object.assign(p.style, {
                    left: f.x + 'px', top: f.y + 'px',
                    width: f.w + 'px', height: f.h + 'px',
                    background: '', borderRadius: '6px',
                    transform: `rotate(${rots[i]}deg)`,
                    boxShadow: '', border: '',
                });
                p.classList.add('final');
            }

            setTimeout(() => {
                if (introScene) introScene.style.overflow = 'visible';
            }, 300);
        }
    }
    requestAnimationFrame(animateZoom);
}



// ===========================
// MAIN ANIMATION TIMELINE
// ===========================
function startMainAnimation() {
    if (!introScene || !manContainer) {
        if (mainNav && !mainNav.classList.contains('visible')) mainNav.classList.add('visible');
        if (logoText) logoText.classList.add('blown');
        return;
    }

    createPapers();

    const LINGER = 1500;       // Man lingers for 1.5s before running
    const BLEND_DUR = 300;     // Quick blend from linger pose into running cycle
    const WALK_DUR = 3500;     // Run cycle duration (faster)
    const MAN_EXIT = LINGER + BLEND_DUR + WALK_DUR;
    const LID_OPEN_DELAY = WALK_DUR * 0.075; // Lid opens 7.5% into the run
    const PAPER_DROP = LINGER + BLEND_DUR + LID_OPEN_DELAY; // Papers burst out the moment lid swings open on upswing

    // --- Smooth running cycle using pure math (cosine waves + Fourier) ---
    // No linear keyframe interpolation = no sharp velocity reversals = no hitches.
    const TWO_PI = Math.PI * 2;
    const FOUR_PI = Math.PI * 4;

    function runCycle(phase) {
        const p = TWO_PI * phase;
        const sinP = Math.sin(p);
        const cosP = Math.cos(p);
        const cosP2 = Math.cos(FOUR_PI * phase); // double-frequency for bounce
        return {
            // Runner bounce (double freq): -12 ↔ 4
            runnerTY:    -4 - 8 * cosP2,
            runnerRot:    4 - 2 * cosP2,          // lean: 2 ↔ 6
            // Legs: smooth sinusoidal swing
            legBack:     -40 * cosP,               // -40 ↔ 40
            legFront:     40 * cosP,               //  40 ↔ -40
            // Arms: opposite to corresponding leg
            armBack:      40 * cosP,               //  40 ↔ -40
            armFront:    -40 * cosP,               // -40 ↔ 40
            // Elbows: sinusoidal flex
            elbowBack:   -45 + 25 * cosP,          // -20 ↔ -70
            elbowFront:  -45 - 25 * cosP,          // -70 ↔ -20
            // Briefcase: combined sin+cos for phase-shifted swing
            briefcase:    50 * sinP + 20 * cosP,   // 20 → 50 → -20 → -50
            // Knees: Fourier series (smooth C∞ fit through 0→10→0→110→0)
            kneeBack:    Math.max(0, 30 - 50 * sinP - 30 * cosP2),
            kneeFront:   Math.max(0, 30 + 50 * sinP - 30 * cosP2),
        };
    }

    // --- Single JS-driven animation loop: blend + slide + run all together ---
    setTimeout(() => {
        const RUN_PERIOD = 600;
        const TOTAL_DUR = BLEND_DUR + WALK_DUR;
        const SLIDE_START = 39;   // CSS initial left: 39%
        const SLIDE_END = 150;    // slide off-screen to 150%
        const SLIDE_RANGE = SLIDE_END - SLIDE_START;
        const loopStart = performance.now();
        let secondaryStarted = false;

        // Initial poses from CSS
        const init = {
            runnerTY: 0, runnerRot: -2,
            legBack: 32, kneeBack: 30, armBack: -5, elbowBack: 1, briefcase: 5,
            legFront: -18, kneeFront: 17, armFront: 36, elbowFront: -11,
        };

        // Cache DOM references
        const runnerEl = document.getElementById('runner');
        const el = {};
        ['leg-back','knee-back','arm-back','elbow-back','briefcase-group',
         'leg-front','knee-front','arm-front','elbow-front'].forEach(id => {
            el[id] = document.getElementById(id);
        });

        manContainer.style.willChange = 'transform';

        // Hint the browser to promote limb elements to GPU layers
        if (runnerEl) runnerEl.style.willChange = 'transform';
        Object.values(el).forEach(e => { if (e) e.style.willChange = 'transform'; });

        function setRot(element, initial, target, blend) {
            if (element) element.style.transform = `rotate(${initial + (target - initial) * blend}deg)`;
        }

        // Convert slide range to px for transform-based sliding (no layout thrash)
        // CSS has transform: translateX(-40%) for centering, so we must preserve it
        const containerParent = manContainer.parentElement;
        const parentWidth = containerParent ? containerParent.offsetWidth : window.innerWidth;
        const slideRangePx = ((SLIDE_END - SLIDE_START) / 100) * parentWidth;
        // left stays at CSS initial (39%), we only add translateX offset on top of the -40% centering

        function runLoop(now) {
            const elapsed = now - loopStart;

            const rawT = Math.min(elapsed / BLEND_DUR, 1);
            const blend = rawT;
            const phase = (elapsed / RUN_PERIOD) % 1;
            const c = runCycle(phase);

            if (runnerEl) {
                const tY = init.runnerTY + (c.runnerTY - init.runnerTY) * blend;
                const rot = init.runnerRot + (c.runnerRot - init.runnerRot) * blend;
                runnerEl.style.transform = `translateY(${tY}px) rotate(${rot}deg)`;
            }

            setRot(el['leg-back'],        init.legBack,    c.legBack,    blend);
            setRot(el['knee-back'],       init.kneeBack,   c.kneeBack,   blend);
            setRot(el['arm-back'],        init.armBack,    c.armBack,    blend);
            setRot(el['elbow-back'],      init.elbowBack,  c.elbowBack,  blend);
            setRot(el['briefcase-group'], init.briefcase,  c.briefcase,  blend);
            setRot(el['leg-front'],       init.legFront,   c.legFront,   blend);
            setRot(el['knee-front'],      init.kneeFront,  c.kneeFront,  blend);
            setRot(el['arm-front'],       init.armFront,   c.armFront,   blend);
            setRot(el['elbow-front'],     init.elbowFront, c.elbowFront, blend);

            // Slide using translateX (GPU composited, no layout recalc)
            // Preserve CSS translateX(-40%) centering offset
            const slideT = Math.min(elapsed / TOTAL_DUR, 1);
            manContainer.style.transform = `translateX(calc(-40% + ${slideT * slideRangePx}px))`;

            // Fire one-time secondary animations when blend completes
            if (rawT >= 1 && !secondaryStarted) {
                secondaryStarted = true;
                const torso = document.getElementById('torso-body');
                if (torso) torso.style.animation = 'shirt-flex 0.4s ease-in-out infinite alternate';
                const lidH = document.getElementById('lid-hinge');
                if (lidH) lidH.style.animation = `break-open 0.4s ${LID_OPEN_DELAY / 1000}s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`;
                const lidF = document.getElementById('lid-flapper');
                if (lidF) lidF.style.animation = `lid-swing 0.8s ${(LID_OPEN_DELAY + 400) / 1000}s linear infinite alternate`;
            }

            if (elapsed < TOTAL_DUR) {
                requestAnimationFrame(runLoop);
            }
        }
        requestAnimationFrame(runLoop);
    }, LINGER);

    // All papers burst out at once on the briefcase upswing
    setTimeout(() => dropAllPapers(), PAPER_DROP);

    // Man fades out at exit
    setTimeout(() => {
        manContainer.style.transition = 'opacity 0.4s ease';
        manContainer.style.opacity = '0';
        setTimeout(() => { manContainer.style.display = 'none'; }, 450);
    }, MAN_EXIT);

    // Wind starts only after ALL papers have settled (including the slow floater)
    onAllPapersGrounded = () => {
        showWindSwirls();
        blowPapersToWall();

        // After cards settle on the wall, pause briefly then zoom in
        onAllCardsOnWall = () => {
            setTimeout(() => {
                zoomFromWall();
                // Show nav after zoom completes
                setTimeout(() => {
                    if (mainNav) mainNav.classList.add('visible');
                }, 2200);
            }, 800);
        };

        if (logoText) {
            logoText.classList.add('blown');
            logoText.style.marginTop = '0';

            const textStartX = window.innerWidth / 2;
            const textStartY = window.innerHeight / 2 + 160;
            const textEndX = window.innerWidth / 2;
            const textEndY = 80;
            const textDuration = 4000;
            const textStartTime = performance.now();
            const textOrbitRadius = window.innerWidth * 0.3;

            function animateText(now) {
                const elapsed = now - textStartTime;
                let t = Math.min(elapsed / textDuration, 1);
                const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                let curX = textStartX + (textEndX - textStartX) * easeT;
                let curY = textStartY + (textEndY - textStartY) * easeT;

                const orbitFade = Math.sin(easeT * Math.PI);
                const orbitAngle = easeT * Math.PI * 2 * 3;
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
                    logoText.style.top = '80px';
                    logoText.style.left = '50%';
                    logoText.style.transform = 'translate(-50%, 0) rotate(0deg) scale(1)';
                }
            }
            requestAnimationFrame(animateText);
        }
    };
}

// Scroll to top on load so animation starts at the beginning
window.scrollTo(0, 0);

// Kick it off
startMainAnimation();

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
