/**
 * archive.js — Archive page
 */
import { animateOnScroll } from '../core/animations.js';
import { LineGraph } from '../components/line-graph.js';
import { SHEET_URLS, parseCsv } from '../services/data-service.js';
import { fetchCsvCached } from '../services/fetch-csv.js';
import { FootballLoader } from '../components/loader.js';
import { POSITION_CODE_MAP, MONTH_EN_TO_NL, parseGoalscorers, parseDate, resultToClass, resultToIcon, calcWinMargin, calcLossMargin } from '../core/helpers.js';
import { PLAYER_TABLE_HEADER_HTML, sliceForTable, resetTableState, buildPlayerRow, appendTableToggle, bindSortableHeaders } from '../components/player-table.js';
import { initDropdown, bindDropdownClose } from '../components/dropdown.js';
import { animateMatchCards } from '../components/match-card.js';

// ── Animation Registry ────────────────────────────────────────────────────────

const animationElements = [
    { selector: '.page-hero h1',                          containerSelector: 'section' },
    { selector: '.section-title',                         containerSelector: 'section' },
    { selector: '.section-subtitle',                      containerSelector: 'section' },
    { selector: '.picker-section .season-picker',         containerSelector: 'section' },
    { selector: '.podium-step',                           containerSelector: '.podium-container' }
];

// ── Season Configuration ──────────────────────────────────────────────────────

const SEASON_CONFIG = {
    '2025-2026': {
        label: "'25-'26", url: SHEET_URLS.currentSeason,
        matchCols:  { first: colIndex('F'), last: colIndex('AA') },
        matchRows:  { opponent: 1, date: 2, time: 3, stadium: 4, homeAway: 5, goalsFor: 74, goalsAgainst: 75, goalscorers: 77 },
        playerRows: { first: 4, last: 51 },
        playerCols: { name: colIndex('B'), position: colIndex('D'), goals: colIndex('AD'), matches: colIndex('AE') },
        statsCell:  { played: [77, colIndex('AE')], wins: [75, colIndex('AG')], draws: [76, colIndex('AG')], losses: [77, colIndex('AG')], goalsFor: [74, colIndex('AE')], goalsAgainst: [75, colIndex('AE')] },
        goldenShoe: { col: colIndex('AD'), gold: 84, silver: 85, bronze: 86 }
    },
    '2024-2025': {
        label: "'24-'25", url: SHEET_URLS.season2425,
        matchCols:  { first: colIndex('F'), last: colIndex('AA') },
        matchRows:  { opponent: 1, date: 2, time: 3, stadium: 4, homeAway: 5, goalsFor: 75, goalsAgainst: 76, goalscorers: 78 },
        playerRows: { first: 7, last: 51 },
        playerCols: { name: colIndex('B'), position: colIndex('D'), goals: colIndex('AD'), matches: colIndex('AE') },
        statsCell:  { played: [78, colIndex('AE')], wins: [76, colIndex('AG')], draws: [77, colIndex('AG')], losses: [78, colIndex('AG')], goalsFor: [75, colIndex('AE')], goalsAgainst: [76, colIndex('AE')] },
        goldenShoe: { col: colIndex('AD'), gold: 84, silver: 85, bronze: 86 }
    },
    '2023-2024': {
        label: "'23-'24", url: SHEET_URLS.season2324,
        matchCols:  { first: colIndex('F'), last: colIndex('Z') },
        matchRows:  { opponent: 1, date: 2, time: 3, stadium: 4, homeAway: 5, goalsFor: 64, goalsAgainst: 65, goalscorers: 67 },
        playerRows: { first: 7, last: 50 },
        playerCols: { name: colIndex('B'), position: colIndex('D'), goals: colIndex('AC'), matches: colIndex('AD') },
        statsCell:  { played: [67, colIndex('AD')], wins: [65, colIndex('AF')], draws: [66, colIndex('AF')], losses: [67, colIndex('AF')], goalsFor: [64, colIndex('AD')], goalsAgainst: [65, colIndex('AD')] },
        goldenShoe: { col: colIndex('AC'), gold: 70, silver: 71, bronze: 72 }
    },
    '2022-2023': {
        label: "'22-'23", url: SHEET_URLS.season2223,
        matchCols:  { first: colIndex('F'), last: colIndex('W') },
        matchRows:  { opponent: 1, date: 2, time: 3, stadium: 4, homeAway: 5, goalsFor: 73, goalsAgainst: 74, goalscorers: 76 },
        playerRows: { first: 7, last: 52 },
        playerCols: { name: colIndex('B'), position: colIndex('D'), goals: colIndex('Z'), matches: colIndex('AA') },
        statsCell:  { played: [76, colIndex('AA')], wins: [74, colIndex('AC')], draws: [75, colIndex('AC')], losses: [76, colIndex('AC')], goalsFor: [73, colIndex('AA')], goalsAgainst: [74, colIndex('AA')] },
        goldenShoe: { col: colIndex('Z'), gold: 79, silver: 80, bronze: 81 }
    },
    '2021-2022': {
        label: "'21-'22", url: SHEET_URLS.season2122,
        matchCols:  { first: colIndex('F'), last: colIndex('X') },
        matchRows:  { opponent: 1, date: 2, time: 3, stadium: 4, homeAway: 5, goalsFor: 56, goalsAgainst: 57, goalscorers: 59 },
        playerRows: { first: 7, last: 47 },
        playerCols: { name: colIndex('B'), position: colIndex('D'), goals: colIndex('AA'), matches: colIndex('AB') },
        statsCell:  { played: [59, colIndex('AB')], wins: [57, colIndex('AD')], draws: [58, colIndex('AD')], losses: [59, colIndex('AD')], goalsFor: [56, colIndex('AB')], goalsAgainst: [57, colIndex('AB')] },
        goldenShoe: { col: colIndex('AA'), gold: 62, silver: 63, bronze: 64 }
    },
};

