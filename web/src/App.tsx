import { useState, useEffect } from 'react';
import BarcodeScannerComponent from './components/BarcodeScannerComponent';
import { Container, Typography, Box, CircularProgress, Paper, TextField, Button, List, ListItem, ListItemButton, ListItemText, Chip, Tabs, Tab } from '@mui/material';
import { FOOD_DYES, CRITICAL_INGREDIENTS } from './foodDyes';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PaletteIcon from '@mui/icons-material/Palette';
import ProductCard from './components/ProductCard';

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
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [ingredientInfo, setIngredientInfo] = useState<{ name: string, info: string, isFlagged: boolean, isDye: boolean } | null>(null);

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

  const handleSelectProduct = (prod: any) => {
    setProduct(prod);
    setSearchResults([]);
    setError(null);
    saveToHistory(prod);
    setHistory(loadHistory());
  };

  const dyes = product ? findDyes(product.ingredients_text) : [];
  const flaggedIngredients = product ? findFlaggedIngredients(product.ingredients_text) : [];

  // Helper to get info for an ingredient
  function handleIngredientClick(ing: string) {
    const flagged = flaggedIngredients.find(f => ing.toLowerCase().includes(f.name.toLowerCase()) || f.aliases.some((a: string) => ing.toLowerCase().includes(a.toLowerCase())));
    const dye = dyes.find(d => ing.toLowerCase().includes(d.name.toLowerCase()) || d.aliases.some((a: string) => ing.toLowerCase().includes(a.toLowerCase())) || d.eNumbers.some((e: string) => ing.toLowerCase().includes(e.toLowerCase())));
    if (flagged) {
      setIngredientInfo({ name: flagged.name, info: flagged.warning, isFlagged: true, isDye: false });
      return;
    }
    if (dye) {
      setIngredientInfo({ name: dye.name, info: `This is a food dye. Also known as: ${[dye.name, ...dye.aliases, ...dye.eNumbers].join(', ')}`, isFlagged: false, isDye: true });
      return;
    }
    // For non-flagged, non-dye ingredients, show a generic message or nothing
    setIngredientInfo({ name: ing, info: 'No additional information available.', isFlagged: false, isDye: false });
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
        <Box mb={2}>
          <TextField
            label="Search for a food item"
            value={search}
            onChange={e => setSearch(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />
          <Button variant="contained" onClick={handleSearch} disabled={!search || searching} fullWidth>
            {searching ? 'Searching...' : 'Search'}
          </Button>
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
        </Box>
      )}
      {tab === 1 && (
        <Box mb={2}>
          {history.length > 0 ? (
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