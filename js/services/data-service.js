/**
 * services/data-service.js
 * All data-fetching and CSV-parsing logic.
 */
import { fetchCsvCached } from './fetch-csv.js';
import { MONTH_EN_TO_NL, parseDate, parseGoalscorers, POSITION_CODE_MAP } from '../core/helpers.js';

export const gsap             = window.gsap;
export const Draggable        = window.Draggable;
export const MotionPathPlugin = window.MotionPathPlugin;

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR';

// ── Internal Constants ────────────────────────────────────────────────────────

/** Row labels that represent section headings, not player data. */
const TITLE_ROWS = new Set(['keeper', 'verdedigers', 'middenvelders', 'aanvallers']);

const DUTCH_MONTH_NAMES = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

const NATIONALITY_MAP = {
    'BEL': { name: 'Belgium',     flagSrc: '../img/icons/flags/belgium.svg' },
    'NLD': { name: 'Netherlands', flagSrc: '../img/icons/flags/netherlands.svg' }
};

const POSITION_RANK = {
    'goalkeeper': 1, 'defender': 2, 'midfielder': 3, 'attacker': 4
};

// ── Sheet URLs ────────────────────────────────────────────────────────────────

export const SHEET_URLS = {
    currentSeason:   `${BASE_URL}/pub?gid=300017481&single=true&output=csv`,
    teamSeasonStats: `${BASE_URL}/pub?gid=241725037&single=true&output=csv`,
    teamAllTime:     `${BASE_URL}/pub?gid=1146719775&single=true&output=csv`,
    allTimePlayers:  `${BASE_URL}/pub?gid=1401992067&single=true&output=csv`,
    seasonRecords:   `${BASE_URL}/pub?gid=39583142&single=true&output=csv`,
    searchAll:       `${BASE_URL}/pub?gid=890518549&single=true&output=csv`,
    season2425:      `${BASE_URL}/pub?gid=560088310&single=true&output=csv`,
    season2324:      `${BASE_URL}/pub?gid=183840910&single=true&output=csv`,
    season2223:      `${BASE_URL}/pub?gid=49161181&single=true&output=csv`,
    season2122:      `${BASE_URL}/pub?gid=1020713465&single=true&output=csv`,
};

// ── Current Season Layout ─────────────────────────────────────────────────────

export const CURRENT_SEASON_LAYOUT = {
    matchCols: { first: 5, last: 26 },
    rows: {
        opponent: 1, date: 2, time: 3, stadium: 4, homeAway: 5,
        result: 73, goalsFor: 74, goalsAgainst: 75, goalscorers: 77,
        sponsorName: 84, sponsorLogo: 85, sponsorUrl: 86,
    },
    form: { row: 82, startCol: 28, count: 5 }
};

/**
 * Wraps the third-party CSV parser so consumers don't need to know about it.
 */
export function parseCsv(csvText, options = {}) {
    return window.Papa.parse(csvText, { delimiter: ',', ...options });
}

// ── 0. Current Season Matches (home.js & matches.js) ─────────────────────────

export async function fetchCurrentSeasonMatches() {
    const csvText = await fetchCsvCached(SHEET_URLS.currentSeason);
    return parseMatchesCsv(csvText, CURRENT_SEASON_LAYOUT);
}

