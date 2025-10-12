// statistics.js
import { animateOnScroll } from './general.js';

// Season player data (loaded dynamically from CSV)
let seasonPlayers = [];
// All-time player data (loaded dynamically from CSV)
let allTimePlayers = [];
// Team season data (loaded dynamically from CSV)
let teamSeasonStats = {};
// Team all-time data (loaded dynamically from CSV)
let teamAllTimeStats = {};
// Season records data (loaded dynamically from CSV)
let seasonRecords = {};

// Function to load and parse team season stats from the Google Sheet CSV
async function loadTeamSeasonStats() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=241725037&single=true&output=csv');
        if (!response.ok) {
            throw new Error('Failed to fetch team season stats CSV');
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));

        // Expecting stats in column D (index 3), rows 51 to 67 (0-based indices 50 to 66)
        if (rows.length < 67) {
            throw new Error('Insufficient rows in team season stats CSV');
        }

        teamSeasonStats = {
            matchesPlayed: parseInt(rows[50][3]) || 0, // D51
            wins: parseInt(rows[51][3]) || 0, // D52
            draws: parseInt(rows[52][3]) || 0, // D53
            losses: Math.abs(parseInt(rows[53][3])) || 0, // D54
            goalsScored: parseInt(rows[54][3]) || 0, // D55
            goalsConceded: Math.abs(parseInt(rows[55][3])) || 0, // D56
            goalDifference: parseInt(rows[56][3]) || 0, // D57
            points: parseInt(rows[57][3]) || 0, // D58
            winRate: parseFloat(rows[58][3]) || 0, // D59 (percentage)
            goalsPerMatch: parseFloat(rows[59][3]) || 0, // D60
            goalsConcededPerMatch: Math.abs(parseFloat(rows[60][3])) || 0, // D61
            cleanSheets: parseInt(rows[61][3]) || 0, // D62
            cleanSheetsPerMatch: parseFloat(rows[62][3]) || 0, // D63
            largestWinScore: rows[63][3] || '0-0', // D64
            largestWinOpponent: rows[64][3] || 'Unknown', // D65
            largestLossScore: rows[65][3] || '0-0', // D66
            largestLossOpponent: rows[66][3] || 'Unknown' // D67
        };

        updateTeamSeasonStats();
        console.log('Loaded team season stats from CSV.');
    } catch (error) {
        console.error('Error loading team season stats:', error);
        teamSeasonStats = {};
        updateTeamSeasonStats();
    }
}

// Function to load and parse team all-time stats from the Google Sheet CSV
async function loadTeamAllTimeStats() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=1146719775&single=true&output=csv');
        if (!response.ok) {
            throw new Error('Failed to fetch team all-time stats CSV');
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));

        if (rows.length < 68) {
            throw new Error('Insufficient rows in team all-time stats CSV');
        }

        teamAllTimeStats = {
            matchesPlayed: parseInt(rows[50][3]) || 0, // D51
            wins: parseInt(rows[51][3]) || 0, // D52
            draws: parseInt(rows[52][3]) || 0, // D53
            losses: Math.abs(parseInt(rows[53][3])) || 0, // D54
            goalsScored: parseInt(rows[54][3]) || 0, // D55
            goalsConceded: Math.abs(parseInt(rows[55][3]) || 0), // D56
            goalDifference: parseInt(rows[56][3]) || 0, // D57
            points: parseInt(rows[57][3]) || 0, // D58
            pointPercentage: parseFloat(rows[58][3]) || 0, // D59
            goalsPerMatch: parseFloat(rows[59][3]) || 0, // D60
            goalsConcededPerMatch: Math.abs(parseFloat(rows[60][3])) || 0, // D61
            cleanSheets: parseInt(rows[61][3]) || 0, // D62
            cleanSheetsPerMatch: parseFloat(rows[62][3]) || 0, // D63
            longestWinStreak: parseInt(rows[63][3]) || 0, // D64
            longestUnbeatenRun: parseInt(rows[64][3]) || 0, // D65
            differentGoalscorers: parseInt(rows[67][3]) || 0 // D68
        };

        updateTeamAllTimeStats();
        console.log('Loaded team all-time stats from CSV.');
    } catch (error) {
        console.error('Error loading team all-time stats:', error);
        teamAllTimeStats = {};
        updateTeamAllTimeStats();
    }
}

