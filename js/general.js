/* Countdown Timer */
export function initializeCountdown() {
    const countdownElement = document.getElementById("countdown");
    const titleEl = document.getElementById("next-match-title");
    const sponsorBlock = document.getElementById('home-match-sponsor');
    const sponsorLink = document.getElementById('home-sponsor-link');
    const sponsorLogo = document.getElementById('home-sponsor-logo');

    if (!countdownElement || !titleEl) return;

    const upcomingMatches = window.upcomingMatchesData || [];

    const monthMap = {
        'jan': 0, 'feb': 1, 'mrt': 2, 'mar': 2, 'apr': 3, 'mei': 4, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'oct': 9, 'nov': 10, 'dec': 11
    };

    const parseDateTime = (matchDate, matchTime) => {
        if (!matchDate || !matchTime) return NaN;

        const dateParts = matchDate.split(' ');
        if (dateParts.length < 3) return NaN;

        const day = dateParts[0];
        const month = dateParts[1].toLowerCase();
        const year = dateParts[2];

        const timeParts = matchTime.split(':');
        if (timeParts.length < 2) return NaN;

        const hours = timeParts[0];
        const minutes = timeParts[1];
        const monthIndex = monthMap[month];

        if (monthIndex === undefined) return NaN;

        return new Date(year, monthIndex, day, hours, minutes).getTime();
    };

    const now = new Date().getTime();
    let targetMatch = null;
    let targetDate = NaN;

    for (const match of upcomingMatches) {
        const parsed = parseDateTime(match.dateTime.date, match.dateTime.time);
        if (!isNaN(parsed) && parsed > now) {
            targetMatch = match;
            targetDate = parsed;
            break;
        }
    }

    if (!targetMatch || isNaN(targetDate)) {
        titleEl.textContent = "Geen wedstrijden gepland in de nabije toekomst.";
        countdownElement.style.display = "none";
        if (sponsorBlock) sponsorBlock.style.display = "none";
        return;
    }

    titleEl.textContent = targetMatch.title;
    if (targetMatch.sponsor && sponsorBlock) {
        sponsorLink.href = targetMatch.sponsor.url;
        sponsorLogo.src = targetMatch.sponsor.logo;
        sponsorLogo.alt = `Logo ${targetMatch.sponsor.name}`;
        sponsorLink.title = `Bezoek website van ${targetMatch.sponsor.name} - Matchbalsponsor`;
        sponsorBlock.style.display = 'block';
    } else if (sponsorBlock) {
        sponsorBlock.style.display = 'none';
    }

    countdownElement.style.display = "flex";

    if (window.countdownInterval) clearInterval(window.countdownInterval);

    function updateDisplay() {
        const currentTime = new Date().getTime();
        const distance = targetDate - currentTime;

        if (distance < 0) {
            clearInterval(window.countdownInterval);
            initializeCountdown();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const elements = { days, hours, minutes, seconds };
        Object.keys(elements).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.textContent = elements[key] < 10 ? '0' + elements[key] : elements[key];
        });
    }

    updateDisplay();
    window.countdownInterval = setInterval(updateDisplay, 1000);
}

/* Player Card Animations */
export function animatePlayerCards() {
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    const initialItems = document.querySelectorAll('.player-card:not(.animate-in)');
    const container = document.querySelector('.players-grid') || document;
    const itemsInContainer = container.querySelectorAll('.player-card');
    initialItems.forEach(item => {
        if (isElementInViewport(item)) {
            const itemIndex = Array.from(itemsInContainer).indexOf(item);
            item.style.setProperty('--animation-delay', Math.min(itemIndex * 0.2, 2));
            item.classList.add('animate-in');
        }
    });

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target.closest('.players-grid') || document;
                const itemsInContainer = container.querySelectorAll('.player-card');
                const itemIndex = Array.from(itemsInContainer).indexOf(entry.target);
                entry.target.style.setProperty('--animation-delay', itemIndex);
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    document.querySelectorAll('.player-card:not(.animate-in)').forEach(item => observer.observe(item));

    window.addEventListener('hashchange', () => {
        const items = document.querySelectorAll('.player-card:not(.animate-in)');
        const container = document.querySelector('.players-grid') || document;
        const itemsInContainer = container.querySelectorAll('.player-card');
        items.forEach(item => {
            if (isElementInViewport(item)) {
                const itemIndex = Array.from(itemsInContainer).indexOf(item);
                item.style.setProperty('--animation-delay', Math.min(itemIndex * 0.2, 2));
                item.classList.add('animate-in');
            }
        });
    }, { once: true });
}

/* Scroll-Based Animations */
export function animateOnScroll(elements = [], observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 }) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const elementType = elements.find(el => entry.target.matches(el.selector));
                if (elementType) {
                    const container = getContainer(entry.target, elementType.containerSelector);
                    const itemsInContainer = container.querySelectorAll(elementType.selector);
                    const itemIndex = Array.from(itemsInContainer).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, itemIndex * 100);
                    observer.unobserve(entry.target);
                }
            }
        });
    }, observerOptions);

    elements.forEach(el => {
        document.querySelectorAll(el.selector).forEach(item => observer.observe(item));
    });

    function getContainer(target, containerSelector) {
        if (!containerSelector) return document;
        if (Array.isArray(containerSelector)) {
            for (const selector of containerSelector) {
                const container = target.closest(selector);
                if (container) return container;
            }
        }
        return target.closest(containerSelector);
    }
}

/* Smooth Scrolling */
export function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* Page Load Animation */
export function setupPageLoadAnimation() {
    window.addEventListener('load', () => {
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '1';
        }, 100);
    });
}