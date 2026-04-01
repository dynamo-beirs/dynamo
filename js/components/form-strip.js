/**
 * components/form-strip.js — Form strip renderer
 *
 * Renders the recent match form (last N results) as a visual strip
 * of win/draw/loss icons. Used on home and matches pages.
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