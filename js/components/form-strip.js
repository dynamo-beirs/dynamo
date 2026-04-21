/**
 * components/form-strip.js — Form strip renderer
 *
 * Renders the recent match form (last N results) as a visual strip
 * of win/draw/loss icons. Now clickable to open the match modal.
 */

import {resultToIcon} from "../core/helpers.js";

export function renderForm(formMatches) {
    const formResults = document.getElementById('form-results');
    if (!formResults) return;

    formResults.innerHTML = '';

    // formMatches should be an array of full match objects
    formMatches.forEach(match => {
        const span     = document.createElement('span');
        const result   = match.result; // 'winst', 'gelijk', or 'verlies'
        const cls      = result === 'winst' ? 'win' : result === 'gelijk' ? 'draw' : 'loss';
        const iconClass = resultToIcon(cls);

        span.className = `form-result ${cls}`;
        span.innerHTML = `<i class="${iconClass}"></i>`;
        span.setAttribute('data-tooltip', `${match.title} (${match.score})`);

        // Bind the modal click event
        span.addEventListener('click', () => {
            // Ensure isUpcoming is false so the score/goalscorers display properly
            match.isUpcoming = false;

            if (window.matchModal) {
                window.matchModal.show(match, span);
            } else {
                console.warn('MatchModal niet gevonden!');
            }
        });

        formResults.appendChild(span);
    });
}