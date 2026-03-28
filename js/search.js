/* Imports */
import { animateOnScroll } from './general.js';

/* Animation Elements */
const animationElements = [
    { selector: '.section-title', containerSelector: 'section' },
    { selector: '.page-hero h1', containerSelector: 'section' },
    { selector: '.search-container', containerSelector: 'section' }];

/* Page Initialization */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchAndRenderMatches();
        setupSearch();

        // Animate elements
        if (typeof animateOnScroll === 'function') {
            animateOnScroll(animationElements);
        }

        // Initialize match modal if available
        if (window.matchModal?.init) {
            await window.matchModal.init();
        }
    } catch (error) {
        console.error('Error during page initialization:', error);
    }
});

/* Fetch and Render Matches */
async function fetchAndRenderMatches() {
    const loadingEl   = document.getElementById('search-loading');
    const errorEl     = document.getElementById('search-error');
    const contentEl   = document.getElementById('search-results-content');
    const searchMsg   = document.getElementById('search-message');
    const resultsHeader = document.getElementById('search-results-header');

    // Show loading, hide everything else
    loadingEl?.classList.remove('hidden');
    errorEl?.classList.add('hidden');
    contentEl.style.display = 'none';
    searchMsg?.classList.add('hidden');

    resultsHeader?.classList.add('results-header-hidden');

    const spreadsheetUrl =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=890518549&single=true&output=csv';

    try {
        const response = await fetch(spreadsheetUrl);
        if (!response.ok) throw new Error('Network error');

        const csvText = await response.text();
        window.allMatches = parseCsvData(csvText);

        // SUCCESS: Hide loading, show results
        loadingEl?.classList.add('hidden');
        contentEl.style.display = 'block'; // Now visible

        renderSearchResults(window.allMatches);

        resultsHeader?.classList.remove('results-header-hidden');

        // NOW initialize dropdown (safe — DOM is ready and visible)
        const resultsDropdown = document.getElementById('results-sort');
        if (resultsDropdown) {
            initCustomDropdown(resultsDropdown);
        }

    } catch (error) {
        console.error('Error fetching or parsing CSV:', error);

        // ERROR: Hide loading, show error
        loadingEl?.classList.add('hidden');
        errorEl?.classList.remove('hidden');
        contentEl.style.display = 'none';

        resultsHeader?.classList.add('results-header-hidden');

        searchMsg.textContent = 'Fout bij het laden van wedstrijden.';
        searchMsg.classList.add('error-message');
        searchMsg.classList.remove('hidden');
    }
}

/* Parse CSV Data */
function parseCsvData(csvText) {
    const parsed = Papa.parse(csvText, { skipEmptyLines: true, delimiter: ',' });
    const rows = parsed.data;
    const matches = [];
    const currentDate = new Date();
    const monthNames = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

    for (let i = 2; i < rows.length; i++) {
        const opponent      = rows[i][1]?.trim();
        const dateRaw       = rows[i][4]?.trim();
        const time          = rows[i][5]?.trim();
        const stadium       = rows[i][6]?.trim();
        const homeAwayRaw   = rows[i][7]?.trim();
        const goalsScored   = rows[i][8]?.trim();
        const goalsConceded = rows[i][9]?.trim();
        const goalscorersRaw= rows[i][10]?.trim();

        if (!opponent || !dateRaw || goalsScored === undefined || goalsConceded === undefined) continue;

        let displayDate = '', matchDate, season = '';
        try {
            const [day, month, year] = dateRaw.split('-').map(Number);
            matchDate = new Date(year, month - 1, day);
            if (matchDate > currentDate) continue;
            displayDate = `${day} ${monthNames[month - 1]}`;

            const seasonStart = month >= 8 ? year : year - 1;
            const seasonEnd = seasonStart + 1;

            const startStr = (seasonStart % 100).toString().padStart(2, '0');
            const endStr = (seasonEnd % 100).toString().padStart(2, '0');

            season = `'${startStr}-'${endStr}`;
        } catch (e) {
            console.warn(`Bad date: ${dateRaw}`);
            continue;
        }

        const isHome = homeAwayRaw?.toLowerCase() === 'thuis';
        const goalscorers = parseGoalscorers(goalscorersRaw);

        const match = {
            title: isHome ? `Dynamo Beirs vs ${opponent}` : `${opponent} vs Dynamo Beirs`,
            opponent,
            dateTime: { date: dateRaw, time: time || '??:??', displayDate, season },
            stadium: stadium || 'Onbekend stadion',
            isHome,
            score: isHome
                ? `${goalsScored}-${goalsConceded}`
                : `${goalsConceded}-${goalsScored}`,
            result: determineResult(goalsScored, goalsConceded),
            goalscorers
        };
        matches.push(match);
    }

    matches.sort((a, b) => parseDate(b.dateTime.date) - parseDate(a.dateTime.date));
    return matches;
}

