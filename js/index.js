// Imports and Initialization
import { initializeCountdown, animateOnScroll, setupSmoothScrolling, setupPageLoadAnimation } from './general.js';

// Animation Elements
const animationElements = [
    { selector: '.hero', containerSelector: null },
    { selector: '.carousel-container', containerSelector: null },
    { selector: '.stat-card', containerSelector: 'section' },
    { selector: '.contact-card', containerSelector: 'section' },
    { selector: '.countdown-block', containerSelector: null },
    { selector: '.form-result', containerSelector: null },
    { selector: '.map-container', containerSelector: null },
    { selector: '.section-title', containerSelector: 'section' },
    { selector: '.section-subtitle', containerSelector: 'section' },
    { selector: '.upcoming-match-name', containerSelector: null },
    { selector: '.form-description', containerSelector: null }
];

// Scroll Animation Handling
let hasStartedScrolling = false;

function isElementInViewport(el, threshold = 0.1) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return (
        rect.top <= windowHeight * (1 - threshold) &&
        rect.bottom >= windowHeight * threshold
    );
}

function animateIndexElements() {
    const scrollElements = document.querySelectorAll(
        '.stat-card, .contact-card, .countdown-block, .form-result, .map-container, .section-title, .section-subtitle, .upcoming-match-name, .form-description'
    );

    scrollElements.forEach((element, index) => {
        if (isElementInViewport(element) && !element.classList.contains('animate-in')) {
            const section = element.closest('section');
            const sectionElements = section
                ? section.querySelectorAll(
                    '.carousel-container, .stat-card, .contact-card, .countdown-block, .form-result, .map-container, .section-title, .section-subtitle, .upcoming-match-name, .form-description'
                )
                : [element];
            const elementIndex = Array.from(sectionElements).indexOf(element);

            setTimeout(() => {
                element.classList.add('animate-in');
            }, elementIndex * 100);
        }
    });
}

function handleIndexScroll() {
    if (window.scrollY > 50) {
        hasStartedScrolling = true;
    }

    if (hasStartedScrolling) {
        animateIndexElements();
    }
}

function setupIndexAnimations() {
    const immediateElements = document.querySelectorAll('.hero');
    immediateElements.forEach((element) => {
        element.classList.add('animate-in');
    });

    let isThrottled = false;
    window.addEventListener('scroll', () => {
        if (!isThrottled) {
            handleIndexScroll();
            isThrottled = true;
            setTimeout(() => {
                isThrottled = false;
            }, 100);
        }
    });
}

