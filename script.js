
                            
                                const message = document.getElementById('message');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
const bowContainer = document.getElementById('bow-container');
const arrow = document.getElementById('arrow');
const shotCounterElement = document.getElementById('shot-counter');
const hitsCounterElement = document.getElementById('hits-counter');
const heartsArea = document.getElementById('hearts-area');
const restartButton = document.getElementById('restart-button');
const startModalOverlay = document.getElementById('start-modal-overlay');
const startGameButton = document.getElementById('start-game-button');

let isDragging = false;
let startDrag = { x: 0, y: 0 };
let pullDistance = 0;
let angle = 0;
const maxPull = 100;
let arrowAnimationId = null;
let heartsAnimationId = null;

// MODIFICAR: Número de flechas disponibles
let shotsLeft = 10;
let heartsHit = 0;
// MODIFICAR: Número de corazones que aparecen
const heartsToCreate = 7;
let hearts = [];
let canShoot = false; // El disparo está deshabilitado hasta que empieza el juego
let isGameOver = false;

// MODIFICAR: Frases que aparecen al acertar a un corazón
const lovePhrases = [
    "Tu voz es mi melodía favorita y tu risa, mi lugar seguro💖",
    "Tus ojos brillan más que cualquier estrella✨",
    "En tus ojos encuentro mi paz, y en tus labios mi deseo",
    "Tu sonrisa ilumina mi mundo.",
    "Pienso en ti más de lo que imaginas💌",
    "Tu voz es mi melodía favorita y tu risa, mi lugar seguro.",
    "Te amo Mucho mi amor Marisol, Te adoro mi niña hermosa🌸"
];

const confettiCount = 150;
const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#ff9800'];
const confetti = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
class ConfettiParticle { constructor(x, y) { this.x = x; this.y = y; this.radius = Math.random() * 6 + 2; this.color = colors[Math.floor(Math.random() * colors.length)]; this.angle = Math.random() * Math.PI * 2; this.speed = Math.random() * 5 + 2; this.friction = 0.97; this.gravity = 0.1; this.alpha = 1; this.decay = Math.random() * 0.015 + 0.005; this.vx = Math.cos(this.angle) * this.speed; this.vy = Math.sin(this.angle) * this.speed - 3; } update() { this.x += this.vx; this.y += this.vy; this.vx *= this.friction; this.vy += this.gravity; this.alpha -= this.decay; } draw() { ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color; ctx.translate(this.x, this.y); ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false); ctx.fill(); ctx.restore(); } }
function animateConfetti() { ctx.clearRect(0, 0, canvas.width, canvas.height); for (let i = confetti.length - 1; i >= 0; i--) { const p = confetti[i]; p.update(); p.draw(); if (p.alpha <= 0) { confetti.splice(i, 1); } } if (confetti.length > 0) requestAnimationFrame(animateConfetti); }