// Function to load and parse season records for all-time stats from the Google Sheet CSV
async function loadSeasonRecords() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=39583142&single=true&output=csv');
        if (!response.ok) {
            throw new Error('Failed to fetch season records CSV');
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));

        // Expecting max stats in row 16 (0-based index 15) and seasons in row 18 (0-based index 17)
        if (rows.length < 18) {
            throw new Error('Insufficient rows in season records CSV');
        }

        const recordRow = rows[15]; // Row 16
        const seasonRow = rows[17]; // Row 18
        if (recordRow.length < 16 || seasonRow.length < 16) {
            throw new Error('Insufficient columns in season records CSV');
        }

        seasonRecords = {
            mostWins: {
                value: parseInt(recordRow[3]) || 0, // Column D
                season: seasonRow[3] || 'Unknown' // Column D
            },
            mostGoals: {
                value: parseInt(recordRow[6]) || 0, // Column G
                season: seasonRow[6] || 'Unknown' // Column G
            },
            bestGoalDifference: {
                value: parseInt(recordRow[8]) || 0, // Column I
                season: seasonRow[8] || 'Unknown' // Column I
            },
            mostCleanSheets: {
                value: parseInt(recordRow[13]) || 0, // Column N
                season: seasonRow[13] || 'Unknown' // Column N
            }
        };

        console.log('Season Records:', seasonRecords);
        updateTeamAllTimeStats();
        console.log('Loaded season records from CSV.');
    } catch (error) {
        console.error('Error loading season records:', error);
        seasonRecords = {
            mostWins: { value: 0, season: 'Unknown' },
            mostGoals: { value: 0, season: 'Unknown' },
            bestGoalDifference: { value: 0, season: 'Unknown' },
            mostCleanSheets: { value: 0, season: 'Unknown' }
        };
        updateTeamAllTimeStats();
    }
}

// Function to update team season stats display
function updateTeamSeasonStats() {
    document.getElementById('team-matches-played').textContent = teamSeasonStats.matchesPlayed || 0;
    document.getElementById('team-wins').textContent = teamSeasonStats.wins || 0;
    document.getElementById('team-draws').textContent = teamSeasonStats.draws || 0;
    document.getElementById('team-losses').textContent = teamSeasonStats.losses || 0;
    document.getElementById('team-goals-scored').textContent = teamSeasonStats.goalsScored || 0;
    document.getElementById('team-goals-conceded').textContent = teamSeasonStats.goalsConceded || 0;

    document.getElementById('team-goals-scored-detailed').textContent = teamSeasonStats.goalsScored || 0;
    document.getElementById('team-goals-per-match').textContent = (teamSeasonStats.goalsPerMatch || 0).toFixed(2);
    document.getElementById('team-largest-win').textContent = teamSeasonStats.largestWinScore || '0-0';

    document.getElementById('team-goals-conceded-detailed').textContent = teamSeasonStats.goalsConceded || 0;
    document.getElementById('team-goals-conceded-per-match').textContent = (teamSeasonStats.goalsConcededPerMatch || 0).toFixed(2);
    document.getElementById('team-clean-sheets').textContent = teamSeasonStats.cleanSheets || 0;

    const goalDiff = teamSeasonStats.goalDifference || 0;
    document.getElementById('team-goal-difference').textContent = goalDiff >= 0 ? `+${goalDiff}` : goalDiff;
    document.getElementById('team-win-rate').textContent = `${(teamSeasonStats.winRate || 0).toFixed(0)}%`;
    document.getElementById('team-points').textContent = teamSeasonStats.points || 0;

    animateOnScroll([
        { selector: '.stat-card', containerSelector: 'section' },
        { selector: '.stat-category', containerSelector: 'section' }
    ]);
}

