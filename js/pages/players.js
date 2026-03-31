/**
 * players.js — Players page
 */
import { animateOnScroll, animatePlayerCards } from '../core/animations.js';
import { POSITION_LABEL_MAP } from '../core/helpers.js';
import { fetchSeasonPlayers } from '../services/data-service.js';
import { FootballLoader } from '../components/loader.js';

const animationElements = [
    { selector: '.section-title',    containerSelector: 'section' },
    { selector: '.section-subtitle', containerSelector: 'section' },
    { selector: '.page-hero h1',     containerSelector: 'section' },
    { selector: '.filter-section',   containerSelector: null },
    { selector: '.search-container', containerSelector: null },
    { selector: '.player-card',      containerSelector: 'section' }
];

let globalPlayers = [];
let currentFilter = 'all';

const DOM = {
    get grid()          { return document.querySelector('.players-grid'); },
    get loading()       { return document.getElementById('players-loading'); },
    get searchInput()   { return document.querySelector('.search-input'); },
    get filterButtons() { return document.querySelectorAll('.filter-btn'); },
    get emptyState()    { return document.getElementById('players-empty-state'); }
};

// ── Page Initialization ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    await loadPlayers();
    initFilters();
    initSearch();
    initKeyboardNav();
    animatePlayerCards();
    animateOnScroll(animationElements);
    setTimeout(applyHashFilter, 100);
});

// ── Data Loading ──────────────────────────────────────────────────────────────

async function loadPlayers() {
    const loaderId = 'players-loading';
    const errorId  = 'players-error';
    const loadingEl = DOM.loading;
    const gridEl    = DOM.grid;

    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        FootballLoader.show(loaderId, 'Spelers worden geladen...');
    }

    if (gridEl) gridEl.style.opacity = '0';

    try {
        globalPlayers = await fetchSeasonPlayers(true);
        renderPlayerCards(globalPlayers);

        if (loadingEl) loadingEl.classList.add('hidden');

        if (gridEl) {
            gridEl.style.opacity   = '1';
            gridEl.style.transition = 'opacity 0.4s ease';
        }
    } catch (error) {
        console.error('Error fetching or rendering players:', error);
        if (loadingEl) loadingEl.classList.add('hidden');
        FootballLoader.showError(errorId, 'Spelers konden niet worden geladen. Probeer opnieuw.');
    }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderPlayerCards(players) {
    const grid = document.querySelector('.players-grid');
    if (!grid) return;
    grid.innerHTML = '';

    players.forEach(player => {
        const card     = document.createElement('div');
        card.className = `player-card${player.isBirthday ? ' birthday' : ''}`;
        card.setAttribute('data-position', player.position);
        card.style.cursor = 'pointer';

        const birthdayHTML = player.isBirthday
            ? '<div class="confetti-bg"></div><div class="garland-left"></div><div class="garland-right"></div>'
            : '';

        card.innerHTML = `
            ${birthdayHTML}
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-position">${POSITION_LABEL_MAP[player.position]}</div>
                <div class="player-nationality">
                    <img src="${player.flagSrc}" alt="${player.nationality} Flag" class="flag-icon">
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.playerModal) {
                window.playerModal.show(player, card);
            } else {
                console.error('PlayerModal not initialized');
                alert('Spelerdetails zijn momenteel niet beschikbaar. Probeer het later opnieuw.');
            }
        });

        player.element = card;
        grid.appendChild(card);
    });
}

// ── Filters ───────────────────────────────────────────────────────────────────

function initFilters() {
    const buttons = DOM.filterButtons;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pos = btn.getAttribute('data-position');
            currentFilter = pos;

            buttons.forEach(b => b.classList.toggle('active', b === btn));
            setPositionTheme(pos);
            filterPlayers(pos);

            if (DOM.searchInput) DOM.searchInput.value = '';
            history.replaceState(null, null, pos === 'all' ? '#players' : `#${pos}`);
        });
    });
}

function filterPlayers(position) {
    globalPlayers.forEach(player => {
        const show = position === 'all' || player.position === position;
        player.element.classList.toggle('filter-hidden',  !show);
    });
    toggleEmptyState();
}

function applyHashFilter() {
    const hash  = window.location.hash.substring(1);
    const valid = ['goalkeeper', 'defender', 'midfielder', 'attacker'];
    if (valid.includes(hash)) {
        const btn = document.querySelector(`[data-position="${hash}"]`);
        if (btn) btn.click();
    }
}

// ── Search ────────────────────────────────────────────────────────────────────

function initSearch() {
    const input = document.querySelector('.search-input');
    if (input) input.addEventListener('input', onSearch);
}

function onSearch(e) {
    const term = e.target.value.toLowerCase().trim();

    globalPlayers.forEach(player => {
        const matchesSearch = term === '' || player.name.toLowerCase().includes(term);
        const matchesFilter = currentFilter === 'all' || player.position === currentFilter;
        const show          = matchesSearch && matchesFilter;

        player.element.classList.toggle('filter-hidden',  !show);
    });
    toggleEmptyState();
}

// ── Keyboard Navigation ───────────────────────────────────────────────────────

function initKeyboardNav() {
    const buttons = Array.from(DOM.filterButtons);

    document.addEventListener('keydown', (e) => {
        if (DOM.searchInput && document.activeElement === DOM.searchInput) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

        e.preventDefault();
        const idx    = buttons.findIndex(btn => btn.classList.contains('active'));
        const newIdx = e.key === 'ArrowLeft'
            ? (idx > 0 ? idx - 1 : buttons.length - 1)
            : (idx < buttons.length - 1 ? idx + 1 : 0);

        buttons[newIdx].click();
        buttons[newIdx].focus();
    });
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function setPositionTheme(position) {
    const valid    = ['goalkeeper', 'defender', 'midfielder', 'attacker', 'all'];
    const newClass = valid.includes(position) ? `filter-${position}` : 'filter-all';

    document.body.classList.remove(...valid.map(p => `filter-${p}`));
    document.body.classList.add(newClass);
}

// ── Empty State ───────────────────────────────────────────────────────────────

function toggleEmptyState() {
    const visible = globalPlayers.filter(p => !p.element?.classList.contains('filter-hidden'));
    if (visible.length === 0) {
        DOM.emptyState?.classList.remove('hidden');
        if (DOM.grid) DOM.grid.style.display = 'none';
    } else {
        DOM.emptyState?.classList.add('hidden');
        if (DOM.grid) DOM.grid.style.display = 'grid';
    }
}
