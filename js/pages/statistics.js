/**
 * statistics.js — Statistics page
 *
 * Main entry point for the statistics page. Handles loading and rendering of
 * team season/all-time stats, player tables, records, toggles between views,
 * and scroll animations.
 */

/* Imports */

import { animateOnScroll } from '../core/animations.js';
import { debounce } from '../core/helpers.js';
import { PLAYER_TABLE_HEADER_HTML, sliceForTable, buildPlayerRow, appendTableToggle, bindSortableHeaders } from '../components/player-table.js';
import { fetchTeamSeasonStats, fetchTeamAllTimeStats, fetchSeasonRecords, fetchSeasonPlayers, fetchAllTimePlayers } from '../services/data-service.js';
import { FootballLoader } from '../components/loader.js';
import { initDropdown, bindDropdownClose } from '../components/dropdown.js';

/* Module State */

let seasonPlayers    = [];
let allTimePlayers   = [];
let teamSeasonStats  = {};
let teamAllTimeStats = {};
let seasonRecords    = {};
let isLoading        = false;

/* Animation Elements Registry */

const animationElements = [
    { selector: '.stat-card',         containerSelector: 'section' },
    { selector: '.record-category',   containerSelector: 'section' },
    { selector: '.scorer-row',        containerSelector: 'section' },
    { selector: '.player-row',        containerSelector: 'section' },
    { selector: '.stat-category',     containerSelector: 'section' },
    { selector: '.section-title',     containerSelector: 'section' },
    { selector: '.section-subtitle',  containerSelector: 'section' },
    { selector: '.page-hero h1',      containerSelector: 'section' },
    { selector: '.toggles-container', containerSelector: null }
];

/* Page Initialization */

document.addEventListener('DOMContentLoaded', () => {
    initToggle();
    loadStats();

    initDropdown(
        document.getElementById('season-sort'),
        (value) => renderSeasonPlayers(value)
    );
    initDropdown(
        document.getElementById('alltime-sort'),
        (value) => renderAllTimePlayers(value)
    );
    bindDropdownClose();

    const staticElements = animationElements.filter(el =>
        !['.player-row', '.scorer-row'].includes(el.selector)
    );
    animateOnScroll(staticElements);
    initRowObserver();
});

/* Data Loading */

async function loadStats() {
    isLoading = true;

    const loaders = [
        { id: 'team-season-loading',          text: 'Teamstatistieken worden geladen ...' },
        { id: 'team-season-detailed-loading', text: 'Teamstatistieken worden geladen ...' }
    ];
    const errorIds   = ['team-season-error', 'team-season-detailed-error'];
    const contentIds = ['team-season-grid', 'team-season-detailed-stats'];

    loaders.forEach(({ id, text }) => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden');
            FootballLoader.show(id, text);
        }
    });

    errorIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    contentIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));

    const teamPlayerToggle    = document.getElementById('team-player-toggle');
    const seasonAlltimeToggle = document.getElementById('season-alltime-toggle');
    [teamPlayerToggle, seasonAlltimeToggle].forEach(t => t && (t.disabled = true));
    document.querySelectorAll('.toggle-label').forEach(l => l.style.pointerEvents = 'none');

    try {
        const [sStats, atStats, records, sPlayers, atPlayers] = await Promise.all([
            fetchTeamSeasonStats(),
            fetchTeamAllTimeStats(),
            fetchSeasonRecords(),
            fetchSeasonPlayers(),
            fetchAllTimePlayers()
        ]);

        const season   = "'25-'26";
        const setTitle = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = text;
        };

        setTitle('team-season-title',        `Seizoensoverzicht ${season}`);
        setTitle('detailed-team-stats-title', `Teamstatistieken ${season}`);
        setTitle('player-season-title', `Spelersstatistieken ${season}`);

        teamSeasonStats  = sStats;
        teamAllTimeStats = atStats;
        seasonRecords    = records;
        seasonPlayers    = sPlayers;
        allTimePlayers   = atPlayers;

        renderSeasonStats();
        renderAllTimeStats();
        renderSeasonPlayers();
        renderAllTimePlayers();

        loaders.forEach(({ id }) => document.getElementById(id)?.classList.add('hidden'));
        contentIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
    } catch (error) {
        console.error('Error initializing statistics:', error);

        loaders.forEach(({ id }) => document.getElementById(id)?.classList.add('hidden'));
        errorIds.forEach(id => {
            FootballLoader.showError(id, 'Teamstatistieken konden niet worden geladen. Probeer opnieuw.');
        });
    } finally {
        isLoading = false;
        if (teamPlayerToggle)    teamPlayerToggle.disabled  = false;
        if (seasonAlltimeToggle) seasonAlltimeToggle.disabled = false;
        document.querySelectorAll('.toggle-label').forEach(l => l.style.pointerEvents = '');

        teamPlayerToggle?.dispatchEvent(new Event('change'));
    }
}

/* Stat Display Renderers */