// Function to update team all-time stats display
function updateTeamAllTimeStats() {
    document.getElementById('team-alltime-matches-played').textContent = teamAllTimeStats.matchesPlayed || 0;
    document.getElementById('team-alltime-wins').textContent = teamAllTimeStats.wins || 0;
    document.getElementById('team-alltime-draws').textContent = teamAllTimeStats.draws || 0;
    document.getElementById('team-alltime-losses').textContent = teamAllTimeStats.losses || 0;
    document.getElementById('team-alltime-goals-scored').textContent = teamAllTimeStats.goalsScored || 0;
    document.getElementById('team-alltime-goals-conceded').textContent = teamAllTimeStats.goalsConceded || 0;

    document.getElementById('alltime-most-wins').innerHTML = `${seasonRecords.mostWins.value} <small>(${seasonRecords.mostWins.season})</small>`;
    document.getElementById('alltime-most-goals').innerHTML = `${seasonRecords.mostGoals.value} <small>(${seasonRecords.mostGoals.season})</small>`;
    document.getElementById('alltime-best-goal-difference').innerHTML = `${seasonRecords.bestGoalDifference.value >= 0 ? '+' : ''}${seasonRecords.bestGoalDifference.value} <small>(${seasonRecords.bestGoalDifference.season})</small>`;
    document.getElementById('alltime-most-clean-sheets').innerHTML = `${seasonRecords.mostCleanSheets.value} <small>(${seasonRecords.mostCleanSheets.season})</small>`;

    document.getElementById('alltime-longest-win-streak').textContent = teamAllTimeStats.longestWinStreak || 0;
    document.getElementById('alltime-longest-unbeaten').textContent = teamAllTimeStats.longestUnbeatenRun || 0;
    document.getElementById('alltime-total-matches').textContent = teamAllTimeStats.matchesPlayed || 0;
    document.getElementById('alltime-different-goalscorers').textContent = teamAllTimeStats.differentGoalscorers || 0;

    animateOnScroll([
        { selector: '.stat-card', containerSelector: 'section' },
        { selector: '.record-category', containerSelector: 'section' }
    ]);
}

// Function to load and parse season players from the Google Sheet CSV
async function loadSeasonPlayers() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=300017481&single=true&output=csv');
        if (!response.ok) {
            throw new Error('Failed to fetch season players CSV');
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));
        const positionMap = {
            'GK': 'goalkeeper',
            'VER': 'defender',
            'MID': 'midfielder',
            'AAN': 'attacker'
        };
        const titleRows = ['keeper', 'verdedigers', 'middenvelders', 'aanvallers'];
        const players = [];
        for (let i = 0; i < Math.min(rows.length, 50); i++) {
            const row = rows[i];
            if (row.length < 31) continue;
            const name = row[1];
            const positionDutch = row[3];
            const goalsStr = row[29];
            const matchesStr = row[30];
            const ratioStr = row[31];
            if (!name || !positionDutch || !goalsStr || !matchesStr || !ratioStr) continue;
            if (titleRows.includes(name.toLowerCase())) continue;
            const goals = parseInt(goalsStr, 10);
            const matches = parseInt(matchesStr, 10);
            if (isNaN(goals) || isNaN(matches)) continue;
            const position = positionMap[positionDutch];
            if (!position) continue;
            players.push({ name, position, goals, matches });
        }
        seasonPlayers = players.sort((a, b) => b.goals - a.goals);
        updateSeasonPlayerStats();
        console.log(`Loaded ${seasonPlayers.length} season players from CSV.`);
    } catch (error) {
        console.error('Error loading season players:', error);
        seasonPlayers = [];
        updateSeasonPlayerStats();
    }
}

// Function to load and parse all-time players from the Google Sheet CSV
async function loadAllTimePlayers() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=1401992067&single=true&output=csv');
        if (!response.ok) {
            throw new Error('Failed to fetch all-time players CSV');
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));
        const positionMap = {
            'GK': 'goalkeeper',
            'VER': 'defender',
            'MID': 'midfielder',
            'AAN': 'attacker'
        };
        const titleRows = ['keeper', 'verdedigers', 'middenvelders', 'aanvallers'];
        const players = [];
        for (let i = 0; i < Math.min(rows.length, 57); i++) {
            const row = rows[i];
            if (row.length < 7) continue;
            const name = row[1];
            const positionDutch = row[2];
            const goalsStr = row[4];
            const matchesStr = row[5];
            const ratioStr = row[6];
            if (!name || !positionDutch || !goalsStr || !matchesStr || !ratioStr) continue;
            if (titleRows.includes(name.toLowerCase())) continue;
            const goals = parseInt(goalsStr, 10);
            const matches = parseInt(matchesStr, 10);
            if (isNaN(goals) || isNaN(matches) || matches <= 0) continue;
            const position = positionMap[positionDutch];
            if (!position) continue;
            players.push({ name, position, goals, matches });
        }
        allTimePlayers = players.sort((a, b) => b.goals - a.goals);
        updateAllTimePlayerStats();
        console.log(`Loaded ${allTimePlayers.length} all-time players from CSV.`);
    } catch (error) {
        console.error('Error loading all-time players:', error);
        allTimePlayers = [];
        updateAllTimePlayerStats();
    }
}

