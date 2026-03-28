/**
 * components/player-table.js
 * Handles DOM construction, toggles, and event binding for player/scorer tables.
 */

import { POSITION_ICON_MAP, POSITION_LABEL_MAP} from '../core/helpers.js';

// ── Table HTML ────────────────────────────────────────────────────────────────
export const PLAYER_TABLE_HEADER_HTML = `
    <div class="table-header">
        <div class="table-cell">Rang</div>
        <div class="table-cell">Positie</div>
        <div class="table-cell">Speler</div>
        <div class="table-cell sort-header" data-column="goals">
            <span class="desktop-only">Doelpunten</span>
            <i class="fas fa-futbol mobile-only"></i>
        </div>
        <div class="table-cell sort-header" data-column="matches">
            <span class="desktop-only">Wedstrijden</span>
            <i class="fas fa-shirt mobile-only"></i>
        </div>
        <div class="table-cell sort-header" data-column="avg-goals">
            <span class="desktop-only">Gem. D/W</span>
            <span class="mobile-only"><i class="fas fa-futbol"></i> / <i class="fas fa-shirt"></i></span>
        </div>
    </div>
`;

// ── Table Toggle Manager ──────────────────────────────────────────────────────
export const tableStates = {};

/** Resets a specific table back to its collapsed state. */
export function resetTableState(tableId) {
    tableStates[tableId] = false;
}

/** Returns either the sliced 10-item array or the full array based on current state. */
export function sliceForTable(items, tableId, limit = 10) {
    if (!(tableId in tableStates)) tableStates[tableId] = false;
    return tableStates[tableId] ? items : items.slice(0, limit);
}
/** Handles cleanup, creation, and event binding of the toggle button. */
export function appendTableToggle(tableContainer, tableId, totalItems, limit, renderCallback) {
    // 1. Clean up any existing button container after this table
    const nextEl = tableContainer.nextElementSibling;
    if (nextEl && nextEl.classList.contains('table-toggle-container')) {
        nextEl.remove();
    }

    // 2. If we have 10 or fewer items, we don't need a button
    if (totalItems <= limit) return;

    // 3. Create the new button container
    const isExpanded = tableStates[tableId];
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'table-toggle-container';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-toggle-table';
    toggleBtn.innerHTML = isExpanded
        ? 'Toon minder <i class="fas fa-chevron-up"></i>'
        : `Toon alle ${totalItems} spelers <i class="fas fa-chevron-down"></i>`;

    // 4. Bind the click event
    toggleBtn.addEventListener('click', () => {
        tableStates[tableId] = !isExpanded;
        renderCallback();

        if (isExpanded) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    });

    toggleContainer.appendChild(toggleBtn);
    tableContainer.insertAdjacentElement('afterend', toggleContainer);
}

// ── Table Sorting Manager ─────────────────────────────────────────────────────
/**
 * Binds click events to table headers for sorting, updates the associated dropdown,
 * and triggers a re-render.
 *
 * @param {string} tableSelector - CSS selector for the table container.
 * @param {string} dropdownSelector - CSS selector for the dropdown to update.
 * @param {function} renderFn - Callback function to re-render the table, passed the sort key.
 */
export function bindSortableHeaders(tableSelector, dropdownSelector, renderFn) {
    const keyMap = { 3: 'goals', 4: 'matches', 5: 'avg-goals' };
    const lblMap = {
        'goals': 'Totaal Doelpunten',
        'matches': 'Gespeelde Wedstrijden',
        'avg-goals': 'Gemiddelde Doelpunten per Wedstrijd'
    };

    document.querySelectorAll(`${tableSelector} .table-header .table-cell`).forEach((cell, index) => {
        const key = keyMap[index];
        if (!key) return;

        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
            const selected = document.querySelector(`${dropdownSelector} .selected`);
            if (selected) {
                selected.dataset.value = key;
                selected.innerHTML = lblMap[key];
            }
            renderFn(key);
        });
    });
}

// ── Table Row Builder ─────────────────────────────────────────────────────────
/**
 * Builds a standardized DOM element for a player table row.
 * * @param {Object} player - The player data object { name, position, goals, matches }.
 * @param {number} index - The current index for the rank (0-based).
 * @param {string} rowClass - The full CSS class string to apply to the row wrapper.
 * @param {string} [prefix='player'] - The prefix to use for internal cell classes (e.g., 'player', 'scorer').
 * @returns {HTMLElement} The constructed row element.
 */
export function buildPlayerRow(player, index, rowClass, prefix = 'player') {
    const avg = player.matches === 0 ? '0.00' : (player.goals / player.matches).toFixed(2);
    const row = document.createElement('div');
    row.className = rowClass;

    row.innerHTML = `
        <div class="table-cell ${prefix}-rank">${index + 1}</div>
        <div class="table-cell ${prefix}-position">
            ${POSITION_ICON_MAP[player.position] || ''}
            <span class="tooltip">${POSITION_LABEL_MAP[player.position] || ''}</span>
        </div>
        <div class="table-cell ${prefix}-name">${player.name}</div>
        <div class="table-cell ${prefix}-goals">${player.goals}</div>
        <div class="table-cell ${prefix}-matches">${player.matches}</div>
        <div class="table-cell ${prefix}-avg-goals">${avg}</div>
    `;

    return row;
}