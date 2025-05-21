import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Divider, Avatar, Chip, Collapse, Button, Popover, CircularProgress } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import OpacityIcon from '@mui/icons-material/Opacity';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import GrainIcon from '@mui/icons-material/Grain';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { Product, Dye } from '../types';

/**
 * Props for the ProductCard component.
 * @property product - The product object to display.
 * @property flaggedIngredients - Array of flagged ingredient objects.
 * @property dyes - Array of dye objects found in the product.
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
}

const NEGATIVE_FIELDS: {
  key: string;
  label: string;
  icon: React.ReactNode;
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

const SCORE_DEFINITIONS: Record<string, string> = {
  'Nutri-Score': 'A nutrition label that grades food from A (best) to E (worst) based on its nutritional quality.',
  'Eco-Score': 'An environmental impact score from A (low impact) to E (high impact).',
  'NOVA Group': 'A classification of food processing, from 1 (unprocessed) to 4 (ultra-processed).',
};

/**
 * Displays a product card with image, name, score, negatives, positives, and ingredients.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, flaggedIngredients, dyes }) => {
  if (!product) return null;
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showAllFlagged, setShowAllFlagged] = useState(false);
  const score = getScore(flaggedIngredients, dyes);
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);
  const nutriments = product.nutriments || {};
  const additivesCount = flaggedIngredients.length;
  const [scorePopover, setScorePopover] = useState<{ anchorEl: HTMLElement | null, type: string | null }>({ anchorEl: null, type: null });
  const [additiveInfo, setAdditiveInfo] = useState<Record<string, { name: string; code: string; description?: string }>>({});
  const [additivePopover, setAdditivePopover] = useState<{ anchorEl: HTMLElement | null, code: string | null }>({ anchorEl: null, code: null });
  const [additiveLoading, setAdditiveLoading] = useState(false);

  // Helper: get value or fallback
  const get = (obj: any, ...fields: string[]) => fields.reduce((v, f) => v && v[f], obj);

  // Collect extra fields
  const servingSize = product.serving_size || product.quantity || get(product, 'servingSize') || get(product, 'servingSizeUnit') || '';
  const categories = product.categories || product.categories_tags || product.category || '';
  const labels = product.labels || product.labels_tags || '';
  const allergens = product.allergens || product.allergens_tags || '';
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

  // Collapsible logic for ingredients
  const ingredientLines = (product.ingredients_text || '').split(/,|\n/).map(s => s.trim()).filter(Boolean);
  const flaggedToShow = showAllFlagged ? flaggedIngredients : flaggedIngredients.slice(0, 3);
  const flaggedHasMore = flaggedIngredients.length > 3;

  // Parse additive codes from product
  const additiveCodes = (product.additives_tags || product.additives || '')
    .toString()
    .split(',')
    .map((tag: string) => tag.trim().replace(/^en:/, ''))
    .filter(Boolean);

  // Fetch additive names from Open Food Facts
  useEffect(() => {
    let cancelled = false;
    async function fetchAdditives() {
      setAdditiveLoading(true);
      const info: Record<string, { name: string; code: string; description?: string }> = {};
      await Promise.all(additiveCodes.map(async (code) => {
        try {
          const res = await fetch(`https://world.openfoodfacts.org/additive/${code}.json`);
          const data = await res.json();
          if (data && data.name && data.name.en) {
            info[code] = {
              name: data.name.en,
              code,
              description: data.wiki_data && data.wiki_data.description && data.wiki_data.description.en
                ? data.wiki_data.description.en
                : data.description && data.description.en
                  ? data.description.en
                  : undefined,
            };
          } else {
            info[code] = { name: code.toUpperCase(), code };
          }
        } catch {
          info[code] = { name: code.toUpperCase(), code };
        }
      }));
      if (!cancelled) {
        setAdditiveInfo(info);
        setAdditiveLoading(false);
      }
    }
    if (additiveCodes.length > 0) fetchAdditives();
    else setAdditiveInfo({});
    return () => { cancelled = true; };
  }, [product.additives_tags, product.additives]);

  const handleScoreChipClick = (event: React.MouseEvent<HTMLElement>, type: string) => {
    if (scorePopover.anchorEl && scorePopover.type === type) {
      setScorePopover({ anchorEl: null, type: null });
    } else {
      setScorePopover({ anchorEl: event.currentTarget, type });
    }
  };
  const handleScorePopoverClose = () => setScorePopover({ anchorEl: null, type: null });

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
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{product.product_name || 'No name'}</Typography>
      {product.brands && <Typography variant="subtitle2" sx={{ color: '#888', mb: 1 }}>{product.brands}</Typography>}
      {/* Score */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ background: scoreColor, color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, mr: 1 }}>{score}</Box>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>{scoreLabel}</Typography>
        <Typography variant="body2" sx={{ ml: 0.5, color: scoreColor }}>{score}/100</Typography>
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Ingredients (collapsible) */}
      {ingredientLines.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Ingredients</Typography>
          <Collapse in={showAllIngredients || ingredientLines.length <= 3} collapsedSize={72}>
            <Typography variant="body2" sx={{ color: '#444', whiteSpace: 'pre-line' }}>
              {showAllIngredients ? ingredientLines.join(', ') : ingredientLines.slice(0, 3).join(', ') + (ingredientLines.length > 3 ? ', ...' : '')}
            </Typography>
          </Collapse>
          {ingredientLines.length > 3 && (
            <Button size="small" onClick={() => setShowAllIngredients(v => !v)} sx={{ mt: 1 }} endIcon={showAllIngredients ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
              {showAllIngredients ? 'Show Less' : 'Show More'}
            </Button>
          )}
        </Box>
      )}
      <Divider sx={{ my: 2 }} />
      {/* Details Section (chips) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Details</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {categories && <Chip label={`Categories: ${categories}`} size="small" />}
          {labels && <Chip label={`Labels: ${labels}`} size="small" />}
          {allergens && <Chip label={`Allergens: ${allergens}`} size="small" color="warning" />}
          {/* Additives as chips with popover */}
          {additiveLoading && additiveCodes.length > 0 && <CircularProgress size={18} sx={{ ml: 1 }} />}
          {additiveCodes.map(code => (
            <Chip
              key={code}
              label={additiveInfo[code] ? `${additiveInfo[code].name} (${code.toUpperCase()})` : code.toUpperCase()}
              size="small"
              color="error"
              sx={{ cursor: 'pointer' }}
              onClick={e => setAdditivePopover({ anchorEl: e.currentTarget, code })}
            />
          ))}
          <Popover
            open={!!additivePopover.anchorEl && !!additivePopover.code}
            anchorEl={additivePopover.anchorEl}
            onClose={() => setAdditivePopover({ anchorEl: null, code: null })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <Box sx={{ p: 2, maxWidth: 280 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {additivePopover.code && additiveInfo[additivePopover.code]?.name} ({additivePopover.code?.toUpperCase()})
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {additivePopover.code && additiveInfo[additivePopover.code]?.description
                  ? additiveInfo[additivePopover.code]?.description
                  : 'No description available.'}
              </Typography>
            </Box>
          </Popover>
        </Box>
        {servingSize && <Typography variant="body2">Serving Size: {servingSize}</Typography>}
        {dataType && <Typography variant="body2">Data Type: {dataType}</Typography>}
        {publicationDate && <Typography variant="body2">Publication Date: {publicationDate}</Typography>}
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Scores with popovers */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {nutriScore && (
          <>
            <Chip
              label={`Nutri-Score: ${nutriScore}`}
              sx={{ mb: 1, cursor: 'pointer' }}
              onClick={e => handleScoreChipClick(e, 'Nutri-Score')}
              color={scorePopover.type === 'Nutri-Score' && Boolean(scorePopover.anchorEl) ? 'primary' : 'default'}
            />
            <Popover
              open={scorePopover.type === 'Nutri-Score' && Boolean(scorePopover.anchorEl)}
              anchorEl={scorePopover.anchorEl}
              onClose={handleScorePopoverClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, maxWidth: 240 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Nutri-Score</Typography>
                <Typography variant="body2">{SCORE_DEFINITIONS['Nutri-Score']}</Typography>
              </Box>
            </Popover>
          </>
        )}
        {ecoScore && (
          <>
            <Chip
              label={`Eco-Score: ${ecoScore}`}
              sx={{ mb: 1, cursor: 'pointer' }}
              onClick={e => handleScoreChipClick(e, 'Eco-Score')}
              color={scorePopover.type === 'Eco-Score' && Boolean(scorePopover.anchorEl) ? 'primary' : 'default'}
            />
            <Popover
              open={scorePopover.type === 'Eco-Score' && Boolean(scorePopover.anchorEl)}
              anchorEl={scorePopover.anchorEl}
              onClose={handleScorePopoverClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, maxWidth: 240 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Eco-Score</Typography>
                <Typography variant="body2">{SCORE_DEFINITIONS['Eco-Score']}</Typography>
              </Box>
            </Popover>
          </>
        )}
        {novaGroup && (
          <>
            <Chip
              label={`NOVA Group: ${novaGroup}`}
              sx={{ mb: 1, cursor: 'pointer' }}
              onClick={e => handleScoreChipClick(e, 'NOVA Group')}
              color={scorePopover.type === 'NOVA Group' && Boolean(scorePopover.anchorEl) ? 'primary' : 'default'}
            />
            <Popover
              open={scorePopover.type === 'NOVA Group' && Boolean(scorePopover.anchorEl)}
              anchorEl={scorePopover.anchorEl}
              onClose={handleScorePopoverClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, maxWidth: 240 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>NOVA Group</Typography>
                <Typography variant="body2">{SCORE_DEFINITIONS['NOVA Group']}</Typography>
              </Box>
            </Popover>
          </>
        )}
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Nutritional Info (main, with background) */}
      <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: '#f5f7fa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Nutritional Info (per 100g)</Typography>
        {nutrientFields.map(field => (
          nutriments[field.key] !== undefined && (
            <Typography key={field.key} variant="body2">
              {field.label}: {nutriments[field.key]} {field.unit}
            </Typography>
          )
        ))}
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Highlights: Negatives & Positives */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Highlights</Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Potential negatives and positives based on nutrition and flagged ingredients:</Typography>
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
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Flagged Ingredients Section (collapsible) */}
      {flaggedIngredients.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Flagged Ingredients</Typography>
          <Collapse in={showAllFlagged || flaggedIngredients.length <= 3} collapsedSize={120}>
            {flaggedToShow.map((flag, idx) => (
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
          </Collapse>
          {flaggedHasMore && (
            <Button size="small" onClick={() => setShowAllFlagged(v => !v)} sx={{ mt: 1 }} endIcon={showAllFlagged ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
              {showAllFlagged ? 'Show Less' : 'Show More'}
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ProductCard; 