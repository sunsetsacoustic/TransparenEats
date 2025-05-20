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
        <Paper sx={{
          p: 3,
          mt: 3,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
          border: '1.5px solid rgba(255,255,255,0.10)',
          maxWidth: 380,
          mx: 'auto',
          overflowY: 'auto',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {product.image_front_url && (
              <img src={product.image_front_url} alt={product.product_name} style={{ width: 80, height: 80, borderRadius: 18, objectFit: 'cover', marginRight: 18, border: '2px solid #fff2' }} />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#fff' }}>{product.product_name || 'No name'}</Typography>
              <Typography variant="subtitle2" sx={{ color: '#bbb' }}>{product.brands}</Typography>
            </Box>
            {/* Score badge */}
            <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {(() => {
                // Simple score: 100 - 15*flagged - 7*dyes, min 0
                const score = Math.max(0, 100 - 15 * flaggedIngredients.length - 7 * dyes.length);
                let color = '#4caf50';
                let label = 'Good';
                if (score < 40) { color = '#ff5252'; label = 'Bad'; }
                else if (score < 70) { color = '#ffa726'; label = 'Caution'; }
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{
                      background: color,
                      color: '#fff',
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 20,
                      boxShadow: `0 0 0 4px ${color}33`,
                      mb: 0.5
                    }}>{score}</Box>
                    <Typography variant="caption" sx={{ color }}>{label}</Typography>
                  </Box>
                );
              })()}
            </Box>
          </Box>

          {/* Negatives Section */}
          {(flaggedIngredients.length > 0 || dyes.length > 0) && (
            <Box mb={2}>
              <Typography variant="subtitle1" sx={{ color: '#ff5252', fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ fontSize: 22, mr: 0.5 }} /> Negatives
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {flaggedIngredients.map(ing => (
                  <Chip
                    key={ing.name}
                    label={ing.name}
                    icon={<WarningIcon sx={{ color: '#ff5252' }} />}
                    sx={{ background: 'rgba(255,82,82,0.13)', color: '#ff5252', fontWeight: 600, border: '1.5px solid #ff5252' }}
                    onClick={() => handleIngredientClick(ing.name)}
                  />
                ))}
                {dyes.filter(dye => !flaggedIngredients.some(f => f.name === dye.name)).map(dye => (
                  <Chip
                    key={dye.name}
                    label={dye.name}
                    icon={<PaletteIcon sx={{ color: '#ffa751' }} />}
                    sx={{ background: 'rgba(255,167,81,0.13)', color: '#ffa751', fontWeight: 600, border: '1.5px solid #ffa751' }}
                    onClick={() => handleIngredientClick(dye.name)}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Positives Section (fiber, protein) */}
          {product && (product.nutriments?.fiber_100g || product.nutriments?.proteins_100g) && (
            <Box mb={2}>
              <Typography variant="subtitle1" sx={{ color: '#4caf50', fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 22, mr: 0.5 }} /> Positives
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {product.nutriments?.fiber_100g && (
                  <Chip
                    label={`Fiber: ${product.nutriments.fiber_100g}g`}
                    icon={<CheckCircleIcon sx={{ color: '#4caf50' }} />}
                    sx={{ background: 'rgba(76,175,80,0.13)', color: '#4caf50', fontWeight: 600, border: '1.5px solid #4caf50' }}
                  />
                )}
                {product.nutriments?.proteins_100g && (
                  <Chip
                    label={`Protein: ${product.nutriments.proteins_100g}g`}
                    icon={<CheckCircleIcon sx={{ color: '#4caf50' }} />}
                    sx={{ background: 'rgba(76,175,80,0.13)', color: '#4caf50', fontWeight: 600, border: '1.5px solid #4caf50' }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Other Ingredients Section */}
          <Box mb={2}>
            <Typography variant="subtitle1" sx={{ color: '#7fff7f', fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon sx={{ color: '#7fff7f', fontSize: 22, mr: 0.5 }} /> Other Ingredients
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(() => {
                const text = product.ingredients_text || '';
                const items = text.split(/,|;|\./).map((i: string) => i.trim()).filter(Boolean);
                return items.filter((ing: string) => {
                  const isFlagged = flaggedIngredients.some(f => ing.toLowerCase().includes(f.name.toLowerCase()) || f.aliases.some((a: string) => ing.toLowerCase().includes(a.toLowerCase())));
                  const isDye = dyes.some(d => ing.toLowerCase().includes(d.name.toLowerCase()) || d.aliases.some((a: string) => ing.toLowerCase().includes(a.toLowerCase())) || d.eNumbers.some((e: string) => ing.toLowerCase().includes(e.toLowerCase())));
                  return !isFlagged && !isDye;
                }).map((ing: string, idx: number) => (
                  <Chip
                    key={idx}
                    label={ing}
                    icon={<CheckCircleIcon sx={{ color: '#7fff7f' }} />}
                    sx={{ background: 'rgba(127,255,127,0.10)', color: '#7fff7f', fontWeight: 500, border: '1.5px solid #7fff7f' }}
                    onClick={() => handleIngredientClick(ing)}
                  />
                ));
              })()}
            </Box>
          </Box>

          {/* Ingredient Warnings (detailed) */}
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
        </Paper>
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