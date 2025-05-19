import React, { useState } from 'react';
import BarcodeScannerComponent from './components/BarcodeScannerComponent';
import { Container, Typography, Box, CircularProgress, Paper, TextField, Button, List, ListItem, ListItemButton, ListItemText, Chip } from '@mui/material';
import { FOOD_DYES } from './foodDyes';

function fetchProductByBarcode(barcode) {
  // Open Food Facts API for product by barcode
  return fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    .then(res => res.json());
}

function searchProductsByName(query) {
  // Open Food Facts API for product search
  return fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`)
    .then(res => res.json());
}

function findDyes(ingredientText) {
  if (!ingredientText) return [];
  const lower = ingredientText.toLowerCase();
  return FOOD_DYES.filter(dye => {
    if (lower.includes(dye.name.toLowerCase())) return true;
    if (dye.aliases.some(alias => lower.includes(alias.toLowerCase()))) return true;
    if (dye.eNumbers.some(eNum => lower.includes(eNum.toLowerCase()))) return true;
    return false;
  });
}

export default function App() {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  const handleSearch = async () => {
    setProduct(null);
    setError(null);
    setSearchResults([]);
    setSearching(true);
    try {
      const data = await searchProductsByName(search);
      if (data.products && data.products.length > 0) {
        setSearchResults(data.products);
      } else {
        setError('No products found.');
      }
    } catch (e) {
      setError('Error searching for products.');
    }
    setSearching(false);
  };

  const handleSelectProduct = (prod) => {
    setProduct(prod);
    setSearchResults([]);
    setError(null);
  };

  const dyes = product ? findDyes(product.ingredients_text) : [];

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Ingredient Aware (MVP)</Typography>
      <Box mb={2}>
        <BarcodeScannerComponent onDetected={handleDetected} />
      </Box>
      <Box mb={2}>
        <TextField
          label="Search for a food item"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          sx={{ mb: 1 }}
        />
        <Button variant="contained" onClick={handleSearch} disabled={!search || searching}>
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </Box>
      {searchResults.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1">Search Results:</Typography>
          <List>
            {searchResults.map((prod, idx) => (
              <ListItem key={prod.code || idx} disablePadding>
                <ListItemButton onClick={() => handleSelectProduct(prod)}>
                  <ListItemText
                    primary={prod.product_name || 'No name'}
                    secondary={prod.brands}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {product && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">{product.product_name || 'No name'}</Typography>
          <Typography variant="subtitle1">Ingredients:</Typography>
          <Typography variant="body2">{product.ingredients_text || 'No ingredient info'}</Typography>
          {dyes.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="warning.main">Identified Food Dyes:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {dyes.map(dye => (
                  <Chip key={dye.name} label={dye.name} color="warning" />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
} 