// Position icons mapping
const positionIcons = {
    all: '<i class="fas fa-users"></i>',
    goalkeeper: '<i class="fas fa-hand-paper"></i>',
    defender: '<i class="fas fa-shield-alt"></i>',
    midfielder: '<i class="fas fa-person-running"></i>',
    attacker: '<i class="fas fa-crosshairs"></i>'
};

// Define animation elements
const animationElements = [
    { selector: '.stat-card', containerSelector: 'section' },
    { selector: '.record-category', containerSelector: 'section' },
    { selector: '.scorer-row', containerSelector: 'section' },
    { selector: '.player-row', containerSelector: 'section' },
    { selector: '.stat-category', containerSelector: 'section' },
    { selector: '.section-title', containerSelector: 'section' },
    { selector: '.section-subtitle', containerSelector: 'section' },
    { selector: '.page-hero h1', containerSelector: 'section' },
    { selector: '.toggles-container', containerSelector: null }
];

// DOM initialization
document.addEventListener('DOMContentLoaded', () => {
    initToggle();
    initPlayerStats();
    initSortableHeaders();
    initCustomDropdowns();
    animateOnScroll(animationElements);
});

// Initialize player stats and team stats
function initPlayerStats() {
    loadTeamSeasonStats();
    loadTeamAllTimeStats();
    loadSeasonRecords();
    loadSeasonPlayers();
    loadAllTimePlayers();
}

// Update season player stats display
function updateSeasonPlayerStats(sortBy = document.querySelector('#season-sort .selected')?.dataset.value || 'goals') {
    const playerStatsList = document.querySelector('.player-stats-list');
    const sortedPlayers = [...seasonPlayers].sort((a, b) => {
        const aRatio = a.matches === 0 ? 0 : a.goals / a.matches;
        const bRatio = b.matches === 0 ? 0 : b.goals / b.matches;
        if (sortBy === 'goals') {
            if (a.goals !== b.goals) return b.goals - a.goals;
            if (aRatio !== bRatio) return bRatio - aRatio;
            if (a.matches !== b.matches) return b.matches - a.matches;
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'matches') {
            if (a.matches !== b.matches) return b.matches - a.matches;
            if (a.goals !== b.goals) return b.goals - a.goals;
            if (aRatio !== bRatio) return bRatio - aRatio;
            return a.name.localeCompare(b.name);
        } else {
            if (aRatio !== bRatio) return bRatio - aRatio;
            if (a.goals !== b.goals) return b.goals - a.goals;
            if (a.matches !== b.matches) return b.matches - a.matches;
            return a.name.localeCompare(b.name);
        }
    });
    playerStatsList.innerHTML = '';
    sortedPlayers.forEach((player, index) => {
        const avgGoals = player.matches === 0 ? '0.00' : (player.goals / player.matches).toFixed(2);
        const row = document.createElement('div');
        row.className = 'player-row';
        row.innerHTML = `
            <div class="table-cell player-rank">${index + 1}</div>
            <div class="table-cell player-position">${positionIcons[player.position]}</div>
            <div class="table-cell player-name">${player.name}</div>
            <div class="table-cell player-goals">${player.goals}</div>
            <div class="table-cell player-matches">${player.matches}</div>
            <div class="table-cell player-avg-goals">${avgGoals}</div>
        `;
        playerStatsList.appendChild(row);
    });
    animateOnScroll([{ selector: '.player-row', containerSelector: 'section' }]);
}