/* Parse Goalscorers */
function parseGoalscorers(raw) {
    if (!raw || raw.trim() === '' || raw.trim() === '/') return [];
    const cleaned = raw.replace(/^["'\s]+|["'\s]+$/g, '').trim();
    if (!cleaned) return [];

    const entries = cleaned.split(';').map(s => s.trim()).filter(Boolean);
    const out = [];

    for (const e of entries) {
        const m = e.match(/^(.+?)(?:\s*\(x(\d+)\))?$/i);
        if (m) {
            const player = m[1].trim();
            const goals  = m[2] ? parseInt(m[2], 10) : 1;
            if (player) out.push({ player, goals });
        }
    }
    return out;
}

/* Determine Result */
function determineResult(scored, conceded) {
    const s = parseInt(scored), c = parseInt(conceded);
    if (isNaN(s) || isNaN(c)) return 'gelijk';
    return s > c ? 'winst' : s === c ? 'gelijk' : 'verlies';
}

/* Parse Date */
function parseDate(d) {
    const [day, month, year] = d.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/* Render Search Results */
function renderSearchResults(matches) {
    const grid           = document.getElementById('search-results-grid');
    const searchMessage  = document.getElementById('search-message');
    const resultsHeader  = document.getElementById('search-results-header');
    const resultsContent = document.getElementById('search-results-content');

    if (!grid) {
        console.error('Grid element not found');
        return;
    }

    grid.innerHTML = '';

    if (matches.length === 0) {
        if (searchMessage) {
            searchMessage.textContent = 'Geen wedstrijden gevonden.';
            searchMessage.classList.remove('hidden');
        }

        resultsHeader?.classList.add('results-header-hidden');
        resultsContent.style.display = 'none';

        return;
    }

    searchMessage?.classList.add('hidden');
    resultsHeader?.classList.remove('results-header-hidden');
    resultsContent.style.display = 'block';

    matches.forEach(match => {
        const resCls = match.result === 'winst' ? 'win' : match.result === 'gelijk' ? 'draw' : 'loss';
        const card = document.createElement('div');
        card.className = `match-card modern result`;
        card.style.cursor = 'pointer';

        card.dataset.matchTitle   = match.title;
        card.dataset.score        = match.score;
        card.dataset.matchDate    = match.dateTime.date;
        card.dataset.matchTime    = match.dateTime.time;
        card.dataset.venue        = match.stadium;
        card.dataset.season       = match.dateTime.season;
        card.dataset.isHome       = match.isHome;
        card.dataset.goalscorers  = JSON.stringify(match.goalscorers);

        const [home, away] = match.title.split(' vs ');
        card.innerHTML = `
            <div class="result-icon ${resCls}">
                <span><i class="fas fa-${resCls === 'win' ? 'check' : resCls === 'draw' ? 'minus' : 'times'}"></i></span>
            </div>
            <div class="match-body">
                <div class="match-teams">
                    <div class="home-team">${home}</div>
                    <div class="vs-divider">vs</div>
                    <div class="away-team">${away}</div>
                </div>
                <div class="match-score">${match.score}</div>
                <div class="match-details">
                    <span class="match-date"><i class="fas fa-calendar"></i> ${match.dateTime.displayDate}</span>
                    <span class="match-season"><i class="fas fa-trophy"></i> ${match.dateTime.season}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    if (searchMessage) {
        searchMessage.classList.add('hidden');
    }

    setupCardClicks();
    animateMatchCards();
}

/* Make Match Cards Clickable */
function setupCardClicks() {
    document.querySelectorAll('#search-results-grid .match-card.modern.result').forEach(card => {
        card.addEventListener('mouseenter', () => card.classList.add('hover'));
        card.addEventListener('mouseleave', () => card.classList.remove('hover'));

        card.addEventListener('click', () => {
            const data = {
                title:      card.dataset.matchTitle,
                stadium:    card.dataset.venue,
                season:     card.dataset.season,
                dateTime: {
                    date: card.dataset.matchDate,
                    time: card.dataset.matchTime,
                    displayDate: card.querySelector('.match-date')?.textContent.replace(/^\s*<i.*<\/i>\s*/, '').trim() || ''
                },
                score:      card.dataset.score,
                goalscorers: JSON.parse(card.dataset.goalscorers || '[]'),
                isUpcoming: false,
                isHome:     card.dataset.isHome === 'true'
            };

            if (window.matchModal) {
                window.matchModal.show(data);
            } else {
                console.error('matchModal not ready');
            }
        });
    });
}

/* Match Card Animations */
function animateMatchCards() {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target.closest('.matches-grid') || document;
                const itemsInContainer = container.querySelectorAll('.match-card');
                const itemIndex = Array.from(itemsInContainer).indexOf(entry.target);
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    document.querySelectorAll('.match-card').forEach(card => observer.observe(card));
}

/* Search and Autocomplete */
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const autocompleteList = document.getElementById('autocomplete-list');
    const searchMessage = document.getElementById('search-message');

    if (!searchInput || !autocompleteList) {
        console.error('Search elements not found');
        return;
    }

    const performSearch = (query) => {
        if (!window.allMatches) {
            if (searchMessage) {
                searchMessage.textContent = 'Fout bij het laden van wedstrijden.';
                searchMessage.classList.add('error-message');
                searchMessage.classList.remove('hidden');
            }
            return;
        }

        const filteredMatches = window.allMatches.filter(match =>
            match.title.toLowerCase().includes(query.toLowerCase())
        );
        renderSearchResults(filteredMatches);
    };

    const renderAutocomplete = (query) => {
        autocompleteList.innerHTML = '';
        if (!window.allMatches || query.length < 1) {
            autocompleteList.style.display = 'none';
            return;
        }

        const uniqueOpponents = [...new Set(window.allMatches.map(match => match.opponent))];
        const filteredOpponents = uniqueOpponents.filter(opponent =>
            opponent.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (filteredOpponents.length === 0) {
            autocompleteList.style.display = 'none';
            return;
        }

        filteredOpponents.forEach(opponent => {
            const li = document.createElement('li');
            li.textContent = opponent;
            li.className = 'autocomplete-item';
            li.addEventListener('click', () => {
                searchInput.value = opponent;
                performSearch(opponent);
                autocompleteList.innerHTML = '';
                autocompleteList.style.display = 'none';
            });
            autocompleteList.appendChild(li);
        });

        autocompleteList.style.display = filteredOpponents.length > 0 ? 'block' : 'none';
    };

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        renderAutocomplete(query);
        performSearch(query);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value.trim());
            autocompleteList.innerHTML = '';
            autocompleteList.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteList.contains(e.target)) {
            autocompleteList.innerHTML = '';
            autocompleteList.style.display = 'none';
        }
    });

    const searchWrapper = document.querySelector('.search-wrapper');
    if (searchWrapper) {
        searchWrapper.addEventListener('click', () => {
            searchInput.focus();
        });
    }
}

/* Sort Dropdown */
function initCustomDropdown(dropdownEl) {
    const selected = dropdownEl.querySelector('.selected');
    const options = dropdownEl.querySelector('.options');

    if (!selected || !options) {
        console.error('Dropdown elements not found');
        return;
    }

    selected.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownEl.classList.toggle('active');
    });

    options.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = li.dataset.value;
            const text = li.textContent;
            selected.dataset.value = value;
            selected.textContent = text;
            dropdownEl.classList.remove('active');
            if (dropdownEl.id === 'results-sort') {
                sortSearchResults(value);
            }
        });
    });

    document.addEventListener('click', e => {
        if (!dropdownEl.contains(e.target)) {
            dropdownEl.classList.remove('active');
        }
    });
}

/* Sorting Logic */
function sortSearchResults(sortKey) {
    if (!window.allMatches) return;

    const grid = document.getElementById('search-results-grid');
    if (!grid) return;

    let displayed = Array.from(document.querySelectorAll('#search-results-grid .match-card'))
        .map(card => ({
            el: card,
            date: card.dataset.matchDate,
            score: card.dataset.score,
            isHome: card.dataset.isHome === 'true'
        }));

    displayed.sort((a, b) => {
        switch (sortKey) {
            case 'date-desc': return parseDate(b.date) - parseDate(a.date);
            case 'date-asc': return parseDate(a.date) - parseDate(b.date);
            case 'biggest-win': return victoryMargin(b) - victoryMargin(a);
            case 'biggest-loss': return lossMargin(b) - lossMargin(a);
            default: return 0;
        }
    });

    displayed.forEach(item => grid.appendChild(item.el));
    animateMatchCards();
}

/* HELPER FUNCTIONS */
function victoryMargin(item) {
    const [home, away] = item.score.split('-').map(Number);
    const dynamo = item.isHome ? home : away;
    const opp = item.isHome ? away : home;

    if (dynamo > opp) {
        return dynamo - opp;
    } else if (dynamo === opp) {
        return -0.5;
    } else {
        return -1000 - (opp - dynamo);
    }
}

function lossMargin(item) {
    const [home, away] = item.score.split('-').map(Number);
    const dynamo = item.isHome ? home : away;
    const opp = item.isHome ? away : home;

    if (dynamo < opp) {
        return opp - dynamo;
    } else if (dynamo === opp) {
        return -0.5;
    } else {
        return -1000 - (dynamo - opp);
    }
}