function parseMatchesCsv(csvText, layout) {
    const parsed  = parseCsv(csvText, { skipEmptyLines: true});
    const rows    = parsed.data;
    const matches = { upcoming: [], past: [], all: [], form: [] };

    for (let colIdx = layout.matchCols.first; colIdx <= layout.matchCols.last; colIdx++) {
        const opponent = rows[layout.rows.opponent]?.[colIdx]?.trim();
        const date     = rows[layout.rows.date]?.[colIdx]?.trim();
        const time     = rows[layout.rows.time]?.[colIdx]?.trim();
        const stadium  = rows[layout.rows.stadium]?.[colIdx]?.trim();
        const homeAway = rows[layout.rows.homeAway]?.[colIdx]?.trim().toLowerCase();

        if (!opponent || !date || !time || !stadium || !homeAway) continue;

        const isHome = homeAway === 'thuis';
        const title  = isHome ? `Dynamo Beirs vs ${opponent}` : `${opponent} vs Dynamo Beirs`;
        const result = rows[layout.rows.result]?.[colIdx]?.trim().toLowerCase();

        const sponsorName = rows[layout.rows.sponsorName]?.[colIdx]?.trim();
        const sponsorLogo = rows[layout.rows.sponsorLogo]?.[colIdx]?.trim();
        const sponsorUrl  = rows[layout.rows.sponsorUrl]?.[colIdx]?.trim();
        const hasSponsor  = sponsorName
            && !sponsorName.toLowerCase().includes('beschikbaar')
            && sponsorLogo && sponsorUrl;

        const dateParts  = date.split(' ');
        const monthEn    = dateParts[1]?.toLowerCase();
        const monthDutch = MONTH_EN_TO_NL[monthEn] || monthEn;
        const displayDate = `${dateParts[0]} ${monthDutch}`;

        const match = {
            title,
            dateTime: { date, time, displayDate },
            season: '2025-2026',
            stadium,
            isHome,
            sponsor: hasSponsor ? { name: sponsorName, logo: sponsorLogo, url: sponsorUrl } : null
        };

        if (result) {
            const goalsScoredRaw  = rows[layout.rows.goalsFor]?.[colIdx]?.trim();
            const goalsConcededRaw = rows[layout.rows.goalsAgainst]?.[colIdx]?.trim();
            const goalsScored   = isHome ? goalsScoredRaw  : goalsConcededRaw;
            const goalsConceded = isHome ? goalsConcededRaw : goalsScoredRaw;

            match.score       = `${goalsScored}-${goalsConceded}`;
            match.result      = result;
            match.goalscorers = parseGoalscorers(rows[layout.rows.goalscorers]?.[colIdx]?.trim());
            matches.past.push(match);
        } else {
            matches.upcoming.push(match);
        }
        matches.all.push(match);
    }

    const sortByDate = (a, b) => parseDate(a.dateTime.date) - parseDate(b.dateTime.date);
    matches.all.sort(sortByDate);
    matches.past.sort(sortByDate);
    matches.upcoming.sort(sortByDate);

    const resultMap = { 'w': 'winst', 'd': 'gelijk', 'l': 'verlies' };
    for (let i = 0; i < layout.form.count; i++) {
        const cell = rows[layout.form.row]?.[layout.form.startCol + i]?.trim().toLowerCase();
        if (cell && resultMap[cell]) matches.form.push(resultMap[cell]);
    }

    return matches;
}

// ── 1. Team Stats & Records (statistics.js & home.js) ────────────────────────

