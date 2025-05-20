import { useState, useEffect } from 'react';
import { Typography, Dialog, DialogTitle, DialogContent, DialogContentText, Box, CircularProgress, AppBar, Toolbar } from '@mui/material';
import { FOOD_DYES, FLAGGED_INGREDIENTS } from './foodDyes';
import ProductCard from './components/ProductCard';
import BottomNav from './components/BottomNav';
import HistoryList from './components/HistoryList';
import SearchBar from './components/SearchBar';
import SearchResultsList from './components/SearchResultsList';
import BarcodeScannerComponent from './components/BarcodeScannerComponent';
import type { Product, Dye, IngredientInfo } from './types';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import Button from '@mui/material/Button';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

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
      <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {/* Responsive Search Bar */}
        <Box sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
          <SearchBar
            value={search}
            onChange={e => setSearch(e.target.value)}
            onSearch={() => { setTab(3); setTimeout(searchProducts, 0); }}
            loading={loading}
          />
        </Box>
        {/* Scan Barcode Button */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          startIcon={<QrCodeScannerIcon />}
          sx={{
            borderRadius: 3,
            fontWeight: 700,
            fontSize: { xs: 18, sm: 20 },
            py: 1.7,
            px: 2,
            boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.08)',
            mb: 2,
            mt: 1,
            maxWidth: 400,
          }}
          onClick={() => setTab(1)}
        >
          Scan Barcode
        </Button>
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
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
      pb: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* AppBar/Header */}
      <AppBar position="fixed" color="inherit" elevation={1} sx={{
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
        borderBottom: '1px solid #e0e0e0',
        zIndex: 1201,
        width: '100vw',
        left: 0,
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 0, sm: 2 },
      }}>
        <Toolbar sx={{ minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%', maxWidth: 480, mx: 'auto', px: 2 }}>
          <EmojiFoodBeverageIcon color="primary" sx={{ fontSize: 28, mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 22, letterSpacing: 0.5, color: '#1976d2', textAlign: 'center', flex: 1 }}>
            Ingredient Aware
          </Typography>
        </Toolbar>
      </AppBar>
      {/* Main Content */}
      <Box sx={{
        pt: { xs: 10, sm: 12 },
        pb: 10,
        px: { xs: 2, sm: 0 },
        width: '100vw',
        maxWidth: '100vw',
        minHeight: '100vh',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {tab === 0 && !product ? (
          <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            {/* Responsive Search Bar */}
            <Box sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
              <SearchBar
                value={search}
                onChange={e => setSearch(e.target.value)}
                onSearch={() => { setTab(3); setTimeout(searchProducts, 0); }}
                loading={loading}
              />
            </Box>
            {/* Scan Barcode Button */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              startIcon={<QrCodeScannerIcon />}
              sx={{
                borderRadius: 3,
                fontWeight: 700,
                fontSize: { xs: 18, sm: 20 },
                py: 1.7,
                px: 2,
                boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.08)',
                mb: 2,
                mt: 1,
                maxWidth: 400,
              }}
              onClick={() => setTab(1)}
            >
              Scan Barcode
            </Button>
          </Box>
        ) : content}
        <Dialog open={!!ingredientInfo} onClose={() => { setIngredientInfo(null); }} fullWidth maxWidth="xs">
          <DialogTitle>{ingredientInfo?.name}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {ingredientInfo?.info}
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </Box>
      {/* Bottom Navigation with elevation and safe area */}
      <Box sx={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100vw',
        boxShadow: '0 -2px 12px 0 rgba(0,0,0,0.08)',
        background: '#fff',
        zIndex: 1202,
        borderTop: '1px solid #e0e0e0',
        pb: { xs: 'env(safe-area-inset-bottom)', sm: 0 },
        px: { xs: 0, sm: 0 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <BottomNav value={tab} onChange={(_, v) => setTab(v)} />
      </Box>
    </Box>
  );
} 