// Carousel Initialization
function initializeCarousel() {
    const carousel = document.getElementById('carousel');
    const container = document.querySelector('.carousel-container');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('dotsContainer');

    if (!carousel || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    let isTransitioning = false;
    let autoPlayInterval;

    // Clone first & last slides
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[totalSlides - 1].cloneNode(true);
    firstClone.classList.add('clone');
    lastClone.classList.add('clone');
    carousel.appendChild(firstClone);
    carousel.insertBefore(lastClone, carousel.firstChild);

    const allSlides = document.querySelectorAll('.slide');
    const totalWithClones = allSlides.length;

    // Start at the real first slide
    carousel.style.transform = `translateX(-${100}%)`;

    // Create dots
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToRealSlide(i));
        dotsContainer.appendChild(dot);
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

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    // Handle transition end smoothly
    carousel.addEventListener('transitionend', () => {
        setTransition(false);
        if (currentIndex >= totalSlides) {
            currentIndex = 0;
            requestAnimationFrame(() => updatePosition());
        } else if (currentIndex < 0) {
            currentIndex = totalSlides - 1;
            requestAnimationFrame(() => updatePosition());
        }
        isTransitioning = false;
    });

    function goToRealSlide(idx) {
        goToSlide(idx);
    }

    // Auto play
    function startAutoPlay() {
        autoPlayInterval = setInterval(() => goToSlide(currentIndex + 1), 4000);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    // Event listeners
    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });

    // Mobile Swipe & Dragging
    let touchStartX = 0;
    let touchStartY = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;
    let animationID = 0;
    let startTime = 0;

    function touchStart(e) {
        if (e.target.closest('.nav-btn')) {
            return;
        }
    
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = true;
        startTime = e.timeStamp;
        prevTranslate = -((currentIndex + 1) * 100);
        carousel.style.transition = 'none';
        cancelAnimationFrame(animationID);
        clearInterval(autoPlayInterval);
    }

    function touchMove(e) {
        if (!isDragging) return;
    
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - touchStartX;
        const diffY = currentY - touchStartY;
    
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);
    
        if (absDiffX > absDiffY && absDiffX > 5) { // 5px threshold to avoid accidental blocks
            e.preventDefault();
            currentTranslate = prevTranslate + (diffX / carousel.offsetWidth) * 100;
            carousel.style.transform = `translateX(${currentTranslate}%)`;
        }
    }

    function touchEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        const diffX = e.changedTouches[0].clientX - touchStartX;
        const elapsedTime = e.timeStamp - startTime; // ms
        const velocity = diffX / elapsedTime; // px/ms

        const swipeThreshold = Math.max(15, carousel.offsetWidth * 0.05); // smaller threshold for fast swipes
        let targetIndex = currentIndex;

        if (diffX < -swipeThreshold || velocity < -0.3) {
            targetIndex = currentIndex + 1;
        } else if (diffX > swipeThreshold || velocity > 0.3) {
            targetIndex = currentIndex - 1;
        }

        setTransition(true);
        goToSlide(targetIndex);
        resetAutoPlay();
    }

    // Attach to container for better touch handling
    container.addEventListener('touchstart', touchStart, { passive: true });
    container.addEventListener('touchmove', touchMove, { passive: false });
    container.addEventListener('touchend', touchEnd, { passive: true });
    container.addEventListener('touchcancel', touchEnd, { passive: true });


    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { nextSlide(); resetAutoPlay(); }
        if (e.key === 'ArrowLeft') { prevSlide(); resetAutoPlay(); }
    });

    // Pause on hover
    container.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    container.addEventListener('mouseleave', startAutoPlay);

    // Init
    updateDots();
    startAutoPlay();
}

// Page Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderData();
    initializeCountdown();
    initializeCarousel();
    setupSmoothScrolling();
    setupPageLoadAnimation();
    setupIndexAnimations();
});

// Data Fetching and Rendering
async function fetchAndRenderData() {
    try {
        await Promise.all([
            fetchAndRenderMatches(),
            fetchAndRenderTeamStats()
        ]);
    } catch (error) {
        console.error('Error fetching data:', error);
        handleErrorStates();
    }
}

async function fetchAndRenderMatches() {
    const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=300017481&single=true&output=csv';

    try {
        const response = await fetch(spreadsheetUrl);
        const csvText = await response.text();
        const matches = parseCsvData(csvText);

        renderForm(matches.form);
        updateCountdown(matches.upcoming);
    } catch (error) {
        console.error('Error fetching matches:', error);
        handleErrorStates();
    }
}

