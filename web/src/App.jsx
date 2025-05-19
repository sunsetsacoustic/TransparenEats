import React, { useState } from 'react';
import BarcodeScannerComponent from './components/BarcodeScannerComponent';
import { Container, Typography, Box, CircularProgress, Paper } from '@mui/material';

function fetchProductByBarcode(barcode) {
  // Open Food Facts API for product by barcode
  return fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    .then(res => res.json());
}

export default function App() {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDetected = async (code) => {
    setBarcode(code);
    setProduct(null);
    setError(null);
    setLoading(true);
    try {
      const data = await fetchProductByBarcode(code);
      if (data.status === 1) {
        setProduct(data.product);
      } else {
        setError('Product not found.');
      }
    } catch (e) {
      setError('Error fetching product.');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Ingredient Aware (MVP)</Typography>
      <Box mb={2}>
        <BarcodeScannerComponent onDetected={handleDetected} />
      </Box>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {product && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">{product.product_name || 'No name'}</Typography>
          <Typography variant="subtitle1">Ingredients:</Typography>
          <Typography variant="body2">{product.ingredients_text || 'No ingredient info'}</Typography>
        </Paper>
      )}
    </Container>
  );
} 