console.log('content.js loaded');

// Set the correct API base URL for product admin
document.addEventListener('DOMContentLoaded', () => {
  // If we're on the products admin page
  if (window.location.pathname.includes('products-admin')) {
    // Override any hardcoded URLs to ensure they use the correct domain
    window.API_BASE_URL = 'https://transpareneats.onrender.com/api/v1/products';
    console.log('Product admin API URL set to:', window.API_BASE_URL);
  }
}); 