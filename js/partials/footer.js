/* Footer Loader */
document.addEventListener('DOMContentLoaded', function() {
    loadFooter();
});

async function loadFooter() {
    try {
        const isRootPage = window.location.pathname === '/' ||
            window.location.pathname.endsWith('/index.html') ||
            !window.location.pathname.includes('/html/');
        const footerPath = isRootPage ? 'html/partials/footer.html' : 'partials/footer.html';
        const response = await fetch(footerPath);

        if (!response.ok) {
            console.error(`Failed to load footer from ${footerPath}: ${response.status} ${response.statusText}`);
            loadFallbackFooter(isRootPage);
            return;
        }

        const footerHTML = await response.text();

        if (!footerHTML.trim()) {
            console.error('Footer file is empty');
            loadFallbackFooter(isRootPage);
            return;
        }

        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = footerHTML;
        } else {
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }

        configureFooter(isRootPage);
    } catch (error) {
        console.error('Error loading footer:', error);
        loadFallbackFooter(isRootPage);
    }
}

function loadFallbackFooter(isRootPage) {
    const logoGreyPath = isRootPage ? 'img/logos/gray-outlined-logo.png' : 'dynamo/img/logos/gray-outlined-logo.png';
    const logoRedPath = isRootPage ? 'img/logos/red-outlined-logo.png' : 'dynamo/img/logos/red-outlined-logo.png';
    const homePath = isRootPage ? 'index.html' : '../index.html';

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
                                    <img src="${logoGreyPath}" alt="Gray Outlined Dynamo Beirs Logo" class="footer-logo footer-logo-grey">
                                    <img src="${logoRedPath}" alt="Red Outlined Dynamo Beirs Logo" class="footer-logo footer-logo-red">
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
                    <p>© 2025 Dynamo Beirs</p>
                </div>
            </div>
        </footer>
    `;

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        footerPlaceholder.outerHTML = fallbackFooter;
    } else {
        document.body.insertAdjacentHTML('beforeend', fallbackFooter);
    }
}

function configureFooter(isRootPage) {
    const logoLink = document.getElementById('footer-logo-link');
    const logoGrey = document.getElementById('footer-logo-grey');
    const logoRed = document.getElementById('footer-logo-red');

    if (!logoLink || !logoGrey || !logoRed) {
        console.warn('Footer logo elements not found');
        return;
    }

    if (isRootPage) {
        logoLink.href = 'index.html';
        logoGrey.src = 'img/logos/gray-outlined-logo.png';
        logoRed.src = 'img/logos/red-outlined-logo.png';
    } else {
        logoLink.href = '../index.html';
        logoGrey.src = '/dynamo/img/logos/gray-outlined-logo.png';
        logoRed.src = '/dynamo/img/logos/red-outlined-logo.png';
    }
}