/* Page Initialization */
document.addEventListener('DOMContentLoaded', () => {
    setupCtaHoverEffect();
});

/* CTA Hover Effect */
function setupCtaHoverEffect() {
    const ctaButton = document.querySelector('.error-cta');
    ctaButton.addEventListener('mouseenter', (e) => {
        const rect = ctaButton.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const hoverEffect = ctaButton.querySelector('.hover-effect');
        hoverEffect.style.top = relY + 'px';
        hoverEffect.style.left = relX + 'px';
    });

    ctaButton.addEventListener('mouseleave', (e) => {
        const rect = ctaButton.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const hoverEffect = ctaButton.querySelector('.hover-effect');
        hoverEffect.style.top = relY + 'px';
        hoverEffect.style.left = relX + 'px';
    });
}