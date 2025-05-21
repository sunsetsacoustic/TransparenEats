import { useState, useEffect, useRef } from 'react';
import { Typography, Dialog, DialogTitle, DialogContent, DialogContentText, Box, CircularProgress, AppBar, Toolbar, MenuItem, Select, FormControl, InputLabel, DialogActions } from '@mui/material';
import { FOOD_DYES, FLAGGED_INGREDIENTS } from './foodDyes';
import ProductCard from './components/ProductCard';
import BottomNav from './components/BottomNav';
import HistoryList from './components/HistoryList';
import SearchBar from './components/SearchBar';
import SearchResultsList from './components/SearchResultsList';
import BarcodeScannerComponent, { type BarcodeScannerComponentHandle } from './components/BarcodeScannerComponent';
import type { Product, Dye, IngredientInfo } from './types';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import Button from '@mui/material/Button';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ProductUploadDialog from './components/ProductUploadDialog';

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
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState<Product | null>(null);
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
  const scannerRef = useRef<BarcodeScannerComponentHandle>(null);
  const [productType, setProductType] = useState<'food' | 'cosmetics' | 'cleaning'>('food');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

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

  // Helper to get API base URL
  const getApiBaseUrl = () => {
    if (productType === 'cosmetics') return 'https://world.openbeautyfacts.org';
    if (productType === 'cleaning') return 'https://world.openproductsfacts.org';
    return 'https://world.openfoodfacts.org';
  };

  // Show upload dialog when product not found
  useEffect(() => {
    if (error === 'Product not found.' && pendingBarcode) {
      setShowUploadDialog(true);
    }
  }, [error, pendingBarcode]);

  // Modified fetchProductByBarcode to set pendingBarcode
  const fetchProductByBarcode = async (barcode: string) => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setPendingBarcode(barcode);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v2/product/${barcode}`);
      const data = await res.json();
      if (data && data.product) {
        setProduct(data.product);
        addToHistory(data.product);
        setTab(0); // Switch to Home tab after successful scan
        setPendingBarcode(null);
      } else {
        setError('Product not found.');
      }
    } catch (e) {
      setError('Error fetching product.');
    } finally {
      setLoading(false);
    }
  };

  // Search products by name from selected API
  const searchProducts = async () => {
    if (!search) return;
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const res = await fetch(`${getApiBaseUrl()}/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=10`);
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

  // Stop scanner when leaving Scan tab
  useEffect(() => {
    if (tab !== 1 && scannerRef.current && typeof scannerRef.current.stopScanner === 'function') {
      scannerRef.current.stopScanner();
    }
  }, [tab]);

  // Upload handler for ProductUploadDialog
  const handleProductUpload = async (form: {
    barcode: string;
    product_name: string;
    ingredients_text: string;
    image_front?: File;
    image_ingredients?: File;
    image_nutrition?: File;
  }) => {
    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadStatus('Uploading product data...');
    try {
      // 1. Upload product data and images as FormData to backend
      const formData = new FormData();
      formData.append('barcode', form.barcode);
      formData.append('product_name', form.product_name);
      formData.append('ingredients_text', form.ingredients_text);
      if (form.image_front) formData.append('image_front', form.image_front);
      if (form.image_ingredients) formData.append('image_ingredients', form.image_ingredients);
      if (form.image_nutrition) formData.append('image_nutrition', form.image_nutrition);
      const productRes = await fetch('/api/v1/uploadProduct', {
        method: 'POST',
        body: formData,
      });
      setUploadStatus('Processing images...');
      const productData = await productRes.json();
      if (!productData.success) {
        throw new Error(productData.error || 'Failed to upload product data.');
      }
      setUploadSuccess(true);
      setShowUploadDialog(false);
      setError(null);
      setPendingBarcode(null);
      setUploadStatus(null);
    } catch (e: any) {
      setUploadError(e.message || 'Failed to upload product.');
      setUploadStatus(null);
    } finally {
      setUploadLoading(false);
    }
  };

  // Tab content rendering
  let content = null;
  if (tab === 0) {
    // Home
    content = product ? null : (
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
        {/* Error message if product not found and upload dialog is not open */}
        {error && !showUploadDialog && (
          <Typography color="error" sx={{ mt: 2, mb: 1, textAlign: 'center' }}>{error}</Typography>
        )}
        {/* Featured categories placeholder */}
        <Box sx={{ width: '100%', maxWidth: 400, mt: 2, mb: 2 }}>
          <Box sx={{
            background: 'linear-gradient(90deg, #e3f2fd 0%, #fce4ec 100%)',
            borderRadius: 3,
            p: 2,
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            fontWeight: 500,
            fontSize: 18,
            boxShadow: '0 1px 4px 0 rgba(25, 118, 210, 0.06)',
          }}>
            <span>🌟 Featured categories coming soon!</span>
          </Box>
        </Box>
      </Box>
    );
  } else if (tab === 1) {
    // Scan
    content = (
      <BarcodeScannerComponent ref={scannerRef} onDetected={fetchProductByBarcode} autoStart={true} />
    );
  } else if (tab === 2) {
    // History
    content = (
      <HistoryList history={history} onSelect={(prod) => setSelectedHistoryProduct(prod)} />
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
      position: 'relative',
      pb: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      '::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23e3f2fd\'/%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'2\' fill=\'%23bbdefb\'/%3E%3C/svg%3E")',
        opacity: 0.15,
        zIndex: 0,
      },
    }}>
      <Box sx={{ position: 'relative', zIndex: 1, width: '100vw', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: 24, letterSpacing: 1, color: 'primary.main', textAlign: 'center', flex: 1, fontFamily: 'Montserrat, Arial, sans-serif', textShadow: '0 2px 8px #e3f2fd' }}>
              Ingredient Aware
            </Typography>
          </Toolbar>
          {/* Product Type Selector */}
          <FormControl size="small" sx={{ minWidth: 160, position: 'absolute', right: 24, top: 10 }}>
            <InputLabel id="product-type-label">Product Type</InputLabel>
            <Select
              labelId="product-type-label"
              id="product-type-select"
              value={productType}
              label="Product Type"
              onChange={e => setProductType(e.target.value as 'food' | 'cosmetics' | 'cleaning')}
            >
              <MenuItem value="food">Food</MenuItem>
              <MenuItem value="cosmetics">Cosmetics</MenuItem>
              <MenuItem value="cleaning">Cleaning</MenuItem>
            </Select>
          </FormControl>
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
          {content}
          {/* Product Upload Dialog */}
          <ProductUploadDialog
            open={showUploadDialog}
            barcode={pendingBarcode || ''}
            onClose={() => { setShowUploadDialog(false); setError(null); setPendingBarcode(null); }}
            onSubmit={handleProductUpload}
            loading={uploadLoading}
            error={uploadError}
            statusMessage={uploadStatus}
          />
          {/* Upload Success Message */}
          {uploadSuccess && (
            <Dialog open onClose={() => setUploadSuccess(false)}>
              <DialogTitle>Thank you!</DialogTitle>
              <DialogContent>
                <Typography>Product submitted successfully. It will appear in the database after review.</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setUploadSuccess(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          )}
          <Dialog open={!!ingredientInfo} onClose={() => { setIngredientInfo(null); }} fullWidth maxWidth="xs">
            <DialogTitle>{ingredientInfo?.name}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {ingredientInfo?.info}
              </DialogContentText>
            </DialogContent>
          </Dialog>
          {/* Product details dialog for history */}
          <Dialog open={!!selectedHistoryProduct} onClose={() => setSelectedHistoryProduct(null)} fullWidth maxWidth="sm">
            {selectedHistoryProduct ? (
              <ProductCard
                product={selectedHistoryProduct}
                flaggedIngredients={findFlaggedIngredients(selectedHistoryProduct.ingredients_text)}
                dyes={findDyes(selectedHistoryProduct.ingredients_text)}
                handleIngredientClick={() => {}}
              />
            ) : null}
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
    </Box>
  );
} 