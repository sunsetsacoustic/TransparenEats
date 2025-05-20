import React from 'react';
import { Paper, Box, Typography, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PaletteIcon from '@mui/icons-material/Palette';
import type { Product, CriticalIngredient, Dye } from '../types';

/**
 * Props for the ProductCard component.
 * @property product - The product object to display.
 * @property flaggedIngredients - Array of flagged ingredient objects.
 * @property dyes - Array of dye objects found in the product.
 * @property handleIngredientClick - Callback for when an ingredient chip is clicked.
 */
interface ProductCardProps {
  product: Product;
  flaggedIngredients: CriticalIngredient[];
  dyes: Dye[];
  handleIngredientClick: (ing: string) => void;
}

const NEGATIVE_FIELDS = [
  { key: 'additives', label: 'Additives', icon: <WarningIcon color="error" fontSize="small" /> },
  { key: 'sugars_100g', label: 'Sugar', icon: <WarningIcon color="error" fontSize="small" /> },
  { key: 'energy-kcal_100g', label: 'Calories', icon: <WarningIcon color="error" fontSize="small" /> },
  { key: 'sodium_100g', label: 'Sodium', icon: <WarningIcon color="error" fontSize="small" /> },
];
const POSITIVE_FIELDS = [
  { key: 'fiber_100g', label: 'Fiber', icon: <CheckCircleIcon color="success" fontSize="small" /> },
  { key: 'proteins_100g', label: 'Protein', icon: <CheckCircleIcon color="success" fontSize="small" /> },
];

const getScore = (product: Product, flaggedIngredients: CriticalIngredient[], dyes: Dye[]) => {
  // Example: 10 - flagged - dyes, clamp 0-10
  let score = 10 - flaggedIngredients.length - dyes.length;
  if (score < 0) score = 0;
  if (score > 10) score = 10;
  return score;
};

/**
 * Displays a product card with image, name, score, negatives, positives, and ingredients.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, flaggedIngredients, dyes }) => {
  if (!product) return null;
  const score = getScore(product, flaggedIngredients, dyes);
  const nutriments = product.nutriments || {};
  // For demo, count flagged ingredients as "additives"
  const additivesCount = flaggedIngredients.length;

  return (
    <Paper sx={{ p: 3, mt: 3, borderRadius: 6, maxWidth: 420, mx: 'auto', overflowY: 'auto' }}>
      {/* Top section: photo, name, brand, score */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {product.image_front_url && (
          <img src={product.image_front_url} alt={product.product_name} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', marginRight: 18, border: '2px solid #eee' }} />
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{product.product_name || 'No name'}</Typography>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 1 }}>{product.brands}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              background: '#1976d2',
              color: '#fff',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              mr: 1
            }}>{score}</Box>
            <Typography variant="body2">Score</Typography>
            <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600 }}>{score}/10</Typography>
          </Box>
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Negatives */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Negatives</Typography>
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        <Box component="li" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <span>Additives</span>
          <span>{additivesCount}</span>
        </Box>
        {NEGATIVE_FIELDS.slice(1).map(field => (
          <Box component="li" key={field.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <span>{field.label}</span>
            <span>{nutriments[field.key] !== undefined ? nutriments[field.key] : '-'}</span>
          </Box>
        ))}
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Positives */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Positives</Typography>
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {POSITIVE_FIELDS.map(field => (
          <Box component="li" key={field.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <span>{field.label}</span>
            <span>{nutriments[field.key] !== undefined ? nutriments[field.key] : '-'}</span>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ProductCard; 