function renderSeasonStats() {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setText('team-matches-played', teamSeasonStats.matchesPlayed || 0);
    setText('team-wins',           teamSeasonStats.wins           || 0);
    setText('team-draws',          teamSeasonStats.draws          || 0);
    setText('team-losses',         teamSeasonStats.losses         || 0);
    setText('team-goals-scored',   teamSeasonStats.goalsScored    || 0);
    setText('team-goals-conceded', teamSeasonStats.goalsConceded  || 0);

    setText('team-goals-scored-detailed',    teamSeasonStats.goalsScored            || 0);
    setText('team-goals-per-match',          (teamSeasonStats.goalsPerMatch          || 0).toFixed(2));
    setText('team-largest-win',              teamSeasonStats.largestWinScore         || '0-0');
    setText('team-goals-conceded-detailed',  teamSeasonStats.goalsConceded           || 0);
    setText('team-goals-conceded-per-match', (teamSeasonStats.goalsConcededPerMatch  || 0).toFixed(2));
    setText('team-clean-sheets',             teamSeasonStats.cleanSheets             || 0);

    const diff = teamSeasonStats.goalDifference || 0;
    setText('team-goal-difference', diff >= 0 ? `+${diff}` : diff);
    setText('team-win-rate',        `${(teamSeasonStats.winRate || 0).toFixed(0)}%`);
    setText('team-points',          teamSeasonStats.points || 0);

    animateOnScroll([
        { selector: '.stat-card',     containerSelector: 'section' },
        { selector: '.stat-category', containerSelector: 'section' }
    ]);
}

function renderAllTimeStats() {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    const setHTML = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = val;
    };
    const recHTML = (rec) => `${rec.value} <small>(${rec.season})</small>`;

    setText('team-alltime-matches-played', teamAllTimeStats.matchesPlayed     || 0);
    setText('team-alltime-wins',           teamAllTimeStats.wins              || 0);
    setText('team-alltime-draws',          teamAllTimeStats.draws             || 0);
    setText('team-alltime-losses',         teamAllTimeStats.losses            || 0);
    setText('team-alltime-goals-scored',   teamAllTimeStats.goalsScored       || 0);
    setText('team-alltime-goals-conceded', teamAllTimeStats.goalsConceded     || 0);

    setHTML('alltime-most-wins',           recHTML(seasonRecords.mostWins));
    setHTML('alltime-most-goals',          recHTML(seasonRecords.mostGoals));
    setHTML('alltime-best-goal-difference',
        `${seasonRecords.bestGoalDifference.value >= 0 ? '+' : ''}${seasonRecords.bestGoalDifference.value} <small>(${seasonRecords.bestGoalDifference.season})</small>`
    );
    setHTML('alltime-most-clean-sheets',   recHTML(seasonRecords.mostCleanSheets));

    setText('alltime-longest-win-streak',    teamAllTimeStats.longestWinStreak     || 0);
    setText('alltime-longest-unbeaten',      teamAllTimeStats.longestUnbeatenRun   || 0);
    setText('alltime-total-matches',         teamAllTimeStats.matchesPlayed        || 0);
    setText('alltime-different-goalscorers', teamAllTimeStats.differentGoalscorers || 0);

    animateOnScroll([
        { selector: '.stat-card',       containerSelector: 'section' },
        { selector: '.record-category', containerSelector: 'section' }
    ]);
}

/* Player Table Core */

function sortPlayers(players, sortBy) {
    return [...players].sort((a, b) => {
        const aRatio = a.matches === 0 ? 0 : a.goals / a.matches;
        const bRatio = b.matches === 0 ? 0 : b.goals / b.matches;

        if (sortBy === 'goals') {
            if (a.goals   !== b.goals)   return b.goals   - a.goals;
            if (aRatio    !== bRatio)     return bRatio    - aRatio;
            return a.matches !== b.matches ? b.matches - a.matches : a.name.localeCompare(b.name);
        }
        if (sortBy === 'matches') {
            if (a.matches !== b.matches) return b.matches - a.matches;
            if (a.goals   !== b.goals)   return b.goals   - a.goals;
            return aRatio !== bRatio ? bRatio - aRatio : a.name.localeCompare(b.name);
        }
        // avg-goals
        if (aRatio    !== bRatio)  return bRatio    - aRatio;
        if (a.goals   !== b.goals) return b.goals   - a.goals;
        return a.matches !== b.matches ? b.matches - a.matches : a.name.localeCompare(b.name);
    });
}

