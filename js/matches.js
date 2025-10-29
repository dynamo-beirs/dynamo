// matches.js
import { initializeCountdown, animateOnScroll } from './general.js';

// Define animation elements
const animationElements = [
    { selector: '.match-card', containerSelector: 'section' },
    { selector: '.timeline', containerSelector: 'section' },
    { selector: '.timeline-item', containerSelector: ['section', '.container'] },
    { selector: '.countdown-block', containerSelector: null },
    { selector: '.form-result', containerSelector: null },
    { selector: '.section-title', containerSelector: 'section' },
    { selector: '.section-subtitle', containerSelector: 'section' },
    { selector: '.page-hero h1', containerSelector: 'section' },
    { selector: '.upcoming-match-name', containerSelector: null },
    { selector: '.form-description', containerSelector: null }
];

// Matches page initialization and functionality
document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderMatches();
    animateOnScroll(animationElements);
    scrollTimelineToEnd();
});

// Fetch and parse CSV data from Google Spreadsheet
async function fetchAndRenderMatches() {
    const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=300017481&single=true&output=csv';

    try {
        const response = await fetch(spreadsheetUrl);
        const csvText = await response.text();
        const matches = parseCsvData(csvText);

        renderUpcomingMatches(matches.upcoming);
        renderRecentMatches(matches.past);
        renderSeasonTimeline(matches.all);
        renderForm(matches.form);
        updateCountdown(matches.upcoming);
        setupMatchInteractions();
        initializeCountdown();
    } catch (error) {
        console.error('Error fetching or parsing CSV:', error);
        const titleEl = document.getElementById('next-match-title');
        const countdownEl = document.getElementById('countdown');
        if (titleEl && countdownEl) {
            titleEl.textContent = 'No games planned in the near future';
            countdownEl.style.display = 'none';
        }
    }
}

// Month mapping: English to Dutch
const monthMapEnglishToDutch = {
    'jan': 'jan',
    'feb': 'feb',
    'mar': 'mrt',
    'apr': 'apr',
    'may': 'mei',
    'jun': 'jun',
    'jul': 'jul',
    'aug': 'aug',
    'sep': 'sep',
    'oct': 'okt',
    'nov': 'nov',
    'dec': 'dec'
};

// Parse CSV data using Papaparse
function parseCsvData(csvText) {
    // Parse CSV properly handling quoted fields
    const parsed = Papa.parse(csvText, {
        skipEmptyLines: true,
        delimiter: ','
    });

    const rows = parsed.data;
    const matches = { upcoming: [], past: [], all: [], form: [] };

    // Extract match data from columns F to AA
    const columns = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA'];
    const colIndexMap = columns.reduce((map, col, idx) => {
        map[col] = idx + 5; // Columns start at F (index 5 in 0-based indexing)
        return map;
    }, {});

    for (const col of columns) {
        const colIdx = colIndexMap[col];
        const opponent = rows[1]?.[colIdx]?.trim(); // Row 2
        const date = rows[2]?.[colIdx]?.trim(); // Row 3
        const time = rows[3]?.[colIdx]?.trim(); // Row 4
        const stadium = rows[4]?.[colIdx]?.trim(); // Row 5
        const homeAway = rows[5]?.[colIdx]?.trim().toLowerCase(); // Row 6
        const result = rows[60]?.[colIdx]?.trim().toLowerCase(); // Row 61
        const goalsScoredRaw = rows[61]?.[colIdx]?.trim(); // Row 62
        const goalsConcededRaw = rows[62]?.[colIdx]?.trim(); // Row 63
        const goalscorersRaw = rows[64]?.[colIdx]?.trim(); // Row 65

        if (opponent && date && time && stadium && homeAway) {
            const isHome = homeAway === 'thuis';
            const title = isHome ? `Dynamo Beirs vs ${opponent}` : `${opponent} vs Dynamo Beirs`;

            // Transform English month to Dutch
            const dateParts = date.split(' ');
            const day = dateParts[0];
            const monthEnglish = dateParts[1]?.toLowerCase();
            const year = dateParts[2];
            const monthDutch = monthMapEnglishToDutch[monthEnglish] || monthEnglish; // Fallback to original if not found
            const displayDate = `${day} ${monthDutch}`;

            const match = {
                title,
                dateTime: { date, time, displayDate },
                season: '2025-26',
                stadium,
                isHome
            };

            if (result) {
                const goalsScored = isHome ? goalsScoredRaw : goalsConcededRaw;
                const goalsConceded = isHome ? goalsConcededRaw : goalsScoredRaw;
                match.score = `${goalsScored}-${goalsConceded}`;
                match.goalscorers = parseGoalscorers(goalscorersRaw);
                match.result = result;
                matches.past.push(match);
            } else {
                matches.upcoming.push(match);
            }
            matches.all.push(match);
        }
    }

    // Sort matches by date
    const parseDate = (dateStr) => {
        const [day, month, year] = dateStr.split(' ');
        const monthMap = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        return new Date(year, monthMap[month.toLowerCase()], day);
    };

    matches.all.sort((a, b) => parseDate(a.dateTime.date) - parseDate(b.dateTime.date));
    matches.past.sort((a, b) => parseDate(a.dateTime.date) - parseDate(b.dateTime.date));
    matches.upcoming.sort((a, b) => parseDate(a.dateTime.date) - parseDate(b.dateTime.date));

    // Extract form from cells AC70 to AG70 and map W/D/L to winst/gelijk/verlies
    const formStartCol = 28; // AC = 28 (0-indexed)
    const formCells = [];
    const resultMap = {
        'w': 'winst',
        'd': 'gelijk',
        'l': 'verlies'
    };
    for (let i = 0; i < 5; i++) {
        const cell = rows[69]?.[formStartCol + i]?.trim().toLowerCase(); // Row 70
        if (cell && resultMap[cell]) {
            formCells.push(resultMap[cell]);
        }
    }
    matches.form = formCells; // Most recent first (AG70 first)

    return matches;
}