function createHearts() {
    for (let i = 0; i < heartsToCreate; i++) {
        const heartEl = document.createElement('div');
        heartEl.classList.add('heart-target');
        heartEl.id = `heart-${i}`;

        const isMobile = window.innerWidth < 640;
        const heartSize = isMobile ? 50 : 80;
        const topMargin = 40;
        const bottomMargin = 80;
        const spawnAreaHeight = window.innerHeight - topMargin - bottomMargin - heartSize;

        const top = Math.random() * Math.max(0, spawnAreaHeight) + topMargin;
        const left = (Math.random() * (isMobile ? 0.4 : 0.5) + (isMobile ? 0.5 : 0.4)) * window.innerWidth;

        heartEl.style.top = `${top}px`;
        heartEl.style.left = `${left}px`;

        // SVG del corazón
        heartEl.innerHTML = `<svg class="w-full h-full text-red-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;

        // --- NUEVO: span con letra o emoji dentro del corazón ---
        const heartText = document.createElement('span');
        heartText.textContent = ''; // Aquí puedes cambiar el emoji o letra
        heartEl.appendChild(heartText);

        heartsArea.appendChild(heartEl);

        hearts.push({
            id: i,
            element: heartEl,
            phrase: lovePhrases[i % lovePhrases.length],
            isHit: false,
            x: left,
            y: top,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }
}

function animateHearts() {
    const isMobile = window.innerWidth < 640;
    hearts.forEach(heart => {
        if (!heart.isHit) {
            heart.x += heart.vx;
            heart.y += heart.vy;

            const heartSize = isMobile ? 50 : 80;
            const topMargin = 40;
            const bottomMargin = 80;

            const playAreaRight = window.innerWidth - heartSize;
            const playAreaLeft = window.innerWidth * (isMobile ? 0.45 : 0.3);

            if (heart.x > playAreaRight || heart.x < playAreaLeft) heart.vx *= -1;

            const topBoundary = topMargin;
            const bottomBoundary = window.innerHeight - bottomMargin - heartSize;

            if (heart.y < topBoundary || heart.y > bottomBoundary) {
                heart.vy *= -1;
                heart.y = Math.max(topBoundary, Math.min(heart.y, bottomBoundary));
            }

            heart.element.style.left = `${heart.x}px`;
            heart.element.style.top = `${heart.y}px`;
        }
    });
    heartsAnimationId = requestAnimationFrame(animateHearts);
}

function updateCounters() { shotCounterElement.textContent = shotsLeft; hitsCounterElement.textContent = heartsHit; }
function displayPhrase(phrase) { message.textContent = phrase; message.classList.add('visible'); setTimeout(() => { message.classList.remove('visible'); }, 5000); }
function explode(targetElement) { const rect = targetElement.getBoundingClientRect(); const originX = rect.left + rect.width / 2; const originY = rect.top + rect.height / 2; for (let i = 0; i < confettiCount; i++) { confetti.push(new ConfettiParticle(originX, originY)); } targetElement.classList.add('exploded'); if (confetti.length > 0) { animateConfetti(); } }

function checkGameOver() {
    if ((shotsLeft <= 0 && heartsHit < heartsToCreate) || heartsHit === heartsToCreate) {
        isGameOver = true;
        canShoot = false;
        arrow.style.display = 'none';
        bowContainer.style.display = 'none';
        setTimeout(() => { message.textContent = heartsHit === heartsToCreate ? "¡Felicidades  Mi Niña❤️! ¡Acertaste a todos!" : "¡Buen intento ❤️! Inténtalo de nuevo."; message.classList.add('visible'); }, 1500);
    }
}

function handleStart(e) { if (!canShoot || isGameOver) return; isDragging = true; startDrag.x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; startDrag.y = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY; arrow.classList.add('dragging'); arrow.style.transition = 'none'; bowContainer.style.transition = 'none'; e.preventDefault(); }
function handleMove(e) { if (!isDragging || !canShoot) return; const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY; const bowRect = bowContainer.getBoundingClientRect(); const bowCenterY = bowRect.top + bowRect.height / 2; angle = Math.atan2(currentY - bowCenterY, currentX - (bowRect.left + 30)); pullDistance = Math.min(maxPull, Math.hypot(currentX - startDrag.x, currentY - startDrag.y)); const rotation = `rotate(${angle}rad)`; bowContainer.style.transform = `translateY(-50%) ${rotation}`; arrow.style.transform = `translateY(-50%) ${rotation} translateX(${-pullDistance}px)`; }
function handleEnd() { if (!isDragging || !canShoot) return; isDragging = false; arrow.classList.remove('dragging'); arrow.style.transition = 'transform 0.1s ease-out, left 0.5s linear, top 0.5s linear, opacity 0.5s'; bowContainer.style.transition = 'transform 0.3s ease-out'; if (pullDistance > 20) { shootArrow(); } else { resetArrowAndBow(); } }
function shootArrow() { if (!canShoot) return; canShoot = false; shotsLeft--; updateCounters(); arrow.style.pointerEvents = 'none'; const releaseAngle = angle; const force = 500 + (pullDistance * 5); animateFlight(releaseAngle, force); }

function animateFlight(flightAngle, force) {
    let arrowElem = arrow; let currentX = arrowElem.offsetLeft; let currentY = arrowElem.offsetTop; const vx = Math.cos(flightAngle) * (force / 20); const vy = Math.sin(flightAngle) * (force / 20);
    function flightLoop() {
        currentX += vx; currentY += vy; arrowElem.style.left = `${currentX}px`; arrowElem.style.top = `${currentY}px`; const arrowRect = arrowElem.getBoundingClientRect();
        for (const heart of hearts) {
            if (!heart.isHit) {
                const heartRect = heart.element.getBoundingClientRect();
                if (arrowRect.right > heartRect.left && arrowRect.left < heartRect.right && arrowRect.bottom > heartRect.top && arrowRect.top < heartRect.bottom) {
                    heart.isHit = true; heartsHit++; updateCounters(); explode(heart.element); displayPhrase(heart.phrase); arrowElem.style.opacity = '0'; setTimeout(resetArrowAndBow, 1000); return;
                }
            }
        }
        if (arrowRect.right < 0 || arrowRect.left > window.innerWidth || arrowRect.bottom < 0 || arrowRect.top > window.innerHeight) { arrowElem.style.opacity = '0'; setTimeout(resetArrowAndBow, 500); return; }
        arrowAnimationId = requestAnimationFrame(flightLoop);
    }
    flightLoop();
}

function resetArrowAndBow() {
    cancelAnimationFrame(arrowAnimationId); checkGameOver(); if (isGameOver) return;
    arrow.style.transition = 'none'; bowContainer.style.transition = 'none';
    arrow.style.left = ''; arrow.style.top = '50%'; arrow.style.opacity = '1'; arrow.style.pointerEvents = 'auto';
    const initialTransform = 'translateY(-50%) rotate(0rad)'; arrow.style.transform = `${initialTransform} translateX(0px)`; bowContainer.style.transform = initialTransform;
    pullDistance = 0; angle = 0; canShoot = true;
}

function restartGame() {
    cancelAnimationFrame(heartsAnimationId); cancelAnimationFrame(arrowAnimationId);
    heartsArea.innerHTML = ''; hearts = [];
    shotsLeft = 10; heartsHit = 0; isGameOver = false; canShoot = true;
    updateCounters(); message.classList.remove('visible'); message.textContent = '';
    arrow.style.display = 'block'; bowContainer.style.display = 'block';
    resetArrowAndBow(); createHearts(); animateHearts();
}

function initGameElements() {
    resizeCanvas(); createHearts(); updateCounters(); animateHearts();
}

function showGame() {
    bowContainer.style.display = 'block'; arrow.style.display = 'block';
    document.getElementById('counters-container').style.display = 'flex';
    document.getElementById('controls-container').style.display = 'block';
    canShoot = true;
    initGameElements();
}

function hideStartModal() {
    startModalOverlay.style.transition = 'opacity 0.5s ease';
    startModalOverlay.style.opacity = '0';
    setTimeout(() => { startModalOverlay.style.display = 'none'; }, 500);
}

// --- Event Listeners ---
startGameButton.addEventListener('click', () => { hideStartModal(); showGame(); });
arrow.addEventListener('mousedown', handleStart);
document.addEventListener('mousemove', handleMove);
document.addEventListener('mouseup', handleEnd);
arrow.addEventListener('touchstart', handleStart, { passive: false });
document.addEventListener('touchmove', handleMove);
document.addEventListener('touchend', handleEnd);
restartButton.addEventListener('click', restartGame);
window.addEventListener('resize', resizeCanvas);

// --- Initial State ---
bowContainer.style.display = 'none';
arrow.style.display = 'none';
document.getElementById('counters-container').style.display = 'none';
document.getElementById('controls-container').style.display = 'none';