# Dynamo Beirs – Official Club Website

Welcome to the official website of **Dynamo Beirs**, a fictional football club showcasing modern design, team stats, match history, and player information in a responsive, modular structure.

## 🌐 Project Structure

```
project-root/
├── index.html
├── pages/
│   ├── players.html
│   ├── matches.html
│   ├── statistics.html
├── public/
│   ├── css/
│   │   ├── home.css
│   │   ├── players.css
│   │   ├── matches.css
│   │   ├── statistics.css
│   │   ├── header.css
│   │   └── footer.css
│   ├── js/
│   │   ├── home.js
│   │   ├── players.js
│   │   ├── matches.js
│   │   ├── statistics.js
│   │   └── header.js
│   └── img/
│       └── logos/
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
    - `home.js`, `players.js`, `matches.js`, `statistics.js`: Page-specific animations and interactions
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
   git clone https://github.com/woutaerts/Dynamo.git
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
© 2025 [Dynamo Beirs](https://github.com/woutaerts/Dynamo) – All rights reserved.