// CSV Parsing
function parseCsvData(csvText) {
    const parsed = Papa.parse(csvText, {
        skipEmptyLines: true,
        delimiter: ','
    });

    const rows = parsed.data;
    const matches = { upcoming: [], past: [], all: [], form: [] };

    const columns = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA'];
    const colIndexMap = columns.reduce((map, col, idx) => {
        map[col] = idx + 5;
        return map;
    }, {});

    for (const col of columns) {
        const colIdx = colIndexMap[col];
        const opponent = rows[1]?.[colIdx]?.trim();
        const date = rows[2]?.[colIdx]?.trim();
        const time = rows[3]?.[colIdx]?.trim();
        const stadium = rows[4]?.[colIdx]?.trim();
        const homeAway = rows[5]?.[colIdx]?.trim().toLowerCase();
        const result = rows[61]?.[colIdx]?.trim().toLowerCase();

        if (opponent && date && time && stadium && homeAway) {
            const isHome = homeAway === 'thuis';
            const title = isHome ? `Dynamo Beirs vs ${opponent}` : `${opponent} vs Dynamo Beirs`;
            const match = {
                title,
                dateTime: { date, time, displayDate: date.split(' ').slice(0, 2).join(' ') },
                stadium,
                isHome,
                result
            };

            if (result) {
                matches.past.push(match);
            } else {
                matches.upcoming.push(match);
            }
            matches.all.push(match);
        }
    }

    const parseDate = (dateStr) => {
        const [day, month, year] = dateStr.split(' ');
        const monthMap = {
            'jan': 0, 'feb': 1, 'mrt': 2, 'apr': 3, 'mei': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dec': 11
        };
        return new Date(year, monthMap[month.toLowerCase()], day);
    };

    matches.all.sort((a, b) => parseDate(a.dateTime.date) - parseDate(b.dateTime.date));
    matches.past.sort((a, b) => parseDate(a.dateTime.date) - parseDate(b.dateTime.date));
    matches.upcoming.sort((a, b) => parseDate(a.dateTime.date) - parseDate(b.dateTime.date));

    const formStartCol = 28;
    const resultMap = {
        'w': 'winst',
        'd': 'gelijk',
        'l': 'verlies'
    };
    for (let i = 0; i < 5; i++) {
        const cell = rows[70]?.[formStartCol + i]?.trim().toLowerCase();
        if (cell && resultMap[cell]) {
            matches.form.push(resultMap[cell]);
        }
    }
    return matches;
}

// Team Stats Fetching
async function fetchAndRenderTeamStats() {
    const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=241725037&single=true&output=csv';

    try {
        const response = await fetch(spreadsheetUrl);
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));

        if (rows.length < 67) {
            throw new Error('Insufficient rows in team season stats CSV');
        }

        const teamSeasonStats = {
            matchesPlayed: parseInt(rows[50][3]) || 0,
            wins: parseInt(rows[51][3]) || 0,
            cleanSheets: parseInt(rows[61][3]) || 0,
            goalsScored: parseInt(rows[54][3]) || 0
        };

        updateTeamStats(teamSeasonStats);
    } catch (error) {
        console.error('Error loading team season stats:', error);
        updateTeamStats({});
    }
}

// Update Team Stats Display
function updateTeamStats(stats) {
    document.getElementById('team-matches-played').textContent = stats.matchesPlayed || 0;
    document.getElementById('team-wins').textContent = stats.wins || 0;
    document.getElementById('team-goals-scored').textContent = stats.goalsScored || 0;
    document.getElementById('team-clean-sheets').textContent = stats.cleanSheets || 0;
}

// Render Recent Form
function renderForm(form) {
    const formResults = document.getElementById('form-results');
    formResults.innerHTML = '';

    form.forEach(result => {
        const span = document.createElement('span');
        const resultClass = result === 'winst' ? 'win' : result === 'gelijk' ? 'draw' : 'loss';
        span.className = `form-result ${resultClass}`;
        span.innerHTML = `<i class="fas fa-${resultClass === 'win' ? 'check' : resultClass === 'draw' ? 'minus' : 'times'}"></i>`;
        formResults.appendChild(span);
    });
}

// Update Next Match Countdown
function updateCountdown(upcomingMatches) {
    const titleEl = document.getElementById('next-match-title');
    const countdownEl = document.getElementById('countdown');

    if (upcomingMatches.length === 0) {
        titleEl.textContent = 'Geen wedstrijden gepland in de nabije toekomst';
        countdownEl.style.display = 'none';
        window.nextMatchDateTime = null;
        return;
    }

    const nextMatch = upcomingMatches[0];
    titleEl.textContent = nextMatch.title;
    window.nextMatchDateTime = `${nextMatch.dateTime.date} ${nextMatch.dateTime.time}`;
}

// Error Handling
function handleErrorStates() {
    document.getElementById('next-match-title').textContent = 'Geen wedstrijden gepland in de nabije toekomst.';
    document.getElementById('countdown').style.display = 'none';
    document.getElementById('form-results').innerHTML = '<p>Geen vorm beschrikbaar</p>';
    updateTeamStats({});
}