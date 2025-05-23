import { useState, useEffect, useRef } from 'react';
import { Typography, Dialog, DialogContent, DialogContentText, Box, CircularProgress, Chip, Card, CardContent, CardMedia } from '@mui/material';
import Grid from '@mui/material/Grid';
import { FOOD_DYES, FLAGGED_INGREDIENTS } from './foodDyes';
import ProductCard from './components/ProductCard';
import BottomNav from './components/BottomNav';
import HistoryList from './components/HistoryList';
import SearchBar from './components/SearchBar';
import BarcodeScannerComponent, { type BarcodeScannerComponentHandle } from './components/BarcodeScannerComponent';
import type { Product, Dye, IngredientInfo } from './types';
import Button from '@mui/material/Button';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import WarningIcon from '@mui/icons-material/Warning';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
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
  // Admin menu state
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const adminMenuOpen = Boolean(adminMenuAnchor);
  const [adminPasswordDialogOpen, setAdminPasswordDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState(false);
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
      try {
        const nutriRes = await fetch(`${BACKEND_URL}/api/v1/nutritionix/search?query=${encodeURIComponent(barcode)}`);
        if (nutriRes.ok) {
          const nutriData = await nutriRes.json();
          if (nutriData && nutriData.hits && nutriData.hits.length > 0) {
            const hit = nutriData.hits[0].fields;
            const nutriProduct: Product = {
              code: barcode,
              product_name: hit.item_name,
              brands: hit.brand_name,
              ingredients_text: hit.nf_ingredient_statement,
              nutriments: {
                'energy-kcal_100g': hit.fields.nf_calories,
              },
              // Nutritionix is primarily US-based
              countries: 'United States',
              countries_tags: ['en:united-states'],
            };
            setProduct(nutriProduct);
            setSelectedHistoryProduct(nutriProduct);
            addToHistory(nutriProduct);
            setTab(0);
            setSearch('');
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Nutritionix barcode search failed:', e);
        // Continue to next API
      }
      
      // 2. Try USDA
      try {
        const usdaRes = await fetch(`${BACKEND_URL}/api/v1/usda/search?query=${encodeURIComponent(barcode)}`);
        if (usdaRes.ok) {
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
              // USDA is US-specific
              countries: 'United States',
              countries_tags: ['en:united-states'],
            };
            setProduct(usdaProduct);
            setSelectedHistoryProduct(usdaProduct);
            addToHistory(usdaProduct);
            setTab(0);
            setSearch('');
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('USDA barcode search failed:', e);
        // Continue to next API
      }
      
      // 3. Try Open Food Facts - look for US product first
      try {
        const res = await fetch(`${OPEN_FOOD_FACTS_URL}/api/v2/product/${barcode}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.product) {
            // Check if this is a US product
            const isUSProduct = data.product.countries_tags && 
              Array.isArray(data.product.countries_tags) &&
              data.product.countries_tags.some((c: string) => c.includes('united-states'));
            
            // If not a US product, try to find a US version
            if (!isUSProduct) {
              try {
                const usSearchRes = await fetch(`${OPEN_FOOD_FACTS_URL}/cgi/search.pl?search_terms=${encodeURIComponent(barcode)}&search_simple=1&action=process&json=1&tagtype_0=countries&tag_contains_0=contains&tag_0=united-states`);
                if (usSearchRes.ok) {
                  const usSearchData = await usSearchRes.json();
                  if (usSearchData && usSearchData.products && usSearchData.products.length > 0) {
                    // Use the US version instead
                    setProduct(usSearchData.products[0]);
                    setSelectedHistoryProduct(usSearchData.products[0]);
                    addToHistory(usSearchData.products[0]);
                    setTab(0);
                    setSearch('');
                    setLoading(false);
                    return;
                  }
                }
              } catch (usSearchErr) {
                console.log('US product search failed:', usSearchErr);
              }
            }
            
            // If we're here, either it's a US product or we couldn't find a US version
            setProduct(data.product);
            setSelectedHistoryProduct(data.product);
            addToHistory(data.product);
            setTab(0);
            setSearch('');
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Open Food Facts barcode search failed:', e);
        // Continue to next API
      }
      
      // 4. Final fallback: Open Beauty Facts - prefer US products
      try {
        const beautyRes = await fetch(`${OPEN_BEAUTY_FACTS_URL}/api/v2/product/${barcode}`);
        if (beautyRes.ok) {
          const beautyData = await beautyRes.json();
          if (beautyData && beautyData.product) {
            // Check if this is a US product
            const isUSProduct = beautyData.product.countries_tags && 
              Array.isArray(beautyData.product.countries_tags) &&
              beautyData.product.countries_tags.some((c: string) => c.includes('united-states'));
            
            // If not a US product, try to find a US version
            if (!isUSProduct) {
              try {
                const usSearchRes = await fetch(`${OPEN_BEAUTY_FACTS_URL}/cgi/search.pl?search_terms=${encodeURIComponent(barcode)}&search_simple=1&action=process&json=1&tagtype_0=countries&tag_contains_0=contains&tag_0=united-states`);
                if (usSearchRes.ok) {
                  const usSearchData = await usSearchRes.json();
                  if (usSearchData && usSearchData.products && usSearchData.products.length > 0) {
                    // Use the US version instead
                    setProduct(usSearchData.products[0]);
                    setSelectedHistoryProduct(usSearchData.products[0]);
                    addToHistory(usSearchData.products[0]);
                    setTab(0);
                    setSearch('');
                    setLoading(false);
                    return;
                  }
                }
              } catch (usSearchErr) {
                console.log('US product search failed:', usSearchErr);
              }
            }
            
            setProduct(beautyData.product);
            setSelectedHistoryProduct(beautyData.product);
            addToHistory(beautyData.product);
            setTab(0);
            setSearch('');
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Open Beauty Facts barcode search failed:', e);
      }
      
      // If we got here, no product was found
      setLoading(false);
    } catch (e) {
      console.error('Product barcode search failed:', e);
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!search) return;
    setLoading(true);
    setSearchResults([]);
    try {
      // 1. Try Nutritionix
      try {
        const nutriRes = await fetch(`${BACKEND_URL}/api/v1/nutritionix/search?query=${encodeURIComponent(search)}`);
        if (nutriRes.ok) {
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
              // Nutritionix is primarily US-based
              countries: 'United States',
              countries_tags: ['en:united-states'],
            }));
            setSearchResults(nutriProducts);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Nutritionix search failed:', e);
        // Continue to next API
      }
      
      // 2. Try USDA
      try {
        const usdaRes = await fetch(`${BACKEND_URL}/api/v1/usda/search?query=${encodeURIComponent(search)}`);
        if (usdaRes.ok) {
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
                // USDA is US-specific
                countries: 'United States',
                countries_tags: ['en:united-states'],
              };
            });
            setSearchResults(usdaProducts);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('USDA search failed:', e);
        // Continue to next API
      }
      
      // 3. Try Open Food Facts (with US filter)
      try {
        const res = await fetch(`${OPEN_FOOD_FACTS_URL}/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=20&tagtype_0=countries&tag_contains_0=contains&tag_0=united-states`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.products) {
            // Filter to ensure only US products
            const usProducts = data.products.filter((p: any) => {
              const countries = (p.countries_tags || []);
              return countries.some((c: string) => c.includes('united-states'));
            });
            setSearchResults(usProducts);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Open Food Facts search failed:', e);
        // Continue to next API
      }
      
      // 4. Final fallback: Open Beauty Facts (with US filter)
      try {
        const beautyRes = await fetch(`${OPEN_BEAUTY_FACTS_URL}/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=20&tagtype_0=countries&tag_contains_0=contains&tag_0=united-states`);
        if (beautyRes.ok) {
          const beautyData = await beautyRes.json();
          if (beautyData && beautyData.products) {
            // Filter to ensure only US products
            const usProducts = beautyData.products.filter((p: any) => {
              const countries = (p.countries_tags || []);
              return countries.some((c: string) => c.includes('united-states'));
            });
            setSearchResults(usProducts);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Open Beauty Facts search failed:', e);
      }
      
      // If all APIs fail, return empty results
      setLoading(false);
    } catch (e) {
      console.error('Product search failed:', e);
      setLoading(false);
    }
  };

  // Stop scanner when leaving Scan tab
  useEffect(() => {
    if (tab !== 1 && scannerRef.current) {
      // Ensure we call stopScanner when leaving the Scan tab
      try {
        if (typeof scannerRef.current.stopScanner === 'function') {
          scannerRef.current.stopScanner();
        }
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
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
    fetch(`${BACKEND_URL}/api/v1/off/categories`)
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
    fetch(`${BACKEND_URL}/api/v1/off/popular?country=united-states`)
      .then(res => res.json())
      .then(data => {
        // Filter to ensure only US products
        const usProducts = data.products.filter((p: any) => {
          const countries = (p.countries_tags || []);
          return countries.some((c: string) => c.includes('united-states'));
        });
        setTrending(usProducts.slice(0, 8)); // Limit to 8 for UI
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
    fetch(`${BACKEND_URL}/api/v1/off/category/${selectedCategory}?country=united-states`)
      .then(res => res.json())
      .then(data => {
        // Filter to ensure only US products
        const usProducts = data.products.filter((p: any) => {
          const countries = (p.countries_tags || []);
          return countries.some((c: string) => c.includes('united-states'));
        });
        setCategoryProducts(usProducts.slice(0, 12));
        setCategoryProductsLoading(false);
      })
      .catch(() => {
        setCategoryProductsError('Failed to load products for category');
        setCategoryProductsLoading(false);
      });
  }, [selectedCategory]);

  // Listen for ingredient info events from ProductCard
  useEffect(() => {
    const handleIngredientInfo = (event: CustomEvent) => {
      if (event.detail) {
        setIngredientInfo(event.detail);
      }
    };
    
    window.addEventListener('show-ingredient-info', handleIngredientInfo as EventListener);
    
    return () => {
      window.removeEventListener('show-ingredient-info', handleIngredientInfo as EventListener);
    };
  }, []);

  // Admin menu handlers
  const handleAdminButtonClick = () => {
    setAdminPasswordDialogOpen(true);
  };

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  const handleAdminPasswordDialogClose = () => {
    setAdminPasswordDialogOpen(false);
    setAdminPassword('');
    setAdminPasswordError(false);
  };

  const handleAdminPasswordSubmit = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // This is critical for session cookies!
        body: JSON.stringify({ password: adminPassword })
      });
      if (res.ok) {
        handleAdminPasswordDialogClose();
        window.open(`${BACKEND_URL}/admin`, '_blank');
      } else {
        setAdminPasswordError(true);
      }
    } catch (err) {
      setAdminPasswordError(true);
    }
  };

  const navigateToAdminDashboard = () => {
    handleAdminMenuClose();
    // Open in a new tab to avoid navigation issues
    window.open(`${BACKEND_URL}/admin`, '_blank');
  };

  const navigateToAnalyticsDashboard = () => {
    handleAdminMenuClose();
    // Open in a new tab to avoid navigation issues
    window.open(`${BACKEND_URL}/admin/analytics`, '_blank');
  };

  // Tab content rendering
  let content = null;
  if (tab === 0) {
    // Home
    content = product ? null : (
      <Box sx={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d0e8fd 100%)',
        py: 2,
        position: 'relative',
        overflow: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
      className="scrollable-content"
      >
        {/* Background patterns */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.4,
          background: `
            radial-gradient(circle at 20% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(3, 169, 244, 0.07) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(156, 39, 176, 0.05) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />

        {/* App name and tagline with bold styling */}
        <Box sx={{
          width: '100%',
          textAlign: 'center',
          mb: 2,
          mt: 1, // Reduced top margin
          position: 'relative',
          zIndex: 1,
        }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 900, 
            mb: 1, 
            color: '#1e3a8a',
            letterSpacing: '-0.5px',
            textShadow: '1px 1px 0px rgba(255,255,255,0.5)',
            fontFamily: '"Montserrat", sans-serif',
          }}>
            Ingredient <Box component="span" sx={{ color: '#4caf50' }}>Aware</Box>
          </Typography>
          <Typography variant="subtitle1" sx={{ 
            color: '#2c5282', 
            mb: 2, 
            fontWeight: 500,
            fontSize: '1.1rem',
            maxWidth: '260px',
            mx: 'auto',
            lineHeight: 1.4,
          }}>
            Scan, search, and discover what's really in your food
          </Typography>
        </Box>

        {/* Main content card with unique shape */}
        <Box sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 420 },
          mx: 'auto',
          mb: 4,
          position: 'relative',
          zIndex: 1,
        }}>
          <Box sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: { xs: '40px 40px 0 0', sm: '40px' },
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 40px -10px rgba(0, 105, 165, 0.3), 0 0 80px -20px rgba(76, 175, 80, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            borderBottom: { xs: 'none', sm: '4px solid #4caf50' },
          }}>
            {/* Food icon group */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 1,
              mb: 3
            }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '20px', 
                background: '#ebf8ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                transform: 'rotate(-5deg)'
              }}>
                🥦
              </Box>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '20px', 
                background: '#fff0e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                transform: 'rotate(5deg)'
              }}>
                🥕
              </Box>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '20px', 
                background: '#e6f7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                transform: 'rotate(-5deg)'
              }}>
                🍎
              </Box>
            </Box>

            {/* SearchBar with enhanced styling */}
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
                mb: 3,
                width: '100%',
                '& .MuiInputBase-root': {
                  borderRadius: 99,
                  fontSize: 16,
                  px: 2,
                  py: 1.5,
                  background: '#f1f5f9',
                  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0',
                  fontFamily: 'inherit',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#94a3b8',
                  opacity: 1,
                },
              }}
            />
            
            {/* Scan Button with improved design */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<QrCodeScannerIcon />}
              sx={{
                borderRadius: 99,
                fontWeight: 700,
                fontSize: 18,
                py: 2,
                px: 2,
                background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                color: '#fff',
                boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.4)',
                mb: 0,
                mt: 0,
                transition: 'all 0.2s',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                  boxShadow: '0 6px 20px 0 rgba(34, 197, 94, 0.5)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 10px 0 rgba(34, 197, 94, 0.4)',
                },
              }}
              onClick={() => setTab(1)}
            >
              Scan Product Barcode
            </Button>
          </Box>
        </Box>

        {/* Admin Button */}
        <Box sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 420 },
          mx: 'auto',
          px: { xs: 2, sm: 0 },
          mb: 3,
          zIndex: 1,
        }}>
          <Button
            id="admin-button"
            variant="outlined"
            fullWidth
            size="medium"
            endIcon={<KeyboardArrowDownIcon />}
            startIcon={<AdminPanelSettingsIcon />}
            sx={{
              borderRadius: 99,
              fontWeight: 600,
              fontSize: 16,
              py: 1.5,
              px: 2,
              borderColor: '#3b82f6',
              color: '#1e40af',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
              textTransform: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                background: 'rgba(255,255,255,0.9)',
                borderColor: '#2563eb',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
              },
            }}
            onClick={handleAdminButtonClick}
            aria-controls={adminMenuOpen ? 'admin-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={adminMenuOpen ? 'true' : undefined}
          >
            Admin Options
          </Button>
          <Menu
            id="admin-menu"
            anchorEl={adminMenuAnchor}
            open={adminMenuOpen}
            onClose={handleAdminMenuClose}
            MenuListProps={{
              'aria-labelledby': 'admin-button',
            }}
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }
            }}
          >
            <MenuItem 
              onClick={navigateToAdminDashboard}
              sx={{ 
                py: 1.5,
                px: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                minWidth: 200,
              }}
            >
              <AdminPanelSettingsIcon fontSize="small" sx={{ color: '#3b82f6' }} />
              <Typography variant="body1">Admin Dashboard</Typography>
            </MenuItem>
            <MenuItem 
              onClick={navigateToAnalyticsDashboard}
              sx={{ 
                py: 1.5, 
                px: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                minWidth: 200,
              }}
            >
              <AnalyticsIcon fontSize="small" sx={{ color: '#3b82f6' }} />
              <Typography variant="body1">Analytics Dashboard</Typography>
            </MenuItem>
          </Menu>

          {/* Admin Password Dialog */}
          <Dialog 
            open={adminPasswordDialogOpen} 
            onClose={handleAdminPasswordDialogClose}
            PaperProps={{
              sx: {
                borderRadius: 3,
                width: '100%',
                maxWidth: 360,
                p: 1,
              }
            }}
          >
            <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
              Administrator Access
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Admin Password"
                type="password"
                fullWidth
                variant="outlined"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminPasswordError(false);
                }}
                error={adminPasswordError}
                helperText={adminPasswordError ? "Invalid password" : ""}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminPasswordSubmit();
                  }
                }}
                sx={{
                  mt: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
              <Button 
                onClick={handleAdminPasswordDialogClose}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAdminPasswordSubmit} 
                variant="contained"
                sx={{ 
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                }}
              >
                Login
              </Button>
            </DialogActions>
          </Dialog>
        </Box>

        {/* Feature cards */}
        <Box sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 420 },
          mx: 'auto',
          px: { xs: 2, sm: 0 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1,
          position: 'relative',
          mb: 2,
        }}>
          {/* Feature 1 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            p: 3,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <Box sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: '15px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              color: '#fff',
              fontSize: 24,
            }}>
              🚫
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e40af', mb: 0.5 }}>
                Identify Food Dyes
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.4 }}>
                Scan products to detect artificial food dyes and additives
              </Typography>
            </Box>
          </Box>
          
          {/* Feature 2 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            p: 3,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <Box sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: '15px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#fff',
              fontSize: 24,
            }}>
              ⚠️
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e40af', mb: 0.5 }}>
                Ingredient Warnings
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.4 }}>
                Get alerts about potentially concerning ingredients
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  } else if (tab === 1) {
    // Scan
    content = (
      <Box sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d0e8fd 100%)',
        padding: 2,
        position: 'relative',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      className="scrollable-content"
      >
        {/* Background pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.4,
          background: `
            radial-gradient(circle at 20% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(3, 169, 244, 0.07) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(156, 39, 176, 0.05) 0%, transparent 40%)
          `,
        }} />
        
        <Typography variant="h4" sx={{ 
          fontWeight: 800, 
          color: '#1e3a8a',
          mb: 4,
          zIndex: 1,
        }}>
          Scan Barcode
        </Typography>
        
        {/* Scanner component */}
        <Box sx={{ 
          width: '100%', 
          maxWidth: '450px',
          zIndex: 1,
          mb: 3,
        }}>
          <BarcodeScannerComponent 
            ref={scannerRef} 
            onDetected={fetchProductByBarcode} 
            autoStart={true} 
          />
        </Box>
        
        <Typography variant="body1" sx={{ 
          color: '#475569',
          textAlign: 'center',
          maxWidth: 300,
          mb: 2,
          zIndex: 1,
        }}>
          Position the product barcode within the scanner frame
        </Typography>
      </Box>
    );
  } else if (tab === 2) {
    // History
    content = (
      <Box sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d0e8fd 100%)',
        position: 'relative',
        py: 3,
        px: 2,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      className="scrollable-content"
      >
        {/* Background pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.4,
          background: `
            radial-gradient(circle at 20% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(3, 169, 244, 0.07) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(156, 39, 176, 0.05) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />
        
        <Box sx={{ 
          width: '100%',
          maxWidth: 600,
          zIndex: 1,
          mb: 2,
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: '#1e3a8a',
            mb: 1,
          }}>
            Scan History
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#475569',
            mb: 3,
          }}>
            Your recently scanned or searched products
          </Typography>
        </Box>
        
        <Box sx={{ 
          width: '100%',
          maxWidth: 600,
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          p: 2,
          WebkitOverflowScrolling: 'touch',
          maxHeight: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 220px)' },
          overflow: 'auto',
        }}
        className="scrollable-content"
        >
          <HistoryList 
            history={history} 
            onSelect={(prod) => setSelectedHistoryProduct(prod)} 
          />
          
          {history.length === 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 8,
              opacity: 0.7,
            }}>
              <Box sx={{ fontSize: 64, mb: 2 }}>📋</Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                No History Yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', maxWidth: 300 }}>
                Your scan and search history will appear here
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  } else if (tab === 3) {
    // Products
    content = (
      <Box sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d0e8fd 100%)',
        position: 'relative',
        py: 3,
        px: 2,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      className="scrollable-content"
      >
        {/* Background pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.4,
          background: `
            radial-gradient(circle at 20% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(3, 169, 244, 0.07) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(156, 39, 176, 0.05) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />
        
        <Typography variant="h4" sx={{ 
          fontWeight: 800, 
          color: '#1e3a8a',
          mb: 3,
          zIndex: 1,
          width: '100%',
          maxWidth: 600,
        }}>
          Browse Products
        </Typography>
        
        <Box sx={{ 
          width: '100%',
          maxWidth: 600,
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          WebkitOverflowScrolling: 'touch',
          overflow: 'auto',
          maxHeight: { xs: 'calc(100vh - 150px)', sm: 'calc(100vh - 170px)' },
          pb: 4,
        }}
        className="scrollable-content"
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#334155',
              fontSize: '1.25rem',
              position: 'relative',
              display: 'inline-block',
              mb: 2,
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 3,
                borderRadius: 2,
                background: '#4ade80',
              }
            }}>
              Categories
            </Typography>
            
            {categoriesLoading ? (
              <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={30} sx={{ color: '#60a5fa' }} />
              </Box>
            ) : categoriesError ? (
              <Typography color="error" sx={{ py: 2 }}>{categoriesError}</Typography>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                flexWrap: 'wrap', 
                mb: 3,
                mt: 2,
              }}>
                {categories.map(cat => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    clickable
                    color={selectedCategory === cat.id.replace(/^en:/, "") ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(cat.id.replace(/^en:/, ""))}
                    sx={{ 
                      minWidth: 100, 
                      fontWeight: 600, 
                      fontSize: 14,
                      borderRadius: '10px',
                      px: 1,
                      '&.MuiChip-colorPrimary': {
                        background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                      },
                      '&.MuiChip-colorDefault': {
                        background: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      }
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
          
          {selectedCategory && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#334155',
                fontSize: '1.25rem',
                position: 'relative',
                display: 'inline-block',
                mb: 2,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 40,
                  height: 3,
                  borderRadius: 2,
                  background: '#60a5fa',
                }
              }}>
                Products in "{categories.find(c => c.id.replace(/^en:/, "") === selectedCategory)?.name || selectedCategory}"
              </Typography>
              
              {categoryProductsLoading ? (
                <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={30} sx={{ color: '#60a5fa' }} />
                </Box>
              ) : categoryProductsError ? (
                <Typography color="error" sx={{ py: 2 }}>{categoryProductsError}</Typography>
              ) : (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {categoryProducts.map(prod => (
                    <Grid item xs={12} sm={6} md={4} key={prod.code}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer', 
                          height: '100%',
                          borderRadius: 3,
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                          }
                        }} 
                        onClick={() => setProduct(prod)}
                      >
                        {prod.image_front_url && (
                          <CardMedia 
                            component="img" 
                            height="140" 
                            image={prod.image_front_url} 
                            alt={prod.product_name}
                            sx={{ objectFit: 'cover' }}
                          />
                        )}
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 700,
                            fontSize: '1rem',
                            mb: 0.5,
                            lineHeight: 1.3,
                          }}>
                            {prod.product_name}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: '#64748b',
                            fontSize: '0.875rem',
                          }}>
                            {prod.brands}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#334155',
              fontSize: '1.25rem',
              position: 'relative',
              display: 'inline-block',
              mb: 2,
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 3,
                borderRadius: 2,
                background: '#f59e0b',
              }
            }}>
              Trending Foods
            </Typography>
            
            {trendingLoading ? (
              <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={30} sx={{ color: '#60a5fa' }} />
              </Box>
            ) : trendingError ? (
              <Typography color="error" sx={{ py: 2 }}>{trendingError}</Typography>
            ) : (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {trending.map(prod => (
                  <Grid item xs={6} sm={4} md={3} key={prod.code}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer', 
                        height: '100%',
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        }
                      }} 
                      onClick={() => setProduct(prod)}
                    >
                      {prod.image_front_url && (
                        <CardMedia 
                          component="img" 
                          height="120" 
                          image={prod.image_front_url} 
                          alt={prod.product_name}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          mb: 0.5,
                          lineHeight: 1.3,
                        }}>
                          {prod.product_name}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#64748b',
                          fontSize: '0.75rem',
                        }}>
                          {prod.brands}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      height: '100vh',
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
      position: 'fixed',
      left: 0,
      top: 0,
      m: 0,
      p: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      '::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23e3f2fd\'/%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'2\' fill=\'%23bbdefb\'/%3E%3C/svg%3E")',
        opacity: 0.15,
        zIndex: 0,
      },
    }}>
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Main Content - Adjusted for no app bar */}
        <Box sx={{
          pt: { xs: 2, sm: 2 }, // Reduced padding without app bar
          pb: 0,
          px: { xs: 2, sm: 0 },
          width: '100%',
          maxWidth: '100%',
          minHeight: 'calc(100vh - 56px)', // Only accounting for bottom nav now
          height: 'calc(100vh - 56px)', // Only accounting for bottom nav
          boxSizing: 'border-box',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }}
        className="scrollable-content"
        >
          {content}
          <Dialog 
            open={!!ingredientInfo} 
            onClose={() => { setIngredientInfo(null); }} 
            fullWidth 
            maxWidth="xs"
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                overflow: 'hidden',
              }
            }}
          >
            <Box sx={{ 
              background: ingredientInfo?.type === 'allergen' 
                ? 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)' 
                : ingredientInfo?.type === 'additive' 
                ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' 
                : ingredientInfo?.isDye 
                ? 'linear-gradient(135deg, #d32f2f 0%, #9c27b0 100%)' 
                : 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              color: 'white',
              px: 3,
              py: 2,
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {ingredientInfo?.name}
                {ingredientInfo?.code && ` (${ingredientInfo.code})`}
              </Typography>
            </Box>
            <DialogContent sx={{ px: 3, py: 3 }}>
              <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem', lineHeight: 1.6 }}>
                {ingredientInfo?.info || 'No information available for this ingredient.'}
              </DialogContentText>
              {ingredientInfo?.isFlagged && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                  <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon fontSize="small" /> Warning
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    This ingredient has been flagged and may cause adverse reactions in some individuals.
                  </Typography>
                </Box>
              )}
            </DialogContent>
          </Dialog>
          {/* Product details dialog for history */}
          <Dialog 
            open={!!selectedHistoryProduct} 
            onClose={() => {
              setSelectedHistoryProduct(null);
              // Reset product state when dialog is closed from home tab
              if (tab === 0) {
                setProduct(null);
              }
            }} 
            fullWidth 
            maxWidth="sm"
          >
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
          width: '100%',
          boxShadow: '0 -2px 16px 0 rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1202,
          borderTop: '1px solid rgba(226,232,240,0.8)',
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