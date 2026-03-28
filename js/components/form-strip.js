/**
 * components/form-strip.js
 * Renders the recent-form strip (last N results) into #form-results.
 * Extracted from general.js — this has no relation to the countdown logic
 * and is its own standalone DOM renderer.
 */

/**
 * Renders the recent-form strip into `#form-results`.
 * Shared by home.js (home.js) and matches.js.
 *
 * @param {string[]} form - Array of Dutch result strings: 'winst' | 'gelijk' | 'verlies'
 */
export function renderForm(form) {
    const formResults = document.getElementById('form-results');
    if (!formResults) return;
    formResults.innerHTML = '';

    form.forEach(result => {
        const span     = document.createElement('span');
        const cls      = result === 'winst' ? 'win' : result === 'gelijk' ? 'draw' : 'loss';
        const icon     = cls === 'win' ? 'check' : cls === 'draw' ? 'minus' : 'times';
        span.className = `form-result ${cls}`;
        span.innerHTML = `<i class="fas fa-${icon}"></i>`;
        formResults.appendChild(span);
    });
}