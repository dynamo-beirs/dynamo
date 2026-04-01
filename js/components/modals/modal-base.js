/**
 * components/modals/modal-base.js — Modal base class
 *
 * Abstract base class for FLIP-animated overlay modals.
 * Provides shared open/close animations, event binding, and cleanup logic.
 */

export class ModalBase {

    constructor() {
        this.modal         = null;
        this.isInitialized = false;
        this.originEl      = null;
    }

    /* Shared Event Binding */

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

    /* FLIP: Open */

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

    /* FLIP: Close */

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

    /* Animation Cleanup */
    _clearAnimations() {
        if (!this.modal) return;
        this.modal.getAnimations().forEach(a => a.cancel());
        const content = this.modal.querySelector('.modal-content');
        if (content) content.getAnimations().forEach(a => a.cancel());
    }
}