/**
 * home.js — Homepage
 *
 * Main entry point for the homepage. Handles data loading, initialization
 * of components (countdown, carousel, animations), and rendering of dynamic content.
 */

/* Imports */

import { animateOnScroll, setupSmoothScrolling } from '../core/animations.js';
import { initCountdown, setCountdownData } from '../components/countdown.js';
import { renderForm } from '../components/form-strip.js';
import { fetchCurrentSeasonMatches, fetchTeamSeasonStats, fetchAllMatches, fetchSeasonPlayers } from '../services/data-service.js';
/* Animation Elements Registry */

const animationElements = [
    { selector: '.hero',                containerSelector: null },
    { selector: '.carousel-container',  containerSelector: null },
    { selector: '.stat-card',           containerSelector: 'section' },
    { selector: '.contact-card',        containerSelector: 'section' },
    { selector: '.countdown-block',     containerSelector: null },
    { selector: '#home-match-sponsor',  containerSelector: null },
    { selector: '.cta-section',         containerSelector: null },
    { selector: '.form-result',         containerSelector: null },
    { selector: '.map-container',       containerSelector: null },
    { selector: '.section-title',       containerSelector: 'section' },
    { selector: '.section-subtitle',    containerSelector: 'section' },
    { selector: '.upcoming-match-name', containerSelector: null },
    { selector: '.form-description',    containerSelector: null }
];

/* Page Initialization */

document.addEventListener('DOMContentLoaded', async () => {
    await loadPageData();

    initCountdown();
    initCarousel();
    setupSmoothScrolling();

    if (window.matchModal?.init) {
        await window.matchModal.init();
    }

    // Trigger initial hero entrance animation
    const hero = document.querySelector('.hero');
    if (hero) hero.classList.add('animate-in');

    animateOnScroll(animationElements);
});

/* Data Loading */

let currentSeasonData = null;
let currentPlayersData = null;

async function loadPageData() {
    try {
        await Promise.all([
            loadMatches(),
            loadTeamStats()
        ]);

        // Setup the interactive stat cards after data is loaded
        setupStatCardInteractions();
    } catch (error) {
        console.error('Error fetching page data:', error);
        renderErrorState();
    }
}

async function loadMatches() {
    try {
        const [currentSeason, searchMatches, players] = await Promise.all([
            fetchCurrentSeasonMatches(),
            fetchAllMatches(),
            fetchSeasonPlayers()
        ]);

        currentSeasonData = currentSeason;
        currentPlayersData = players;

        setCountdownData(currentSeason.upcoming);
        const playedMatches = searchMatches.filter(m => m.result && m.score);
        const last5Matches = playedMatches.slice(0, 5).reverse();
        renderForm(last5Matches);

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

function setupStatCardInteractions() {
    if (!currentSeasonData || !currentPlayersData || !window.statModal) return;

    const pastMatches = currentSeasonData.past;
    const cards = document.querySelectorAll('.stat-card');

    // Helper to get opponent name
    const getOpponent = (match) => match.isHome ? match.title.split(' vs ')[1] : match.title.split(' vs ')[0];

    // 1. Wedstrijden
    cards[0]?.addEventListener('click', () => {
        const counts = {};
        pastMatches.forEach(m => {
            const opp = getOpponent(m);
            counts[opp] = (counts[opp] || 0) + 1;
        });

        const data = Object.entries(counts)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([opp, count]) => ({ title: opp, badge: `${count}x` }));

        window.statModal.show({
            title: 'Tegenstanders',
            headerIconHtml: '<i class="fas fa-handshake"></i>',
            theme: 'var(--dark-blue)',
            data
        }, cards[0]);
    });

    // 2. Overwinningen
    cards[1]?.addEventListener('click', () => {
        const wins = pastMatches.filter(m => m.result === 'winst').sort((a, b) => {
            const marginA = parseInt(a.score.split('-')[0]) - parseInt(a.score.split('-')[1]);
            const marginB = parseInt(b.score.split('-')[0]) - parseInt(b.score.split('-')[1]);
            return marginB - marginA;
        });

        const data = wins.map(m => ({
            title: getOpponent(m), subtitle: m.dateTime.displayDate, badge: m.score
        }));

        window.statModal.show({
            title: 'Overwinningen',
            headerIconHtml: '<i class="fas fa-trophy"></i>',
            theme: 'var(--light-green)',
            data
        }, cards[1]);
    });

    // 3. Doelpunten
    cards[2]?.addEventListener('click', () => {
        const scorers = currentPlayersData.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);

        const formatName = (name) => {
            return name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        };

        const data = scorers.map(p => ({
            title: formatName(p.name),
            badge: p.goals
        }));

        window.statModal.show({
            title: 'Doelpunten',
            headerIconHtml: '<i class="fas fa-futbol"></i>',
            theme: 'var(--dynamo-red)',
            data
        }, cards[2]);
    });

    // 4. Clean Sheets
    cards[3]?.addEventListener('click', () => {
        const cleanSheets = pastMatches.filter(m => parseInt(m.score.split('-')[1]) === 0).sort((a, b) => {
            const marginA = parseInt(a.score.split('-')[0]) - parseInt(a.score.split('-')[1]);
            const marginB = parseInt(b.score.split('-')[0]) - parseInt(b.score.split('-')[1]);
            return marginB - marginA;
        });

        const data = cleanSheets.map(m => ({
            title: getOpponent(m), subtitle: m.dateTime.displayDate, badge: m.score
        }));

        window.statModal.show({
            title: 'Clean sheets',
            headerIconHtml: '<i class="fas fa-shield-alt"></i>',
            theme: 'var(--golden-yellow)',
            data
        }, cards[3]);
    });
}

