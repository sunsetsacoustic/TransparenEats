import { useState, useEffect } from 'react';
import BarcodeScannerComponent from './components/BarcodeScannerComponent';
import { Container, Typography, Box, CircularProgress, Tabs, Tab } from '@mui/material';
import { FOOD_DYES, CRITICAL_INGREDIENTS } from './foodDyes';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import ProductCard from './components/ProductCard';
import SearchBar from './components/SearchBar';
import HistoryList from './components/HistoryList';
import SearchResultsList from './components/SearchResultsList';
import type { Product, Dye, CriticalIngredient, IngredientInfo } from './types';

const HISTORY_KEY = 'ingredientAwareHistory';
const HISTORY_LIMIT = 20;

/**
 * Loads the scan/search history from localStorage.
 */
function loadHistory(): Product[] {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

/**
 * Saves a product to the scan/search history in localStorage.
 */
function saveToHistory(product: Product) {
  if (!product || !product.code) return;
  let history: Product[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  // Remove if already exists
  history = history.filter((item: Product) => item.code !== product.code);
  // Add to front
  history.unshift({
    code: product.code,
    product_name: product.product_name,
    brands: product.brands,
    ingredients_text: product.ingredients_text,
    image_front_url: product.image_front_url,
    nutriments: product.nutriments,
  });
  // Limit history
  if (history.length > HISTORY_LIMIT) history = history.slice(0, HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Fetches product data from Open Food Facts by barcode.
 */
function fetchProductByBarcode(barcode: string): Promise<{ status: number; product: Product }> {
  return fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`).then(res => res.json());
}

/**
 * Searches for products by name using Open Food Facts.
 */
function searchProductsByName(query: string): Promise<{ products: Product[] }> {
  return fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`).then(res => res.json());
}

/**
 * Finds food dyes in the ingredient text.
 */
function findDyes(ingredientText: string | null | undefined): Dye[] {
  if (!ingredientText) return [];
  const lower = ingredientText.toLowerCase();
  return FOOD_DYES.filter((dye: Dye) => {
    if (lower.includes(dye.name.toLowerCase())) return true;
    if (dye.aliases.some((alias: string) => lower.includes(alias.toLowerCase()))) return true;
    if (dye.eNumbers.some((eNum: string) => lower.includes(eNum.toLowerCase()))) return true;
    return false;
  });
}

/**
 * Finds flagged (critical) ingredients in the ingredient text.
 */
function findFlaggedIngredients(ingredientText: string | null | undefined): CriticalIngredient[] {
  if (!ingredientText) return [];
  const lower = ingredientText.toLowerCase();
  return CRITICAL_INGREDIENTS.filter((ing: CriticalIngredient) => {
    if (lower.includes(ing.name.toLowerCase())) return true;
    if (ing.aliases.some((alias: string) => lower.includes(alias.toLowerCase()))) return true;
    return false;
  });
}

/**
 * Main application component for Ingredient Aware.
 */
export default function App() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [history, setHistory] = useState<Product[]>([]);
  const [tab, setTab] = useState(0);
  const [ingredientInfo, setIngredientInfo] = useState<IngredientInfo | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleDetected = async (code: string) => {
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

  const handleSelectProduct = (prod: Product) => {
    setProduct(prod);
    setSearchResults([]);
    setError(null);
    saveToHistory(prod);
    setHistory(loadHistory());
  };

  const dyes = product ? findDyes(product.ingredients_text) : [];
  const flaggedIngredients = product ? findFlaggedIngredients(product.ingredients_text) : [];

  // Helper to get info for an ingredient
  function handleIngredientClick(ingredient: string) {
    const flagged = flaggedIngredients.find(f => ingredient.toLowerCase().includes(f.name.toLowerCase()) || f.aliases.some((a: string) => ingredient.toLowerCase().includes(a.toLowerCase())));
    const dye = dyes.find(d => ingredient.toLowerCase().includes(d.name.toLowerCase()) || d.aliases.some((a: string) => ingredient.toLowerCase().includes(a.toLowerCase())) || d.eNumbers.some((e: string) => ingredient.toLowerCase().includes(e.toLowerCase())));
    if (flagged) {
      setIngredientInfo({ name: flagged.name, info: flagged.warning, isFlagged: true, isDye: false });
      return;
    }
    if (dye) {
      setIngredientInfo({ name: dye.name, info: `This is a food dye. Also known as: ${[dye.name, ...dye.aliases, ...dye.eNumbers].join(', ')}`, isFlagged: false, isDye: true });
      return;
    }
    // For non-flagged, non-dye ingredients, show a generic message or nothing
    setIngredientInfo({ name: ingredient, info: 'No additional information available.', isFlagged: false, isDye: false });
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Ingredient Aware (MVP)</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label="Search" />
          <Tab label="History" />
        </Tabs>
      </Box>
      {tab === 0 && (
        <>
          <SearchBar
            value={search}
            onChange={e => setSearch(e.target.value)}
            onSearch={handleSearch}
            loading={searching}
          />
          {searchResults.length > 0 && (
            <SearchResultsList results={searchResults} onSelect={handleSelectProduct} />
          )}
        </>
      )}
      {tab === 1 && (
        <Box mb={2}>
          {history.length > 0 ? (
            <HistoryList history={history} onSelect={handleSelectProduct} />
          ) : (
            <Typography color="text.secondary">No history yet.</Typography>
          )}
        </Box>
      )}
      <Box mb={2}>
        <BarcodeScannerComponent onDetected={handleDetected} />
      </Box>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {product && (
        <ProductCard
          product={product}
          flaggedIngredients={flaggedIngredients}
          dyes={dyes}
          handleIngredientClick={handleIngredientClick}
        />
      )}
      <Dialog open={!!ingredientInfo} onClose={() => { setIngredientInfo(null); }}>
        <DialogTitle>{ingredientInfo?.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {ingredientInfo?.info}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Container>
  );
} 