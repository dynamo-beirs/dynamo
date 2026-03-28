/**
 * utils/match-card.js
 *
 * Shared utilities for building, animating, and wiring up match cards.
 * Centralises logic that was duplicated across matches.js, search.js, archive.js.
 *
 */
import { resultToClass, resultToIcon } from '../core/helpers.js';

// ── Card HTML Builder ─────────────────────────────────────────────────────────

/**
 * Creates a result match-card DOM element (<div class="match-card result">).
 * Sets `data-match-data` as a JSON attribute so bindMatchCardClicks can read it.
 *
 * @param {Object}  match
 * @param {string}  match.title              "Home vs Away"
 * @param {string}  match.score              "2-1"
 * @param {string}  match.result             'winst'|'gelijk'|'verlies'
 * @param {Object}  match.dateTime
 * @param {string}  match.dateTime.displayDate
 * @param {string}  [match.season]           shown only when opts.showSeason is true
 * @param {Object}  [opts]
 * @param {string}  [opts.extraClass='']     extra CSS class(es) on the root element
 * @param {boolean} [opts.showSeason=false]  whether to render the season badge
 * @returns {HTMLElement}
 */
export function buildResultCard(match, { extraClass = '', showSeason = false } = {}) {
    const cls  = resultToClass(match.result);
    const icon = resultToIcon(cls);
    const [homeTeam, awayTeam] = match.title.split(' vs ');

    const card = document.createElement('div');
    card.className    = `match-card result${extraClass ? ' ' + extraClass : ''}`;
    card.style.cursor = 'pointer';
    card.setAttribute('data-match-data', JSON.stringify(match));

    card.innerHTML = `
        <div class="result-icon ${cls}">
            <span><i class="fas fa-${icon}"></i></span>
        </div>
        <div class="match-body">
            <div class="match-teams">
                <div class="home-team">${homeTeam}</div>
                <div class="vs-divider">vs</div>
                <div class="away-team">${awayTeam}</div>
            </div>
            <div class="match-score">${match.score}</div>
            <div class="match-details">
                <span class="match-date">
                    <i class="fas fa-calendar"></i> ${match.dateTime.displayDate}
                </span>
                ${showSeason && match.season
        ? `<span class="match-season"><i class="fas fa-trophy"></i> ${match.season}</span>`
        : ''}
            </div>
        </div>
    `;

    return card;
}

// ── Card Stagger Animation ────────────────────────────────────────────────────

// Replace the per-call observer with a module-level singleton
let _matchCardObserver = null;

/**
 * Stagger-reveals match cards as they enter the viewport using IntersectionObserver.
 * Cards within the same container receive incremental delay based on their index.
 *
 * @param {string} cardSelector       CSS selector for the cards to observe.
 * Defaults to '.match-card'.
 * @param {string|null} containerSelector  Used with `.closest()` inside the observer
 * to scope the stagger index calculation.
 * Pass null to use the card's direct parentElement.
 */
export function animateMatchCards(
    cardSelector      = '.match-card',
    containerSelector = null
) {
    if (_matchCardObserver) {
        _matchCardObserver.disconnect();
        _matchCardObserver = null;
    }

    _matchCardObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const container = containerSelector
                ? (entry.target.closest(containerSelector) || entry.target.parentElement)
                : entry.target.parentElement;

            const items = Array.from(container.querySelectorAll(cardSelector));
            const index = items.indexOf(entry.target);

            setTimeout(() => entry.target.classList.add('animate-in'), index * 30);
            obs.unobserve(entry.target);
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    document.querySelectorAll(`${cardSelector}:not(.animate-in)`)
        .forEach(card => _matchCardObserver.observe(card));
}

// ── Card Click Binding ────────────────────────────────────────────────────────

/**
 * Attaches a click listener to every element matching `selector` that reads
 * `data-match-data` (JSON) and calls `window.matchModal.show(matchData, card)`.
 *
 * @param {string}       selector    CSS selector scoped to the relevant grid.
 * @param {boolean|null} [isUpcoming=null]
 *   - true/false: forces the isUpcoming flag for every card.
 *   - null (default): auto-detects — cards WITHOUT the 'result' class are upcoming.
 */
export function bindMatchCardClicks(selector, isUpcoming = null) {
    document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('click', () => {
            const raw = card.getAttribute('data-match-data');
            if (!raw) return;
            try {
                const matchData    = JSON.parse(raw);
                matchData.isUpcoming = isUpcoming !== null
                    ? isUpcoming
                    : !card.classList.contains('result');
                window.matchModal?.show(matchData, card);
            } catch (err) {
                console.warn('Failed to parse match data:', err);
            }
        });
    });
}