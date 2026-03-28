/**
 * search.js — Search page
 */
import { animateOnScroll } from '../core/animations.js';
import { fetchSearchMatches, parseDDMMYYYY } from '../services/data-service.js';
import { FootballLoader } from '../components/loader.js';
import { calcWinMargin, calcLossMargin } from '../core/helpers.js';
import { buildResultCard, animateMatchCards, bindMatchCardClicks } from '../components/match-card.js';
import { initDropdown, bindDropdownClose } from '../components/dropdown.js';

const animationElements = [
    { selector: '.section-title',    containerSelector: 'section' },
    { selector: '.page-hero h1',     containerSelector: 'section' },
    { selector: '.search-container', containerSelector: 'section' }
];

// ── Page Initialization ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadMatches();
        initSearch();
        bindDropdownClose();
        animateOnScroll(animationElements);

        if (window.matchModal?.init) await window.matchModal.init();
    } catch (error) {
        console.error('Error during page initialization:', error);
    }
});

// ── Data Loading ──────────────────────────────────────────────────────────────

async function loadMatches() {
    const loaderId      = 'search-loading';
    const errorId       = 'search-error';
    const loadingEl     = document.getElementById(loaderId);
    const contentEl     = document.getElementById('search-results-content');
    const searchMsg     = document.getElementById('search-message');
    const resultsHeader = document.getElementById('search-results-header');

    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        FootballLoader.show(loaderId, 'Wedstrijden worden geladen...');
    }

    document.getElementById(errorId)?.classList.add('hidden');
    contentEl?.classList.add('hidden');
    searchMsg?.classList.add('hidden');
    resultsHeader?.classList.add('hidden');

    try {
        window.allMatches = await fetchSearchMatches();

        if (loadingEl) loadingEl.classList.add('hidden');
        contentEl?.classList.remove('hidden');

        renderSearchResults(window.allMatches);
        resultsHeader?.classList.remove('hidden');

        const dropdownEl = document.getElementById('results-sort');
        if (dropdownEl) {
            initDropdown(dropdownEl, (value) => sortSearchResults(value));
        }
    } catch (error) {
        console.error('Error fetching matches:', error);

        if (loadingEl) loadingEl.classList.add('hidden');
        FootballLoader.showError(errorId, 'Wedstrijden konden niet worden geladen. Probeer opnieuw.');

        contentEl?.classList.add('hidden');
        resultsHeader?.classList.add('hidden');
    }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderSearchResults(matches) {
    const grid           = document.getElementById('search-results-grid');
    const searchMessage  = document.getElementById('search-message');
    const resultsHeader  = document.getElementById('search-results-header');
    const resultsContent = document.getElementById('search-results-content');

    if (!grid) { console.error('Grid element not found'); return; }

    grid.innerHTML = '';

    if (matches.length === 0) {
        if (searchMessage) {
            searchMessage.textContent = 'Geen wedstrijden gevonden.';
            searchMessage.classList.remove('hidden');
        }
        resultsHeader?.classList.add('hidden');
        resultsContent?.classList.add('hidden');
        return;
    }

    searchMessage?.classList.add('hidden');
    resultsHeader?.classList.remove('hidden');
    resultsContent?.classList.remove('hidden');

    // buildResultCard with showSeason:true renders the trophy season badge
    matches.forEach(match => {
        grid.appendChild(buildResultCard(match, { showSeason: true }));
    });

    bindMatchCardClicks('#search-results-grid .match-card.result', false);
    animateMatchCards('.match-card', '#search-results-grid');
}

// ── Search & Autocomplete ─────────────────────────────────────────────────────

function initSearch() {
    const input        = document.getElementById('search-input');
    const autocomplete = document.getElementById('autocomplete-list');
    const searchMessage = document.getElementById('search-message');
    const wrapper      = document.querySelector('.search-wrapper');

    if (!input || !autocomplete) return;

    const performSearch = (query) => {
        if (!window.allMatches) {
            if (searchMessage) {
                searchMessage.textContent = 'Fout bij het laden van wedstrijden.';
                searchMessage.classList.add('error-message');
                searchMessage.classList.remove('hidden');
            }
            return;
        }
        const filtered = window.allMatches.filter(m =>
            m.title.toLowerCase().includes(query.toLowerCase())
        );
        renderSearchResults(filtered);
    };

    const renderAutocomplete = (query) => {
        autocomplete.innerHTML = '';
        if (!window.allMatches || query.length < 1) {
            autocomplete.style.display = 'none';
            return;
        }

        const unique = [...new Set(window.allMatches.map(m => m.opponent))];
        const hits   = unique.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

        if (hits.length === 0) { autocomplete.style.display = 'none'; return; }

        hits.forEach(opponent => {
            const li       = document.createElement('li');
            li.textContent = opponent;
            li.className   = 'autocomplete-item';
            li.addEventListener('click', () => {
                input.value                = opponent;
                autocomplete.innerHTML     = '';
                autocomplete.style.display = 'none';
                performSearch(opponent);
            });
            autocomplete.appendChild(li);
        });

        autocomplete.style.display = 'block';
    };

    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        renderAutocomplete(query);
        performSearch(query);
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(input.value.trim());
            autocomplete.innerHTML     = '';
            autocomplete.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !autocomplete.contains(e.target)) {
            autocomplete.innerHTML     = '';
            autocomplete.style.display = 'none';
        }
    });

    if (wrapper) wrapper.addEventListener('click', () => input.focus());
}

// ── Sorting ───────────────────────────────────────────────────────────────────

function sortSearchResults(sortKey) {
    if (!window.allMatches) return;

    const grid = document.getElementById('search-results-grid');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.match-card')).map(card => {
        const data = JSON.parse(card.getAttribute('data-match-data') || '{}');
        return {
            el:     card,
            date:   data.dateTime?.date || '01-01-2000',
            score:  data.score          || '0-0',
            isHome: data.isHome === true
        };
    });

    items.sort((a, b) => {
        switch (sortKey) {
            case 'date-desc':    return parseDDMMYYYY(b.date) - parseDDMMYYYY(a.date);
            case 'date-asc':     return parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date);
            case 'biggest-win':  return calcWinMargin(b)      - calcWinMargin(a);
            case 'biggest-loss': return calcLossMargin(b)     - calcLossMargin(a);
            default:             return 0;
        }
    });

    items.forEach(item => grid.appendChild(item.el));
    animateMatchCards('.match-card', '#search-results-grid');
}