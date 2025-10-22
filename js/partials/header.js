document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
});

async function loadHeader() {
    try {
        const headerPath = '/dynamo/html/partials/header.html';
        const response = await fetch(headerPath);

        if (!response.ok) {
            console.error(`Failed to load header from ${headerPath}: ${response.status} ${response.statusText}`);
            loadFallbackHeader();
            return;
        }

        const headerHTML = await response.text();

        if (!headerHTML.trim()) {
            console.error('Header file is empty');
            loadFallbackHeader();
            return;
        }

        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.outerHTML = headerHTML;
        } else {
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }

        configureHeader(false);
        initializeScrollProgress();
        setupHeaderScrollEffect();
        setupPositionAwareHoverEffect();
    } catch (error) {
        console.error('Error loading header:', error);
        loadFallbackHeader();
    }
}

function setupPositionAwareHoverEffect() {
    const isDesktop = window.matchMedia('(min-width: 769px)').matches;

    if (isDesktop) {
        if (typeof jQuery !== 'undefined') {
            setupJQueryHoverEffect();
        } else {
            setupVanillaHoverEffect();
        }
    }
}

function setupJQueryHoverEffect() {
    $(function() {
        $('.nav-link').each(function() {
            if ($(this).find('span').length === 0) {
                $(this).append('<span></span>');
            }

            $(this).on('mouseenter', function(e) {
                if (!$(this).hasClass('active')) {
                    const parentOffset = $(this).offset();
                    const relX = e.pageX - parentOffset.left;
                    const relY = e.pageY - parentOffset.top;
                    $(this).find('span').css({ top: relY, left: relX });
                }
            }).on('mouseout', function(e) {
                if (!$(this).hasClass('active')) {
                    const parentOffset = $(this).offset();
                    const relX = e.pageX - parentOffset.left;
                    const relY = e.pageY - parentOffset.top;
                    $(this).find('span').css({ top: relY, left: relX });
                }
            });
        });
    });
}

function setupVanillaHoverEffect() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(function(link) {
        if (!link.querySelector('span')) {
            const span = document.createElement('span');
            link.appendChild(span);
        }

        link.addEventListener('mouseenter', function(e) {
            if (!this.classList.contains('active')) {
                const rect = this.getBoundingClientRect();
                const relX = e.clientX - rect.left;
                const relY = e.clientY - rect.top;
                const span = this.querySelector('span');
                span.style.top = relY + 'px';
                span.style.left = relX + 'px';
            }
        });

        link.addEventListener('mouseleave', function(e) {
            if (!this.classList.contains('active')) {
                const rect = this.getBoundingClientRect();
                const relX = e.clientX - rect.left;
                const relY = e.clientY - rect.top;
                const span = this.querySelector('span');
                span.style.top = relY + 'px';
                span.style.left = relX + 'px';
            }
        });
    });
}

function configureHeader(isRootPage) {
    const navLinks = document.querySelectorAll('.nav-link');
    const headerLogoLink = document.getElementById('header-logo-link');
    const headerLogoRed = document.getElementById('header-logo-red');

    // Configure navigation links with absolute paths
    navLinks.forEach(link => {
        const page = link.getAttribute('data-page');
        switch(page) {
            case 'home':
                link.href = '/dynamo/index.html';
                break;
            case 'statistics':
                link.href = '/dynamo/html/statistics.html';
                break;
            case 'players':
                link.href = '/dynamo/html/players.html';
                break;
            case 'matches':
                link.href = '/dynamo/html/matches.html';
                break;
        }
    });

    // Configure header logo
    if (headerLogoLink && headerLogoRed) {
        headerLogoLink.href = '/dynamo/index.html';
        headerLogoRed.src = '/dynamo/img/logos/red-outlined-logo.png';
    } else {
        console.warn('Header logo elements not found');
    }

    highlightCurrentPage();
    initializeMobileMenu();
}

function loadFallbackHeader() {
    const fallbackHeader = `
        <header class="header">
            <div class="scroll-progress-container">
                <div class="scroll-progress-bar"></div>
            </div>
            <nav class="nav-container">
                <div class="mobile-menu-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="header-logo-container">
                    <a href="/dynamo/index.html" aria-label="Dynamo Beirs Homepage" class="header-logo-link">
                        <div class="logo-container">
                            <img src="/dynamo/img/logos/red-outlined-logo.png" alt="Red Outlined Dynamo Beirs Logo" class="header-logo header-logo-red">
                        </div>
                    </a>
                </div>
                <ul class="nav-links">
                    <li><a href="/dynamo/index.html" class="nav-link" data-page="home">Home<span></span></a></li>
                    <li><a href="/dynamo/html/statistics.html" class="nav-link" data-page="statistics">Statistics<span></span></a></li>
                    <li><a href="/dynamo/html/players.html" class="nav-link" data-page="players">Players<span></span></a></li>
                    <li><a href="/dynamo/html/matches.html" class="nav-link" data-page="matches">Matches<span></span></a></li>
                </ul>
            </nav>
        </header>
    `;

    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        headerPlaceholder.outerHTML = fallbackHeader;
    } else {
        document.body.insertAdjacentHTML('afterbegin', fallbackHeader);
    }

    highlightCurrentPage();
    initializeMobileMenu();
    initializeScrollProgress();
    setupHeaderScrollEffect();
    setupPositionAwareHoverEffect();
}

function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');
        const page = link.getAttribute('data-page');
        if ((currentPath === '/dynamo/' || currentPath === '/dynamo/index.html') && page === 'home') {
            link.classList.add('active');
        } else if (currentPath.includes(page)) {
            link.classList.add('active');
        }
    });
}

function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
}

function initializeScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress-bar');

    if (!progressBar) {
        console.warn('Scroll progress bar element not found');
        return;
    }

    function updateScrollProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );

        const windowHeight = window.innerHeight;
        const maxScroll = documentHeight - windowHeight;
        let progress = 0;
        if (maxScroll > 0) {
            progress = (scrollTop / maxScroll) * 100;
            progress = Math.min(100, Math.max(0, progress));
        }

        progressBar.style.width = progress + '%';
    }

    let ticking = false;
    function throttledUpdateScrollProgress() {
        if (!ticking) {
            requestAnimationFrame(function() {
                updateScrollProgress();
                ticking = false;
            });
            ticking = true;
        }
    }

    updateScrollProgress();
    window.addEventListener('scroll', throttledUpdateScrollProgress, { passive: true });

    window.addEventListener('resize', function() {
        setTimeout(updateScrollProgress, 100);
    });

    const observer = new MutationObserver(function(mutations) {
        let shouldUpdate = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' ||
                (mutation.type === 'attributes' &&
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class'))) {
                shouldUpdate = true;
            }
        });

        if (shouldUpdate) {
            setTimeout(updateScrollProgress, 50);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
}

function setupHeaderScrollEffect() {
    const header = document.querySelector(".header");

    if (!header) {
        console.warn('Header element not found for scroll effect');
        return;
    }

    let lastScrollTop = 0;
    let ticking = false;
    const scrollThreshold = 100;

    function handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (!ticking) {
            window.requestAnimationFrame(function() {
                if (currentScroll > scrollThreshold) {
                    if (currentScroll > lastScrollTop) {
                        header.classList.add('header-hidden');
                    } else {
                        header.classList.remove('header-hidden');
                    }
                } else {
                    header.classList.remove('header-hidden');
                }

                lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
}