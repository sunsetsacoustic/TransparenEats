# Project: Ingredient Aware (Food Scanner) - MVP Document

**Version:** 1.0  
**Date:** May 19, 2025

## 1. MVP Core Goal

To provide users with a simple way to scan food barcodes or search for food items and quickly identify the presence of common artificial food dyes and receive basic warnings about those dyes and other potentially concerning ingredients based on a predefined list.

## 2. Target User

* **Health-conscious individuals:** People actively trying to avoid specific artificial food dyes or common controversial additives.
* **Parents:** Concerned about the ingredients in food products for their children, particularly relating to food dyes and their potential effects.
* **Individuals with specific sensitivities:** Users who need to avoid specific ingredients (e.g., Red 40) for health reasons.

## 3. Key MVP Features

### 3.1. Barcode Scanning
* **Description:** Users can scan UPC/EAN barcodes on food packaging using their device's camera.
* **Technology:** Integrate a barcode scanning SDK or web camera solution.
* **Outcome:** Barcode is decoded and used to query the food database.

### 3.2. Manual Food Item Search
* **Description:** Users can manually type the name of a food product if a barcode is unavailable or unscannable.
* **Technology:** Input field that queries the chosen food database API.
* **Outcome:** User selects a product from search results to view its details.

### 3.3. Product & Ingredient Display
* **Description:** Upon successful scan or search, the app displays the product name and its full ingredient list as provided by the API.
* **Technology:** API integration to fetch product data with clean UI presentation.
* **Outcome:** User can read the complete ingredient list.

### 3.4. Food Dye Identification
* **Description:** The app parses the ingredient list to identify predefined common artificial food dyes (e.g., Red 40, Yellow 5, Yellow 6, Blue 1, Green 3, Red 3).
* **Technology:** Internal database of food dyes including aliases (e.g., "Allura Red" for Red 40) and E-numbers with string matching algorithms.
* **Outcome:** Identified dyes are highlighted or listed separately for quick reference.

### 3.5. Basic Ingredient Warning System
* **Description:** For identified food dyes and a curated list of critical ingredients (e.g., "Aspartame," "High Fructose Corn Syrup"), the app displays concise, informational warnings.
* **Technology:** Internal mapping database connecting ingredients to their respective warnings.
* **Outcome:** User receives contextual alerts about potentially concerning ingredients based on the predefined list.

### 3.6. Scan History
* **Description:** The app locally stores the last 10-20 scanned/searched items for quick reference.
* **Technology:** Local device storage (localStorage for web, SQLite/AsyncStorage for mobile).
* **Outcome:** Users can revisit recently viewed items without re-scanning/searching.

## 4. Technology Stack & Implementation

### 4.1. Web Development
* **Frontend:** React + Material-UI
* **Barcode Scanning:** react-qr-barcode-scanner or similar
* **API:** Open Food Facts (free, extensive, user-contributed)
* **Backend:** Node.js + Express (for proxying/normalization if needed)

### 4.2. Data Sources
* **Food Product Database API:**
  * **Primary:** Open Food Facts
* **Ingredient Database:**
  * Curated internal list of food dyes with US & EU naming conventions
  * ~10 other "flagged" ingredients with standardized warning messages
  * Sources: FDA guidelines, CSPI, EWG (publicly available information)

### 4.3. Storage & Persistence
* Local storage for scan/search history and warnings
* No cloud synchronization for MVP phase

## 5. Non-Goals for MVP (Future Roadmap)

* Full nutritional breakdown (calories, macros, micronutrients)
* Advanced allergen tracking or custom user allergen profiles
* User accounts or cloud synchronization
* "Safe Alternative" product suggestions
* User-submitted content, reviews, or ratings
* Extensive scientific explanations or research links
* Comprehensive coverage of all controversial ingredients
* Multiple language support (English-only MVP)

## 6. Success Metrics

* **Quantitative:**
  * Number of successful barcode scans and product lookups
  * Percentage of scans where target ingredients are identified
  * User retention after 1 week / 1 month (basic analytics)
  * App launch frequency per user
* **Qualitative:**
  * User surveys focusing on accuracy, usability, and perceived value
  * App Store ratings/reviews
  * Feedback collection through in-app mechanism

## 7. Post-MVP Roadmap

* Expanded ingredient database with more additives and preservatives
* UI/UX refinements based on initial user feedback
* Offline mode with basic functionality
* User profiles with personalized ingredient avoidance lists
* Full nutritional information display
* "Free From" categorization and advanced allergen flagging
* Social sharing capabilities
* Machine learning for ingredient image recognition (label photos)
* Integration with shopping lists and meal planning
* Product recommendation engine for alternatives
* Premium subscription model for advanced features