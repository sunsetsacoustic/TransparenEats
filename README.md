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