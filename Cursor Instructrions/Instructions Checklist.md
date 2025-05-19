# Ingredient Aware (Food Scanner) - MVP Checklist

## Core Goal
- [ ] Enable users to scan or search food items to identify artificial food dyes and receive warnings about concerning ingredients.

## Step-by-Step Checklist

### 1. Tech Stack & Development Phases
- [x] **Web App Prototype (Phase 1):**
    - [x] Frontend: React (Vite scaffolded and pushed to GitHub)
    - [x] UI Library: Material-UI (MUI) installed
    - [ ] Barcode Scanning: react-qr-barcode-scanner or quaggaJS
    - [ ] Backend/API Proxy: Node.js + Express (if needed)
    - [ ] Food Data API: Open Food Facts
    - [ ] Local Storage: localStorage or IndexedDB for scan/search history
- [ ] **Mobile App Launch (Phase 2):**
    - [ ] Framework: React Native (reuse business logic from web)
    - [ ] Barcode Scanning: react-native-camera or expo-barcode-scanner
    - [ ] Local Storage: AsyncStorage or SQLite
    - [ ] UI: Adapt for mobile experience

### 2. Barcode Scanning
- [ ] Integrate barcode scanning in web app (Phase 1)
- [ ] Integrate native barcode scanning in mobile app (Phase 2)
- [ ] Decode barcode and query food database

### 3. Manual Food Item Search
- [ ] Implement input field for manual product search
- [ ] Query food database API with search term
- [ ] Display search results for user selection

### 4. Product & Ingredient Display
- [ ] Fetch product data from API
- [ ] Display product name and full ingredient list in UI

### 5. Food Dye Identification
- [ ] Parse ingredient list for common artificial food dyes (Red 40, Yellow 5, etc.)
- [ ] Maintain internal database of dye names, aliases, and E-numbers
- [ ] Highlight or separately list identified dyes

### 6. Basic Ingredient Warning System
- [ ] Curate list of critical ingredients (e.g., Aspartame, HFCS)
- [ ] Map ingredients to warning messages
- [ ] Display warnings for flagged ingredients

### 7. Scan/Search History
- [ ] Store last 10-20 scanned/searched items locally (web: localStorage/IndexedDB, mobile: AsyncStorage/SQLite)
- [ ] Allow users to revisit recent items

### 8. Backend (if needed)
- [ ] Set up lightweight backend for API proxying and data normalization (Node.js + Express)
- [ ] Collect basic analytics (optional for MVP)

### 9. Out of Scope (MVP)
- [ ] No nutritional breakdown, user accounts, cloud sync, or advanced allergen tracking
- [ ] No alternative suggestions or user-submitted content
- [ ] English-only support

### 10. Success Metrics
- [ ] Track barcode scans, lookups, and ingredient identifications
- [ ] Collect basic user feedback and app usage data

---

_Reference this checklist throughout development to ensure all MVP requirements are met and to guide the transition from web prototype to mobile app._ 