/* Rendering */

function renderTeamStats(stats) {
    document.getElementById('team-matches-played').textContent = stats.matchesPlayed || 0;
    document.getElementById('team-wins').textContent           = stats.wins           || 0;
    document.getElementById('team-goals-scored').textContent   = stats.goalsScored    || 0;
    document.getElementById('team-clean-sheets').textContent   = stats.cleanSheets    || 0;
}

function renderErrorState() {
    document.getElementById('next-match-title').textContent = 'Geen wedstrijden gepland in de nabije toekomst.';
    document.getElementById('countdown').style.display      = 'none';
    document.getElementById('form-results').innerHTML       = '<p>Geen vorm beschikbaar.</p>';
    renderTeamStats({});
}

/* Carousel */

function initCarousel() {
    const carousel  = document.getElementById('carousel');
    const container = document.querySelector('.carousel-container');
    const slides    = document.querySelectorAll('.slide');
    const prevBtn   = document.getElementById('prevBtn');
    const nextBtn   = document.getElementById('nextBtn');
    const dotsCont  = document.getElementById('dotsContainer');

    if (!carousel || slides.length === 0) return;

    let currentIndex    = 0;
    const totalSlides   = slides.length;
    let isTransitioning = false;
    let autoPlayInterval;

    // Clone first and last slide for seamless infinite loop
    const firstClone = slides[0].cloneNode(true);
    const lastClone  = slides[totalSlides - 1].cloneNode(true);
    firstClone.classList.add('clone');
    lastClone.classList.add('clone');

    carousel.appendChild(firstClone);
    carousel.insertBefore(lastClone, carousel.firstChild);

    carousel.style.transition = 'none';
    carousel.style.transform  = 'translateX(-100%)';
    carousel.offsetHeight;

    // Create pagination dots
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

    // Handle infinite loop after transition
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

    // Auto-play controls
    function startAutoPlay()  { autoPlayInterval = setInterval(() => goToSlide(currentIndex + 1), 4000); }
    function resetAutoPlay()  { clearInterval(autoPlayInterval); startAutoPlay(); }

    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });

    // Touch / Swipe support
    let touchStartX = 0, touchStartY = 0, isDragging = false;
    let prevTranslate = 0, currentTranslate = 0, startTime = 0;

    function touchStart(e) { /* ... */ }
    function touchMove(e)  { /* ... */ }
    function touchEnd(e)   { /* ... */ }

    // Event listeners for touch
    container.addEventListener('touchstart',  touchStart,  { passive: true });
    container.addEventListener('touchmove',   touchMove,   { passive: false });
    container.addEventListener('touchend',    touchEnd,    { passive: true });
    container.addEventListener('touchcancel', touchEnd,    { passive: true });

    // Keyboard navigation
    document.addEventListener('keydown', e => { /* ... */ });

    // Pause autoplay on hover
    container.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    container.addEventListener('mouseleave', startAutoPlay);

    // Initialize carousel
    updateDots();
    startAutoPlay();
}