// ── Module State ──────────────────────────────────────────────────────────────

const _parsedSeasonCache = new Map();
let archivePlayers = [];
let archiveMatches = [];

// ── Tooltip Template ──────────────────────────────────────────────────────────

const getTooltipHTML = (d) => `
    <div class="archive-graph-tooltip">
        <h4 class="archive-graph-tooltip-title">${d.matches}</h4>
        <div class="archive-graph-tooltip-row">
            <span class="result-icon win"><i class="fas fa-check"></i></span>
            <span class="archive-graph-tooltip-value">${d.winst}</span>
        </div>
        <div class="archive-graph-tooltip-row">
            <span class="result-icon draw"><i class="fas fa-minus"></i></span>
            <span class="archive-graph-tooltip-value">${d.gelijk}</span>
        </div>
        <div class="archive-graph-tooltip-row">
            <span class="result-icon loss"><i class="fas fa-times"></i></span>
            <span class="archive-graph-tooltip-value">${d.verlies}</span>
        </div>
    </div>
`;

// ── Page Initialization ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Each dropdown gets a single typed callback — no more three separate functions
    initDropdown(
        document.getElementById('season-select'),
        (value) => loadSeason(value)
    );
    initDropdown(
        document.getElementById('archive-player-sort'),
        (value) => { resetTableState('archive-players'); renderArchivePlayers(value); }
    );
    initDropdown(
        document.getElementById('archive-match-sort'),
        (value) => renderSortedMatches(value)
    );

    // One global outside-click closer covers all three dropdowns above
    bindDropdownClose();

    initSortHeaders();
    animateOnScroll(animationElements);

    const initialSeason = document.querySelector('#season-select .selected').dataset.value;
    loadSeason(initialSeason);
});

// ── Season Loading ────────────────────────────────────────────────────────────

