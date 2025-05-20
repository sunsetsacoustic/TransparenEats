import { useState } from 'react';
import { Container, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText } from '@mui/material';
import { FOOD_DYES, CRITICAL_INGREDIENTS } from './foodDyes';
import ProductCard from './components/ProductCard';
import BottomNav from './components/BottomNav';
import type { Product, Dye, CriticalIngredient, IngredientInfo } from './types';

const HISTORY_KEY = 'ingredientAwareHistory';
const HISTORY_LIMIT = 20;

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

function findFlaggedIngredients(ingredientText: string | null | undefined): CriticalIngredient[] {
  if (!ingredientText) return [];
  const lower = ingredientText.toLowerCase();
  return CRITICAL_INGREDIENTS.filter((ing: CriticalIngredient) => {
    if (lower.includes(ing.name.toLowerCase())) return true;
    if (ing.aliases.some((alias: string) => lower.includes(alias.toLowerCase()))) return true;
    return false;
  });
}

export default function App() {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [tab, setTab] = useState(0);
  const [ingredientInfo, setIngredientInfo] = useState<IngredientInfo | null>(null);

  // Example product for demo
  const demoProduct: Product = {
    code: '123456',
    product_name: 'Cereal Honey Nut',
    brands: 'Cheerios',
    image_front_url: 'https://static.openfoodfacts.org/images/products/001/600/014/5892/front_en.4.400.jpg',
    nutriments: {
      sugars_100g: 32,
      'energy-kcal_100g': 393,
      sodium_100g: 571,
      fiber_100g: 3.6,
      proteins_100g: 7.1,
    },
  };

  // For demo, always show the demo product
  const dyes = findDyes(demoProduct.ingredients_text);
  const flaggedIngredients = findFlaggedIngredients(demoProduct.ingredients_text);

  return (
    <Container maxWidth="sm" sx={{ mt: 4, pb: 8 }}>
      <Typography variant="h4" gutterBottom>Ingredient Aware (MVP)</Typography>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      <ProductCard
        product={demoProduct}
        flaggedIngredients={flaggedIngredients}
        dyes={dyes}
        handleIngredientClick={() => {}}
      />
      <Dialog open={!!ingredientInfo} onClose={() => { setIngredientInfo(null); }}>
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