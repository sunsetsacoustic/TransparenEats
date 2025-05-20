import { useState, useEffect } from 'react';
import { Container, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, Box, CircularProgress } from '@mui/material';
import { FOOD_DYES, FLAGGED_INGREDIENTS } from './foodDyes';
import ProductCard from './components/ProductCard';
import BottomNav from './components/BottomNav';
import HistoryList from './components/HistoryList';
import SearchBar from './components/SearchBar';
import SearchResultsList from './components/SearchResultsList';
import BarcodeScannerComponent from './components/BarcodeScannerComponent';
import type { Product, Dye, IngredientInfo } from './types';

function findDyes(ingredientText: string | null | undefined): Dye[] {
  if (!ingredientText) return [];
  const lower = ingredientText.toLowerCase();
  return FOOD_DYES.filter((dye: Dye) => {
    if (lower.includes(dye.name.toLowerCase())) return true;
    if (dye.aliases.some((alias: string) => lower.includes(alias.toLowerCase()))) return true;
    if (dye.eNumbers && dye.eNumbers.some((eNum: string) => lower.includes(eNum.toLowerCase()))) return true;
    return false;
  });
}

function findFlaggedIngredients(ingredientText: string | null | undefined) {
  if (!ingredientText) return [];
  const lower = ingredientText.toLowerCase();
  return FLAGGED_INGREDIENTS.filter((item) => {
    if (lower.includes(item.name.toLowerCase())) return true;
    if (item.aliases && item.aliases.some((alias: string) => lower.includes(alias.toLowerCase()))) return true;
    return false;
  }).map(item => ({ ...item, severity: item.severity as 'critical' | 'caution' }));
}

const HISTORY_KEY = 'ingredientAwareHistory';
const HISTORY_LIMIT = 20;

export default function App() {
  const [tab, setTab] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [ingredientInfo, setIngredientInfo] = useState<IngredientInfo | null>(null);
  const [history, setHistory] = useState<Product[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure viewport meta tag for mobile scaling
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!viewport) {
      viewport = document.createElement('meta') as HTMLMetaElement;
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      document.head.appendChild(viewport);
    } else {
      viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: Product[]) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Add product to history (no duplicates, most recent first)
  const addToHistory = (prod: Product) => {
    const filtered = history.filter((h) => h.code !== prod.code);
    const newHistory = [prod, ...filtered].slice(0, HISTORY_LIMIT);
    saveHistory(newHistory);
  };

  // Fetch product by barcode from OpenFoodFacts
  const fetchProductByBarcode = async (barcode: string) => {
    setLoading(true);
    setError(null);
    setProduct(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`);
      const data = await res.json();
      if (data && data.product) {
        setProduct(data.product);
        addToHistory(data.product);
        setTab(0); // Switch to Home tab after successful scan
      } else {
        setError('Product not found.');
      }
    } catch (e) {
      setError('Error fetching product.');
    } finally {
      setLoading(false);
    }
  };

  // Search products by name from OpenFoodFacts
  const searchProducts = async () => {
    if (!search) return;
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=10`);
      const data = await res.json();
      if (data && data.products) {
        setSearchResults(data.products);
      } else {
        setError('No results found.');
      }
    } catch (e) {
      setError('Error searching products.');
    } finally {
      setLoading(false);
    }
  };

  // Tab content rendering
  let content = null;
  if (tab === 0) {
    // Home
    content = product ? (
      <ProductCard
        product={product}
        flaggedIngredients={findFlaggedIngredients(product.ingredients_text)}
        dyes={findDyes(product.ingredients_text)}
        handleIngredientClick={() => {}}
      />
    ) : (
      <Box sx={{ mt: 6, textAlign: 'center', color: '#888' }}>
        <Typography variant="h6">Scan a barcode or search for a product to get started.</Typography>
      </Box>
    );
  } else if (tab === 1) {
    // Scan
    content = (
      <BarcodeScannerComponent onDetected={fetchProductByBarcode} />
    );
  } else if (tab === 2) {
    // History
    content = (
      <HistoryList history={history} onSelect={(prod) => { setProduct(prod); setTab(0); }} />
    );
  } else if (tab === 3) {
    // Search
    content = (
      <Box>
        <SearchBar value={search} onChange={e => setSearch(e.target.value)} onSearch={searchProducts} loading={loading} />
        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        <SearchResultsList results={searchResults} onSelect={(prod) => { setProduct(prod); addToHistory(prod); setTab(0); }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{
      mt: { xs: 1, sm: 4 },
      pb: 8,
      px: { xs: 0, sm: 2 },
      width: { xs: '100vw', sm: 'auto' },
      minHeight: '100vh',
      boxSizing: 'border-box',
      background: '#fafbfc',
    }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: 22, sm: 32 }, textAlign: 'center', mt: { xs: 2, sm: 4 } }}>
        Ingredient Aware (MVP)
      </Typography>
      {content}
      <Dialog open={!!ingredientInfo} onClose={() => { setIngredientInfo(null); }} fullWidth maxWidth="xs">
        <DialogTitle>{ingredientInfo?.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {ingredientInfo?.info}
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <BottomNav value={tab} onChange={(_, v) => setTab(v)} />
    </Container>
  );
} 