async function loadSeason(seasonString) {
    const loadingId      = 'archive-loading';
    const errorId        = 'archive-error';
    const loadingEl      = document.getElementById(loadingId);
    const contentEl      = document.getElementById('archive-content');
    const errorEl        = document.getElementById(errorId);
    const titleEl        = document.getElementById('archive-season-title');
    const comparisonView = document.getElementById('archive-comparison-view');
    const seasonView     = document.getElementById('archive-season-view');
    const displayLabel = SEASON_CONFIG[seasonString]?.label || seasonString;

    titleEl.textContent = seasonString === 'Vergelijking'
        ? 'Seizoenen Vergelijken'
        : `Overzicht ${displayLabel}`;
    titleEl.classList.remove('animate-in');

    contentEl.style.display = 'none';
    errorEl.classList.add('hidden');

    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        FootballLoader.show(loadingId, 'Gegevens worden geladen...');
    }

    try {
        if (seasonString === 'Vergelijking') {
            seasonView.classList.add('hidden');
            comparisonView.classList.remove('hidden');

            const allData = await fetchAllSeasonsData();
            loadingEl?.classList.add('hidden');
            contentEl.style.display = 'block';

            const graphConfigs = [
                {
                    id: '#matches-graph', title: 'Aantal gespeelde wedstrijden',
                    color: '#7B96B7', dotColor: '#3D5A80', hideLine: true,
                    mapFn: d => ({
                        label: d.seasonLabel, value: d.matches, tooltipHTML: getTooltipHTML(d),
                        stacked: [
                            { value: d.winst,   color: '#648F5F' },
                            { value: d.gelijk,  color: '#E8B04B' },
                            { value: d.verlies, color: '#E07A5F' }
                        ]
                    })
                },
                { id: '#total-voor-graph',  title: 'Aantal gescoorde doelpunten',                        color: '#84B281', dotColor: '#648F5F', mapFn: d => ({ label: d.seasonLabel, value: d.totalVoor  }) },
                { id: '#total-tegen-graph', title: 'Aantal tegendoelpunten',                              color: '#E07A5F', dotColor: '#B90A0A', mapFn: d => ({ label: d.seasonLabel, value: d.totalTegen }) },
                { id: '#avg-voor-graph',    title: 'Gemiddeld aantal gescoorde doelpunten per wedstrijd', color: '#84B281', dotColor: '#648F5F', mapFn: d => ({ label: d.seasonLabel, value: d.avgVoor    }) },
                { id: '#avg-tegen-graph',   title: 'Gemiddeld aantal tegendoelpunten per wedstrijd',     color: '#E07A5F', dotColor: '#B90A0A', mapFn: d => ({ label: d.seasonLabel, value: d.avgTegen   }) }
            ];

            graphConfigs.forEach(({ id, title, color, dotColor, hideLine, mapFn }) => {
                const el = document.querySelector(id);
                if (el) {
                    el.innerHTML = '';
                    new LineGraph(id, {
                        title, color, dotColor,
                        hideLineAndDots: hideLine || false,
                        data: allData.map(mapFn)
                    });
                }
            });
        } else {
            comparisonView.classList.add('hidden');
            seasonView.classList.remove('hidden');
            loadingEl?.classList.add('hidden');
            contentEl.style.display = 'block';
            await loadSeasonData(seasonString);
        }

        setTimeout(() => titleEl.classList.add('animate-in'), 100);
    } catch (err) {
        console.error('Error loading data:', err);
        if (loadingEl) loadingEl.classList.add('hidden');
        FootballLoader.showError(errorId, 'Gegevens konden niet worden geladen. Probeer opnieuw.');
    }
}

