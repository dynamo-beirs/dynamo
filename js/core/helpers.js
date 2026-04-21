/**
 * utils/helpers.js — Shared helpers
 *
 * Central location for constants, maps, and pure utility functions
 * used across multiple pages and components.
 */

/* Month Maps */

export const MONTH_INDEX_MAP = {
    'jan': 0, 'feb': 1, 'mar': 2, 'mrt': 2, 'apr': 3, 'may': 4, 'mei': 4,
    'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'okt': 9, 'nov': 10, 'dec': 11
};

export const MONTH_EN_TO_NL = {
    'jan': 'jan', 'feb': 'feb', 'mar': 'mrt', 'apr': 'apr', 'may': 'mei', 'jun': 'jun',
    'jul': 'jul', 'aug': 'aug', 'sep': 'sep', 'oct': 'okt', 'nov': 'nov', 'dec': 'dec'
};

/* Position Maps */

export const POSITION_CODE_MAP = {
    'GK': 'goalkeeper',
    'VER': 'defender',
    'MID': 'midfielder',
    'AAN': 'attacker'
};

export const POSITION_LABEL_MAP = {
    'goalkeeper': 'Doelman',
    'defender':   'Verdediger',
    'midfielder': 'Middenvelder',
    'attacker':   'Aanvaller'
};

export const POSITION_ICON_MAP = {
    'goalkeeper': '<i class="icon-hand-solid"></i>',
    'defender':   '<i class="icon-shield-halved-solid"></i>',
    'midfielder': '<i class="icon-person-running-solid"></i>',
    'attacker':   '<i class="icon-crosshairs-solid"></i>'
};

/* Result Helpers */

export function resultToClass(result) {
    if (result === 'winst')  return 'win';
    if (result === 'gelijk') return 'draw';
    return 'loss';
}

export function resultToIcon(cls) {
    if (cls === 'win')  return 'icon-check-solid';
    if (cls === 'draw') return 'icon-minus-solid';
    return 'icon-xmark-solid';
}

/* Date Parsing */

export function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    const [day, month, year] = dateStr.split(' ');
    const monthKey = (month || '').toLowerCase();

    return new Date(
        parseInt(year) || 2000,
        MONTH_INDEX_MAP[monthKey] ?? 0,
        parseInt(day) || 1
    );
}

/* Goalscorer Parsing */

export function parseGoalscorers(raw) {
    if (!raw || raw.trim() === '' || raw.trim() === '/') return [];

    const cleaned = raw.replace(/^["'\s]+|["'\s]+$/g, '').trim();
    if (!cleaned) return [];

    const scorers = [];
    const entries = cleaned.split(';').map(s => s.trim()).filter(Boolean);

    for (const entry of entries) {
        const m = entry.match(/^(.+?)(?:\s*\(x(\d+)\))?$/i);
        if (m) {
            const player = m[1].trim();
            const goals  = m[2] ? parseInt(m[2], 10) : 1;
            if (player) scorers.push({ player, goals });
        }
    }
    return scorers;
}

/* Match Sort Margin Helpers */

export function calcWinMargin(item) {
    const [home, away] = item.score.split('-').map(Number);
    const us  = item.isHome ? home : away;
    const opp = item.isHome ? away : home;
    return us > opp ? us - opp : us === opp ? -0.5 : -1000 - (opp - us);
}

export function calcLossMargin(item) {
    const [home, away] = item.score.split('-').map(Number);
    const us  = item.isHome ? home : away;
    const opp = item.isHome ? away : home;
    return us < opp ? opp - us : us === opp ? -0.5 : -1000 - (us - opp);
}

/* General Utilities */

export function debounce(fn, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}