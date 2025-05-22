# TransparenEats

![TransparenEats Logo](https://via.placeholder.com/150x150.png?text=TransparenEats)

## About

TransparenEats is a web application that helps users identify what's really in their food and personal care products. By scanning barcodes or searching for products, users can quickly check ingredients, view nutritional information, and get alerts about potentially concerning additives like artificial food dyes.

## Features

### Core Features

- **Barcode Scanner** - Scan product barcodes using your device's camera
- **Product Search** - Search for products by name or keywords
- **Ingredient Analysis** - Automatically identifies concerning ingredients:
  - Artificial food dyes (Red 40, Yellow 5, etc.)
  - Potentially harmful additives and preservatives
  - Ingredients that may cause adverse reactions
- **Scan History** - View your previously scanned products
- **Browse Products** - Explore products by category
- **Trending Products** - See popular food products

### Technical Features

- **Multi-API Integration**:
  - OpenFoodFacts database
  - OpenBeautyFacts database
  - USDA FoodData Central
  - Nutritionix API
- **Responsive Design** - Works seamlessly across mobile and desktop devices
- **Progressive Web App (PWA)** - Install on home screen for app-like experience
- **Real-time Barcode Detection** - Fast and accurate barcode scanning
- **Offline Support** - Basic functionality works without internet connection

## Screenshots

*[Insert screenshots of key screens here]*

## Tech Stack

### Frontend
- React with TypeScript
- Material UI (MUI) for components
- Vite for build tooling
- HTML5-QRCode for barcode scanning

### Backend
- Node.js with Express
- REST API architecture
- Proxy service for third-party API integrations

## Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/TransparenEats.git
cd TransparenEats
```

2. Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
cd web
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
Create a `.env` file in the web directory with the following variables:
```
VITE_BACKEND_URL=http://localhost:3000
```

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in a new terminal)
cd web
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage Guide

### Scanning Products
1. Click the "Scan Product Barcode" button on the home screen
2. Position the barcode within the scan frame
3. The app will automatically detect and process the barcode
4. View detailed product information and ingredient analysis

### Searching Products
1. Use the search bar at the top of the home screen
2. Enter product name or keywords
3. Select a product from the search results
4. View detailed product information and ingredient analysis

### Browsing Products
1. Navigate to the "Browse" tab
2. Select a category or view trending products
3. Click on any product to view details

### Viewing History
1. Navigate to the "History" tab
2. See all previously scanned or searched products
3. Click on any product to view its details again

## API Integration

TransparenEats integrates with multiple food databases to provide comprehensive information:

- **OpenFoodFacts** - Primary database for packaged food products
- **OpenBeautyFacts** - For personal care and beauty products
- **USDA FoodData Central** - For detailed nutritional information
- **Nutritionix** - For additional product data

## Deployment

The application can be deployed on any hosting service that supports Node.js:

1. Build the frontend:
```bash
cd web
npm run build
```

2. Deploy the backend and the frontend build directory to your hosting service

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Open Food Facts for their open database
- Material UI for the component library
- All contributors who have helped improve the app 