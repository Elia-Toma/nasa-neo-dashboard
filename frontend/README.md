# NASA NEO Dashboard Frontend

The frontend is a modern React application built with TypeScript and Vite. It connects to the proxy backend to display Near Earth Objects (NEOs) in an interactive dashboard with support for internationalization, date-range filtering, sorting, and high-contrast styling.

## Features
- **React + TypeScript + Vite** for high-performance development and bundling.
- **Interactive Charts** (Recharts) visualizing estimated asteroid diameters and close-approach distances.
- **Multilingual Support** (i18next) for English and Italian locales.
- **Robust Client Validation** preventing date ranges exceeding 90 days.
- **Responsive & Modern Design** with TailwindCSS, utilizing a Jet Black theme in dark mode and Jet White theme in light mode.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components (AsteroidCard, ChartView, etc.)
│   ├── locales/        # English (en) and Italian (it) JSON translation dictionaries
│   ├── pages/          # Main application pages (Home, Detail)
│   ├── services/       # API call definitions (via fetch)
│   ├── App.tsx         # Root component setting up Router and layout
│   ├── index.css       # Global styles and tailwind configuration
│   └── main.tsx        # Application entrypoint
├── index.html
├── tailwind.config.js
└── vite.config.ts
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation & Run
1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the development server:
   ```sh
   npm run dev
   ```
4. Access the frontend locally at the URL output by Vite (usually `http://localhost:5173`).

## Code Standards & Building
- **Linting**: Ensure code conforms to rules by running `npm run lint`.
- **Production Build**: Verify a successful compile by running `npm run build`.
