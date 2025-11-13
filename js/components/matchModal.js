/* matchModal.js */

/* Match Modal Component */
class MatchModal {
    constructor() {
        this.modal = null;
        this.isInitialized = false;
        this.scrollPosition = 0; // Store scroll position
    }

    /* Initialization */
    async init() {
        if (this.isInitialized) return;

        const placeholder = document.getElementById('match-modal-placeholder');
        if (!placeholder) return;

        placeholder.style.opacity = '0';
        placeholder.style.visibility = 'hidden';

        try {
            const response = await fetch('/dynamo/html/components/matchModal.html');
            placeholder.innerHTML = await response.text();

            this.modal = document.getElementById('matchCenterModal');
            if (this.modal) {
                this.modal.style.display = 'none';
                this.setupEventListeners();
                this.isInitialized = true;

                placeholder.style.opacity = '1';
                placeholder.style.visibility = 'visible';
            }
        } catch (error) {
            console.error('Failed to load match modal:', error);
        }
    }

    /* Event Listeners */
    setupEventListeners() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        this.modal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.close();
            }
        });

        // Add to Calendar button listener
        const addToCalendarBtn = this.modal.querySelector('#addToCalendarBtn');
        if (addToCalendarBtn) {
            addToCalendarBtn.addEventListener('click', () => {
                this.addToCalendar();
            });
        }
    }

    /* Scroll to Self */
    scrollToSelf() {
        if (this.modal) {
            const rect = this.modal.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const targetPosition = rect.top + scrollTop - 50; // Adjust offset as needed
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else {
            console.warn('Match modal not found for autoscroll');
        }
    }
    
    show(matchData = {}) {
    if (!this.modal) return;

    this.scrollPosition = window.scrollY || document.documentElement.scrollTop;

    const { title = 'Match Details', dateTime = { date: 'TBD', time: 'TBD', displayDate: 'TBD' }, season = 'Current Season', stadium = 'Home Stadium', goalscorers = [], score = null, isUpcoming = false, isHome = true } = matchData;

    document.body.classList.add('modal-open');

    // Update content first
    const modalContent = this.modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.toggle('upcoming-match', isUpcoming);
        this.updateContent(title, dateTime, season, stadium, goalscorers, score, isUpcoming, isHome);
    }

    // Now show modal
    this.modal.style.display = 'flex';
    this.modal.classList.add('show');  // triggers fade-in

    // Animation & scroll
    if (modalContent) {
            modalContent.scrollTop = 0;
            const sections = modalContent.querySelectorAll('.modal-match-score, .goalscorers-section, .date-time-section, .stadium-section, #addToCalendarBtn');
            sections.forEach(section => section.classList.remove('animate-in'));
            sections.forEach((section, index) => {
                if ((section.matches('.modal-match-score') && isUpcoming) ||
                    (section.matches('.goalscorers-section') && isUpcoming) ||
                    (section.matches('.modal-match-score') && !score && !isUpcoming) ||
                    (section.matches('#addToCalendarBtn') && !isUpcoming)) {
                    section.style.display = 'none';
                } else {
                    section.style.display = section.matches('.modal-match-score') ? 'flex' : 'block';
                    setTimeout(() => section.classList.add('animate-in'), index * 100);
                }
            });
        } else {
            console.warn('Modal content not found');
        }

    setTimeout(() => this.scrollToSelf(), 100);
}

    close() {
    if (!this.modal) return;

    this.modal.classList.remove('show');
    document.body.classList.remove('modal-open');

    setTimeout(() => {
        this.modal.style.display = 'none';
        window.scrollTo({
            top: this.scrollPosition,
            behavior: 'smooth'
        });
    }, 300); // match CSS transition duration
}

    /* Month mapping: English to Dutch */
    monthMapEnglishToDutch = {
        'jan': 'jan',
        'feb': 'feb',
        'mar': 'mrt',
        'apr': 'apr',
        'may': 'mei',
        'jun': 'jun',
        'jul': 'jul',
        'aug': 'aug',
        'sep': 'sep',
        'oct': 'okt',
        'nov': 'nov',
        'dec': 'dec'
    };

    /* Content Updates */
    updateContent(title, dateTime, season, stadium, goalscorers, score, isUpcoming, isHome) {
        const titleEl = this.modal.querySelector('#modalMatchTitle');
        if (titleEl) {
            // Split title into home and away teams
            const [homeTeam, awayTeam] = title.split(' vs ').map(team => team.trim());
            const homeTeamEl = titleEl.querySelector('.home-team');
            const awayTeamEl = titleEl.querySelector('.away-team');
            if (homeTeamEl && awayTeamEl) {
                homeTeamEl.textContent = homeTeam || 'Home Team';
                awayTeamEl.textContent = awayTeam || 'Away Team';
            }
        }

        const scoreEl = this.modal.querySelector('#modalMatchScore');
        const scoreDisplayEl = this.modal.querySelector('.score-display');
        if (scoreEl && scoreDisplayEl) {
            scoreEl.style.display = isUpcoming ? 'none' : 'flex';
            if (score && !isUpcoming) {
                scoreDisplayEl.textContent = score;
            }
        } else {
            console.warn('Score elements not found:', { scoreEl, scoreDisplayEl });
        }

        const dateEl = this.modal.querySelector('#matchDate');
        const timeEl = this.modal.querySelector('#matchTime');
        if (dateEl && timeEl) {
            let dateValue = dateTime.displayDate || 'TBD';
            let timeValue = dateTime.time || 'TBD';

            if (typeof dateTime === 'string') {
                if (dateTime.includes(' — ')) {
                    const [datePart, timePart] = dateTime.split(' — ');
                    const dateParts = datePart.split(' ');
                    const day = dateParts[0];
                    const monthEnglish = dateParts[1]?.toLowerCase();
                    const monthDutch = this.monthMapEnglishToDutch[monthEnglish] || monthEnglish || 'TBD';
                    dateValue = `${day} ${monthDutch}`;
                    const timeMatch = timePart.match(/\d{2}:\d{2}/);
                    timeValue = timeMatch ? timeMatch[0] : 'TBD';
                } else {
                    const dateParts = dateTime.split(' ');
                    const day = dateParts[0];
                    const monthEnglish = dateParts[1]?.toLowerCase();
                    const monthDutch = this.monthMapEnglishToDutch[monthEnglish] || monthEnglish || 'TBD';
                    dateValue = `${day} ${monthDutch}`;
                }
            }

            dateEl.innerHTML = `<i class="fas fa-calendar"></i> ${dateValue}`;
            timeEl.innerHTML = `<i class="fas fa-clock"></i> ${timeValue}`;
        }

        const seasonEl = this.modal.querySelector('#matchSeason');
        if (seasonEl) seasonEl.textContent = season;

        const stadiumEl = this.modal.querySelector('#stadiumName');
        if (stadiumEl) {
            stadiumEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${stadium}`;
        }

        const goalscorersSection = this.modal.querySelector('.goalscorers-section');
        if (goalscorersSection) {
            goalscorersSection.style.display = isUpcoming ? 'none' : 'block';
            if (!isUpcoming) {
                this.updateGoalscorers(goalscorers);
            }
        }

        const addToCalendarBtn = this.modal.querySelector('#addToCalendarBtn');
        if (addToCalendarBtn) {
            addToCalendarBtn.style.display = isUpcoming ? 'block' : 'none';
        }
    }

    /* Goalscorers Update */
    updateGoalscorers(goalscorers) {
        const goalscorersList = this.modal.querySelector('#goalscorersList');
        if (!goalscorersList) return;

        if (goalscorers.length === 0) {
            goalscorersList.innerHTML = '<li class="goalscorer-item">Geen doelpuntenmakers</li>';
            return;
        }

        goalscorersList.innerHTML = '';
        const scorerCounts = {};

        if (typeof goalscorers[0] === 'object') {
            goalscorers.forEach(scorer => {
                const playerName = scorer.player || scorer.name;
                const goals = scorer.goals || 1;
                scorerCounts[playerName] = (scorerCounts[playerName] || 0) + goals;
            });
        } else if (typeof goalscorers[0] === 'string') {
            goalscorers.forEach(player => {
                scorerCounts[player] = (scorerCounts[player] || 0) + 1;
            });
        }

        Object.entries(scorerCounts).forEach(([player, goals]) => {
            const li = document.createElement('li');
            li.className = 'goalscorer-item';

            let footballIcons = '';
            for (let i = 0; i < goals; i++) {
                footballIcons += '<i class="fas fa-futbol"></i> ';
            }

            li.innerHTML = `${footballIcons}${player}`;
            goalscorersList.appendChild(li);
        });
    }

    /* Add to Calendar Functionality */
    addToCalendar() {
        const titleEl = this.modal.querySelector('#modalMatchTitle');
        const dateEl = this.modal.querySelector('#matchDate');
        const timeEl = this.modal.querySelector('#matchTime');
        const stadiumEl = this.modal.querySelector('#stadiumName');

        if (!titleEl || !dateEl || !timeEl || !stadiumEl) {
            console.error('Cannot add to calendar: Missing modal elements');
            return;
        }

        const matchTitle = titleEl.textContent;
        const dateText = dateEl.textContent.replace(/<[^>]+>/g, '').trim();
        const timeText = timeEl.textContent.replace(/<[^>]+>/g, '').trim();
        const stadium = stadiumEl.textContent.replace(/<[^>]+>/g, '').trim();

        // Parse date in "DD MMM" format, where MMM is Dutch abbreviation
        const [day, month] = dateText.split(' ');
        const monthMap = {
            'jan': '01',
            'feb': '02',
            'mrt': '03',
            'apr': '04',
            'mei': '05',
            'jun': '06',
            'jul': '07',
            'aug': '08',
            'sep': '09',
            'okt': '10',
            'nov': '11',
            'dec': '12'
        };
        const monthNum = monthMap[month.toLowerCase()] || '06'; // Fallback to June if invalid
        const currentYear = new Date().getMonth() < 6 ? 2026 : 2025;
        const [hours, minutes] = timeText.split(':');

        const startDate = new Date(`${currentYear}-${monthNum}-${day.padStart(2, '0')}T${hours}:${minutes}:00`);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

        const event = {
            title: matchTitle,
            start: startDate.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
            end: endDate.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
            location: stadium,
            description: `Football match: ${matchTitle} at ${stadium}`
        };

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `SUMMARY:${event.title}`,
            `DTSTART:${event.start}`,
            `DTEND:${event.end}`,
            `LOCATION:${event.location}`,
            `DESCRIPTION:${event.description}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${matchTitle.replace(/[^a-z0-9]/gi, '_')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('Match added to your calendar!');
    }
}

/* Animation Function */
function animateOnScroll() {
    const elements = [
        { selector: '.modal-match-score', containerSelector: null },
        { selector: '.goalscorers-section', containerSelector: null },
        { selector: '.date-time-section', containerSelector: null },
        { selector: '.stadium-section', containerSelector: null },
        { selector: '#addToCalendarBtn', containerSelector: null }
    ];

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const elementType = elements.find(el => entry.target.matches(el.selector));
                if (elementType) {
                    const container = getContainer(entry.target, elementType.containerSelector);
                    const itemsInContainer = container.querySelectorAll(elementType.selector);
                    const itemIndex = Array.from(itemsInContainer).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                        console.log(`Animating ${elementType.selector}, index: ${itemIndex}`);
                    }, itemIndex * 100);
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { root: null, rootMargin: '50px', threshold: 0.01 });

    elements.forEach(el => {
        const items = document.querySelectorAll(el.selector);
        if (items.length === 0) {
            console.warn(`No elements found for selector: ${el.selector}`);
        }
        items.forEach(item => observer.observe(item));
    });

    function getContainer(target, containerSelector) {
        if (!containerSelector) return document;
        if (Array.isArray(containerSelector)) {
            for (const selector of containerSelector) {
                const container = target.closest(selector);
                if (container) return container;
            }
        }
        return target.closest(containerSelector);
    }
}

/* Global Instance */
window.matchModal = new MatchModal();

document.addEventListener('DOMContentLoaded', () => {
    window.matchModal.init();
});