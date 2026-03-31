/**
 * components/modals/player-modal.js
 * Renamed from playerModal.js (camelCase → kebab-case).
 * Moved from components/ into components/modals/ alongside its base class.
 */
import { ModalBase } from './modal-base.js';
import { POSITION_LABEL_MAP } from '../../core/helpers.js';

class PlayerModal extends ModalBase {
    constructor() {
        super();
    }

    // ── Initialization ────────────────────────────────────────────────────────

    async init() {
        if (this.isInitialized) return;

        try {
            const response  = await fetch('/dynamo/html/components/modals/player-modal.html');
            const modalHTML = await response.text();

            const placeholder = document.getElementById('player-modal-placeholder');
            if (placeholder) {
                placeholder.innerHTML = modalHTML;
                this.modal = document.getElementById('playerModal');
                this.bindEvents();
                this.isInitialized = true;
            }
        } catch (error) {
            console.error('Failed to load player modal:', error);
        }
    }

    // ── Modal Control ─────────────────────────────────────────────────────────

    /**
     * Opens the modal, animating the content outward from `originEl` (FLIP).
     *
     * @param {Object}       playerData  Player data object.
     * @param {Element|null} originEl    The card that was clicked.
     */
    show(playerData = {}, originEl = null) {
        if (!this.modal) return;

        const {
            name            = 'Player Name',
            position        = 'Unknown',
            flagSrc         = '../img/icons/flags/belgium.svg',
            gamesThisSeason = 0,
            gamesTotal      = 0,
            goalsThisSeason = 0,
            goalsTotal      = 0
        } = playerData;

        const modalContent = this.modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('goalkeeper', 'defender', 'midfielder', 'attacker');
            modalContent.classList.add(position.toLowerCase());
            this.renderContent(name, position, flagSrc, gamesThisSeason, gamesTotal, goalsThisSeason, goalsTotal);
            modalContent.scrollTop = 0;
        }

        this._animateOpen(originEl);
    }

    close() {
        this._animateClose();
    }

    // ── Content Population ────────────────────────────────────────────────────

    renderContent(name, position, flagSrc, gamesThisSeason, gamesTotal, goalsThisSeason, goalsTotal) {
        const nameEl = this.modal.querySelector('#modalPlayerName');
        if (nameEl) nameEl.textContent = name;

        const positionEl = this.modal.querySelector('#playerPosition');
        if (positionEl) positionEl.textContent = POSITION_LABEL_MAP[position.toLowerCase()] || position;

        const flagEl = this.modal.querySelector('#nationalityFlag');
        if (flagEl) { flagEl.src = flagSrc; flagEl.alt = 'Nationality Flag'; }

        const gamesThisSeasonEl = this.modal.querySelector('#gamesThisSeason');
        if (gamesThisSeasonEl) gamesThisSeasonEl.textContent = gamesThisSeason;

        const gamesTotalEl = this.modal.querySelector('#gamesTotal');
        if (gamesTotalEl) gamesTotalEl.textContent = gamesTotal;

        const goalsThisSeasonEl = this.modal.querySelector('#goalsThisSeason');
        if (goalsThisSeasonEl) goalsThisSeasonEl.textContent = goalsThisSeason;

        const goalsTotalEl = this.modal.querySelector('#goalsTotal');
        if (goalsTotalEl) goalsTotalEl.textContent = goalsTotal;
    }
}

// ── Global Instance ───────────────────────────────────────────────────────────

window.playerModal = new PlayerModal();

document.addEventListener('DOMContentLoaded', () => {
    window.playerModal.init();
});