/**
 * components/modals/modal-base.js
 * Abstract base class for FLIP-animated overlay modals.
 * Moved from utils/ — a base class for UI components belongs with components,
 * not in a general-purpose utilities folder.
 */
export class ModalBase {
    constructor() {
        this.modal         = null;
        this.isInitialized = false;
        this.originEl      = null;
    }

    // ── Shared Event Binding ──────────────────────────────────────────────────

    /**
     * Attaches close-on-backdrop-click, close-button click, and Escape key.
     * Call once after this.modal is set.
     */
    bindEvents() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.close-modal');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        this.modal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) this.close();
        });
    }

    // ── FLIP: Open ────────────────────────────────────────────────────────────

    /**
     * Adds `.show` to the overlay (triggers CSS fade-in), then runs the FLIP
     * open animation on `.modal-content`, expanding outward from `originEl`.
     *
     * @param {Element|null} originEl  The card/element the modal expands from.
     */
    _animateOpen(originEl) {
        if (!this.modal) return;

        document.body.classList.add('modal-open');
        this._clearAnimations();
        this.originEl = originEl;

        this.modal.classList.add('show');

        const modalContent = this.modal.querySelector('.modal-content');
        if (!modalContent) return;

        const contentRect = modalContent.getBoundingClientRect();
        const toRadius    = getComputedStyle(modalContent).borderRadius;
        let fromKF;

        if (originEl) {
            const cardRect = originEl.getBoundingClientRect();
            const dx     = cardRect.left + cardRect.width  / 2 - (contentRect.left + contentRect.width  / 2);
            const dy     = cardRect.top  + cardRect.height / 2 - (contentRect.top  + contentRect.height / 2);
            const scaleX = cardRect.width  / contentRect.width;
            const scaleY = cardRect.height / contentRect.height;

            fromKF = {
                transform:    `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                opacity:      '0',
                borderRadius: getComputedStyle(originEl).borderRadius
            };
        } else {
            fromKF = { transform: 'scale(0.92) translateY(14px)', opacity: '0', borderRadius: toRadius };
        }

        modalContent.animate(
            [fromKF, { transform: 'none', opacity: '1', borderRadius: toRadius }],
            {
                duration: originEl ? 480 : 280,
                easing:   originEl
                    ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                    : 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'backwards'
            }
        );
    }

    // ── FLIP: Close ───────────────────────────────────────────────────────────

    /**
     * Runs the FLIP close animation, collapsing back toward `this.originEl`,
     * then removes `.show` and cleans up body scroll lock.
     */
    _animateClose() {
        if (!this.modal || !this.modal.classList.contains('show')) return;

        const modalContent = this.modal.querySelector('.modal-content');
        if (!modalContent) return;

        this._clearAnimations();

        const fromRadius = getComputedStyle(modalContent).borderRadius;
        const originEl   = this.originEl;
        let toKF;
        let duration = 280;

        if (originEl) {
            const cardRect    = originEl.getBoundingClientRect();
            const contentRect = modalContent.getBoundingClientRect();
            const dx     = cardRect.left + cardRect.width  / 2 - (contentRect.left + contentRect.width  / 2);
            const dy     = cardRect.top  + cardRect.height / 2 - (contentRect.top  + contentRect.height / 2);
            const scaleX = cardRect.width  / contentRect.width;
            const scaleY = cardRect.height / contentRect.height;

            toKF = {
                transform:    `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                opacity:      '0',
                borderRadius: getComputedStyle(originEl).borderRadius
            };
            duration = 360;
        } else {
            toKF = { transform: 'scale(0.92) translateY(14px)', opacity: '0', borderRadius: fromRadius };
        }

        this.modal.classList.remove('show');

        const anim = modalContent.animate(
            [{ transform: 'none', opacity: '1', borderRadius: fromRadius }, toKF],
            { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
        );

        anim.onfinish = () => {
            document.body.classList.remove('modal-open');
            this._clearAnimations();
            this.originEl = null;
        };
    }

    // ── Animation Cleanup ─────────────────────────────────────────────────────

    /** Cancels all in-flight WAAPI animations on the overlay and its content panel. */
    _clearAnimations() {
        if (!this.modal) return;
        this.modal.getAnimations().forEach(a => a.cancel());
        const content = this.modal.querySelector('.modal-content');
        if (content) content.getAnimations().forEach(a => a.cancel());
    }
}