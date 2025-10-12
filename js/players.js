// players.js
import { animateOnScroll } from './general.js';

// Define animation elements for animateOnScroll
const animationElements = [
    { selector: '.section-title', containerSelector: 'section' },
    { selector: '.section-subtitle', containerSelector: 'section' },
    { selector: '.page-hero h1', containerSelector: 'section' },
    { selector: '.filter-section', containerSelector: null },
    { selector: '.search-container', containerSelector: null },
    { selector: '.player-card', containerSelector: 'section' }
];

// Player page initialization and functionality
document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderPlayers();
    initializeFilters();
    addSearchFunctionality();
    animatePlayerCards();
    animateOnScroll(animationElements);
    initializePositionAwareHover();
    setTimeout(checkInitialHash, 100);
});

// Fetch and render players from CSV
async function fetchAndRenderPlayers() {
    const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCgon0xh9NuQ87NgqQzBNPCEmmZWcC_jrulRhLwmrudf5UQ2QBRA28F1qmWB9L5xP9uZ8-ct2aqfR/pub?gid=300017481&single=true&output=csv';
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const players = parseCSV(csvText);
        console.log('Parsed players:', players); // Debug: Log parsed players
        renderPlayerCards(players);
        initializePlayerCards();
    } catch (error) {
        console.error('Error fetching or rendering players:', error);
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => row.split(','));
    const players = [];
    const positionMap = {
        'GK': 'goalkeeper',
        'VER': 'defender',
        'MID': 'midfielder',
        'AAN': 'attacker'
    };
    const nationalityMap = {
        'BEL': { name: 'Belgium', flagSrc: '../img/icons/flags/belgium.svg' },
        'NLD': { name: 'Netherlands', flagSrc: '../img/icons/flags/netherlands.svg' }
    };

    // Assuming headers are in row 1, data starts from row 5 (index 4)
    for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        const name = row[1]?.trim(); // Column B
        const nationalityCode = row[2]?.trim(); // Column C
        const positionCode = row[3]?.trim(); // Column D
        const goalsThisSeason = row[29]?.trim(); // Column AD
        const gamesThisSeason = row[30]?.trim(); // Column AE
        const goalsTotal = row[39]?.trim(); // Column AN
        const gamesTotal = row[40]?.trim(); // Column AO

        // Debug: Log each row to inspect data
        console.log(`Row ${i + 1}:`, {
            name,
            nationalityCode,
            positionCode,
            goalsThisSeason,
            gamesThisSeason,
            goalsTotal,
            gamesTotal
        });

        // Check if required fields (name, nationality, position) are present
        if (name && nationalityCode && positionCode) {
            const position = positionMap[positionCode.toUpperCase()] || 'unknown';
            const nationality = nationalityMap[nationalityCode.toUpperCase()] || { name: 'Unknown', flagSrc: '../img/icons/flags/belgium.svg' };
            players.push({
                name,
                position,
                nationality: nationality.name,
                flagSrc: nationality.flagSrc,
                gamesThisSeason: parseInt(gamesThisSeason) || 0,
                gamesTotal: parseInt(gamesTotal) || 0,
                goalsThisSeason: parseInt(goalsThisSeason) || 0,
                goalsTotal: parseInt(goalsTotal) || 0
            });
        } else {
            console.log(`Row ${i + 1} skipped: Missing required fields (name, nationality, or position)`);
        }
    }
    return players;
}

// Render player cards dynamically
// Render player cards dynamically
function renderPlayerCards(players) {
    const playersGrid = document.querySelector('.players-grid');
    if (!playersGrid) return;

    // Mapping for Dutch translations of positions
    const positionDisplayMap = {
        'goalkeeper': 'Doelman',
        'defender': 'Verdediger',
        'midfielder': 'Middenvelder',
        'attacker': 'Aanvaller'
    };

    playersGrid.innerHTML = ''; // Clear existing cards
    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.setAttribute('data-position', player.position); // Keep English for internal use
        card.setAttribute('data-name', player.name);
        card.setAttribute('data-nationality', player.nationality);
        card.setAttribute('data-flag-src', player.flagSrc);
        card.setAttribute('data-games-season', player.gamesThisSeason);
        card.setAttribute('data-games-total', player.gamesTotal);
        card.setAttribute('data-goals-season', player.goalsThisSeason);
        card.setAttribute('data-goals-total', player.goalsTotal);

        card.innerHTML = `
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-position">${positionDisplayMap[player.position]}</div>
                <div class="player-nationality">
                    <img src="${player.flagSrc}" alt="${player.nationality} Flag" class="flag-icon">
                </div>
            </div>
        `;
        playersGrid.appendChild(card);
    });
}

