/**
 * matches.js — Matches page
 *
 * Handles loading and rendering of all matches data (upcoming, recent, timeline, form).
 * Includes sponsor ticker, countdown, scroll animations, and click interactions.
 */

/* Imports */

import { animateOnScroll } from '../core/animations.js';
import { initCountdown, setCountdownData } from '../components/countdown.js';
import { renderForm } from '../components/form-strip.js';
import { fetchCurrentSeasonMatches } from '../services/data-service.js';
import { FootballLoader } from '../components/loader.js';
import { resultToClass, resultToIcon } from '../core/helpers.js';
import { buildResultCard, animateMatchCards, bindMatchCardClicks } from '../components/match-card.js';

/* Animation Elements Registry */

const animationElements = [
    { selector: '.match-card',          containerSelector: 'section' },
    { selector: '.timeline',            containerSelector: 'section' },
    { selector: '.timeline-item',       containerSelector: ['section', '.container'] },
    { selector: '.timeline-start-knob', containerSelector: '.timeline-wrapper' },
    { selector: '.countdown-block',     containerSelector: null },
    { selector: '#home-match-sponsor',  containerSelector: null },
    { selector: '.form-result',         containerSelector: null },
    { selector: '.section-title',       containerSelector: 'section' },
    { selector: '.section-subtitle',    containerSelector: 'section' },
    { selector: '.page-hero h1',        containerSelector: 'section' },
    { selector: '.upcoming-match-name', containerSelector: null },
    { selector: '.form-description',    containerSelector: null }
];

/* Page Initialization */

document.addEventListener('DOMContentLoaded', async () => {
    await loadMatches();
    animateOnScroll(animationElements);
    scrollTimelineToEnd();
});

/* Data Loading */

async function loadMatches() {
    const loaderId = 'matches-global-loader';
    const errorId  = 'matches-error';
    const loaderEl = document.getElementById(loaderId);
    const knob     = document.querySelector('.timeline-start-knob');

    if (loaderEl) {
        loaderEl.classList.remove('hidden');
        FootballLoader.show(loaderId, 'Wedstrijden worden geladen ...');
    }

    if (knob) knob.style.opacity = '0';

    // Fade out sections while loading
    document.querySelectorAll('.matches-grid, #form-results, #season-timeline').forEach(el => {
        el.style.opacity   = '0';
        el.style.transition = 'opacity 0.4s ease';
    });

    try {
        const matches = await fetchCurrentSeasonMatches();

        renderUpcomingMatches(matches.upcoming);
        renderRecentMatches(matches.past);
        renderSeasonTimeline(matches.all);
        renderForm(matches.form);
        renderSponsorsTicker(matches.all);
        setCountdownData(matches.upcoming);

        // Wire up interactions
        bindMatchCardClicks('.match-card');
        bindTimelineItemClicks();

        if (loaderEl) loaderEl.classList.add('hidden');

        // Fade in sections
        document.querySelectorAll('.matches-grid, #form-results, #season-timeline').forEach(el => {
            el.style.opacity = '1';
        });

        if (knob) knob.style.opacity = '';

        animateMatchCards('.match-card', 'section');
        initCountdown();
        scrollTimelineToEnd();

    } catch (error) {
        console.error('Error fetching or parsing matches:', error);

        if (loaderEl) loaderEl.classList.add('hidden');
        FootballLoader.showError(errorId, 'Wedstrijden konden niet worden geladen. Probeer opnieuw.');

        const titleEl     = document.getElementById('next-match-title');
        const countdownEl = document.getElementById('countdown');
        if (titleEl && countdownEl) {
            titleEl.textContent       = 'Geen wedstrijden beschikbaar.';
            countdownEl.style.display = 'none';
        }
    }
}

/* Rendering */

