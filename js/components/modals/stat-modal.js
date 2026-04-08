/**
 * components/modals/stat-modal.js — Stat modal
 *
 * Displays lists for specific stats (victories, goalscorers, etc.).
 */

import { ModalBase } from './modal-base.js';

class StatModal extends ModalBase {
    constructor() {
        super();
    }

    async init() {
        if (this.isInitialized) return;
        const placeholder = document.getElementById('stat-modal-placeholder');
        if (!placeholder) return;

        try {
            const response = await fetch('/dynamo/html/components/modals/stat-modal.html');
            placeholder.innerHTML = await response.text();

            this.modal = document.getElementById('statModal');
            if (this.modal) {
                this.bindEvents();
                this.isInitialized = true;
            }
        } catch (error) {
            console.error('Failed to load stat modal:', error);
        }
    }

    // Required by ModalBase.bindEvents() to enable closing via button/Escape key
    close() {
        this._animateClose();
    }

    show(config, originEl = null) {
        if (!this.modal) return;

        const { title, headerIconHtml, theme, data } = config;

        // Apply theme color
        this.modal.style.setProperty('--theme-color', theme);

        // Header Setup
        this.modal.querySelector('#statModalTitle').textContent = title;
        this.modal.querySelector('#statModalIconContainer').innerHTML = headerIconHtml || '';

        // List Setup
        const listEl = this.modal.querySelector('#statModalList');
        listEl.innerHTML = '';

        if (!data || data.length === 0) {
            listEl.innerHTML = '<li class="stat-modal-item">Geen gegevens beschikbaar</li>';
        } else {
            data.forEach(item => {
                const li = document.createElement('li');
                li.className = 'stat-modal-item';

                const subtitleHtml = item.subtitle ? `<small>${item.subtitle}</small>` : '';

                li.innerHTML = `
                    <div class="stat-item-left">
                        <div class="stat-item-info">
                            <strong>${item.title}</strong>
                            ${subtitleHtml}
                        </div>
                    </div>
                    <div class="stat-badge">${item.badge}</div>
                `;
                listEl.appendChild(li);
            });

            const badges = listEl.querySelectorAll('.stat-badge');
            let maxWidth = 0;

            badges.forEach(b => {
                if (b.offsetWidth > maxWidth) {
                    maxWidth = b.offsetWidth;
                }
            });

            if (maxWidth > 0) {
                badges.forEach(b => {
                    b.style.minWidth = `${maxWidth}px`;
                });
            }
        }

        this._animateOpen(originEl);
    }
}

window.statModal = new StatModal();

document.addEventListener('DOMContentLoaded', () => {
    window.statModal.init();
});