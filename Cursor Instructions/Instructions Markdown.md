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

## 8. Visual Walkthrough

### Step 1: Home Screen
- User is greeted with a clean interface featuring two tabs: "Search" and "History".
- Prominent title: "Ingredient Aware (MVP)".

### Step 2: Barcode Scanning
- User clicks the barcode scanner area or holds a product barcode up to their device camera.
- The scanner detects the barcode and automatically fetches product data.
- Loading spinner appears while fetching.

### Step 3: Manual Search
- User types a product name into the search field and clicks "Search".
- A list of matching products appears; user selects one to view details.

### Step 4: Product & Ingredient Display
- Product name and ingredient list are shown in a glassy, modern card.
- Each ingredient is displayed as a clickable pill.
- Artificial food dyes are highlighted (e.g., with a 🎨 icon and colored background).
- Flagged ingredients show a warning (e.g., ⚠️ icon and warning color).

### Step 5: Ingredient Details
- Clicking an ingredient pill opens a dialog with:
  - The ingredient name
  - A warning or note if it is a dye or flagged ingredient
  - Otherwise, a generic message: "No additional information available."

### Step 6: History
- The "History" tab shows the last 10-20 scanned/searched products.
- User can click any item to revisit its details instantly.

---

## 9. Demo Script

**1. Start the App**
- "Let's open Ingredient Aware. Notice the simple, clean interface with Search and History tabs."

**2. Scan a Barcode**
- "I'll scan a food product barcode using my device's camera."
- (Hold up a barcode; wait for detection)
- "The app instantly fetches the product and displays its name and full ingredient list."

**3. Highlighted Ingredients**
- "Notice how artificial food dyes are highlighted with a paint palette icon, and flagged ingredients show a warning."
- (Click a dye or flagged ingredient pill)
- "Clicking an ingredient shows a dialog with a warning or note."

**4. Manual Search**
- "If I don't have a barcode, I can search by product name."
- (Type a product name, select from results)
- "Again, the ingredient list is shown, with dyes and flagged ingredients highlighted."

**5. History**
- "The History tab lets me revisit my last 10-20 scans or searches. I can click any to view details again."

**6. Privacy and Simplicity**
- "All data is stored locally. No AI, no cloud sync, just fast, private ingredient transparency."

---

_This walkthrough and script can be used for demos, onboarding, or user testing._