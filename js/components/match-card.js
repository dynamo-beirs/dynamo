/**
 * components/match-card.js — Match card component
 *
 * Shared logic for building result match cards, staggering their animations,
 * and binding click handlers to open the match modal.
 */

import { resultToClass, resultToIcon } from '../core/helpers.js';

/* Card HTML Builder */

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

/* Card Stagger Animation */

let _matchCardObserver = null;

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

/* Card Click Binding */

export function bindMatchCardClicks(selector, isUpcoming = null) {
    document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('click', () => {
            const raw = card.getAttribute('data-match-data');
            if (!raw) return;

            try {
                const matchData = JSON.parse(raw);
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