function renderUpcomingMatches(upcomingMatches) {
    const grid = document.getElementById('upcoming-matches-grid');
    grid.innerHTML = '';

    if (upcomingMatches.length === 0) {
        grid.classList.add('no-matches');
        const wrapper = document.createElement('div');
        wrapper.className = 'upcoming-match-name';
        const heading = document.createElement('h3');
        heading.textContent = 'Geen wedstrijden gepland in de nabije toekomst.';
        wrapper.appendChild(heading);
        grid.appendChild(wrapper);
        setTimeout(() => wrapper.classList.add('animate-in'), 100);
        return;
    }

    grid.classList.remove('no-matches');

    upcomingMatches.slice(0, 6).forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.setAttribute('data-match-data', JSON.stringify(match));

        const [homeTeam, awayTeam] = match.title.split(' vs ');

        card.innerHTML = `
            <span class="result-icon"><i class="fas fa-hourglass-half"></i></span>
            <div class="match-body">
                <div class="match-teams">
                    <div class="home-team">${homeTeam}</div>
                    <div class="vs-divider">vs</div>
                    <div class="away-team">${awayTeam}</div>
                </div>
                <div class="match-score">${match.dateTime.displayDate} — ${match.dateTime.time}</div>
                <div class="match-details">
                    <div class="match-venue"><i class="fas fa-map-marker-alt"></i> ${match.stadium}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderRecentMatches(pastMatches) {
    const grid = document.getElementById('recent-matches-grid');
    grid.innerHTML = '';

    if (pastMatches.length === 0) {
        grid.classList.add('no-matches');
        const wrapper = document.createElement('div');
        wrapper.className = 'upcoming-match-name';
        const heading = document.createElement('h3');
        heading.textContent = 'Geen recente wedstrijden beschikbaar.';
        wrapper.appendChild(heading);
        grid.appendChild(wrapper);
        setTimeout(() => wrapper.classList.add('animate-in'), 100);
        return;
    }

    grid.classList.remove('no-matches');

    // buildResultCard handles result styling and data attributes
    [...pastMatches].reverse().slice(0, 6).forEach(match => {
        grid.appendChild(buildResultCard(match));
    });
}

function renderSeasonTimeline(matches) {
    const timeline = document.getElementById('season-timeline');
    timeline.innerHTML = '';

    matches.filter(m => m.result).forEach((match, index) => {
        const cls  = resultToClass(match.result);
        const icon = resultToIcon(cls);

        const item = document.createElement('div');
        item.className = `timeline-item ${cls}`;
        item.setAttribute('data-match', `match${index + 1}`);
        item.setAttribute('data-match-data', JSON.stringify(match));
        item.innerHTML = `
            <span class="result-icon"><i class="fas fa-${icon}"></i></span>
            <small>${match.dateTime.displayDate}</small>
        `;
        timeline.appendChild(item);
    });
}

function renderSponsorsTicker(allMatches) {
    const track   = document.getElementById('sponsor-ticker-track');
    const wrapper = document.getElementById('sponsor-ticker-wrapper');
    if (!track || !wrapper) return;

    track.innerHTML = '';

    const uniqueSponsors = new Map();
    allMatches.forEach(match => {
        if (match.sponsor?.name && match.sponsor?.logo && !uniqueSponsors.has(match.sponsor.name)) {
            uniqueSponsors.set(match.sponsor.name, match.sponsor);
        }
    });

    if (uniqueSponsors.size === 0) {
        const section = document.querySelector('.ticker-section');
        if (section) section.style.display = 'none';
        return;
    }

    const sponsorHTML = sponsor => `
        <a href="${sponsor.url}" target="_blank" rel="noopener" class="sponsor-item" title="${sponsor.name}">
            <img src="${sponsor.logo}" alt="${sponsor.name}" class="sponsor-logo" loading="lazy">
        </a>
    `;

    let logosHTML = '';
    uniqueSponsors.forEach(sponsor => { logosHTML += sponsorHTML(sponsor); });
    track.innerHTML = logosHTML;

    const images      = track.querySelectorAll('img');
    let imagesLoaded  = 0;
    const totalImages = images.length;

    const startTicker = () => {
        requestAnimationFrame(() => {
            const trackWidth   = track.scrollWidth;
            const wrapperWidth = wrapper.offsetWidth;
            const needsScroll  = trackWidth > wrapperWidth * 0.7;
            const needsDouble  = needsScroll && (trackWidth < wrapperWidth * 2);

            track.classList.remove('centered', 'scrolling');

            if (needsScroll) {
                if (needsDouble) track.innerHTML += logosHTML;
                track.innerHTML += logosHTML;
                track.classList.add('scrolling');
            } else {
                track.classList.add('centered');
            }
        });
    };

    if (totalImages === 0) {
        startTicker();
        return;
    }

    images.forEach(img => {
        if (img.complete) {
            imagesLoaded++;
        } else {
            img.addEventListener('load',  () => { if (++imagesLoaded === totalImages) startTicker(); });
            img.addEventListener('error', () => { if (++imagesLoaded === totalImages) startTicker(); });
        }
    });

    if (imagesLoaded === totalImages) startTicker();
}

/* Interactions */

function bindTimelineItemClicks() {
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', () => {
            const raw = item.getAttribute('data-match-data');
            let matchData;

            try {
                matchData = JSON.parse(raw);
                if (matchData.season) {
                    matchData.season = matchData.season.replace(/^20(\d{2})-20(\d{2})$/, "'$1-'$2");
                }
            } catch (err) {
                matchData = {
                    title:       `Match ${item.dataset.match}`,
                    dateTime:    { date: item.querySelector('small')?.textContent || 'TBD', time: 'TBD' },
                    season:      "'25-'26",
                    stadium:     'Onbekend Stadion',
                    score:       null,
                    goalscorers: []
                };
            }

            matchData.isUpcoming = !matchData.score;
            window.matchModal?.show(matchData, item);
        });
    });
}

function scrollTimelineToEnd() {
    const wrapper = document.querySelector('.timeline-wrapper');
    if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
}