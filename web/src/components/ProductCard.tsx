import React, { type JSX } from 'react';
import { Paper, Box, Typography, Divider, Avatar } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import OpacityIcon from '@mui/icons-material/Opacity';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import GrainIcon from '@mui/icons-material/Grain';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import type { Product, CriticalIngredient, Dye } from '../types';

/**
 * Props for the ProductCard component.
 * @property product - The product object to display.
 * @property flaggedIngredients - Array of flagged ingredient objects.
 * @property dyes - Array of dye objects found in the product.
 * @property handleIngredientClick - Callback for when an ingredient chip is clicked.
 */
interface FlaggedIngredient {
  name: string;
  aliases: string[];
  severity: 'critical' | 'caution';
  warning: string;
}

interface ProductCardProps {
  product: Product;
  flaggedIngredients: FlaggedIngredient[];
  dyes: Dye[];
  handleIngredientClick: (ing: string) => void;
}

const NEGATIVE_FIELDS: {
  key: string;
  label: string;
  icon: JSX.Element;
  desc: string;
  color: string;
  getValue: (value: number | Record<string, any>) => string | number;
  isAdditives: boolean;
}[] = [
  {
    key: 'additives',
    label: 'Additives',
    icon: <WarningIcon color="error" fontSize="small" />,
    desc: 'Contains additives to avoid',
    color: '#F44336',
    getValue: (value) => typeof value === 'number' ? value : '-',
    isAdditives: true,
  },
  {
    key: 'sugars_100g',
    label: 'Sugar',
    icon: <RestaurantIcon color="error" fontSize="small" />,
    desc: 'Too sweet',
    color: '#F44336',
    getValue: (value) => typeof value === 'object' && value.sugars_100g !== undefined ? `${value.sugars_100g}g` : '-',
    isAdditives: false,
  },
  {
    key: 'energy-kcal_100g',
    label: 'Calories',
    icon: <LocalFireDepartmentIcon color="error" fontSize="small" />,
    desc: 'A bit too caloric',
    color: '#F44336',
    getValue: (value) => typeof value === 'object' && value['energy-kcal_100g'] !== undefined ? `${value['energy-kcal_100g']} Cal` : '-',
    isAdditives: false,
  },
  {
    key: 'sodium_100g',
    label: 'Sodium',
    icon: <OpacityIcon color="warning" fontSize="small" />,
    desc: 'A bit too salty',
    color: '#FFA726',
    getValue: (value) => typeof value === 'object' && value.sodium_100g !== undefined ? `${value.sodium_100g}mg` : '-',
    isAdditives: false,
  },
];
const POSITIVE_FIELDS = [
  {
    key: 'fiber_100g',
    label: 'Fiber',
    icon: <GrainIcon color="success" fontSize="small" />,
    desc: 'Excellent amount of fiber',
    color: '#4CAF50',
    getValue: (nutriments: any) => nutriments.fiber_100g !== undefined ? `${nutriments.fiber_100g}g` : '-',
  },
  {
    key: 'proteins_100g',
    label: 'Protein',
    icon: <FitnessCenterIcon color="success" fontSize="small" />,
    desc: 'Some protein',
    color: '#4CAF50',
    getValue: (nutriments: any) => nutriments.proteins_100g !== undefined ? `${nutriments.proteins_100g}g` : '-',
  },
];

const getScore = (flaggedIngredients: FlaggedIngredient[], dyes: Dye[]) => {
  // Example: 100 - 10*flagged - 5*dyes, clamp 0-100
  let score = 100 - 10 * flaggedIngredients.length - 5 * dyes.length;
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return score;
};

const getScoreLabel = (score: number) => {
  if (score < 40) return { label: 'Bad', color: '#F44336' };
  if (score < 70) return { label: 'Caution', color: '#FFA726' };
  return { label: 'Good', color: '#4CAF50' };
};

/**
 * Displays a product card with image, name, score, negatives, positives, and ingredients.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, flaggedIngredients, dyes }) => {
  if (!product) return null;
  const score = getScore(flaggedIngredients, dyes);
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);
  const nutriments = product.nutriments || {};
  const additivesCount = flaggedIngredients.length;

  return (
    <Paper sx={{ p: 2, mt: 3, borderRadius: 4, maxWidth: 420, mx: 'auto', boxShadow: 3, background: '#fff', color: '#222' }}>
      {/* Top section: photo, name, brand, score */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {product.image_front_url && (
          <Avatar src={product.image_front_url} alt={product.product_name} variant="rounded" sx={{ width: 72, height: 72, mr: 2, boxShadow: 1 }} />
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{product.product_name || 'No name'}</Typography>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 1 }}>{product.brands}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              background: scoreColor,
              color: '#fff',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              mr: 1
            }}>{score}</Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{scoreLabel}</Typography>
            <Typography variant="body2" sx={{ ml: 0.5, color: scoreColor }}>{score}/100</Typography>
          </Box>
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Flagged Ingredients Section */}
      {flaggedIngredients.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Flagged Ingredients</Typography>
          {flaggedIngredients.map((flag, idx) => (
            <Box key={flag.name + idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1, gap: 1 }}>
              {flag.severity === 'critical' ? (
                <WarningIcon color="error" fontSize="small" sx={{ mt: 0.5 }} />
              ) : (
                <ReportProblemIcon sx={{ color: '#FFA726', fontSize: 20, mt: 0.5 }} />
              )}
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, color: flag.severity === 'critical' ? '#F44336' : '#FFA726' }}>{flag.name}</Typography>
                <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5 }}>{flag.warning}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Divider sx={{ my: 2 }} />
      {/* Negatives */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Negatives</Typography>
      <Box>
        {NEGATIVE_FIELDS.map(field => (
          <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {field.icon}
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{field.label}</Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>{field.desc}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{field.isAdditives ? field.getValue(additivesCount) : field.getValue(nutriments)}</Typography>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: field.color, ml: 1 }} />
            </Box>
          </Box>
        ))}
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Positives */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Positives</Typography>
      <Box>
        {POSITIVE_FIELDS.map(field => (
          <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {field.icon}
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{field.label}</Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>{field.desc}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{field.getValue(nutriments)}</Typography>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: field.color, ml: 1 }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ProductCard; 