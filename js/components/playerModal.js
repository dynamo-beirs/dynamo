/* playerModal.js */

/* Player Modal Component */
class PlayerModal {
    constructor() {
        this.modal = null;
        this.isInitialized = false;
        this.scrollPosition = 0; // Store scroll position
    }

    /* Initialization */
    async init() {
        if (this.isInitialized) return;

        try {
            const response = await fetch('/dynamo/html/components/playerModal.html');
            const modalHTML = await response.text();

            const placeholder = document.getElementById('player-modal-placeholder');
            if (placeholder) {
                placeholder.innerHTML = modalHTML;
                this.modal = document.getElementById('playerModal');
                this.setupEventListeners();
                this.isInitialized = true;
            }
        } catch (error) {
            console.error('Failed to load player modal:', error);
        }
    }

    /* Event Listeners */
    setupEventListeners() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        this.modal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.close();
            }
        });
    }

    /* Modal Control */
    show(playerData = {}) {
        if (!this.modal) return;

        // Save current scroll position
        this.scrollPosition = window.scrollY || document.documentElement.scrollTop;

        const {
            name = 'Player Name',
            position = 'Unknown',
            flagSrc = '../img/icons/flags/belgium.svg',
            gamesThisSeason = 0,
            gamesTotal = 0,
            goalsThisSeason = 0,
            goalsTotal = 0
        } = playerData;

        document.body.classList.add('modal-open');
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';

        const modalContent = this.modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('goalkeeper', 'defender', 'midfielder', 'attacker');
            modalContent.classList.add(position.toLowerCase());
            this.updateContent(name, position, flagSrc, gamesThisSeason, gamesTotal, goalsThisSeason, goalsTotal);
        }

        this.modal.style.display = 'flex';

        if (modalContent) {
            modalContent.scrollTop = 0;
            const sections = modalContent.querySelectorAll('.season-stats-section, .all-time-stats-section');
            sections.forEach(section => section.classList.remove('animate-in'));
            sections.forEach((section, index) => {
                section.style.display = 'block';
                setTimeout(() => section.classList.add('animate-in'), index * 100);
            });
        } else {
            console.warn('Modal content not found');
        }
    }

    close() {
        if (!this.modal) return;
        const modalContent = this.modal.querySelector('.modal-content');
        if (modalContent) {
            const sections = modalContent.querySelectorAll('.season-stats-section, .all-time-stats-section');
            sections.forEach(section => section.classList.remove('animate-in'));
        }
        document.body.classList.remove('modal-open');
        // Restore body scrolling
        document.body.style.overflow = '';
        this.modal.style.display = 'none';
        // Restore scroll position
        window.scrollTo({ top: this.scrollPosition, behavior: 'auto' });
    }

    /* Content Updates */
    updateContent(name, position, flagSrc, gamesThisSeason, gamesTotal, goalsThisSeason, goalsTotal) {
        const nameEl = this.modal.querySelector('#modalPlayerName');
        if (nameEl) nameEl.textContent = name;

        const positionEl = this.modal.querySelector('#playerPosition');
        if (positionEl) positionEl.textContent = position;

        const flagEl = this.modal.querySelector('#nationalityFlag');
        if (flagEl) {
            flagEl.src = flagSrc;
            flagEl.alt = `Nationality Flag`;
        }

        const gamesThisSeasonEl = this.modal.querySelector('#gamesThisSeason');
        if (gamesThisSeasonEl) gamesThisSeasonEl.textContent = gamesThisSeason;

        const gamesTotalEl = this.modal.querySelector('#gamesTotal');
        if (gamesTotalEl) gamesTotalEl.textContent = gamesTotal;

        const goalsThisSeasonEl = this.modal.querySelector('#goalsThisSeason');
        if (goalsThisSeasonEl) goalsThisSeasonEl.textContent = goalsThisSeason;

        const goalsTotalEl = this.modal.querySelector('#goalsTotal');
        if (goalsTotalEl) goalsTotalEl.textContent = goalsTotal;
    }
}

/* Animation Function */
function animateOnScroll() {
    const elements = [
        { selector: '.season-stats-section', containerSelector: null },
        { selector: '.all-time-stats-section', containerSelector: null }
    ];

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
                        console.log(`Animating ${elementType.selector}, index: ${itemIndex}`);
                    }, itemIndex * 100);
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { root: null, rootMargin: '50px', threshold: 0.01 });

    elements.forEach(el => {
        const items = document.querySelectorAll(el.selector);
        if (items.length === 0) {
            console.warn(`No elements found for selector: ${el.selector}`);
        }
        items.forEach(item => observer.observe(item));
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

/* Global Instance */
window.playerModal = new PlayerModal();

document.addEventListener('DOMContentLoaded', () => {
    window.playerModal.init();
});