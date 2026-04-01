/**
 * utils/dropdown.js — Custom dropdown manager
 *
 * Provides reusable functions to initialise custom dropdowns and handle
 * global outside-click closing.
 */

/* Single Dropdown Init */

export function initDropdown(dropdownEl, onSelect) {
    if (!dropdownEl) return;

    const selected = dropdownEl.querySelector('.selected');
    const options  = dropdownEl.querySelector('.options');
    if (!selected || !options) return;

    selected.addEventListener('click', (e) => {
        e.stopPropagation();
        const isNowOpen = dropdownEl.classList.toggle('active');
        options.style.display = isNowOpen ? 'block' : 'none';

        // Close all other dropdowns
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
            // Preserve any icon markup inside the selected item
            selected.innerHTML     = li.innerHTML;
            selected.dataset.value = li.dataset.value;
            dropdownEl.classList.remove('active');
            options.style.display  = 'none';
            onSelect?.(li.dataset.value, li);
        });
    });
}

/* Global Outside-Click Closer */

let _globalCloseRegistered = false;

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