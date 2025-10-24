/* Imports */
import { animateOnScroll } from './general.js';

/* Animation Elements */
const animationElements = [
    { selector: '.match-card', containerSelector: 'section' },
    { selector: '.section-title', containerSelector: 'section' },
    { selector: '.page-hero h1', containerSelector: 'section' },
    { selector: '.search-container', containerSelector: 'section' }
];

/* Page Initialization */
document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderMatches();
    setupSearch();
    animateOnScroll(animationElements);
});

/* Fetch and Render Matches */
async function fetchAndRenderMatches() {
    const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=890518549&single=true&output=csv';
    try {
        const response = await fetch(spreadsheetUrl);
        const csvText = await response.text();
        window.allMatches = parseCsvData(csvText);
        renderSearchResults(window.allMatches);
    } catch (error) {
        console.error('Error fetching or parsing CSV:', error);
        const searchMessage = document.getElementById('search-message');
        searchMessage.textContent = 'Fout bij het laden van wedstrijden.';
        searchMessage.classList.add('error-message');
        searchMessage.classList.remove('hidden');
    }
}

/* Parse CSV Data */
function parseCsvData(csvText) {
    const parsed = Papa.parse(csvText, {
        skipEmptyLines: true,
        delimiter: ','
    });
    const rows = parsed.data;
    const matches = [];
    const currentDate = new Date();
    const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

    for (let i = 2; i < rows.length; i++) {
        const opponent = rows[i][1]?.trim();
        const date = rows[i][4]?.trim();
        const goalsScored = rows[i][5]?.trim();
        const goalsConceded = rows[i][6]?.trim();

        if (!opponent || !date || goalsScored === undefined || goalsConceded === undefined) continue;

        let displayDate = '';
        let matchDate;
        let season = '';
        try {
            const [day, month, year] = date.split('-').map(num => parseInt(num));
            matchDate = new Date(year, month - 1, day);
            if (matchDate > currentDate) continue;
            displayDate = `${day} ${monthNames[month - 1]}`;
            const seasonStartYear = month >= 8 ? year : year - 1;
            const seasonEndYear = (seasonStartYear + 1) % 100;
            season = `'${seasonStartYear % 100}-'${seasonEndYear < 10 ? '0' + seasonEndYear : seasonEndYear}`;
        } catch (error) {
            console.warn(`Invalid date format for match against ${opponent}: ${date}`);
            continue;
        }

        const match = {
            title: `Dynamo Beirs vs ${opponent}`,
            opponent: opponent,
            dateTime: { date, displayDate, season },
            score: `${goalsScored}-${goalsConceded}`,
            isHome: true,
            result: determineResult(goalsScored, goalsConceded)
        };
        matches.push(match);
    }

    matches.sort((a, b) => {
        const dateA = parseDate(a.dateTime.date);
        const dateB = parseDate(b.dateTime.date);
        return dateB - dateA;
    });

    return matches;
}

/* Determine Match Result */
function determineResult(goalsScored, goalsConceded) {
    const scored = parseInt(goalsScored);
    const conceded = parseInt(goalsConceded);
    if (isNaN(scored) || isNaN(conceded)) return 'gelijk';
    if (scored > conceded) return 'winst';
    if (scored === conceded) return 'gelijk';
    return 'verlies';
}

/* Parse Date for Sorting */
function parseDate(dateStr) {
    try {
        const [day, month, year] = dateStr.split('-').map(num => parseInt(num));
        return new Date(year, month - 1, day);
    } catch (error) {
        console.warn(`Failed to parse date: ${dateStr}`);
        return new Date(0);
    }
}

/* Render Search Results */
function renderSearchResults(matches) {
    const grid = document.getElementById('search-results-grid');
    const searchMessage = document.getElementById('search-message');
    grid.innerHTML = '';

    matches.forEach(match => {
        const card = document.createElement('div');
        const resultClass = match.result === 'winst' ? 'win' : match.result === 'gelijk' ? 'draw' : 'loss';
        card.className = `match-card modern result animate-in`;
        card.setAttribute('data-match-title', match.title);
        card.setAttribute('data-score', match.score);
        card.setAttribute('data-match-date', match.dateTime.date);

        const [homeTeam, awayTeam] = match.title.split(' vs ');
        card.innerHTML = `
            <div class="result-icon ${resultClass}">
                <span><i class="fas fa-${resultClass === 'win' ? 'check' : resultClass === 'draw' ? 'minus' : 'times'}"></i></span>
            </div>
            <div class="match-body">
                <div class="match-teams">
                    <div class="home-team">${homeTeam}</div>
                    <div class="vs-divider">vs</div>
                    <div class="away-team">${awayTeam}</div>
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

    searchMessage.classList.add('hidden');

    setTimeout(() => {
        document.querySelectorAll('.match-card').forEach(card => {
            card.classList.add('animate-in');
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }, 0);
}

/* Search and Autocomplete */
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const autocompleteList = document.getElementById('autocomplete-list');
    const searchMessage = document.getElementById('search-message');

    const performSearch = (query) => {
        if (!window.allMatches) {
            searchMessage.textContent = 'Fout bij het laden van wedstrijden.';
            searchMessage.classList.add('error-message');
            searchMessage.classList.remove('hidden');
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

    document.querySelector('.search-wrapper').addEventListener('click', () => {
        searchInput.focus();
    });
}

/* Match Interactions */
function setupMatchInteractions() {
    document.querySelectorAll('.match-card.modern.result').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hover');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover');
        });
    });
}