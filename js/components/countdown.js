/**
 * components/countdown.js — Countdown timer
 *
 * Manages the countdown to the next upcoming match and updates
 * related DOM elements (#countdown, #next-match-title, #home-match-sponsor).
 * Shares internal state between initCountdown and setCountdownData.
 */

import { MONTH_INDEX_MAP } from '../core/helpers.js';

/* Internal Module State */

let _upcomingMatches = [];
let _countdownInterval = null;

/* Countdown Timer */

export function initCountdown() {
    const countdownEl  = document.getElementById('countdown');
    const titleEl      = document.getElementById('next-match-title');
    const sponsorBlock = document.getElementById('home-match-sponsor');
    const sponsorLink  = document.getElementById('home-sponsor-link');
    const sponsorLogo  = document.getElementById('home-sponsor-logo');

    if (!countdownEl || !titleEl) return;

    const upcomingMatches = _upcomingMatches;

    const parseMatchDateTime = (matchDate, matchTime) => {
        if (!matchDate || !matchTime) return NaN;
        const dateParts = matchDate.split(' ');
        if (dateParts.length < 3) return NaN;

        const timeParts = matchTime.split(':');
        if (timeParts.length < 2) return NaN;

        const monthIndex = MONTH_INDEX_MAP[dateParts[1].toLowerCase()];
        if (monthIndex === undefined) return NaN;

        return new Date(
            dateParts[2],
            monthIndex,
            dateParts[0],
            timeParts[0],
            timeParts[1]
        ).getTime();
    };

    const now = Date.now();
    let targetMatch = null;
    let targetDate  = NaN;

    for (const match of upcomingMatches) {
        const parsed = parseMatchDateTime(match.dateTime.date, match.dateTime.time);
        if (!isNaN(parsed) && parsed > now) {
            targetMatch = match;
            targetDate  = parsed;
            break;
        }
    }

    if (!targetMatch || isNaN(targetDate)) {
        if (titleEl)      titleEl.textContent       = 'Geen wedstrijden gepland in de nabije toekomst.';
        if (countdownEl)  countdownEl.style.display = 'none';
        if (sponsorBlock) sponsorBlock.style.display = 'none';
        return;
    }

    titleEl.textContent = targetMatch.title;

    if (targetMatch.sponsor && sponsorBlock) {
        sponsorLink.href   = targetMatch.sponsor.url;
        sponsorLogo.src    = targetMatch.sponsor.logo;
        sponsorLogo.alt    = `Logo ${targetMatch.sponsor.name}`;
        sponsorLink.title  = `Bezoek website van ${targetMatch.sponsor.name} - Matchbalsponsor`;
        sponsorBlock.style.display = 'block';
    } else if (sponsorBlock) {
        sponsorBlock.style.display = 'none';
    }

    countdownEl.style.display = 'flex';

    if (_countdownInterval) clearInterval(_countdownInterval);

    const unitEls = {
        days:    document.getElementById('days'),
        hours:   document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds')
    };

    function tickCountdown() {
        const distance = targetDate - Date.now();

        if (distance < 0) {
            clearInterval(_countdownInterval);
            initCountdown();
            return;
        }

        const values = {
            days:    Math.floor(distance / 86400000),
            hours:   Math.floor((distance % 86400000) / 3600000),
            minutes: Math.floor((distance % 3600000)  / 60000),
            seconds: Math.floor((distance % 60000)    / 1000)
        };

        for (const key in values) {
            if (unitEls[key]) {
                unitEls[key].textContent = values[key] < 10 ? '0' + values[key] : values[key];
            }
        }
    }

    tickCountdown();
    _countdownInterval = setInterval(tickCountdown, 1000);
}

/* Upcoming Match Data Sync */

export function setCountdownData(upcomingMatches) {
    _upcomingMatches = upcomingMatches;

    const titleEl      = document.getElementById('next-match-title');
    const countdownEl  = document.getElementById('countdown');
    const sponsorBlock = document.getElementById('home-match-sponsor');

    if (upcomingMatches.length === 0) {
        if (titleEl)      titleEl.textContent       = 'Geen wedstrijden gepland in de nabije toekomst.';
        if (countdownEl)  countdownEl.style.display = 'none';
        if (sponsorBlock) sponsorBlock.style.display = 'none';
        return;
    }

    const nextMatch = upcomingMatches[0];
    if (titleEl) titleEl.textContent = nextMatch.title;

    if (nextMatch.sponsor && sponsorBlock) {
        document.getElementById('home-sponsor-link').href = nextMatch.sponsor.url;
        const logo = document.getElementById('home-sponsor-logo');
        logo.src  = nextMatch.sponsor.logo;
        logo.alt  = `Logo ${nextMatch.sponsor.name}`;
        sponsorBlock.style.display = 'block';
    } else if (sponsorBlock) {
        sponsorBlock.style.display = 'none';
    }
}