// Update all-time player stats display
function updateAllTimePlayerStats(sortBy = document.querySelector('#alltime-sort .selected')?.dataset.value || 'goals') {
    const topScorersList = document.querySelector('.top-scorers-list');
    const sortedPlayers = [...allTimePlayers].sort((a, b) => {
        const aRatio = a.goals / a.matches;
        const bRatio = b.goals / b.matches;
        if (sortBy === 'goals') {
            if (a.goals !== b.goals) return b.goals - a.goals;
            if (aRatio !== bRatio) return bRatio - aRatio;
            if (a.matches !== b.matches) return b.matches - a.matches;
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'matches') {
            if (a.matches !== b.matches) return b.matches - a.matches;
            if (a.goals !== b.goals) return b.goals - a.goals;
            if (aRatio !== bRatio) return bRatio - aRatio;
            return a.name.localeCompare(b.name);
        } else {
            if (aRatio !== bRatio) return bRatio - aRatio;
            if (a.goals !== b.goals) return b.goals - a.goals;
            if (a.matches !== b.matches) return b.matches - a.matches;
            return a.name.localeCompare(b.name);
        }
    });
    topScorersList.innerHTML = '';
    sortedPlayers.forEach((player, index) => {
        const avgGoals = (player.goals / player.matches).toFixed(2);
        const row = document.createElement('div');
        row.className = 'scorer-row';
        row.innerHTML = `
            <div class="table-cell scorer-rank">${index + 1}</div>
            <div class="table-cell scorer-position">${positionIcons[player.position]}</div>
            <div class="table-cell scorer-name">${player.name}</div>
            <div class="table-cell scorer-goals">${player.goals}</div>
            <div class="table-cell scorer-matches">${player.matches}</div>
            <div class="table-cell scorer-avg-goals">${avgGoals}</div>
        `;
        topScorersList.appendChild(row);
    });
    animateOnScroll([{ selector: '.scorer-row', containerSelector: 'section' }]);
}

// Custom dropdown initializer
function initCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const selected = dropdown.querySelector('.selected');
        const options = dropdown.querySelector('.options');
        selected.addEventListener('click', () => {
            dropdown.classList.toggle('active');
            options.style.display = options.style.display === 'block' ? 'none' : 'block';
            document.querySelectorAll('.custom-dropdown').forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    otherDropdown.classList.remove('active');
                    otherDropdown.querySelector('.options').style.display = 'none';
                }
            });
        });
        options.querySelectorAll('li').forEach(option => {
            option.addEventListener('click', () => {
                selected.textContent = option.textContent;
                selected.dataset.value = option.dataset.value;
                dropdown.classList.remove('active');
                options.style.display = 'none';
                if (dropdown.id === 'season-sort') {
                    updateSeasonPlayerStats(selected.dataset.value);
                } else if (dropdown.id === 'alltime-sort') {
                    updateAllTimePlayerStats(selected.dataset.value);
                }
            });
        });
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
                dropdown.querySelector('.options').style.display = 'none';
            });
        }
    });
}

// Keep sortable headers but hook them to custom dropdowns
function initSortableHeaders() {
    const seasonHeaderCells = document.querySelectorAll('#player-season-stats .table-header .table-cell');
    const allTimeHeaderCells = document.querySelectorAll('#player-alltime-stats .table-header .table-cell');
    seasonHeaderCells.forEach((cell, index) => {
        const key = getSortKeyFromIndex(index);
        if (key) {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', () => {
                const selected = document.querySelector('#season-sort .selected');
                if (selected) {
                    selected.dataset.value = key;
                    selected.textContent = getLabelFromKey(key);
                }
                updateSeasonPlayerStats(key);
            });
        }
    });
    allTimeHeaderCells.forEach((cell, index) => {
        const key = getSortKeyFromIndex(index);
        if (key) {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', () => {
                const selected = document.querySelector('#alltime-sort .selected');
                if (selected) {
                    selected.dataset.value = key;
                    selected.textContent = getLabelFromKey(key);
                }
                updateAllTimePlayerStats(key);
            });
        }
    });
}

function getSortKeyFromIndex(index) {
    switch (index) {
        case 3: return 'goals';
        case 4: return 'matches';
        case 5: return 'avg-goals';
        default: return null;
    }
}

