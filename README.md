# Dynamo Beirs – Official Website

Welcome to the official website of **Dynamo Beirs**, a Belgian football club based in Beerse. The site showcases match results, upcoming fixtures, player statistics, and season archives in a responsive, modular, no-build-tool architecture.

## Live Website

[https://dynamo-beirs.github.io/dynamo](https://dynamo-beirs.github.io/dynamo)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | Vanilla HTML5 (modular partials) |
| Styling | Vanilla CSS3 (custom properties, CSS Grid, Flexbox) |
| Scripting | Vanilla JavaScript (ES Modules) |
| Animations | [GSAP](https://gsap.com/) + Draggable + MotionPathPlugin |
| Data | Google Sheets → CSV via PapaParse |
| Fonts | Google Fonts – Poppins |
| Icons | Font Awesome 6.5 |
| Analytics | Google Analytics 4 |
| Hosting | GitHub Pages |

---

## Project Structure

```
dynamo/
├── 404.html                        # Custom 404 error page
├── index.html                      # Homepage
│
├── assets/
│   └── pdf/
│       └── Matchbalsponsor.pdf     # Match ball sponsor brochure
│
├── css/
│   ├── base/
│   │   ├── reset.css               # Browser reset / normalise
│   │   ├── tokens.css              # Design tokens (colours, spacing, typography, breakpoints)
│   │   └── typography.css          # Google Fonts import & type rules
│   │
│   ├── core/
│   │   ├── animations.css          # Scroll-reveal & entrance animation classes
│   │   └── helpers.css             # Utility classes, hover targets, visibility toggles
│   │
│   ├── layout/
│   │   ├── header.css              # Floating nav bar, mobile menu, scroll progress bar
│   │   └── footer.css              # Footer layout, social icons, brand logo
│   │
│   ├── components/
│   │   ├── countdown.css           # Next match countdown timer
│   │   ├── dropdown.css            # Custom select / season picker
│   │   ├── form-strip.css          # Team form display (last 5 results)
│   │   ├── line-graph.css          # SVG line graph for statistics
│   │   ├── loader.css              # Animated football loader
│   │   ├── match-card.css          # Match result / fixture card
│   │   ├── player-table.css        # Top scorers & player stats table
│   │   ├── result-icon.css         # Win / draw / loss badge icon
│   │   ├── search-input.css        # Search bar input field
│   │   ├── section-header.css      # Reusable section title with underline accent
│   │   ├── sort-controls.css       # Sort / filter control bar
│   │   ├── stat-card.css           # Statistic summary card
│   │   ├── ticker.css              # Scrolling news/info ticker
│   │   └── modals/
│   │       ├── modal-base.css      # Shared modal overlay & transitions
│   │       ├── match-modal.css     # Match detail modal styles
│   │       └── player-modal.css    # Player profile modal styles
│   │
│   └── pages/
│       ├── 404.css
│       ├── archive.css
│       ├── home.css
│       ├── matches.css
│       ├── players.css
│       ├── search.css
│       └── statistics.css
│
├── html/
│   ├── archive.html                # Season archive page
│   ├── matches.html                # Fixtures & results page
│   ├── players.html                # Squad & player stats page
│   ├── search.html                 # Match history search page
│   ├── statistics.html             # Club statistics page
│   │
│   ├── layout/
│   │   ├── header.html             # Header partial (loaded by header.js)
│   │   └── footer.html             # Footer partial (loaded by footer.js)
│   │
│   └── components/
│       └── modals/
│           ├── match-modal.html    # Match detail modal markup
│           └── player-modal.html   # Player profile modal markup
│
├── img/
│   ├── carousel/                   # Homepage photo carousel (1–7.jpg)
│   ├── icons/
│   │   ├── birthday/               # Birthday overlay icons (confetti, crown, garland)
│   │   ├── flags/                  # Nationality flag SVGs (Belgium, Netherlands)
│   │   ├── red-football-icon.png
│   │   └── white-football-icon.png
│   └── logos/
│       ├── favicon/                # Favicon set + site.webmanifest (PWA)
│       ├── og/                     # Open Graph images per page
│       ├── gray-outlined-logo.png
│       ├── original-logo.png
│       ├── red-outlined-logo.png
│       ├── white-outlined-black-filled-logo.png
│       └── white-outlined-logo.png
│
├── js/
│   ├── core/
│   │   ├── animations.js           # IntersectionObserver scroll-reveal, stagger utilities
│   │   └── helpers.js              # Shared pure functions (date parsing, formatters)
│   │
│   ├── layout/
│   │   ├── header.js               # Loads header partial, mobile menu, scroll progress
│   │   └── footer.js               # Loads footer partial
│   │
│   ├── components/
│   │   ├── countdown.js            # Next match countdown timer logic
│   │   ├── dropdown.js             # Custom dropdown / season picker
│   │   ├── form-strip.js           # Team form badge renderer
│   │   ├── line-graph.js           # SVG line graph renderer
│   │   ├── loader.js               # Football loader show/hide utility
│   │   ├── match-card.js           # Match card builder & renderer
│   │   ├── player-table.js         # Player table builder & renderer
│   │   └── modals/
│   │       ├── modal-base.js       # Shared modal open/close/trap-focus logic
│   │       ├── match-modal.js      # Match detail modal population
│   │       └── player-modal.js     # Player profile modal population
│   │
│   ├── pages/
│   │   ├── 404.js
│   │   ├── archive.js
│   │   ├── home.js
│   │   ├── matches.js
│   │   ├── players.js
│   │   ├── search.js
│   │   └── statistics.js
│   │
│   ├── services/
│   │   ├── data-service.js         # CSV fetching, parsing & data transformation
│   │   └── fetch-csv.js            # Multi-tier cached CSV fetcher (memory → sessionStorage → network)
│   │
│   └── vendor/
│       ├── gsap.min.js             # GSAP core animation library
│       ├── Draggable.min.js        # GSAP Draggable plugin
│       ├── MotionPathPlugin.min.js # GSAP MotionPath plugin
│       └── papaparse.min.js        # Client-side CSV parser
│
├── robots.txt
└── sitemap.xml
```

---

## Pages

| Page | File | Description |
|---|---|---|
| Home | `index.html` | Hero, photo carousel, countdown, team form, stats overview, contact |
| Matches | `html/matches.html` | Current season fixtures, results, and match detail modals |
| Players | `html/players.html` | Squad list, player stats, and player profile modals |
| Statistics | `html/statistics.html` | Season and all-time club statistics with charts |
| Archive | `html/archive.html` | Historical season results and records |
| Search | `html/search.html` | Full match history search across all seasons |
| 404 | `404.html` | Custom not-found page |

---

## Data

All statistics and match data are sourced live from a **Google Sheets** spreadsheet published as CSV. The `data-service.js` module fetches, parses, and transforms each sheet. A multi-tier caching strategy (in-memory → `sessionStorage` → network) minimises redundant requests within a browsing session.

---

## PWA Support

The site includes a `site.webmanifest` and a full favicon set, enabling basic PWA installation on supported mobile browsers.

---

*© 2026 [Dynamo Beirs](https://github.com/dynamo-beirs/dynamo) – All rights reserved.*