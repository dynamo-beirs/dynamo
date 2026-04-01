/**
 * utils/animations.js — Animation utilities
 *
 * Handles scroll-reveal animations, player card staggering,
 * smooth scrolling, and shared animation helpers.
 */

/* Shared Observer State */

let sharedObserver = null;
let observedSelectors = [];

/* Scroll-Based Animations */

export function animateOnScroll(elements = []) {
    const newElements = elements.filter(el =>
        !observedSelectors.some(existing => existing.selector === el.selector)
    );
    observedSelectors = [...observedSelectors, ...newElements];

    if (!sharedObserver) {
        sharedObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const elementType = observedSelectors.find(el => entry.target.matches(el.selector));
                if (!elementType) return;

                const container        = resolveContainer(entry.target, elementType.containerSelector);
                const itemsInContainer = container.querySelectorAll(elementType.selector);
                const itemIndex        = Array.from(itemsInContainer).indexOf(entry.target);

                setTimeout(() => entry.target.classList.add('animate-in'), itemIndex * 100);
                sharedObserver.unobserve(entry.target);
            });
        }, { root: null, rootMargin: '0px', threshold: 0.1 });
    }

    elements.forEach(el => {
        document.querySelectorAll(`${el.selector}:not(.animate-in)`).forEach(item => {
            sharedObserver.observe(item);
        });
    });
}

/* Player Card Stagger */

export function animatePlayerCards() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const container        = entry.target.closest('.players-grid') || document;
            const itemsInContainer = container.querySelectorAll('.player-card');
            const itemIndex        = Array.from(itemsInContainer).indexOf(entry.target);

            entry.target.style.setProperty('--animation-delay', itemIndex);
            entry.target.classList.add('animate-in');
            obs.unobserve(entry.target);
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    document.querySelectorAll('.player-card:not(.animate-in)').forEach(item => observer.observe(item));

    window.addEventListener('hashchange', () => {
        document.querySelectorAll('.player-card:not(.animate-in)').forEach(item => observer.observe(item));
    });
}

/* Smooth Scrolling */

export function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* Private Helpers */

function resolveContainer(target, containerSelector) {
    if (!containerSelector) return document;
    if (Array.isArray(containerSelector)) {
        for (const selector of containerSelector) {
            const container = target.closest(selector);
            if (container) return container;
        }
    }
    return target.closest(containerSelector) || document;
}