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
    await window.matchModal?.init?.();
});

/* CSV parsing from database */
function parseCsvData(csvText) {
    const parsed = Papa.parse(csvText, { skipEmptyLines: true, delimiter: ',' });
    const rows = parsed.data;
    const matches = [];
    const currentDate = new Date();
    const monthNames = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

    for (let i = 2; i < rows.length; i++) {
        const opponent      = rows[i][1]?.trim();   // B
        const dateRaw       = rows[i][4]?.trim();   // E
        const time          = rows[i][5]?.trim();   // F
        const stadium       = rows[i][6]?.trim();   // G
        const homeAwayRaw   = rows[i][7]?.trim();   // H
        const goalsScored   = rows[i][8]?.trim();   // I
        const goalsConceded = rows[i][9]?.trim();   // J
        const goalscorersRaw= rows[i][10]?.trim();  // K

        if (!opponent || !dateRaw || goalsScored === undefined || goalsConceded === undefined) continue;

        /* Data Handling*/
        let displayDate = '', matchDate, season = '';
        try {
            const [day, month, year] = dateRaw.split('-').map(Number);
            matchDate = new Date(year, month - 1, day);
            if (matchDate > currentDate) continue;               // skip future matches
            displayDate = `${day} ${monthNames[month - 1]}`;
            const seasonStart = month >= 8 ? year : year - 1;
            const seasonEnd   = (seasonStart + 1) % 100;
            season = `'${seasonStart % 100}-${seasonEnd < 10 ? '0' + seasonEnd : seasonEnd}`;
        } catch (e) { console.warn(`Bad date: ${dateRaw}`); continue; }

        /* Home/Away */
        const isHome = homeAwayRaw?.toLowerCase() === 'thuis';

        /* Goalscorers */
        const goalscorers = parseGoalscorers(goalscorersRaw);

        const match = {
            title: isHome ? `Dynamo Beirs vs ${opponent}` : `${opponent} vs Dynamo Beirs`,
            opponent,
            dateTime: { date: dateRaw, time: time || '??:??', displayDate, season },
            stadium: stadium || 'Onbekend stadion',
            isHome,
            score: `${goalsScored}-${goalsConceded}`,
            result: determineResult(goalsScored, goalsConceded),
            goalscorers
        };
        matches.push(match);
    }

    matches.sort((a, b) => parseDate(b.dateTime.date) - parseDate(a.dateTime.date));
    return matches;
}

function determineResult(scored, conceded) {
    const s = parseInt(scored), c = parseInt(conceded);
    if (isNaN(s) || isNaN(c)) return 'gelijk';
    return s > c ? 'winst' : s === c ? 'gelijk' : 'verlies';
}
function parseDate(d) {
    const [day, month, year] = d.split('-').map(Number);
    return new Date(year, month - 1, day);
}

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

async function fetchAndRenderMatches() {
    const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=890518549&single=true&output=csv';
    try {
        const r = await fetch(spreadsheetUrl);
        const txt = await r.text();
        window.allMatches = parseCsvData(txt);
        renderSearchResults(window.allMatches);
        return window.allMatches;
    } catch (e) {
        console.error(e);
        const msg = document.getElementById('search-message');
        msg.textContent = 'Fout bij het laden van wedstrijden.';
        msg.classList.add('error-message');
        msg.classList.remove('hidden');
        return [];
    }
}

function renderSearchResults(matches) {
    const grid = document.getElementById('search-results-grid');
    const msg  = document.getElementById('search-message');
    grid.innerHTML = '';

    matches.forEach(m => {
        const card = document.createElement('div');
        const resCls = m.result === 'winst' ? 'win' : m.result === 'gelijk' ? 'draw' : 'loss';

        card.className = `match-card modern result`;
        card.style.cursor = 'pointer';
        card.dataset.matchTitle   = m.title;
        card.dataset.score        = m.score;
        card.dataset.matchDate    = m.dateTime.date;
        card.dataset.matchTime    = m.dateTime.time;
        card.dataset.venue        = m.stadium;
        card.dataset.season       = m.dateTime.season;
        card.dataset.isHome       = m.isHome;
        card.dataset.goalscorers  = JSON.stringify(m.goalscorers);

        const [home, away] = m.title.split(' vs ');
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
                <div class="match-score">${m.score}</div>
                <div class="match-details">
                    <span class="match-date"><i class="fas fa-calendar"></i> ${m.dateTime.displayDate}</span>
                    <span class="match-season"><i class="fas fa-trophy"></i> ${m.dateTime.season}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    msg.classList.add('hidden');
    setupCardClicks();
}

function setupCardClicks() {
    document.querySelectorAll('#search-results-grid .match-card.modern.result').forEach(card => {
        // hover effect (optional – matches the style on matches.html)
        card.addEventListener('mouseenter', () => card.classList.add('hover'));
        card.addEventListener('mouseleave', () => card.classList.remove('hover'));

        card.addEventListener('click', () => {
            const data = {
                title:      card.dataset.matchTitle,
                stadium:    card.dataset.venue,
                season:     card.dataset.season,
                dateTime: {
                    date:        card.dataset.matchDate,
                    time:        card.dataset.matchTime,
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

/* Search Functionality */
function setupSearch() {
    const input = document.getElementById('search-input');
    const list  = document.getElementById('autocomplete-list');
    const msg   = document.getElementById('search-message');

    const doSearch = q => {
        if (!window.allMatches) { msg.textContent='Fout bij laden.'; msg.classList.remove('hidden'); return; }
        const filtered = window.allMatches.filter(m => m.title.toLowerCase().includes(q.toLowerCase()));
        renderSearchResults(filtered);
    };

    const renderAC = q => {
        list.innerHTML = '';
        if (!window.allMatches || q.length < 1) { list.style.display='none'; return; }
        const uniq = [...new Set(window.allMatches.map(m=>m.opponent))];
        const hits = uniq.filter(o=>o.toLowerCase().includes(q.toLowerCase())).slice(0,5);
        if (!hits.length) { list.style.display='none'; return; }

        hits.forEach(o=>{
            const li = document.createElement('li');
            li.textContent = o;
            li.className='autocomplete-item';
            li.addEventListener('click',()=>{ input.value=o; doSearch(o); list.innerHTML=''; list.style.display='none'; });
            list.appendChild(li);
        });
        list.style.display = hits.length?'block':'none';
    };

    input.addEventListener('input', e=> { const v=e.target.value.trim(); renderAC(v); doSearch(v); });
    input.addEventListener('keypress', e=> { if(e.key==='Enter'){ doSearch(input.value.trim()); list.innerHTML=''; list.style.display='none'; }});
    document.addEventListener('click', e=>{ if(!input.contains(e.target) && !list.contains(e.target)) { list.innerHTML=''; list.style.display='none'; }});
}