function getLabelFromKey(key) {
    switch (key) {
        case 'goals': return 'Totaal Doelpunten';
        case 'matches': return 'Gespeelde Wedstrijden';
        case 'avg-goals': return 'Gemiddelde Doelpunten per Wedstrijd';
        default: return '';
    }
}

// Toggle system for team/player and season/all-time views
function initToggle() {
    const toggles = {
        teamPlayer: document.getElementById('team-player-toggle'),
        seasonAlltime: document.getElementById('season-alltime-toggle')
    };
    const labels = {
        team: document.getElementById('label-team'),
        player: document.getElementById('label-player'),
        season: document.getElementById('label-season'),
        alltime: document.getElementById('label-alltime')
    };
    const sections = {
        teamSeason: document.getElementById('team-season-stats'),
        teamSeasonDetailed: document.getElementById('team-season-detailed'),
        teamAlltimePerformance: document.getElementById('team-alltime-performance'),
        teamAlltime: document.getElementById('team-alltime-stats'),
        playerSeason: document.getElementById('player-season-stats'),
        playerAlltime: document.getElementById('player-alltime-stats')
    };
    const updateView = () => {
        const isPlayer = toggles.teamPlayer?.checked;
        const isAlltime = toggles.seasonAlltime?.checked;
        labels.team?.classList.toggle('active', !isPlayer);
        labels.player?.classList.toggle('active', isPlayer);
        labels.season?.classList.toggle('active', !isAlltime);
        labels.alltime?.classList.toggle('active', isAlltime);
        Object.values(sections).forEach(section => section?.classList.add('hidden'));
        document.body.classList.remove('team-alltime', 'player-season', 'player-alltime');
        animationElements.forEach(({ selector }) => {
            document.querySelectorAll(selector).forEach(element => {
                element.classList.remove('animate-in');
            });
        });
        let sectionsToShow;
        if (!isPlayer && !isAlltime) {
            sectionsToShow = [sections.teamSeason, sections.teamSeasonDetailed];
            document.body.classList.add('team-season');
            updateTeamSeasonStats();
        } else if (!isPlayer && isAlltime) {
            sectionsToShow = [sections.teamAlltimePerformance, sections.teamAlltime];
            document.body.classList.add('team-alltime');
            updateTeamAllTimeStats();
        } else if (isPlayer && !isAlltime) {
            sectionsToShow = [sections.playerSeason];
            document.body.classList.add('player-season');
            updateSeasonPlayerStats();
        } else {
            sectionsToShow = [sections.playerAlltime];
            document.body.classList.add('player-alltime');
            updateAllTimePlayerStats();
        }
        sectionsToShow.forEach(section => {
            if (section) {
                section.classList.remove('hidden');
            }
        });
        const pageHeroH1 = document.querySelector('.page-hero h1');
        if (pageHeroH1) {
            pageHeroH1.classList.remove('animate-in');
            setTimeout(() => {
                pageHeroH1.classList.add('animate-in');
            }, 100);
        }
        animateOnScroll(animationElements);
    };
    labels.team?.addEventListener('click', () => {
        if (toggles.teamPlayer.checked) {
            toggles.teamPlayer.checked = false;
            toggles.teamPlayer.dispatchEvent(new Event('change'));
        }
    });
    labels.player?.addEventListener('click', () => {
        if (!toggles.teamPlayer.checked) {
            toggles.teamPlayer.checked = true;
            toggles.teamPlayer.dispatchEvent(new Event('change'));
        }
    });
    labels.season?.addEventListener('click', () => {
        if (toggles.seasonAlltime.checked) {
            toggles.seasonAlltime.checked = false;
            toggles.seasonAlltime.dispatchEvent(new Event('change'));
        }
    });
    labels.alltime?.addEventListener('click', () => {
        if (!toggles.seasonAlltime.checked) {
            toggles.seasonAlltime.checked = true;
            toggles.seasonAlltime.dispatchEvent(new Event('change'));
        }
    });
    updateView();
    toggles.teamPlayer?.addEventListener('change', updateView);
    toggles.seasonAlltime?.addEventListener('change', updateView);
}