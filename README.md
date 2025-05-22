# Ingredient Aware (Food Scanner) - MVP

A simple web and backend project to help users scan or search food items, identify artificial food dyes, and receive warnings about concerning ingredients.

## Features
- Barcode scanning using device camera (web)
- Manual food item search
- Product and ingredient display
- Food dye identification (with internal database of dye names, aliases, and E-numbers)
- Basic ingredient warning system (predefined list)
- Local scan/search history (last 10-20 items)
- No AI, OpenAI, or advanced ingredient explanations

## Tech Stack
- **Frontend:** React + Material-UI
- **Backend:** Node.js + Express (API proxy/normalization if needed)
- **Data:** Open Food Facts API

## Setup

### 1. Backend
```
cd backend
npm install
npm run dev
```

### 2. Frontend
```
cd web
npm install
npm run dev
```

## Usage
- Scan a barcode or search for a food item.
- View product details and ingredient list.
- Identified food dyes and flagged ingredients are highlighted with warnings.
- Recent scans/searches are stored locally for quick access.

## MVP Scope
See `MVP_CHECKLIST.md` for a detailed breakdown of MVP requirements and progress.

## License
MIT 

## Refactoring & Cleanup Checklist

### Backend
- [ ] Remove unused routes, files, and dependencies.
- [ ] Organize routes into logical modules (e.g., `/off`, `/nutritionix`, `/usda`).
- [ ] Add consistent error handling and logging for all endpoints.
- [ ] Validate and sanitize all incoming parameters.
- [ ] Add comments and JSDoc to all exported functions and routes.
- [ ] Ensure all environment variables are checked and have fallbacks or clear errors.
- [ ] Add tests for all API endpoints (unit and integration).

### Frontend
- [ ] Remove unused components and code.
- [ ] Ensure all API calls go through the backend (no direct CORS requests).
- [ ] Add user-friendly error messages for all failed API calls.
- [ ] Refactor state management for clarity and efficiency.
- [ ] Add comments and prop types (or TypeScript interfaces) for all components.
- [ ] Improve UI/UX for loading and error states.
- [ ] Add tests for key components and flows.

### DevOps
- [ ] Ensure all environment variables are set in Render/Vercel.
- [ ] Set up automatic deployment on push to `main`.
- [ ] Add health checks and monitoring for backend endpoints. 