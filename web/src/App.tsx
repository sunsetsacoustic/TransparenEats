import { useState, useEffect, useRef } from 'react';
import { Typography, Dialog, DialogTitle, DialogContent, DialogContentText, Box, CircularProgress, AppBar, Toolbar, Chip, Card, CardContent, CardMedia } from '@mui/material';
import Grid from '@mui/material/Grid';
import { FOOD_DYES, FLAGGED_INGREDIENTS } from './foodDyes';
import ProductCard from './components/ProductCard';
import BottomNav from './components/BottomNav';
import HistoryList from './components/HistoryList';
import SearchBar from './components/SearchBar';
import BarcodeScannerComponent, { type BarcodeScannerComponentHandle } from './components/BarcodeScannerComponent';
import type { Product, Dye, IngredientInfo } from './types';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import Button from '@mui/material/Button';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org';
const OPEN_BEAUTY_FACTS_URL = 'https://world.openbeautyfacts.org';

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
  const scannerRef = useRef<BarcodeScannerComponentHandle>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  // Products tab state
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [categoryProductsLoading, setCategoryProductsLoading] = useState(false);
  const [categoryProductsError, setCategoryProductsError] = useState<string | null>(null);

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

  const fetchProductByBarcode = async (barcode: string) => {
    setTab(0); // Immediately switch to Home tab to unmount scanner and release camera
    setLoading(true);
    setProduct(null);
    try {
      // 1. Try Nutritionix
      const nutriRes = await fetch(`${BACKEND_URL}/api/v1/nutritionix/search?query=${encodeURIComponent(barcode)}`);
      const nutriData = await nutriRes.json();
      if (nutriData && nutriData.hits && nutriData.hits.length > 0) {
        const hit = nutriData.hits[0].fields;
        const nutriProduct: Product = {
          code: barcode,
          product_name: hit.item_name,
          brands: hit.brand_name,
          ingredients_text: hit.fields.nf_ingredient_statement,
          nutriments: {
            'energy-kcal_100g': hit.fields.nf_calories,
          },
        };
        setProduct(nutriProduct);
        setSelectedHistoryProduct(nutriProduct);
        addToHistory(nutriProduct);
        setTab(0);
        setSearch('');
        setLoading(false);
        return;
      }
      // 2. Try USDA
      const usdaRes = await fetch(`${BACKEND_URL}/api/v1/usda/search?query=${encodeURIComponent(barcode)}`);
      const usdaData = await usdaRes.json();
      if (usdaData && usdaData.foods && usdaData.foods.length > 0) {
        const food = usdaData.foods[0];
        const getNutrient = (name: string) => food.foodNutrients?.find((n: any) => n.nutrientName === name)?.value;
        const usdaProduct: Product = {
          code: food.gtinUpc || food.fdcId?.toString() || barcode,
          product_name: food.description,
          brands: food.brandOwner,
          ingredients_text: food.ingredients,
          nutriments: {
            'energy-kcal_100g': getNutrient('Energy'),
            'proteins_100g': getNutrient('Protein'),
            'fat_100g': getNutrient('Total lipid (fat)'),
            'carbohydrates_100g': getNutrient('Carbohydrate, by difference'),
            'fiber_100g': getNutrient('Fiber, total dietary'),
            'sugars_100g': getNutrient('Sugars, total including NLEA'),
            'sodium_100g': getNutrient('Sodium, Na'),
          },
        };
        setProduct(usdaProduct);
        setSelectedHistoryProduct(usdaProduct);
        addToHistory(usdaProduct);
        setTab(0);
        setSearch('');
        setLoading(false);
        return;
      }
      // 3. Try Open Food Facts
      const res = await fetch(`${OPEN_FOOD_FACTS_URL}/api/v2/product/${barcode}`);
      const data = await res.json();
      if (data && data.product) {
        setProduct(data.product);
        setSelectedHistoryProduct(data.product);
        addToHistory(data.product);
        setTab(0);
        setSearch('');
        setLoading(false);
        return;
      }
      // 4. Final fallback: Open Beauty Facts
      const beautyRes = await fetch(`${OPEN_BEAUTY_FACTS_URL}/api/v2/product/${barcode}`);
      const beautyData = await beautyRes.json();
      if (beautyData && beautyData.product) {
        setProduct(beautyData.product);
        setSelectedHistoryProduct(beautyData.product);
        addToHistory(beautyData.product);
        setTab(0);
        setSearch('');
        setLoading(false);
        return;
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!search) return;
    setLoading(true);
    setSearchResults([]);
    try {
      // 1. Try Nutritionix
      const nutriRes = await fetch(`${BACKEND_URL}/api/v1/nutritionix/search?query=${encodeURIComponent(search)}`);
      const nutriData = await nutriRes.json();
      if (nutriData && nutriData.hits && nutriData.hits.length > 0) {
        const nutriProducts: Product[] = nutriData.hits.map((hit: any) => ({
          code: hit.fields.item_id || hit.fields.nix_item_id || '',
          product_name: hit.fields.item_name,
          brands: hit.fields.brand_name,
          ingredients_text: hit.fields.nf_ingredient_statement,
          nutriments: {
            'energy-kcal_100g': hit.fields.nf_calories,
          },
        }));
        setSearchResults(nutriProducts);
        setLoading(false);
        return;
      }
      // 2. Try USDA
      const usdaRes = await fetch(`${BACKEND_URL}/api/v1/usda/search?query=${encodeURIComponent(search)}`);
      const usdaData = await usdaRes.json();
      if (usdaData && usdaData.foods && usdaData.foods.length > 0) {
        const usdaProducts: Product[] = usdaData.foods.map((food: any) => {
          const getNutrient = (name: string) => food.foodNutrients?.find((n: any) => n.nutrientName === name)?.value;
          return {
            code: food.gtinUpc || food.fdcId?.toString() || '',
            product_name: food.description,
            brands: food.brandOwner,
            ingredients_text: food.ingredients,
            nutriments: {
              'energy-kcal_100g': getNutrient('Energy'),
              'proteins_100g': getNutrient('Protein'),
              'fat_100g': getNutrient('Total lipid (fat)'),
              'carbohydrates_100g': getNutrient('Carbohydrate, by difference'),
              'fiber_100g': getNutrient('Fiber, total dietary'),
              'sugars_100g': getNutrient('Sugars, total including NLEA'),
              'sodium_100g': getNutrient('Sodium, Na'),
            },
          };
        });
        setSearchResults(usdaProducts);
        setLoading(false);
        return;
      }
      // 3. Try Open Food Facts
      const res = await fetch(`${OPEN_FOOD_FACTS_URL}/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=10`);
      const data = await res.json();
      if (data && data.products) {
        setSearchResults(data.products);
        setLoading(false);
        return;
      }
      // 4. Final fallback: Open Beauty Facts
      const beautyRes = await fetch(`${OPEN_BEAUTY_FACTS_URL}/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=10`);
      const beautyData = await beautyRes.json();
      if (beautyData && beautyData.products) {
        setSearchResults(beautyData.products);
        setLoading(false);
        return;
      }
    } catch (e) {
      setLoading(false);
    }
  };

  // Stop scanner when leaving Scan tab
  useEffect(() => {
    if (tab !== 1 && scannerRef.current && typeof scannerRef.current.stopScanner === 'function') {
      scannerRef.current.stopScanner();
    }
  }, [tab]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Trigger searchProducts when debouncedSearch changes (but not on select/search button)
  useEffect(() => {
    if (debouncedSearch && debouncedSearch !== product?.product_name) {
      searchProducts();
    }
    // eslint-disable-next-line
  }, [debouncedSearch]);

  // Fetch categories on mount
  useEffect(() => {
    if (tab !== 3) return;
    setCategoriesLoading(true);
    setCategoriesError(null);
    fetch(`${BACKEND_URL}/api/off/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data.tags.slice(0, 12)); // Limit to 12 for UI
        setCategoriesLoading(false);
      })
      .catch(() => {
        setCategoriesError('Failed to load categories');
        setCategoriesLoading(false);
      });
  }, [tab]);

  // Fetch trending products on mount
  useEffect(() => {
    if (tab !== 3) return;
    setTrendingLoading(true);
    setTrendingError(null);
    fetch(`${BACKEND_URL}/api/off/popular`)
      .then(res => res.json())
      .then(data => {
        setTrending(data.products.slice(0, 8)); // Limit to 8 for UI
        setTrendingLoading(false);
      })
      .catch(() => {
        setTrendingError('Failed to load trending foods');
        setTrendingLoading(false);
      });
  }, [tab]);

  // Fetch products for selected category
  useEffect(() => {
    if (!selectedCategory) return;
    setCategoryProductsLoading(true);
    setCategoryProductsError(null);
    fetch(`https://world.openfoodfacts.org/category/${encodeURIComponent(selectedCategory)}.json`)
      .then(res => res.json())
      .then(data => {
        setCategoryProducts(data.products.slice(0, 12));
        setCategoryProductsLoading(false);
      })
      .catch(() => {
        setCategoryProductsError('Failed to load products for category');
        setCategoryProductsLoading(false);
      });
  }, [selectedCategory]);

  // Tab content rendering
  let content = null;
  if (tab === 0) {
    // Home
    content = product ? null : (
      <Box sx={{
        width: '100vw',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
        py: 6,
      }}>
        <Box sx={{
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
          p: { xs: 2, sm: 4 },
          borderRadius: 5,
          boxShadow: '0 4px 32px 0 rgba(25, 118, 210, 0.08)',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 4,
        }}>
          {/* Organic Illustration */}
          <Box sx={{ mb: 2 }}>
            <span style={{ fontSize: 56, display: 'block' }}>🥦🥕🍃</span>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: 'primary.main', fontFamily: 'Montserrat, Arial, sans-serif' }}>
            Ingredient Aware
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#4caf50', mb: 3, fontWeight: 500 }}>
            Discover what's really in your food.
          </Typography>
          {/* SearchBar with pill shape */}
          <SearchBar
            value={search}
            onChange={val => {
              if (typeof val === 'string') setSearch(val);
              else if (val && 'target' in val) setSearch(val.target.value);
            }}
            onSearch={() => { setTab(3); setTimeout(searchProducts, 0); }}
            loading={loading}
            options={searchResults}
            onSelect={prod => {
              setProduct(prod);
              setSelectedHistoryProduct(prod);
              addToHistory(prod);
              setTab(0);
              setSearch('');
            }}
            sx={{
              mb: 2,
              '& .MuiInputBase-root': {
                borderRadius: 99,
                fontSize: 18,
                px: 2,
                background: '#f8fafc',
              },
            }}
          />
          {/* Scan Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<QrCodeScannerIcon />}
            sx={{
              borderRadius: 99,
              fontWeight: 700,
              fontSize: 20,
              py: 2,
              px: 2,
              background: 'linear-gradient(90deg, #a8e063 0%, #56ab2f 100%)',
              color: '#fff',
              boxShadow: '0 2px 12px 0 rgba(76, 175, 80, 0.12)',
              mb: 2,
              mt: 1,
              transition: 'background 0.2s, box-shadow 0.2s',
              '&:hover': {
                background: 'linear-gradient(90deg, #56ab2f 0%, #a8e063 100%)',
                boxShadow: '0 4px 24px 0 rgba(76, 175, 80, 0.18)',
              },
            }}
            onClick={() => setTab(1)}
          >
            Scan Barcode
          </Button>
        </Box>
        {/* Featured Categories Card */}
        <Box sx={{
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
          mt: 2,
          p: 3,
          borderRadius: 4,
          background: 'linear-gradient(90deg, #e8f5e9 0%, #fce4ec 100%)',
          boxShadow: '0 1px 8px 0 rgba(76, 175, 80, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <span style={{ fontSize: 32 }}>🌱</span>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#388e3c' }}>
              Featured categories coming soon!
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              Explore healthy, plant-based, and trending foods soon.
            </Typography>
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
    // Products
    content = (
      <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 4, p: 3, borderRadius: 4, background: '#fff', boxShadow: '0 2px 16px 0 rgba(25, 118, 210, 0.08)' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: 'primary.main' }}>Browse Products</Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Categories</Typography>
        {categoriesLoading ? <CircularProgress /> : categoriesError ? <Typography color="error">{categoriesError}</Typography> : (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {categories.map(cat => (
              <Chip
                key={cat.id}
                label={cat.name}
                clickable
                color={selectedCategory === cat.id ? 'primary' : 'default'}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{ minWidth: 120, fontWeight: 600, fontSize: 16 }}
              />
            ))}
          </Box>
        )}
        {selectedCategory && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Products in "{categories.find(c => c.id === selectedCategory)?.name || selectedCategory}"</Typography>
            {categoryProductsLoading ? <CircularProgress /> : categoryProductsError ? <Typography color="error">{categoryProductsError}</Typography> : (
              <Grid container spacing={2}>
                {categoryProducts.map(prod => (
                  <Grid item xs={12} sm={6} md={4} key={prod.code}>
                    <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => setProduct(prod)}>
                      {prod.image_front_url && <CardMedia component="img" height="120" image={prod.image_front_url} alt={prod.product_name} />}
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{prod.product_name}</Typography>
                        <Typography variant="body2" color="text.secondary">{prod.brands}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, mt: 4 }}>Trending Foods</Typography>
        {trendingLoading ? <CircularProgress /> : trendingError ? <Typography color="error">{trendingError}</Typography> : (
          <Grid container spacing={2}>
            {trending.map(prod => (
              <Grid item xs={12} sm={6} md={3} key={prod.code}>
                <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => setProduct(prod)}>
                  {prod.image_front_url && <CardMedia component="img" height="120" image={prod.image_front_url} alt={prod.product_name} />}
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{prod.product_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{prod.brands}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
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
          </Toolbar>
        </AppBar>
        {/* Main Content */}
        <Box sx={{
          pt: { xs: 0, sm: 0 },
          pb: 0,
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