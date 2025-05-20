import React, { useState, useEffect } from 'react';
import BarcodeScannerComponent from './components/BarcodeScannerComponent';
import { Container, Typography, Box, CircularProgress, Paper, TextField, Button, List, ListItem, ListItemButton, ListItemText, Chip } from '@mui/material';
import { FOOD_DYES, CRITICAL_INGREDIENTS } from './foodDyes';
import type { ChangeEvent } from 'react';

const HISTORY_KEY = 'ingredientAwareHistory';
const HISTORY_LIMIT = 20;

function saveToHistory(product: any) {
  if (!product || !product.code) return;
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  // Remove if already exists
  history = history.filter((item: any) => item.code !== product.code);
  // Add to front
  history.unshift({
    code: product.code,
    product_name: product.product_name,
    brands: product.brands,
    ingredients_text: product.ingredients_text
  });
  // Limit history
  if (history.length > HISTORY_LIMIT) history = history.slice(0, HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function loadHistory(): any[] {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function fetchProductByBarcode(barcode: string) {
  // Open Food Facts API for product by barcode
  return fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    .then(res => res.json());
}

function searchProductsByName(query: string) {
  // Open Food Facts API for product search
  return fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`)
    .then(res => res.json());
}

function findDyes(ingredientText: string | null | undefined) {
  if (!ingredientText) return [];
  const lower = ingredientText.toLowerCase();
  return FOOD_DYES.filter(dye => {
    if (lower.includes(dye.name.toLowerCase())) return true;
    if (dye.aliases.some((alias: string) => lower.includes(alias.toLowerCase()))) return true;
    if (dye.eNumbers.some((eNum: string) => lower.includes(eNum.toLowerCase()))) return true;
    return false;
  });
}

function findFlaggedIngredients(ingredientText: string | null | undefined) {
  if (!ingredientText) return [];
  const lower = ingredientText.toLowerCase();
  return CRITICAL_INGREDIENTS.filter(ing => {
    if (lower.includes(ing.name.toLowerCase())) return true;
    if (ing.aliases.some((alias: string) => lower.includes(alias.toLowerCase()))) return true;
    return false;
  });
}

export default function App() {
  const [barcode, setBarcode] = useState<string>('');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleDetected = async (code: string) => {
    setBarcode(code);
    setProduct(null);
    setError(null);
    setLoading(true);
    try {
      const data = await fetchProductByBarcode(code);
      if (data.status === 1) {
        setProduct(data.product);
        saveToHistory(data.product);
        setHistory(loadHistory());
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

  const handleSelectProduct = (prod: any) => {
    setProduct(prod);
    setSearchResults([]);
    setError(null);
    saveToHistory(prod);
    setHistory(loadHistory());
  };

  const dyes = product ? findDyes(product.ingredients_text) : [];
  const flaggedIngredients = product ? findFlaggedIngredients(product.ingredients_text) : [];

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
      <Box mb={2}>
        <Button variant="outlined" onClick={() => setHistoryOpen(h => !h)} sx={{ mb: 1 }}>
          {historyOpen ? 'Hide' : 'Show'} Scan/Search History
        </Button>
        {historyOpen && history.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Recent Scans/Searches:</Typography>
            <List>
              {history.map((item, idx) => (
                <ListItem key={item.code || idx} disablePadding>
                  <ListItemButton onClick={() => handleSelectProduct(item)}>
                    <ListItemText
                      primary={item.product_name || 'No name'}
                      secondary={item.brands}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {product && (
        <Paper sx={{
          p: 2,
          mt: 2,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
          backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.18)',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{product.product_name || 'No name'}</Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Ingredients:</Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              maxHeight: 120,
              overflowY: 'auto',
              mb: 2,
              p: 1,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            {(() => {
              // Split ingredients by comma, semicolon, or period
              const text = product.ingredients_text || '';
              const items = text.split(/,|;|\./).map(i => i.trim()).filter(Boolean);
              return items.map((ing, idx) => {
                const isFlagged = flaggedIngredients.some(f => ing.toLowerCase().includes(f.name.toLowerCase()) || f.aliases.some(a => ing.toLowerCase().includes(a.toLowerCase())));
                const isDye = dyes.some(d => ing.toLowerCase().includes(d.name.toLowerCase()) || d.aliases.some(a => ing.toLowerCase().includes(a.toLowerCase())) || d.eNumbers.some(e => ing.toLowerCase().includes(e.toLowerCase())));
                return (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 14px',
                      margin: '2px',
                      borderRadius: 16,
                      fontWeight: 500,
                      fontSize: 15,
                      background: isFlagged
                        ? 'linear-gradient(90deg, #ffb347 0%, #ff5252 100%)'
                        : isDye
                        ? 'linear-gradient(90deg, #ffe259 0%, #ffa751 100%)'
                        : 'rgba(255,255,255,0.13)',
                      color: isFlagged || isDye ? '#222' : '#fff',
                      boxShadow: isFlagged || isDye ? '0 2px 8px rgba(255,82,82,0.12)' : 'none',
                      border: isFlagged ? '2px solid #ff5252' : isDye ? '2px solid #ffa751' : 'none',
                      transition: 'background 0.3s',
                    }}
                  >
                    {isFlagged && <span style={{ marginRight: 6, fontSize: 18 }}>⚠️</span>}
                    {isDye && !isFlagged && <span style={{ marginRight: 6, fontSize: 18 }}>🎨</span>}
                    {ing}
                  </span>
                );
              });
            })()}
          </Box>
          {flaggedIngredients.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="error.main">Ingredient Warnings:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {flaggedIngredients.map(ing => (
                  <Chip key={ing.name} label={ing.warning} color="error" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
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