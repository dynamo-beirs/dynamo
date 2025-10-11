# Dynamo Beirs – Official Club Website

Welcome to the official website of **Dynamo Beirs**, a football club showcasing modern design, team stats, match history, and player information in a responsive, modular structure.

## 🌐 Project Structure

```
C:.
│   Dynamo.iml
│   index.html
│   README.md
│   
├───.idea
│       .gitignore
│       jsLibraryMappings.xml
│       misc.xml
│       modules.xml
│       vcs.xml
│       workspace.xml
│       
├───css
│   │   general.css
│   │   index.css
│   │   matches.css
│   │   players.css
│   │
│   ├───components
│   │       matchModal.css
│   │
│   ├───partials
│   │       footer.css
│   │       header.css
│   │
│   └───statistics
│           player-all-time.css
│           player-season.css
│           statistics.css
│           team-all-time.css
│           team-season.css
│
├───html
│   │   matches.html
│   │   players.html
│   │   statistics.html
│   │
│   ├───components
│   │       matchModal.html
│   │
│   └───partials
│           footer.html
│           header.html
│
├───img
│   ├───icons
│   │   │   red-football-icon.png
│   │   │   white-football-icon.png
│   │   │
│   │   └───flags
│   │           belgium.svg
│   │           netherlands.svg
│   │
│   └───logos
│           gray-outlined-logo.png
│           original-logo.png
│           red-outlined-logo.png
│           white-outlined-black-filled-logo.png
│           white-outlined-logo.png
│
└───js
    │   general.js
    │   index.js
    │   matches.js
    │   players.js
    │   statistics.js
    │
    ├───components
    │       matchModal.js
    │
    └───partials
            footer.js
            header.js
```

## 📄 Pages

- **Home (`index.html`)**: Hero section, club highlights, quick navigation to other pages.
- **Players (`players.html`)**: Detailed player stats, full squad by position.
- **Matches (`matches.html`)**: Upcoming fixtures, recent results, performance overview.
- **Statistics (`statistics.html`)**: Season stats including wins, goals, defensive and offensive breakdowns.

## 🎨 Styling

- Modular CSS:
    - `home.css`: Homepage-specific styling
    - `players.css`, `matches.css`, `statistics.css`: Styles for respective pages
    - `header.css`, `footer.css`: Shared layout elements

## ⚙️ JavaScript Behavior

- Modular JS:
    - `index.js`, `players.js`, `matches.js`, `statistics.js`: Page-specific animations and interactions
    - `header.js`: Handles mobile nav toggle, header scroll effect, and active menu states

## 📱 Responsive Design

Built mobile-first with responsive layouts using:
- CSS Flexbox/Grid
- Media queries for breakpoints
- Mobile navigation toggle system

## 🚀 Getting Started

To view or edit the website locally:

1. **Clone this repository**:
   ```bash
   git clone https://github.com/dynamo-beirs/dynamo.git
   cd Dynamo
   ```

2. **Open `index.html` in your browser** to explore the homepage.

> ✅ No frameworks or bundlers required — this is a static site built with HTML, CSS, and vanilla JavaScript.

## 📦 Dependencies

- [Font Awesome 6.5.0](https://cdnjs.com/libraries/font-awesome) — for social and iconography

## 🛠 Future Improvements

- Add individual player profile pages
- Integrate live match updates (e.g., via football-data.org API)
- Admin dashboard for match and stat input

## 📄 License

This project is for educational and demonstrative purposes only.  
© 2025 [Dynamo Beirs](https://github.com/dynamo-beirs/dynamo) – All rights reserved.
