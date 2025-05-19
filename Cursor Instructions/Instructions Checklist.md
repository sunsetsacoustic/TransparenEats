# Ingredient Aware (Food Scanner) - MVP Checklist

## Core Goal
- [ ] Enable users to scan or search food items to identify artificial food dyes and receive warnings about concerning ingredients.

## Step-by-Step Checklist

### 1. Barcode Scanning
- [ ] Integrate barcode scanning using device camera (SDK or native solution)
- [ ] Decode barcode and query food database

### 2. Manual Food Item Search
- [ ] Implement input field for manual product search
- [ ] Query food database API with search term
- [ ] Display search results for user selection

### 3. Product & Ingredient Display
- [ ] Fetch product data from API
- [ ] Display product name and full ingredient list in UI

### 4. Food Dye Identification
- [ ] Parse ingredient list for common artificial food dyes (Red 40, Yellow 5, etc.)
- [ ] Maintain internal database of dye names, aliases, and E-numbers
- [ ] Highlight or separately list identified dyes

### 5. Basic Ingredient Warning System
- [ ] Curate list of critical ingredients (e.g., Aspartame, HFCS)
- [ ] Map ingredients to warning messages
- [ ] Display warnings for flagged ingredients

### 6. Scan/Search History
- [ ] Store last 10-20 scanned/searched items locally
- [ ] Allow users to revisit recent items

### 7. Technology & Data
- [ ] Choose mobile framework (Native, React Native, or Flutter)
- [ ] Integrate with Open Food Facts API (or alternative)
- [ ] Build internal ingredient/dye database
- [ ] Implement local storage (SQLite/CoreData/SharedPreferences)

### 8. Backend (if needed)
- [ ] Set up lightweight backend for API proxying and data normalization
- [ ] Collect basic analytics (optional for MVP)

### 9. Out of Scope (MVP)
- [ ] No nutritional breakdown, user accounts, cloud sync, or advanced allergen tracking
- [ ] No alternative suggestions or user-submitted content
- [ ] English-only support

### 10. Success Metrics
- [ ] Track barcode scans, lookups, and ingredient identifications
- [ ] Collect basic user feedback and app usage data

---

_Reference this checklist throughout development to ensure all MVP requirements are met._ 