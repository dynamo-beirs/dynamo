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
                                <i class="icon-envelope-solid"></i>
                            </a>
                            <a href="https://www.google.com/maps/place/Dynamo+Beirs/@51.3112215,4.8438315,17z/data=!4m16!1m9!3m8!1s0x47c6ad6e24d8bdb3:0x35268e66cb4d4999!2sDynamo+Beirs!8m2!3d51.3112215!4d4.8464064!9m1!1b1!16s%2Fg%2F11llls8wd9!3m5!1s0x47c6ad6e24d8bdb3:0x35268e66cb4d4999!8m2!3d51.3112215!4d4.8464064!16s%2Fg%2F11llls8wd9!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYwOS4xIKXMDSoASAFQAw%3D%3D" target="_blank" aria-label="Google Maps" class="social-icon">
                                <i class="icon-location-dot-solid"></i>
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
                                <svg viewBox="0 0 320 512" fill="currentColor" width="1em" height="1em"><path d="M279.1 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.4 0 225.4 0c-73.22 0-121.1 44.38-121.1 124.7v70.62H22.89V288h81.39v224h100.2V288z"/></svg>
                            </a>
                            <a href="https://www.instagram.com/dynamobeirs/" target="_blank" aria-label="Instagram" class="social-icon">
                                <svg viewBox="0 0 448 512" fill="currentColor" width="1em" height="1em"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
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