export async function fetchTeamSeasonStats() {
    const csvText = await fetchCsvCached(SHEET_URLS.teamSeasonStats);
    const rows    = csvText.split('\n').map(row => row.split(',').map(c => c.trim().replace(/"/g, '')));
    if (rows.length < 67) throw new Error('Insufficient rows in team season stats CSV');

    return {
        matchesPlayed:         parseInt(rows[50][3])  || 0,
        wins:                  parseInt(rows[51][3])  || 0,
        draws:                 parseInt(rows[52][3])  || 0,
        losses:          Math.abs(parseInt(rows[53][3]))  || 0,
        goalsScored:           parseInt(rows[54][3])  || 0,
        goalsConceded:   Math.abs(parseInt(rows[55][3]))  || 0,
        goalDifference:        parseInt(rows[56][3])  || 0,
        points:                parseInt(rows[57][3])  || 0,
        winRate:           parseFloat(rows[58][3])    || 0,
        goalsPerMatch:     parseFloat(rows[59][3])    || 0,
        goalsConcededPerMatch: Math.abs(parseFloat(rows[60][3])) || 0,
        cleanSheets:           parseInt(rows[61][3])  || 0,
        cleanSheetsPerMatch:   parseFloat(rows[62][3]) || 0,
        largestWinScore:       rows[63][3]             || '0-0',
        largestWinOpponent:    rows[64][3]             || 'Unknown',
        largestLossScore:      rows[65][3]             || '0-0',
        largestLossOpponent:   rows[66][3]             || 'Unknown'
    };
}

export async function fetchTeamAllTimeStats() {
    const csvText = await fetchCsvCached(SHEET_URLS.teamAllTime);
    const rows    = csvText.split('\n').map(row => row.split(',').map(c => c.trim().replace(/"/g, '')));
    if (rows.length < 68) throw new Error('Insufficient rows in team all-time stats CSV');

    return {
        matchesPlayed:            parseInt(rows[50][3])  || 0,
        wins:                     parseInt(rows[51][3])  || 0,
        draws:                    parseInt(rows[52][3])  || 0,
        losses:             Math.abs(parseInt(rows[53][3]))  || 0,
        goalsScored:              parseInt(rows[54][3])  || 0,
        goalsConceded:      Math.abs(parseInt(rows[55][3]))  || 0,
        goalDifference:           parseInt(rows[56][3])  || 0,
        points:                   parseInt(rows[57][3])  || 0,
        pointPercentage:      parseFloat(rows[58][3])    || 0,
        goalsPerMatch:        parseFloat(rows[59][3])    || 0,
        goalsConcededPerMatch: Math.abs(parseFloat(rows[60][3])) || 0,
        cleanSheets:              parseInt(rows[61][3])  || 0,
        cleanSheetsPerMatch:  parseFloat(rows[62][3])    || 0,
        longestWinStreak:         parseInt(rows[63][3])  || 0,
        longestUnbeatenRun:       parseInt(rows[64][3])  || 0,
        differentGoalscorers:     parseInt(rows[67][3])  || 0
    };
}

export async function fetchSeasonRecords() {
    const csvText = await fetchCsvCached(SHEET_URLS.seasonRecords);
    const rows    = csvText.split('\n').map(row => row.split(',').map(c => c.trim().replace(/"/g, '')));
    if (rows.length < 18) throw new Error('Insufficient rows in season records CSV');

    const recordRow = rows[15];
    const seasonRow = rows[17];

    return {
        mostWins:            { value: parseInt(recordRow[3])  || 0, season: seasonRow[3]  || 'Unknown' },
        mostGoals:           { value: parseInt(recordRow[6])  || 0, season: seasonRow[6]  || 'Unknown' },
        bestGoalDifference:  { value: parseInt(recordRow[8])  || 0, season: seasonRow[8]  || 'Unknown' },
        mostCleanSheets:     { value: parseInt(recordRow[13]) || 0, season: seasonRow[13] || 'Unknown' }
    };
}

// ── 2. Players (players.js & statistics.js) ───────────────────────────────────

export async function fetchSeasonPlayers(detailed = false) {
    const csvText = await fetchCsvCached(SHEET_URLS.currentSeason);
    const rows    = csvText.split('\n').map(row => row.split(',').map(c => c.trim().replace(/"/g, '')));
    const players = [];

    const today    = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;

    for (let i = 4; i < Math.min(rows.length, 50); i++) {
        const row  = rows[i];
        if (row.length < 31) continue;

        const name         = row[1];
        const positionCode = row[3];
        const goals        = parseInt(row[29], 10);
        const matches      = parseInt(row[30], 10);

        if (!name || name === '/' || name === '\\' || TITLE_ROWS.has(name.toLowerCase())) continue;

        const position = POSITION_CODE_MAP[positionCode.toUpperCase()] || POSITION_CODE_MAP[positionCode];
        if (!position || isNaN(goals) || isNaN(matches)) continue;

        const playerObj = { name, position, goals, matches };

        if (detailed) {
            const nationalityCode = row[2];
            const nationality     = NATIONALITY_MAP[nationalityCode?.toUpperCase()]
                || { name: 'Unknown', flagSrc: '../img/icons/flags/belgium.svg' };

            playerObj.nationality     = nationality.name;
            playerObj.flagSrc         = nationality.flagSrc;
            playerObj.gamesThisSeason = matches;
            playerObj.gamesTotal      = parseInt(row[40], 10) || 0;
            playerObj.goalsThisSeason = goals;
            playerObj.goalsTotal      = parseInt(row[39], 10) || 0;
            playerObj.isBirthday      = row[36]?.trim() === todayStr;
        }

        players.push(playerObj);
    }

    if (detailed) {
        return players.sort((a, b) => {
            const rankA = POSITION_RANK[a.position] || 99;
            const rankB = POSITION_RANK[b.position] || 99;
            if (rankA !== rankB)      return rankA - rankB;
            if (a.matches !== b.matches) return b.matches - a.matches;
            if (a.goals   !== b.goals)   return b.goals   - a.goals;
            return a.name.localeCompare(b.name);
        });
    }

    return players.sort((a, b) => b.goals - a.goals);
}

export async function fetchAllTimePlayers() {
    const csvText = await fetchCsvCached(SHEET_URLS.allTimePlayers);
    const rows    = csvText.split('\n').map(row => row.split(',').map(c => c.trim().replace(/"/g, '')));
    const players = [];

    for (let i = 0; i < Math.min(rows.length, 57); i++) {
        const row  = rows[i];
        if (row.length < 7) continue;

        const name         = row[1];
        const positionCode = row[2];
        const goals        = parseInt(row[4], 10);
        const matches      = parseInt(row[5], 10);

        if (!name || TITLE_ROWS.has(name.toLowerCase())) continue;
        const position = POSITION_CODE_MAP[positionCode];
        if (!position || isNaN(goals) || isNaN(matches) || matches <= 0) continue;

        players.push({ name, position, goals, matches });
    }
    return players.sort((a, b) => b.goals - a.goals);
}

// ── 3. Search Matches (search.js) ─────────────────────────────────────────────

export async function fetchSearchMatches() {
    const csvText   = await fetchCsvCached(SHEET_URLS.searchAll);
    const parsed  = parseCsv(csvText, { skipEmptyLines: true});
    const rows      = parsed.data;
    const matches   = [];
    const now       = new Date();

    for (let i = 2; i < rows.length; i++) {
        const opponent        = rows[i][1]?.trim();
        const dateRaw         = rows[i][4]?.trim();
        const time            = rows[i][5]?.trim();
        const stadium         = rows[i][6]?.trim();
        const homeAwayRaw     = rows[i][7]?.trim();
        const goalsScored     = rows[i][8]?.trim();
        const goalsConceded   = rows[i][9]?.trim();
        const goalscorersRaw  = rows[i][10]?.trim();

        if (!opponent || !dateRaw || goalsScored === undefined || goalsConceded === undefined) continue;

        let displayDate = '', season = 'Onbekend seizoen';
        try {
            const [day, month, year] = dateRaw.split('-').map(Number);
            if (new Date(year, month - 1, day) > now) continue;

            displayDate = `${day} ${DUTCH_MONTH_NAMES[month - 1]}`;

            const seasonStart = month >= 8 ? year : year - 1;
            season = `${seasonStart}-${seasonStart + 1}`;
        } catch (e) {
            console.warn('Failed to parse date/season for match:', opponent, dateRaw);
        }

        const isHome = homeAwayRaw?.toLowerCase() === 'thuis';
        const s = parseInt(goalsScored), c = parseInt(goalsConceded);

        matches.push({
            title:        isHome ? `Dynamo Beirs vs ${opponent}` : `${opponent} vs Dynamo Beirs`,
            opponent,
            dateTime: { date: dateRaw, time: time || '??:??', displayDate },
            season,
            stadium:      stadium || 'Onbekend stadion',
            isHome,
            score:        isHome ? `${goalsScored}-${goalsConceded}` : `${goalsConceded}-${goalsScored}`,
            result:       isNaN(s) || isNaN(c) ? 'gelijk' : (s > c ? 'winst' : s === c ? 'gelijk' : 'verlies'),
            goalscorers:  parseGoalscorers(goalscorersRaw)
        });
    }

    return matches.sort((a, b) => parseDDMMYYYY(b.dateTime.date) - parseDDMMYYYY(a.dateTime.date));
}

/**
 * Parses a "DD-MM-YYYY" date string into a numeric timestamp.
 * Exported so search.js can import it instead of maintaining its own duplicate.
 *
 * Previously a private function named `parseSearchDate` in this file AND an
 * identical copy named `parseSearchDate` in search.js — both are replaced by
 * this single exported version.
 */
export function parseDDMMYYYY(d) {
    if (!d) return 0;
    const parts = d.split('-');
    return parts.length === 3
        ? new Date(parts[2], parts[1] - 1, parts[0]).getTime()
        : 0;
}
