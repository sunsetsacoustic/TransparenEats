import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PaletteIcon from '@mui/icons-material/Palette';

/**
 * Props for the ProductCard component.
 * @property product - The product object to display.
 * @property flaggedIngredients - Array of flagged ingredient objects.
 * @property dyes - Array of dye objects found in the product.
 * @property handleIngredientClick - Callback for when an ingredient chip is clicked.
 */
interface ProductCardProps {
  product: any;
  flaggedIngredients: any[];
  dyes: any[];
  handleIngredientClick: (ing: string) => void;
}

/**
 * Displays a product card with image, name, score, negatives, positives, and ingredients.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, flaggedIngredients, dyes, handleIngredientClick }) => {
  if (!product) return null;
  // Simple score: 100 - 15*flagged - 7*dyes, min 0
  const score = Math.max(0, 100 - 15 * flaggedIngredients.length - 7 * dyes.length);
  let color = '#4caf50';
  let label = 'Good';
  if (score < 40) { color = '#ff5252'; label = 'Bad'; }
  else if (score < 70) { color = '#ffa726'; label = 'Caution'; }

  return (
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
      <Typography variant="subtitle1" sx={{ color: '#7fff7f', fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon sx={{ color: '#7fff7f', fontSize: 22, mr: 0.5 }} /> Other Ingredients
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {(() => {
          const text = product.ingredients_text || '';
          const items = text.split(/,|;|\./).map((i: string) => i.trim()).filter(Boolean);
          // Only show ingredients that are not flagged or dyes
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
  );
};

export default ProductCard; 