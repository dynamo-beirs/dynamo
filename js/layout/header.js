/**
 * layout/header.js — Header partial loader
 *
 * Loads the header HTML partial, sets the active navigation link,
 * and initialises all header interactions (mobile menu, scroll progress bar,
 * and hide-on-scroll effect).
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
});

/* Header Loading */

async function initHeader() {
    const headerPath = '/dynamo/html/layout/header.html';

    try {
        const response = await fetch(headerPath);
        if (!response.ok) {
            console.error(`Failed to load header from ${headerPath}: ${response.status} ${response.statusText}`);
            renderFallbackHeader();
            return;
        }

        const headerHTML = await response.text();
        if (!headerHTML.trim()) {
            console.error('Header file is empty');
            renderFallbackHeader();
            return;
        }

        const placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.outerHTML = headerHTML;
        } else {
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }

        setActiveNavLink();
        initMobileMenu();
        initScrollProgress();
        initScrollEffect();
    } catch (error) {
        console.error('Error loading header:', error);
        renderFallbackHeader();
    }
}

function renderFallbackHeader() {
    const fallbackHeader = `
        <header class="header" id="header">
            <nav class="nav-container">
                <div class="mobile-menu-toggle" id="mobile-menu-toggle" tabindex="0" role="button" aria-label="Toggle mobile menu">
                    <span></span><span></span><span></span>
                </div>
                <div class="header-logo-container" id="header-logo-container">
                    <a href="/dynamo/index.html" aria-label="Dynamo Beirs Homepage" class="header-logo-link" id="header-logo-link">
                        <div class="logo-container">
                            <img src="/dynamo/img/logos/red-outlined-logo.png" alt="Red Outlined Dynamo Beirs Logo" class="header-logo header-logo-red" id="header-logo-red">
                        </div>
                    </a>
                </div>
                <ul class="nav-links" id="nav-links">
                    <li><a href="/dynamo/index.html" class="nav-link" data-page="home"><i class="fa-solid fa-house"></i><span class="nav-text">Home</span></a></li>
                    <li><a href="/dynamo/html/players.html" class="nav-link" data-page="players">Spelers</a></li>
                    <li><a href="/dynamo/html/statistics.html" class="nav-link" data-page="statistics">Statistieken</a></li>
                    <li><a href="/dynamo/html/matches.html" class="nav-link" data-page="matches">Wedstrijden</a></li>
                    <li><a href="/dynamo/html/archive.html" class="nav-link" data-page="archive">Archief</a></li>
                    <li><a href="/dynamo/html/search.html" class="nav-link search-link" data-page="search"><i class="fa-solid fa-magnifying-glass"></i></a></li>
                </ul>
                <div class="mobile-search-container">
                    <a href="/dynamo/html/search.html" class="mobile-search-link" aria-label="Search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </a>
                </div>
            </nav>
        </header>
        <div class="scroll-progress-container">
            <div class="scroll-progress-bar"></div>
        </div>
    `;

    const placeholder = document.getElementById('header-placeholder');
    if (placeholder) {
        placeholder.outerHTML = fallbackHeader;
    } else {
        document.body.insertAdjacentHTML('afterbegin', fallbackHeader);
    }

    setActiveNavLink();
    initMobileMenu();
    initScrollProgress();
    initScrollEffect();
}

/* Active Nav Link */

function setActiveNavLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const page = link.getAttribute('data-page');
        const isHome = (currentPath === '/dynamo/' || currentPath === '/dynamo/index.html') && page === 'home';
        if (isHome || currentPath.endsWith(page + '.html')) {
            link.classList.add('active');
        }
    });
}

/* Mobile Menu */

function initMobileMenu() {
    const toggle   = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    }
}

/* Scroll Progress Bar */

function initScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (!progressBar) {
        console.warn('Scroll progress bar element not found');
        return;
    }

    let cachedMaxScroll = 0;

    function calcScrollMax() {
        const docHeight = Math.max(
            document.body.scrollHeight, document.body.offsetHeight,
            document.documentElement.clientHeight, document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        cachedMaxScroll = docHeight - window.innerHeight;
    }

    function updateProgress() {
        if (cachedMaxScroll <= 0) {
            progressBar.style.width = '0%';
            return;
        }
        const scrollTop = window.scrollY;
        const pct       = Math.min(100, Math.max(0, (scrollTop / cachedMaxScroll) * 100));
        progressBar.style.width = pct + '%';
    }

    let ticking = false;
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateProgress();
                ticking = false;
            });
            ticking = true;
        }
    }

    calcScrollMax();
    updateProgress();

    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
            calcScrollMax();
            updateProgress();
        });
        ro.observe(document.body);
    } else {
        window.addEventListener('resize', () => {
            calcScrollMax();
            updateProgress();
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
}

/* Header Scroll Effect */

function initScrollEffect() {
    const header = document.querySelector('.header');
    if (!header) {
        console.warn('Header element not found for scroll effect');
        return;
    }

    const SCROLL_THRESHOLD = 100;
    let lastScrollTop = 0;
    let ticking = false;

    function onHeaderScroll() {
        const currentScroll = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                const shouldHide = currentScroll > SCROLL_THRESHOLD && currentScroll > lastScrollTop;
                header.classList.toggle('header-hidden', shouldHide);
                lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onHeaderScroll, { passive: true });
}