// Player card setup and hover effects
function initializePlayerCards() {
    document.querySelectorAll('.player-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default behavior that might cause scrolling
            const playerData = {
                name: card.getAttribute('data-name') || 'Player Name',
                position: card.getAttribute('data-position') || 'Unknown',
                nationality: card.getAttribute('data-nationality') || 'Unknown',
                flagSrc: card.getAttribute('data-flag-src') || '../img/icons/flags/belgium.svg',
                gamesThisSeason: parseInt(card.getAttribute('data-games-season')) || 0,
                gamesTotal: parseInt(card.getAttribute('data-games-total')) || 0,
                goalsThisSeason: parseInt(card.getAttribute('data-goals-season')) || 0,
                goalsTotal: parseInt(card.getAttribute('data-goals-total')) || 0
            };
            if (window.playerModal) {
                window.playerModal.show(playerData);
            } else {
                console.error('PlayerModal not initialized');
            }
        });
        card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-8px) scale(1.02)');
        card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0) scale(1)');
    });
}

// Filter button functionality
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const playerCards = document.querySelectorAll('.player-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPosition = button.getAttribute('data-position');

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            document.body.className = `filter-${targetPosition}`;

            filterPlayers(targetPosition, playerCards);
            updateHeroAccentColor(targetPosition);

            const searchInput = document.querySelector('.player-search');
            if (searchInput) searchInput.value = '';

            history.replaceState(null, null, targetPosition === 'all' ? '#players' : `#${targetPosition}`);
        });
    });
}

// Position-aware hover effect initialization
function initializePositionAwareHover() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        const hoverSpan = document.createElement('span');
        hoverSpan.className = 'hover-effect';
        button.appendChild(hoverSpan);

        button.addEventListener('mouseenter', (e) => {
            const rect = button.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;

            hoverSpan.style.top = relY + 'px';
            hoverSpan.style.left = relX + 'px';
        });

        button.addEventListener('mouseleave', (e) => {
            const rect = button.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;

            hoverSpan.style.top = relY + 'px';
            hoverSpan.style.left = relX + 'px';
        });
    });
}

// Filter players by position
function filterPlayers(position, cards) {
    cards.forEach(card => {
        const cardPosition = card.getAttribute('data-position');
        const shouldShow = position === 'all' || cardPosition === position;

        card.classList.toggle('filter-hidden', !shouldShow);
        card.classList.toggle('filter-visible', shouldShow);
    });
}

// Handle initial page hash
function checkInitialHash() {
    const hash = window.location.hash.substring(1);
    const validPositions = ['goalkeeper', 'defender', 'midfielder', 'attacker'];

    if (validPositions.includes(hash)) {
        const targetButton = document.querySelector(`[data-position="${hash}"]`);
        if (targetButton) targetButton.click();
    }
}

// Search functionality setup
function addSearchFunctionality() {
    const searchInput = document.querySelector('.player-search');
    if (searchInput) searchInput.addEventListener('input', handleSearch);
}

// Handle search with filter combination
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const playerCards = document.querySelectorAll('.player-card');
    const activeFilter = document.querySelector('.filter-btn.active');
    const activePosition = activeFilter ? activeFilter.getAttribute('data-position') : 'all';

    playerCards.forEach(card => {
        const playerName = card.querySelector('.player-name').textContent.toLowerCase();
        const cardPosition = card.getAttribute('data-position');
        const matchesSearch = searchTerm === '' || playerName.includes(searchTerm);
        const matchesFilter = activePosition === 'all' || cardPosition === activePosition;

        card.classList.toggle('filter-hidden', !(matchesSearch && matchesFilter));
        card.classList.toggle('filter-visible', matchesSearch && matchesFilter);
    });
}

// Keyboard navigation for filters
document.addEventListener('keydown', (e) => {
    const searchInput = document.querySelector('.player-search');
    if (searchInput && document.activeElement === searchInput) return;

    const filterButtons = document.querySelectorAll('.filter-btn');
    const activeButton = document.querySelector('.filter-btn.active');
    const currentIndex = Array.from(filterButtons).indexOf(activeButton);

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        let newIndex;

        if (e.key === 'ArrowLeft') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : filterButtons.length - 1;
        } else {
            newIndex = currentIndex < filterButtons.length - 1 ? currentIndex + 1 : 0;
        }

        filterButtons[newIndex].focus();
        filterButtons[newIndex].click();
    }
});

// Scroll animation observer for player cards
function animatePlayerCards() {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target.closest('.players-grid');
                const itemsInContainer = container.querySelectorAll('.player-card');
                const itemIndex = Array.from(itemsInContainer).indexOf(entry.target);

                entry.target.style.setProperty('--animation-delay', itemIndex);
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    document.querySelectorAll('.player-card').forEach(item => observer.observe(item));
}