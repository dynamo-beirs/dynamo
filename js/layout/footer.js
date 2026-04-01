/**
 * layout/footer.js — Footer partial loader
 *
 * Loads the footer HTML partial and updates the copyright year.
 * Falls back to a static footer if the external file cannot be loaded.
 */

document.addEventListener('DOMContentLoaded', () => {
    initFooter();
});

/* Footer Loading */

async function initFooter() {
    const footerPath = '/dynamo/html/layout/footer.html';

    try {
        const response = await fetch(footerPath);
        if (!response.ok) {
            console.error(`Failed to load footer from ${footerPath}: ${response.status} ${response.statusText}`);
            renderFallbackFooter();
            return;
        }

        const footerHTML = await response.text();
        if (!footerHTML.trim()) {
            renderFallbackFooter();
            return;
        }

        const placeholder = document.getElementById('footer-placeholder');
        if (placeholder) {
            placeholder.outerHTML = footerHTML;
        } else {
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }

        updateFooterYear();
    } catch (error) {
        console.error('Error loading footer:', error);
        renderFallbackFooter();
    }
}

function renderFallbackFooter() {
    const logoGreyPath = '/dynamo/img/logos/gray-outlined-logo.png';
    const logoRedPath  = '/dynamo/img/logos/red-outlined-logo.png';
    const homePath     = '/dynamo/index.html';
    const currentYear  = new Date().getFullYear();

    const fallbackFooter = `
        <footer class="footer">
            <div class="footer-content">
                <div class="footer-social-line">
                    <span class="line-left"></span>
                    <div class="footer-social">
                        <div class="social-icons-container">
                            <a href="mailto:dynamobeirs@gmail.com" aria-label="Email" class="social-icon">
                                <i class="fas fa-envelope"></i>
                            </a>
                            <a href="https://www.google.com/maps/place/Dynamo+Beirs/@51.3112215,4.8438315,17z/data=!4m16!1m9!3m8!1s0x47c6ad6e24d8bdb3:0x35268e66cb4d4999!2sDynamo+Beirs!8m2!3d51.3112215!4d4.8464064!9m1!1b1!16s%2Fg%2F11llls8wd9!3m5!1s0x47c6ad6e24d8bdb3:0x35268e66cb4d4999!8m2!3d51.3112215!4d4.8464064!16s%2Fg%2F11llls8wd9!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYwOS4xIKXMDSoASAFQAw%3D%3D" target="_blank" aria-label="Google Maps" class="social-icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </a>
                        </div>
                        <div class="footer-brand">
                            <a href="${homePath}" aria-label="Dynamo Beirs Homepage" class="logo-link">
                                <div class="logo-container">
                                    <img src="${logoGreyPath}" alt="Gray" class="footer-logo footer-logo-grey">
                                    <img src="${logoRedPath}"  alt="Red"  class="footer-logo footer-logo-red">
                                </div>
                            </a>
                        </div>
                        <div class="social-icons-container">
                            <a href="https://www.facebook.com/DynamoBeirs" target="_blank" aria-label="Facebook" class="social-icon">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://www.instagram.com/dynamobeirs/" target="_blank" aria-label="Instagram" class="social-icon">
                                <i class="fab fa-instagram"></i>
                            </a>
                        </div>
                    </div>
                    <span class="line-right"></span>
                </div>
                <div class="footer-copyright">
                    <p>© <span>${currentYear}</span> Dynamo Beirs</p>
                </div>
            </div>
        </footer>
    `;

    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        placeholder.outerHTML = fallbackFooter;
    } else {
        document.body.insertAdjacentHTML('beforeend', fallbackFooter);
    }
}

/* Footer Year Update */

function updateFooterYear() {
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}