function renderPlayerTable(players, listSelector, rowClass, sortBy, tableSelector, dropdownSelector, renderFn) {
    const listEl    = document.querySelector(listSelector);
    const container = listEl?.closest('.player-stats-table, .top-scorers-table');
    if (!container) return;

    const tableId       = listSelector.replace('.', '');
    const prefix        = rowClass.split('-')[0];
    const sorted        = sortPlayers(players, sortBy);
    const listClassName = listSelector.replace('.', '');

    container.innerHTML = `${PLAYER_TABLE_HEADER_HTML}<div class="${listClassName}"></div>`;
    const newList = container.querySelector(listSelector);

    const visiblePlayers = sliceForTable(sorted, tableId, 10);

    visiblePlayers.forEach((player, index) => {
        const row = buildPlayerRow(player, index, rowClass, prefix);
        newList.appendChild(row);
    });

    appendTableToggle(container, tableId, sorted.length, 10, () => {
        renderPlayerTable(players, listSelector, rowClass, sortBy, tableSelector, dropdownSelector, renderFn);
    });

    bindSortableHeaders(tableSelector, dropdownSelector, renderFn);
}

function renderSeasonPlayers(sortBy = document.querySelector('#season-sort .selected')?.dataset.value || 'goals') {
    renderPlayerTable(
        seasonPlayers,
        '.player-stats-list',
        'player-row',
        sortBy,
        '#player-season-stats',
        '#season-sort',
        renderSeasonPlayers
    );
}

function renderAllTimePlayers(sortBy = document.querySelector('#alltime-sort .selected')?.dataset.value || 'goals') {
    renderPlayerTable(
        allTimePlayers,
        '.top-scorers-list',
        'scorer-row',
        sortBy,
        '#player-alltime-stats',
        '#alltime-sort',
        renderAllTimePlayers
    );
}

/* Toggle */

function initToggle() {
    const toggles = {
        teamPlayer:    document.getElementById('team-player-toggle'),
        seasonAlltime: document.getElementById('season-alltime-toggle')
    };
    const labels = {
        team:    document.getElementById('label-team'),
        player:  document.getElementById('label-player'),
        season:  document.getElementById('label-season'),
        alltime: document.getElementById('label-alltime')
    };
    const sections = {
        teamSeason:             document.getElementById('team-season-stats'),
        teamSeasonDetailed:     document.getElementById('team-season-detailed'),
        teamAlltimePerformance: document.getElementById('team-alltime-performance'),
        teamAlltime:            document.getElementById('team-alltime-stats'),
        playerSeason:           document.getElementById('player-season-stats'),
        playerAlltime:          document.getElementById('player-alltime-stats')
    };

    const updateView = debounce(() => {
        if (isLoading) return;

        const isPlayer  = toggles.teamPlayer?.checked;
        const isAlltime = toggles.seasonAlltime?.checked;

        labels.team?.classList.toggle('active', !isPlayer);
        labels.player?.classList.toggle('active',  isPlayer);
        labels.season?.classList.toggle('active', !isAlltime);
        labels.alltime?.classList.toggle('active', isAlltime);

        Object.values(sections).forEach(s => s?.classList.add('hidden'));
        document.body.classList.remove('team-season', 'team-alltime', 'player-season', 'player-alltime');

        document.querySelectorAll('.section-title, .section-subtitle, .stat-card, .record-category')
            .forEach(el => el.classList.remove('animate-in'));

        let toShow;
        if (!isPlayer && !isAlltime) {
            toShow = [sections.teamSeason, sections.teamSeasonDetailed];
            document.body.classList.add('team-season');
            renderSeasonStats();
        } else if (!isPlayer && isAlltime) {
            toShow = [sections.teamAlltimePerformance, sections.teamAlltime];
            document.body.classList.add('team-alltime');
            renderAllTimeStats();
        } else if (isPlayer && !isAlltime) {
            toShow = [sections.playerSeason];
            document.body.classList.add('player-season');
            renderSeasonPlayers();
        } else {
            toShow = [sections.playerAlltime];
            document.body.classList.add('player-alltime');
            renderAllTimePlayers();
        }

        toShow.forEach(s => s?.classList.remove('hidden'));

        animateOnScroll(animationElements.filter(el =>
            ['.section-title', '.section-subtitle', '.stat-card', '.record-category'].includes(el.selector)
        ));
    }, 300);

    const createLabelHandler = (toggle, desiredState) => () => {
        if (isLoading || toggle.checked === desiredState) return;
        toggle.checked = desiredState;
        toggle.dispatchEvent(new Event('change'));
    };

    labels.team?.addEventListener('click',    createLabelHandler(toggles.teamPlayer, false));
    labels.player?.addEventListener('click',  createLabelHandler(toggles.teamPlayer, true));
    labels.season?.addEventListener('click',  createLabelHandler(toggles.seasonAlltime, false));
    labels.alltime?.addEventListener('click', createLabelHandler(toggles.seasonAlltime, true));

    updateView();
    toggles.teamPlayer?.addEventListener('change', updateView);
    toggles.seasonAlltime?.addEventListener('change', updateView);
}

/* Row Animation Observer */

function initRowObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.player-stats-table, .top-scorers-table').forEach(table => {
        const mutator = new MutationObserver(() => {
            table.querySelectorAll('.player-row, .scorer-row').forEach(row => {
                if (!row.classList.contains('animate-in')) observer.observe(row);
            });
        });
        mutator.observe(table, { childList: true, subtree: true });
    });
}