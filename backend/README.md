# Ingredient Aware Backend (MVP)

This backend provides a lightweight API proxy and normalization service for the Ingredient Aware MVP. It is built with Node.js and Express.

## Features
- API proxying to food databases (e.g., Open Food Facts)
- Data normalization for consistent ingredient display
- (Optional) Basic analytics collection

## Setup

```
npm install
```

## Development

```
npm run dev
```

## Lint

```
npm run lint
```

## Test

```
npm test
```

## Project Structure
- `src/api/` - API route handlers
- `public/` - Static assets (if needed)
- `test/` - Backend tests

## Note
This backend does **not** include any AI or OpenAI integration. It is focused solely on supporting the MVP features as described in the main project documentation.
