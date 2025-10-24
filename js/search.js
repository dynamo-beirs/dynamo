// search.js
import { animateOnScroll } from './general.js';

// Define animation elements
const animationElements = [
    { selector: '.match-card', containerSelector: 'section' },
    { selector: '.section-title', containerSelector: 'section' },
    { selector: '.page-hero h1', containerSelector: 'section' },
    { selector: '.search-container', containerSelector: 'section' }
];

// Matches page initialization and functionality
document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderMatches();
    setupSearch();
    animateOnScroll(animationElements);
});

// Fetch and parse CSV data from Google Spreadsheet
async function fetchAndRenderMatches() {
    const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=890518549&single=true&output=csv';

    try {
        const response = await fetch(spreadsheetUrl);
        const csvText = await response.text();
        window.allMatches = parseCsvData(csvText);
        renderSearchResults(window.allMatches); // Initially display all past matches
        document.getElementById('search-message').classList.add('hidden');
    } catch (error) {
        console.error('Error fetching or parsing CSV:', error);
        document.getElementById('search-message').textContent = 'Fout bij het laden van wedstrijden.';
        document.getElementById('search-message').classList.remove('loading-message');
        document.getElementById('search-message').classList.add('error-message');
    }
}

// Parse CSV data using Papaparse
function parseCsvData(csvText) {
    const parsed = Papa.parse(csvText, {
        skipEmptyLines: true,
        delimiter: ','
    });

    const rows = parsed.data;
    const matches = [];

    // Start from row 3 (index 2) and continue until goals scored/conceded are empty
    for (let i = 2; i < rows.length; i++) {
        const opponent = rows[i][1]?.trim(); // Column B
        const date = rows[i][4]?.trim(); // Column E
        const goalsScored = rows[i][5]?.trim(); // Column F
        const goalsConceded = rows[i][6]?.trim(); // Column G

        // Stop if goals scored or conceded are empty (not just "0")
        if (!goalsScored || !goalsConceded) break;

        // Transform date to display format (e.g., "15 okt")
        const dateParts = date.split(' ');
        if (dateParts.length < 3) continue; // Skip invalid dates
        const day = dateParts[0];
        const month = dateParts[1].toLowerCase();
        const displayDate = `${day} ${month}`;

        const match = {
            title: `Dynamo Beirs vs ${opponent}`,
            opponent: opponent, // Store opponent separately for autocomplete
            dateTime: { date, displayDate },
            score: `${goalsScored}-${goalsConceded}`,
            isHome: true, // Assuming Dynamo Beirs is the home team; adjust if CSV provides home/away data
            result: determineResult(goalsScored, goalsConceded)
        };

        matches.push(match);
    }

    // Sort matches by date (most recent first)
    matches.sort((a, b) => {
        const dateA = parseDate(a.dateTime.date);
        const dateB = parseDate(b.dateTime.date);
        return dateB - dateA; // Descending order
    });

    return matches;
}

// Determine match result
function determineResult(goalsScored, goalsConceded) {
    const scored = parseInt(goalsScored);
    const conceded = parseInt(goalsConceded);
    if (scored > conceded) return 'winst';
    if (scored === conceded) return 'gelijk';
    return 'verlies';
}

// Parse date for sorting
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split(' ');
    const monthMap = {
        'jan': 0, 'feb': 1, 'mrt': 2, 'apr': 3, 'mei': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dec': 11
    };
    return new Date(year, monthMap[month.toLowerCase()], day);
}

// Render search results
function renderSearchResults(matches) {
    const grid = document.getElementById('search-results-grid');
    grid.innerHTML = '';

    if (matches.length === 0) {
        grid.innerHTML = '<p>Geen wedstrijden gevonden.</p>';
        return;
    }

    matches.forEach(match => {
        const card = document.createElement('div');
        const resultClass = match.result === 'winst' ? 'win' : match.result === 'gelijk' ? 'draw' : 'loss';
        card.className = `match-card modern result`;
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
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    setupMatchInteractions();
}

// Setup search and autocomplete functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const autocompleteList = document.getElementById('autocomplete-list');
    const searchMessage = document.getElementById('search-message');

    const performSearch = (query) => {
        if (!window.allMatches) {
            searchMessage.textContent = 'Wedstrijden worden nog geladen...';
            searchMessage.classList.remove('error-message');
            searchMessage.classList.add('loading-message');
            return;
        }

        const filteredMatches = window.allMatches.filter(match =>
            match.title.toLowerCase().includes(query.toLowerCase())
        );

        renderSearchResults(filteredMatches);
        searchMessage.textContent = filteredMatches.length === 0 ? 'Geen wedstrijden gevonden.' : '';
        searchMessage.classList.remove('loading-message');
        searchMessage.classList.add('error-message');
        if (filteredMatches.length > 0) searchMessage.classList.add('hidden');
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
        ).slice(0, 5); // Limit to 5 suggestions

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

    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteList.contains(e.target)) {
            autocompleteList.innerHTML = '';
            autocompleteList.style.display = 'none';
        }
    });

    // Focus input when clicking wrapper
    document.querySelector('.search-wrapper').addEventListener('click', () => {
        searchInput.focus();
    });
}

// Match interactions
function setupMatchInteractions() {
    document.querySelectorAll('.match-card.modern.result').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const matchData = {
                title: card.getAttribute('data-match-title') || 'Wedstrijddetails',
                dateTime: {
                    date: card.getAttribute('data-match-date') || 'TBD',
                    displayDate: card.querySelector('.match-date')?.textContent.replace(/^\s*\S+\s*/, '') || 'TBD',
                    time: 'TBD'
                },
                score: card.getAttribute('data-score') || null,
                isUpcoming: false,
                goalscorers: [] // Adjust if goalscorers are added to CSV
            };
            if (window.matchModal) {
                window.matchModal.show(matchData);
            } else {
                console.error('MatchModal not initialized');
            }
        });
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '';
        });
    });
}