async function loadSeasonData(seasonString) {
    const config       = SEASON_CONFIG[seasonString];
    const innerLoadId  = 'archive-season-loader';
    const innerErrorId = 'archive-season-error';
    const innerLoader  = document.getElementById(innerLoadId);
    const innerContent = document.getElementById('archive-season-content');

    if (innerLoader) {
        innerLoader.classList.remove('hidden');
        FootballLoader.show(innerLoadId, 'Seizoensgegevens worden geladen...');
    }

    document.getElementById(innerErrorId)?.classList.add('hidden');
    innerContent?.classList.add('hidden');

    // Reset dropdown labels to defaults
    const sortSel = document.querySelector('#archive-player-sort .selected');
    if (sortSel) { sortSel.innerHTML = 'Totaal Doelpunten'; sortSel.dataset.value = 'goals'; }

    const matchSortSel = document.querySelector('#archive-match-sort .selected');
    if (matchSortSel) {
        matchSortSel.innerHTML    = 'Datum (oud <i class="fas fa-arrow-right-long"></i> nieuw)';
        matchSortSel.dataset.value = 'date-asc';
    }

    try {
        if (_parsedSeasonCache.has(seasonString)) {
            const cached = _parsedSeasonCache.get(seasonString);

            renderGoldenShoe(cached.shoeData);
            renderSeasonStats(cached.stats);
            archivePlayers = cached.players;
            resetTableState('archive-players');
            renderArchivePlayers('goals');
            archiveMatches = cached.matches;
            renderSortedMatches('date-asc');

            if (innerLoader)  innerLoader.classList.add('hidden');
            if (innerContent) innerContent.classList.remove('hidden');

            animateMatchCards('.match-card', '#archive-matches-grid');
            animateOnScroll([
                { selector: '.stat-card',                         containerSelector: 'section' },
                { selector: '.archive-player-row',                containerSelector: 'section' },
                { selector: '.archive-subsection .section-title', containerSelector: 'section' }
            ]);
            return;
        }

        const csvText = await fetchCsvCached(config.url);
        const rows    = parseCsv(csvText, { skipEmptyLines: false }).data;

        const stats    = parseSeasonStats(rows, config);
        const players  = parseSeasonPlayers(rows, config);
        const matches  = parseSeasonMatches(rows, config, seasonString);
        const shoeData = parseGoldenShoe(rows, config);

        _parsedSeasonCache.set(seasonString, { stats, players, matches, shoeData });

        renderGoldenShoe(shoeData);
        renderSeasonStats(stats);
        archivePlayers = players;
        resetTableState('archive-players');
        renderArchivePlayers('goals');
        archiveMatches = matches;
        renderSortedMatches('date-asc');

        if (innerLoader)  innerLoader.classList.add('hidden');
        if (innerContent) innerContent.classList.remove('hidden');

        animateMatchCards('.match-card', '#archive-matches-grid');
        animateOnScroll([
            { selector: '.stat-card',                         containerSelector: 'section' },
            { selector: '.archive-player-row',                containerSelector: 'section' },
            { selector: '.archive-subsection .section-title', containerSelector: 'section' }
        ]);
    } catch (err) {
        console.error('Error loading season data:', err);
        if (innerLoader) innerLoader.classList.add('hidden');
        FootballLoader.showError(innerErrorId, 'Seizoensgegevens konden niet worden geladen. Probeer opnieuw.');
    }
}

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchAllSeasonsData() {
    const csvText = await fetchCsvCached(SHEET_URLS.seasonRecords);
    const rows    = parseCsv(csvText, { skipEmptyLines: true }).data;

    const cleanLabel = str => str ? str.replace(/[="]/g, '').trim() : '';
    const toDecimal  = (val, abs = false) => { let n = parseFloat(val); if (isNaN(n)) return 0; if (abs) n = Math.abs(n); return parseFloat(n.toFixed(2)); };
    const toInt      = (val, abs = false) => { let n = parseInt(val);   if (isNaN(n)) return 0; return abs ? Math.abs(n) : n; };

    return [3, 5, 7, 9, 11].map(rowIndex => {
        const row = rows[rowIndex];
        return {
            seasonLabel: cleanLabel(row[1]),
            matches:     toInt(row[2]),
            winst:       toInt(row[3]),
            gelijk:      toInt(row[4]),
            verlies:     toInt(row[5], true),
            totalVoor:   toInt(row[6]),
            totalTegen:  toInt(row[7], true),
            avgVoor:     toDecimal(row[11]),
            avgTegen:    toDecimal(row[12], true),
        };
    });
}

// ── Cell Helpers ──────────────────────────────────────────────────────────────

/** Converts a spreadsheet column letter (e.g. "AF") to a 0-based array index. */
function colIndex(letters) {
    letters = letters.toUpperCase();
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
}

/** Returns the trimmed string value of a cell, stripping quotes and `=` signs. */
function cellText(rows, rowIdx, colIdx) {
    return rows[rowIdx]?.[colIdx]?.toString().trim().replace(/^[="]+|["+$]/g, '') || '';
}

/** Returns the absolute integer value of a cell (defaults to 0). */
function cellInt(rows, rowIdx, colIdx) {
    return Math.abs(parseInt(cellText(rows, rowIdx, colIdx), 10)) || 0;
}

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseSeasonStats(rows, config) {
    const s = config.statsCell;
    return {
        matches:      cellInt(rows, s.played[0],      s.played[1]),
        wins:         cellInt(rows, s.wins[0],         s.wins[1]),
        draws:        cellInt(rows, s.draws[0],        s.draws[1]),
        losses:       cellInt(rows, s.losses[0],       s.losses[1]),
        goalsFor:     cellInt(rows, s.goalsFor[0],     s.goalsFor[1]),
        goalsAgainst: cellInt(rows, s.goalsAgainst[0], s.goalsAgainst[1]),
    };
}

function parseSeasonPlayers(rows, config) {
    const { first, last } = config.playerRows;
    const pc        = config.playerCols;
    const titleRows = ['keeper', 'verdedigers', 'middenvelders', 'aanvallers'];
    const players   = [];

    for (let r = first; r <= last; r++) {
        const name    = cellText(rows, r, pc.name);
        const posCode = cellText(rows, r, pc.position);
        const goals   = parseInt(cellText(rows, r, pc.goals),   10);
        const matches = parseInt(cellText(rows, r, pc.matches), 10);

        if (!name || titleRows.includes(name.toLowerCase())) continue;
        const position = POSITION_CODE_MAP[posCode];
        if (!position || isNaN(goals) || isNaN(matches)) continue;

        players.push({ name, position, goals, matches });
    }
    return players.sort((a, b) => b.goals - a.goals);
}

function parseSeasonMatches(rows, config, seasonString) {
    const mc          = config.matchCols;
    const mr          = config.matchRows;
    const seasonLabel = config.label || seasonString;
    const matches     = [];

    for (let c = mc.first; c <= mc.last; c++) {
        const opponent = cellText(rows, mr.opponent,     c);
        const dateRaw  = cellText(rows, mr.date,         c);
        const time     = cellText(rows, mr.time,         c);
        const stadium  = cellText(rows, mr.stadium,      c);
        const homeAway = cellText(rows, mr.homeAway,     c).toLowerCase();
        const gfRaw    = cellText(rows, mr.goalsFor,     c);
        const gaRaw    = cellText(rows, mr.goalsAgainst, c);
        const gsRaw    = cellText(rows, mr.goalscorers,  c);

        if (!opponent || !dateRaw) continue;

        const isHome      = homeAway === 'thuis';
        const dateParts   = dateRaw.split(' ');
        const day         = dateParts[0] || '';
        const monthEn     = (dateParts[1] || '').toLowerCase();
        const monthDutch  = MONTH_EN_TO_NL[monthEn] || monthEn;
        const displayDate = `${day} ${monthDutch}`;
        const title       = isHome ? `Dynamo Beirs vs ${opponent}` : `${opponent} vs Dynamo Beirs`;

        const gf = parseInt(gfRaw, 10);
        const ga = parseInt(gaRaw, 10);
        if (isNaN(gf) || isNaN(ga)) continue;

        const score  = isHome ? `${gf}-${ga}` : `${ga}-${gf}`;
        const result = gf > ga ? 'winst' : gf < ga ? 'verlies' : 'gelijk';

        matches.push({
            title, displayDate, dateRaw, score, result, stadium, time,
            goalscorers: parseGoalscorers(gsRaw),
            season: seasonLabel,
            isHome
        });
    }

    return matches.sort((a, b) => parseDate(a.dateRaw) - parseDate(b.dateRaw));
}

function parseGoldenShoe(rows, config) {
    if (!config.goldenShoe) return null;
    const { col, gold, silver, bronze } = config.goldenShoe;
    const goldName = cellText(rows, gold, col);

    if (!goldName || goldName === '0') return null;

    return {
        gold:   goldName,
        silver: cellText(rows, silver, col) || '-',
        bronze: cellText(rows, bronze, col) || '-'
    };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderGoldenShoe(shoeData) {
    const section = document.getElementById('archive-golden-shoe-section');
    if (!section) return;

    if (!shoeData) { section.classList.add('hidden'); return; }

    section.classList.remove('hidden');
    document.getElementById('shoe-gold-name').textContent   = shoeData.gold;
    document.getElementById('shoe-silver-name').textContent = shoeData.silver;
    document.getElementById('shoe-bronze-name').textContent = shoeData.bronze;
}

function renderSeasonStats(stats) {
    const map = {
        'arch-stat-matches':       stats.matches,
        'arch-stat-wins':          stats.wins,
        'arch-stat-draws':         stats.draws,
        'arch-stat-losses':        stats.losses,
        'arch-stat-goals-for':     stats.goalsFor,
        'arch-stat-goals-against': stats.goalsAgainst,
    };
    Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

function renderArchivePlayers(sortBy = 'goals') {
    const tableContainer = document.querySelector('.player-stats-table');
    if (!tableContainer) return;

    const sorted = [...archivePlayers].sort((a, b) => {
        const aR = a.matches === 0 ? 0 : a.goals / a.matches;
        const bR = b.matches === 0 ? 0 : b.goals / b.matches;
        if (sortBy === 'goals')   return b.goals - a.goals || bR - aR || b.matches - a.matches;
        if (sortBy === 'matches') return b.matches - a.matches || b.goals - a.goals;
        return bR - aR || b.goals - a.goals;
    });

    tableContainer.innerHTML = `${PLAYER_TABLE_HEADER_HTML}<div id="archive-player-list"></div>`;
    const list = document.getElementById('archive-player-list');

    if (sorted.length === 0) {
        list.innerHTML = '<div class="empty-state-message">Geen data beschikbaar.</div>';
        return;
    }

    const visiblePlayers = sliceForTable(sorted, 'archive-players', 10);

    // Replaced inline markup with our new helper
    visiblePlayers.forEach((player, index) => {
        const row = buildPlayerRow(player, index, 'player-row archive-player-row', 'player');
        list.appendChild(row);
    });

    appendTableToggle(tableContainer, 'archive-players', sorted.length, 10, () => renderArchivePlayers(sortBy));
    initSortHeaders();
}

function renderSeasonMatches(matches) {
    const grid = document.getElementById('archive-matches-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (matches.length === 0) {
        grid.innerHTML = '<div class="empty-state-message">Geen wedstrijden beschikbaar voor dit seizoen.</div>';
        return;
    }

    matches.forEach(match => {
        // resultToClass / resultToIcon replace the inline ternaries that were here
        const cls  = resultToClass(match.result);
        const icon = resultToIcon(cls);

        const parts    = match.title.split(' vs ');
        const homeTeam = parts[0] || match.title;
        const awayTeam = parts[1] || '';

        const card = document.createElement('div');
        card.className = 'match-card result';

        // Archive cards use individual data-* attributes so bindArchiveMatchClicks
        // can reconstruct the matchData without relying on a single JSON blob.
        card.setAttribute('data-match-title',  match.title);
        card.setAttribute('data-venue',        match.stadium);
        card.setAttribute('data-score',        match.score);
        card.setAttribute('data-match-date',   match.dateRaw);
        card.setAttribute('data-match-time',   match.time);
        card.setAttribute('data-match-season', match.season);
        card.setAttribute('data-goalscorers',  JSON.stringify(match.goalscorers));
        card.setAttribute('data-result',       match.result);

        card.innerHTML = `
            <div class="result-icon ${cls}"><span><i class="fas fa-${icon}"></i></span></div>
            <div class="match-body">
                <div class="match-teams">
                    <div class="home-team">${homeTeam}</div>
                    <div class="vs-divider">vs</div>
                    <div class="away-team">${awayTeam}</div>
                </div>
                <div class="match-score">${match.score}</div>
                <div class="match-details">
                    <span class="match-date"><i class="fas fa-calendar"></i> ${match.displayDate}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ── Match Sorting ─────────────────────────────────────────────────────────────

function renderSortedMatches(sortKey = 'date-asc') {
    const sorted = [...archiveMatches].sort((a, b) => {
        if (sortKey === 'date-desc') return parseDate(b.dateRaw) - parseDate(a.dateRaw);
        if (sortKey === 'date-asc')  return parseDate(a.dateRaw) - parseDate(b.dateRaw);

        // calcWinMargin / calcLossMargin replace the inline getMargin closure
        if (sortKey === 'biggest-win')
            return calcWinMargin(b)  - calcWinMargin(a)  || parseDate(b.dateRaw) - parseDate(a.dateRaw);
        if (sortKey === 'biggest-loss')
            return calcLossMargin(b) - calcLossMargin(a) || parseDate(b.dateRaw) - parseDate(a.dateRaw);

        return 0;
    });

    renderSeasonMatches(sorted);
    bindArchiveMatchClicks();

    if (!document.getElementById('archive-season-content').classList.contains('hidden')) {
        animateMatchCards('.match-card', '#archive-matches-grid');
    }
}

// ── Sortable Table Headers ────────────────────────────────────────────────────

function initSortHeaders() {
    bindSortableHeaders('#archive-players-section', '#archive-player-sort', renderArchivePlayers);
}

// ── Match Interactions ────────────────────────────────────────────────────────

/**
 * Archive cards use multiple individual data-* attributes (not a single JSON blob)
 * because the archive data structure is parsed differently from current-season data.
 * This keeps the click handler local rather than using the shared bindMatchCardClicks.
 */
function bindArchiveMatchClicks() {
    document.querySelectorAll('#archive-matches-grid .match-card').forEach(card => {
        card.style.cursor = 'pointer';

        card.addEventListener('click', () => {
            const matchDate = card.getAttribute('data-match-date') || 'TBD';
            const matchTime = card.getAttribute('data-match-time') || 'TBD';

            const dateParts   = matchDate.split(' ');
            const day         = dateParts[0] || '';
            const monthEn     = (dateParts[1] || '').toLowerCase();
            const displayDate = `${day} ${MONTH_EN_TO_NL[monthEn] || monthEn}`;

            let goalscorers = [];
            try { goalscorers = JSON.parse(card.getAttribute('data-goalscorers') || '[]'); } catch (e) {}

            const matchData = {
                title:       card.getAttribute('data-match-title') || 'Wedstrijddetails',
                stadium:     card.getAttribute('data-venue')        || 'Onbekend stadion',
                score:       card.getAttribute('data-score'),
                result:      card.getAttribute('data-result')       || null,
                season:      card.getAttribute('data-match-season') || '',
                isUpcoming:  false,
                goalscorers,
                dateTime: { date: matchDate, time: matchTime, displayDate }
            };

            if (window.matchModal) {
                window.matchModal.show(matchData, card);
            } else {
                console.error('MatchModal not initialized');
            }
        });
    });
}