// Parse goalscorers
function parseGoalscorers(goalscorersRaw) {
    console.log('Raw goalscorers input:', goalscorersRaw);

    if (!goalscorersRaw ||
        goalscorersRaw.trim() === '' ||
        goalscorersRaw.trim() === '/') {
        return [];
    }

    const goalscorers = [];
    // Remove surrounding quotes and extra whitespace
    const cleanedRaw = goalscorersRaw.replace(/^["'\s]+|["'\s]+$/g, '').trim();

    if (!cleanedRaw) {
        console.log('Cleaned goalscorers is empty');
        return [];
    }

    // Split by semicolons
    const scorerEntries = cleanedRaw.split(';').map(s => s.trim()).filter(s => s);

    console.log('Scorer entries:', scorerEntries);

    for (const entry of scorerEntries) {
        // Match player name and optional goal count (e.g., "Player (x3)" or "Player")
        const match = entry.match(/^(.+?)(?:\s*\(x(\d+)\))?$/i);
        if (match) {
            const player = match[1].trim();
            const goals = match[2] ? parseInt(match[2], 10) : 1;
            if (player && player.length > 0) {
                goalscorers.push({ player, goals });
                console.log(`Added goalscorer: ${player} with ${goals} goal(s)`);
            }
        } else {
            console.warn('Failed to parse goalscorer entry:', entry);
        }
    }

    console.log('Final parsed goalscorers:', goalscorers);
    return goalscorers;
}

// Render upcoming matches
function renderUpcomingMatches(upcomingMatches) {
    const grid = document.getElementById('upcoming-matches-grid');
    grid.innerHTML = '';

    if (upcomingMatches.length === 0) {
        grid.innerHTML = '<p>Geen komende wedstrijden gepland.</p>';
        return;
    }

    const limitedMatches = upcomingMatches.slice(0, 6);

    limitedMatches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card modern';
        card.setAttribute('data-venue', match.stadium);
        card.setAttribute('data-match-title', match.title);
        card.setAttribute('data-match-date', match.dateTime.date);
        card.setAttribute('data-match-time', match.dateTime.time);
        card.setAttribute('data-match-season', match.season);

        const [homeTeam, awayTeam] = match.title.split(' vs ');
        card.innerHTML = `
            <span class="result-icon"><i class="fas fa-hourglass-half"></i></span>
            <div class="match-body">
                <div class="match-teams">
                    <div class="home-team">${homeTeam}</div>
                    <div class="vs-divider">vs</div>
                    <div class="away-team">${awayTeam}</div>
                </div>
                <div class="match-score">${match.dateTime.displayDate} — ${match.dateTime.time}</div>
                <div class="match-details">
                    <div class="match-venue">
                        <i class="fas fa-map-marker-alt"></i>
                        ${match.stadium}
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Render recent matches
function renderRecentMatches(pastMatches) {
    const grid = document.getElementById('recent-matches-grid');
    grid.innerHTML = '';

    if (pastMatches.length === 0) {
        grid.innerHTML = '<p>Geen recente wedstrijden beschikbaar.</p>';
        return;
    }

    const reversedPastMatches = [...pastMatches].reverse().slice(0, 6); // Limit to 6 recent matches

    reversedPastMatches.forEach(match => {
        const card = document.createElement('div');
        const resultClass = match.result === 'winst' ? 'win' : match.result === 'gelijk' ? 'draw' : 'loss';
        card.className = `match-card modern result`;
        card.setAttribute('data-venue', match.stadium);
        card.setAttribute('data-match-title', match.title);
        card.setAttribute('data-score', match.score);
        card.setAttribute('data-match-date', match.dateTime.date);
        card.setAttribute('data-match-time', match.dateTime.time);
        card.setAttribute('data-match-season', match.season);
        card.setAttribute('data-goalscorers', JSON.stringify(match.goalscorers));

        const [homeTeam, awayTeam] = match.title.split(' vs ');
        card.innerHTML = `
            <div class="result-icon ${resultClass}"><span><i class="fas fa-${resultClass === 'win' ? 'check' : resultClass === 'draw' ? 'minus' : 'times'}"></i></span></div>
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
}

// Render season timeline
function renderSeasonTimeline(matches) {
    const timeline = document.getElementById('season-timeline');
    timeline.innerHTML = '';

    const pastMatches = matches.filter(match => match.result);

    pastMatches.forEach((match, index) => {
        const item = document.createElement('div');
        const resultClass = match.result ? (match.result === 'winst' ? 'win' : match.result === 'gelijk' ? 'draw' : 'loss') : '';
        item.className = `timeline-item ${resultClass}`;
        item.setAttribute('data-match', `match${index + 1}`);
        item.setAttribute('data-match-data', JSON.stringify(match));
        item.innerHTML = `
            <span class="result-icon"><i class="fas fa-${resultClass === 'win' ? 'check' : resultClass === 'draw' ? 'minus' : 'times'}"></i></span>
            <small>${match.dateTime.displayDate}</small>
        `;
        timeline.appendChild(item);
    });
}

// Render form display
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

// Update countdown
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

// Match interactions
function setupMatchInteractions() {
    document.querySelectorAll('.match-card.modern:not(.result)').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const matchData = {
                title: card.getAttribute('data-match-title') || 'Wedstrijddetails',
                stadium: card.getAttribute('data-venue') || 'Thuisstadion',
                isUpcoming: true,
                ...getMatchData(card)
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

    document.querySelectorAll('.match-card.modern.result').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const matchData = {
                title: card.getAttribute('data-match-title') || 'Match Details',
                stadium: card.getAttribute('data-venue') || 'Home Stadium',
                isUpcoming: false,
                ...getMatchData(card)
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

    document.querySelectorAll('.timeline-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const matchDataRaw = item.getAttribute('data-match-data');
            let matchData;
            try {
                matchData = JSON.parse(matchDataRaw);
            } catch (error) {
                console.warn('Failed to parse match data:', error);
                matchData = {
                    title: `Match ${item.dataset.match}`,
                    dateTime: { date: item.querySelector('small')?.textContent || 'TBD', time: 'TBD' },
                    season: '2025-26',
                    stadium: 'Onbekend Stadion',
                    score: null,
                    goalscorers: []
                };
            }
            matchData.isUpcoming = !matchData.score;
            if (window.matchModal) {
                window.matchModal.show(matchData);
            } else {
                console.error('MatchModal not initialized');
            }
        });
    });
}

// Extract match data from card attributes
function getMatchData(card) {
    const matchDate = card.getAttribute('data-match-date') || 'TBD';
    const matchTime = card.getAttribute('data-match-time') || 'TBD';
    const season = card.getAttribute('data-match-season') || '2025-26';
    const score = card.getAttribute('data-score') || null;
    let goalscorers = [];
    const goalscorersData = card.getAttribute('data-goalscorers');
    if (goalscorersData) {
        try {
            goalscorers = JSON.parse(goalscorersData);
            if (!Array.isArray(goalscorers)) {
                console.warn('Goalscorers data is not an array:', goalscorersData);
                goalscorers = [];
            }
        } catch (error) {
            console.warn('Failed to parse goalscorers data:', error, goalscorersData);
            goalscorers = [];
        }
    }
    // Transform English month to Dutch for displayDate
    const dateParts = matchDate.split(' ');
    const day = dateParts[0];
    const monthEnglish = dateParts[1]?.toLowerCase();
    const monthDutch = monthMapEnglishToDutch[monthEnglish] || monthEnglish; // Fallback to original
    const displayDate = `${day} ${monthDutch}`;

    return {
        dateTime: { date: matchDate, time: matchTime, displayDate },
        season,
        score,
        goalscorers
    };
}

// Timeline scroller
function scrollTimelineToEnd() {
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (timelineWrapper) {
        timelineWrapper.scrollLeft = timelineWrapper.scrollWidth;
    }
}