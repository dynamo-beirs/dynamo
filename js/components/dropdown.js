/**
 * utils/dropdown.js
 *
 * Generic custom-dropdown manager.
 */

// ── Single Dropdown Init ──────────────────────────────────────────────────────

/**
 * Initialises a single custom dropdown element.
 *
 * @param {HTMLElement|null} dropdownEl  The root `.dropdown` element.
 * @param {Function}         onSelect    Called with `(value, liElement)` when
 *                                       the user picks an option.
 */
export function initDropdown(dropdownEl, onSelect) {
    if (!dropdownEl) return;

    const selected = dropdownEl.querySelector('.selected');
    const options  = dropdownEl.querySelector('.options');
    if (!selected || !options) return;

    selected.addEventListener('click', (e) => {
        e.stopPropagation();
        const isNowOpen = dropdownEl.classList.toggle('active');
        options.style.display = isNowOpen ? 'block' : 'none';

        // Close every other open dropdown on the page
        document.querySelectorAll('.dropdown').forEach(other => {
            if (other === dropdownEl) return;
            other.classList.remove('active');
            const otherOpts = other.querySelector('.options');
            if (otherOpts) otherOpts.style.display = 'none';
        });
    });

    options.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', (e) => {
            e.stopPropagation();
            // Use innerHTML to preserve icon markup (e.g. archive match-sort arrows)
            selected.innerHTML     = li.innerHTML;
            selected.dataset.value = li.dataset.value;
            dropdownEl.classList.remove('active');
            options.style.display  = 'none';
            onSelect?.(li.dataset.value, li);
        });
    });
}

// ── Global Outside-Click Closer ───────────────────────────────────────────────

let _globalCloseRegistered = false;

/**
 * Registers a single document-level click listener that closes any `.dropdown`
 * whose subtree does not contain the clicked target.
 *
 * Idempotent — calling this more than once is harmless.
 */
export function bindDropdownClose() {
    if (_globalCloseRegistered) return;
    _globalCloseRegistered = true;

    document.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown')) return;

        document.querySelectorAll('.dropdown').forEach(d => {
            d.classList.remove('active');
            const opts = d.querySelector('.options');
            if (opts) opts.style.display = 'none';
        });
    });
}