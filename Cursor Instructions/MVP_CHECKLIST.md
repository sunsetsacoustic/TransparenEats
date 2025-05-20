# Ingredient Aware (Food Scanner) - MVP Checklist

## Core Goal
- [x] Enable users to scan or search food items to identify artificial food dyes and receive warnings about concerning ingredients.

## Step-by-Step Checklist

### 1. Barcode Scanning
- [x] Integrate barcode scanning using device camera (web or mobile)
- [x] Decode barcode and query food database (Open Food Facts)

### 2. Manual Food Item Search
- [x] Implement input field for manual product search
- [x] Query food database API with search term
- [x] Display search results for user selection

### 3. Product & Ingredient Display
- [x] Fetch product data from API
- [x] Display product name and full ingredient list in UI

### 4. Food Dye Identification
- [x] Parse ingredient list for common artificial food dyes (Red 40, Yellow 5, etc.)
- [x] Maintain internal database of dye names, aliases, and E-numbers
- [x] Highlight or separately list identified dyes

### 5. Basic Ingredient Warning System
- [x] Curate list of critical ingredients (e.g., Aspartame, HFCS)
- [x] Map ingredients to warning messages
- [x] Display warnings for flagged ingredients

### 6. Scan/Search History
- [x] Store last 10-20 scanned/searched items locally
- [x] Allow users to revisit recent items

### 7. Technology & Data
- [x] Web: React + Material-UI, Barcode Scanner, Open Food Facts API
- [x] Backend: Node.js + Express (API proxy/normalization if needed)
- [x] Local storage for scan/search history

### 8. Out of Scope (MVP)
- [x] No nutritional breakdown, user accounts, cloud sync, or advanced allergen tracking
- [x] No alternative suggestions or user-submitted content
- [x] English-only support

### 9. Success Metrics
- [ ] Track barcode scans, lookups, and ingredient identifications
- [ ] Collect basic user feedback and app usage data

---

_Reference this checklist throughout development to ensure all MVP requirements are met._ 