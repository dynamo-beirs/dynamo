/**
 * home.js — Homepage
 */
import { animateOnScroll, setupSmoothScrolling} from '../core/animations.js';
import { initCountdown, setCountdownData } from '../components/countdown.js';
import { renderForm } from '../components/form-strip.js';
import { fetchCurrentSeasonMatches, fetchTeamSeasonStats } from '../services/data-service.js';

// ── Animation Element Registry ────────────────────────────────────────────────

const animationElements = [
    { selector: '.hero',               containerSelector: null },
    { selector: '.carousel-container', containerSelector: null },
    { selector: '.stat-card',          containerSelector: 'section' },
    { selector: '.contact-card',       containerSelector: 'section' },
    { selector: '.countdown-block',    containerSelector: null },
    { selector: '#home-match-sponsor', containerSelector: null },
    { selector: '.cta-section',        containerSelector: null },
    { selector: '.form-result',        containerSelector: null },
    { selector: '.map-container',      containerSelector: null },
    { selector: '.section-title',      containerSelector: 'section' },
    { selector: '.section-subtitle',   containerSelector: 'section' },
    { selector: '.upcoming-match-name',containerSelector: null },
    { selector: '.form-description',   containerSelector: null }
];

// ── Page Initialization ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    await loadPageData();
    initCountdown();
    initCarousel();
    setupSmoothScrolling();

    const hero = document.querySelector('.hero');
    if (hero) hero.classList.add('animate-in');

    animateOnScroll(animationElements);
});

// ── Data Loading ──────────────────────────────────────────────────────────────

async function loadPageData() {
    try {
        await Promise.all([loadMatches(), loadTeamStats()]);
    } catch (error) {
        console.error('Error fetching page data:', error);
        renderErrorState();
    }
}

async function loadMatches() {
    try {
        const matches = await fetchCurrentSeasonMatches();
        renderForm(matches.form);
        setCountdownData(matches.upcoming);
    } catch (error) {
        console.error('Error fetching matches:', error);
        renderErrorState();
    }
}

async function loadTeamStats() {
    try {
        const stats = await fetchTeamSeasonStats();
        renderTeamStats(stats);
    } catch (error) {
        console.error('Error loading team season stats:', error);
        renderTeamStats({});
    }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderTeamStats(stats) {
    document.getElementById('team-matches-played').textContent = stats.matchesPlayed || 0;
    document.getElementById('team-wins').textContent           = stats.wins           || 0;
    document.getElementById('team-goals-scored').textContent   = stats.goalsScored    || 0;
    document.getElementById('team-clean-sheets').textContent   = stats.cleanSheets    || 0;
}

function renderErrorState() {
    document.getElementById('next-match-title').textContent   = 'Geen wedstrijden gepland in de nabije toekomst.';
    document.getElementById('countdown').style.display        = 'none';
    document.getElementById('form-results').innerHTML         = '<p>Geen vorm beschikbaar.</p>';
    renderTeamStats({});
}

// ── Carousel ──────────────────────────────────────────────────────────────────

function initCarousel() {
    const carousel  = document.getElementById('carousel');
    const container = document.querySelector('.carousel-container');
    const slides    = document.querySelectorAll('.slide');
    const prevBtn   = document.getElementById('prevBtn');
    const nextBtn   = document.getElementById('nextBtn');
    const dotsCont  = document.getElementById('dotsContainer');

    if (!carousel || slides.length === 0) return;

    let currentIndex  = 0;
    const totalSlides = slides.length;
    let isTransitioning = false;
    let autoPlayInterval;

    // Clone first and last slide for seamless looping
    const firstClone = slides[0].cloneNode(true);
    const lastClone  = slides[totalSlides - 1].cloneNode(true);
    firstClone.classList.add('clone');
    lastClone.classList.add('clone');
    carousel.appendChild(firstClone);
    carousel.insertBefore(lastClone, carousel.firstChild);

    carousel.style.transition = 'none';
    carousel.style.transform = 'translateX(-100%)';
    carousel.offsetHeight;

    // Dots
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsCont.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    function setTransition(active) {
        carousel.style.transition = active
            ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'none';
    }

    function updatePosition() {
        carousel.style.transform = `translateX(-${(currentIndex + 1) * 100}%)`;
    }

    function updateDots() {
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }

    function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex = index;
        setTransition(true);
        updatePosition();
        updateDots();
    }

    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() { goToSlide(currentIndex - 1); }

    carousel.addEventListener('transitionend', () => {
        setTransition(false);
        if (currentIndex >= totalSlides) {
            currentIndex = 0;
            requestAnimationFrame(updatePosition);
        } else if (currentIndex < 0) {
            currentIndex = totalSlides - 1;
            requestAnimationFrame(updatePosition);
        }
        isTransitioning = false;
    });

    function startAutoPlay()  { autoPlayInterval = setInterval(() => goToSlide(currentIndex + 1), 4000); }
    function resetAutoPlay()  { clearInterval(autoPlayInterval); startAutoPlay(); }

    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });

    // Touch / swipe
    let touchStartX = 0, touchStartY = 0, isDragging = false;
    let prevTranslate = 0, currentTranslate = 0, startTime = 0;

    function touchStart(e) {
        if (e.target.closest('.nav-btn')) return;
        touchStartX     = e.touches[0].clientX;
        touchStartY     = e.touches[0].clientY;
        isDragging      = true;
        startTime       = e.timeStamp;
        prevTranslate   = -((currentIndex + 1) * 100);
        carousel.style.transition = 'none';
        clearInterval(autoPlayInterval);
    }

    function touchMove(e) {
        if (!isDragging) return;
        const diffX = e.touches[0].clientX - touchStartX;
        const diffY = e.touches[0].clientY - touchStartY;
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 5) {
            e.preventDefault();
            currentTranslate = prevTranslate + (diffX / carousel.offsetWidth) * 100;
            carousel.style.transform = `translateX(${currentTranslate}%)`;
        }
    }

    function touchEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        const diffX     = e.changedTouches[0].clientX - touchStartX;
        const velocity  = diffX / (e.timeStamp - startTime);
        const threshold = Math.max(15, carousel.offsetWidth * 0.05);
        let target      = currentIndex;

        if (diffX < -threshold || velocity < -0.3) target = currentIndex + 1;
        else if (diffX > threshold || velocity > 0.3) target = currentIndex - 1;

        setTransition(true);
        goToSlide(target);
        resetAutoPlay();
    }

    container.addEventListener('touchstart',  touchStart, { passive: true });
    container.addEventListener('touchmove',   touchMove,  { passive: false });
    container.addEventListener('touchend',    touchEnd,   { passive: true });
    container.addEventListener('touchcancel', touchEnd,   { passive: true });

    // Keyboard (only when carousel is hovered/focused)
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.activeElement.closest('.carousel-container') && !container.matches(':hover')) return;
        if (e.key === 'ArrowRight') { nextSlide(); resetAutoPlay(); }
        if (e.key === 'ArrowLeft')  { prevSlide(); resetAutoPlay(); }
    });

    container.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    container.addEventListener('mouseleave', startAutoPlay);

    updateDots();
    startAutoPlay();
}
