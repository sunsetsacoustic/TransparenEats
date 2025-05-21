import React, { type JSX } from 'react';
import { Paper, Box, Typography, Divider, Avatar, Chip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import OpacityIcon from '@mui/icons-material/Opacity';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import GrainIcon from '@mui/icons-material/Grain';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import type { Product, Dye } from '../types';

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
const ProductCard: React.FC<ProductCardProps> = ({ product, flaggedIngredients, dyes, handleIngredientClick }) => {
  if (!product) return null;
  const score = getScore(flaggedIngredients, dyes);
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);
  const nutriments = product.nutriments || {};
  const additivesCount = flaggedIngredients.length;

  // Helper: get value or fallback
  const get = (obj: any, ...fields: string[]) => fields.reduce((v, f) => v && v[f], obj);

  // Collect extra fields
  const servingSize = product.serving_size || product.quantity || get(product, 'servingSize') || get(product, 'servingSizeUnit') || '';
  const categories = product.categories || product.categories_tags || product.category || '';
  const labels = product.labels || product.labels_tags || '';
  const allergens = product.allergens || product.allergens_tags || '';
  const additives = product.additives_tags || product.additives || '';
  const nutriScore = product.nutriscore_grade || product.nutriscore_score;
  const ecoScore = product.ecoscore_grade || product.ecoscore_score;
  const novaGroup = product.nova_group;
  const publicationDate = product.publicationDate || product.modifiedDate;
  const dataType = product.dataType;
  const barcode = product.code || product.gtinUpc || product.fdcId;
  const image = product.image_front_url || product.image_url || product.photo || '';

  // Collect all nutrients present
  const nutrientFields = [
    { key: 'energy-kcal_100g', label: 'Calories', unit: 'kcal' },
    { key: 'proteins_100g', label: 'Protein', unit: 'g' },
    { key: 'fat_100g', label: 'Fat', unit: 'g' },
    { key: 'carbohydrates_100g', label: 'Carbs', unit: 'g' },
    { key: 'fiber_100g', label: 'Fiber', unit: 'g' },
    { key: 'sugars_100g', label: 'Sugars', unit: 'g' },
    { key: 'sodium_100g', label: 'Sodium', unit: 'mg' },
  ];

  return (
    <Paper sx={{ p: 2, mt: 3, borderRadius: 4, maxWidth: 420, mx: 'auto', boxShadow: 3, background: '#fff', color: '#222', maxHeight: '80vh', overflowY: 'auto' }}>
      {/* Barcode */}
      {barcode && <Typography variant="caption" sx={{ color: '#888', mb: 1 }}>Barcode: {barcode}</Typography>}
      {/* Image */}
      {image && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar src={image} alt={product.product_name} variant="rounded" sx={{ width: 96, height: 96, boxShadow: 1 }} />
        </Box>
      )}
      {/* Name, Brand */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{product.product_name || 'No name'}</Typography>
      {product.brands && <Typography variant="subtitle2" sx={{ color: '#888', mb: 1 }}>{product.brands}</Typography>}
      {/* Score */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ background: scoreColor, color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, mr: 1 }}>{score}</Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{scoreLabel}</Typography>
        <Typography variant="body2" sx={{ ml: 0.5, color: scoreColor }}>{score}/100</Typography>
      </Box>
      {/* Ingredients */}
      {product.ingredients_text && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Ingredients</Typography>
          <Typography variant="body2" sx={{ color: '#444' }}>{product.ingredients_text}</Typography>
        </Box>
      )}
      {/* Serving Size, Categories, Labels, Allergens, Additives, Data Type, Publication Date */}
      <Box sx={{ mb: 2 }}>
        {servingSize && <Typography variant="body2">Serving Size: {servingSize}</Typography>}
        {categories && <Typography variant="body2">Categories: {categories}</Typography>}
        {labels && <Typography variant="body2">Labels: {labels}</Typography>}
        {allergens && <Typography variant="body2">Allergens: {allergens}</Typography>}
        {additives && <Typography variant="body2">Additives: {additives}</Typography>}
        {dataType && <Typography variant="body2">Data Type: {dataType}</Typography>}
        {publicationDate && <Typography variant="body2">Publication Date: {publicationDate}</Typography>}
      </Box>
      {/* Scores */}
      <Box sx={{ mb: 2 }}>
        {nutriScore && <Chip label={`Nutri-Score: ${nutriScore}`} sx={{ mr: 1, mb: 1 }} />}
        {ecoScore && <Chip label={`Eco-Score: ${ecoScore}`} sx={{ mr: 1, mb: 1 }} />}
        {novaGroup && <Chip label={`NOVA Group: ${novaGroup}`} sx={{ mr: 1, mb: 1 }} />}
      </Box>
      {/* Nutritional Info */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Nutritional Info (per 100g)</Typography>
      <Box sx={{ mb: 2 }}>
        {nutrientFields.map(field => (
          nutriments[field.key] !== undefined && (
            <Typography key={field.key} variant="body2">
              {field.label}: {nutriments[field.key]} {field.unit}
            </Typography>
          )
        ))}
      </Box>
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