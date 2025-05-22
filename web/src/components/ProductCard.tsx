import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Avatar, Chip, Collapse, Button, Popover, CircularProgress, Grid } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
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

const getScore = (flaggedIngredients: FlaggedIngredient[], dyes: Dye[]) => {
  // Count critical and caution flagged ingredients separately
  const criticalCount = flaggedIngredients.filter(i => i.severity === 'critical').length;
  const cautionCount = flaggedIngredients.filter(i => i.severity === 'caution').length;
  
  // Heavier penalties for critical ingredients, moderate for caution, light for dyes
  let score = 100 - (criticalCount * 20) - (cautionCount * 10) - (dyes.length * 7);
  
  // Additional penalty if both dyes and critical ingredients are present
  if (criticalCount > 0 && dyes.length > 0) {
    score -= 10;
  }
  
  // Clamp score between 0-100
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
  const { label: scoreLabel } = getScoreLabel(score);
  const nutriments = product.nutriments || {};
  const [scorePopover, setScorePopover] = useState<{ anchorEl: HTMLElement | null, type: string | null }>({ anchorEl: null, type: null });
  const [additiveInfo, setAdditiveInfo] = useState<Record<string, { name: string; code: string; description?: string }>>({});
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
  const additiveCodes = (() => {
    const additiveData = product.additives_tags || product.additives || '';
    if (Array.isArray(additiveData)) {
      return additiveData.join(',').split(',').map(tag => tag.trim().replace(/^en:/, '')).filter(Boolean);
    } else {
      return String(additiveData).split(',').map(tag => tag.trim().replace(/^en:/, '')).filter(Boolean);
    }
  })();

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

  // Get allergen/additive descriptions for popups
  const getAllergenInfo = (allergenCode: string) => {
    const name = allergenCode.replace(/^en:/, '').replace(/-/g, ' ');
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      code: allergenCode,
      info: 'Common allergen that can cause serious, life-threatening allergic reactions, or medically recognized severe intolerances in some individuals.',
      type: 'allergen',
      isFlagged: true
    };
  };

  return (
    <Paper sx={{ 
      p: 0, 
      borderRadius: '24px', 
      maxWidth: 420, 
      mx: 'auto', 
      boxShadow: '0 12px 24px rgba(0,0,0,0.08)', 
      background: '#fff', 
      color: '#222', 
      maxHeight: '80vh', 
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Top section with gradient background */}
      <Box sx={{ 
        background: score < 40 
          ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
          : score < 70
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
        color: 'white',
        p: 3,
        borderRadius: '24px 24px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: `
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)
          `,
          zIndex: 0,
        }} />
        
        {/* Barcode */}
        {barcode && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, display: 'block', zIndex: 1, position: 'relative' }}>Barcode: {barcode}</Typography>}
        
        {/* Product name & brand */}
        <Box sx={{ position: 'relative', zIndex: 1, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{product.product_name || 'No name'}</Typography>
          {product.brands && <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{product.brands}</Typography>}
        </Box>

        {/* Score in circle */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          position: 'relative', 
          zIndex: 1 
        }}>
          <Box sx={{ 
            background: 'rgba(255,255,255,0.2)', 
            color: '#fff', 
            borderRadius: '50%', 
            width: 56, 
            height: 56, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 800, 
            fontSize: 24,
            border: '2px solid rgba(255,255,255,0.4)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>{score}</Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{scoreLabel}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>{score}/100 Health Score</Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Image (if available) */}
      {image && (
        <Box sx={{ 
          mt: -4, 
          mb: 2, 
          display: 'flex', 
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          <Avatar 
            src={image} 
            alt={product.product_name} 
            variant="rounded" 
            sx={{ 
              width: 100, 
              height: 100, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '4px solid white',
              borderRadius: 4
            }} 
          />
        </Box>
      )}
      
      {/* Content section */}
      <Box sx={{ p: 3, pt: image ? 1 : 3 }}>
        {/* Ingredients (collapsible) */}
        {ingredientLines.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: '1.1rem',
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: 0,
                width: 40,
                height: 3,
                borderRadius: 2,
                background: '#4ade80',
              }
            }}>Ingredients</Typography>
            <Collapse in={showAllIngredients || ingredientLines.length <= 3} collapsedSize={72}>
              <Typography variant="body2" sx={{ 
                color: '#374151', 
                whiteSpace: 'pre-line',
                background: 'rgba(243, 244, 246, 0.7)',
                borderRadius: 2,
                p: 2,
                fontSize: '0.9rem',
                lineHeight: 1.6,
              }}>
                {showAllIngredients ? ingredientLines.join(', ') : ingredientLines.slice(0, 3).join(', ') + (ingredientLines.length > 3 ? ', ...' : '')}
              </Typography>
            </Collapse>
            {ingredientLines.length > 3 && (
              <Button 
                size="small" 
                onClick={() => setShowAllIngredients(v => !v)} 
                sx={{ 
                  mt: 1,
                  color: '#4ade80',
                  '&:hover': {
                    background: 'rgba(74, 222, 128, 0.1)',
                  },
                }} 
                endIcon={showAllIngredients ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {showAllIngredients ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </Box>
        )}
        
        {/* Details Section (chips) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2,
            fontSize: '1.1rem',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -6,
              left: 0,
              width: 40,
              height: 3,
              borderRadius: 2,
              background: '#60a5fa',
            }
          }}>Details</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {categories && <Chip label={`Categories: ${categories}`} size="small" sx={{ background: 'rgba(243, 244, 246, 0.7)' }} />}
            {labels && <Chip label={`Labels: ${labels}`} size="small" sx={{ background: 'rgba(243, 244, 246, 0.7)' }} />}
            
            {/* Allergens with proper click handling */}
            {allergens && typeof allergens === 'string' && allergens.split(',').filter(Boolean).map(allergen => (
              <Chip
                key={allergen}
                label={`${allergen.replace(/^en:/, '').replace(/-/g, ' ')}`}
                size="small"
                color="warning"
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  const allergenInfo = getAllergenInfo(allergen);
                  window.dispatchEvent(new CustomEvent('show-ingredient-info', {
                    detail: {
                      name: allergenInfo.name,
                      info: allergenInfo.info,
                      isFlagged: true,
                      isDye: false,
                      type: 'allergen',
                      code: allergenInfo.code
                    }
                  }));
                }}
              />
            ))}
            
            {/* Additives as chips with custom event dispatch */}
            {additiveLoading && additiveCodes.length > 0 && <CircularProgress size={18} sx={{ ml: 1 }} />}
            {additiveCodes.map(code => (
              <Chip
                key={code}
                label={additiveInfo[code] ? `${additiveInfo[code].name} (${code.toUpperCase()})` : code.toUpperCase()}
                size="small"
                color="error"
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('show-ingredient-info', {
                    detail: {
                      name: additiveInfo[code]?.name || code.toUpperCase(),
                      info: additiveInfo[code]?.description || 'Food additive that may affect taste, appearance, or shelf life of the product.',
                      isFlagged: true,
                      isDye: false,
                      type: 'additive',
                      code: code.toUpperCase()
                    }
                  }));
                }}
              />
            ))}
          </Box>
          {servingSize && (
            <Typography variant="body2" sx={{ 
              color: '#4b5563', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mb: 1,
              '&:before': {
                content: '""',
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#60a5fa',
              }
            }}>
              Serving Size: {servingSize}
            </Typography>
          )}
        </Box>
        
        {/* Scores with popovers */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2,
            fontSize: '1.1rem',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -6,
              left: 0,
              width: 40,
              height: 3,
              borderRadius: 2,
              background: '#f59e0b',
            }
          }}>Food Scores</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {nutriScore && (
              <>
                <Chip
                  label={`Nutri-Score: ${nutriScore}`}
                  sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    '&.MuiChip-root': {
                      background: scorePopover.type === 'Nutri-Score' && Boolean(scorePopover.anchorEl) 
                        ? 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)' 
                        : 'rgba(243, 244, 246, 0.7)',
                      color: scorePopover.type === 'Nutri-Score' && Boolean(scorePopover.anchorEl) ? 'white' : 'inherit',
                      fontWeight: 500,
                    }
                  }}
                  onClick={e => handleScoreChipClick(e, 'Nutri-Score')}
                />
                <Popover
                  open={scorePopover.type === 'Nutri-Score' && Boolean(scorePopover.anchorEl)}
                  anchorEl={scorePopover.anchorEl}
                  onClose={handleScorePopoverClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }
                  }}
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
                  sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    '&.MuiChip-root': {
                      background: scorePopover.type === 'Eco-Score' && Boolean(scorePopover.anchorEl) 
                        ? 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)' 
                        : 'rgba(243, 244, 246, 0.7)',
                      color: scorePopover.type === 'Eco-Score' && Boolean(scorePopover.anchorEl) ? 'white' : 'inherit',
                      fontWeight: 500,
                    }
                  }}
                  onClick={e => handleScoreChipClick(e, 'Eco-Score')}
                />
                <Popover
                  open={scorePopover.type === 'Eco-Score' && Boolean(scorePopover.anchorEl)}
                  anchorEl={scorePopover.anchorEl}
                  onClose={handleScorePopoverClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }
                  }}
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
                  sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    '&.MuiChip-root': {
                      background: scorePopover.type === 'NOVA Group' && Boolean(scorePopover.anchorEl) 
                        ? 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)' 
                        : 'rgba(243, 244, 246, 0.7)',
                      color: scorePopover.type === 'NOVA Group' && Boolean(scorePopover.anchorEl) ? 'white' : 'inherit',
                      fontWeight: 500,
                    }
                  }}
                  onClick={e => handleScoreChipClick(e, 'NOVA Group')}
                />
                <Popover
                  open={scorePopover.type === 'NOVA Group' && Boolean(scorePopover.anchorEl)}
                  anchorEl={scorePopover.anchorEl}
                  onClose={handleScorePopoverClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <Box sx={{ p: 2, maxWidth: 240 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>NOVA Group</Typography>
                    <Typography variant="body2">{SCORE_DEFINITIONS['NOVA Group']}</Typography>
                  </Box>
                </Popover>
              </>
            )}
          </Box>
        </Box>
        
        {/* Nutritional Info in a card */}
        <Box sx={{ 
          mb: 3, 
          p: 3, 
          borderRadius: '16px', 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid rgba(186, 230, 253, 0.4)'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2,
            fontSize: '1.1rem',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -6,
              left: 0,
              width: 40,
              height: 3,
              borderRadius: 2,
              background: '#0ea5e9',
            }
          }}>Nutritional Info (per 100g)</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {nutrientFields.map(field => (
              nutriments[field.key] !== undefined && (
                <Grid item xs={6} key={field.key}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                      {field.label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {nutriments[field.key]} {field.unit}
                    </Typography>
                  </Box>
                </Grid>
              )
            ))}
          </Grid>
        </Box>
        
        {/* Flagged Ingredients Section (collapsible) in a warning card */}
        {flaggedIngredients.length > 0 && (
          <Box sx={{ 
            mb: 3,
            p: 3,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid rgba(254, 202, 202, 0.4)'
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: '1.1rem',
              position: 'relative',
              display: 'inline-block',
              color: '#b91c1c',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: 0,
                width: 40,
                height: 3,
                borderRadius: 2,
                background: '#ef4444',
              }
            }}>Flagged Ingredients</Typography>
            <Collapse in={showAllFlagged || flaggedIngredients.length <= 3} collapsedSize={120}>
              {flaggedToShow.map((flag, idx) => (
                <Box key={flag.name + idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                  {flag.severity === 'critical' ? (
                    <WarningIcon sx={{ color: '#dc2626', fontSize: 20, mt: 0.5 }} />
                  ) : (
                    <ReportProblemIcon sx={{ color: '#ea580c', fontSize: 20, mt: 0.5 }} />
                  )}
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: flag.severity === 'critical' ? '#dc2626' : '#ea580c' 
                    }}>
                      {flag.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4b5563', display: 'block', mb: 0.5 }}>
                      {flag.warning}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Collapse>
            {flaggedHasMore && (
              <Button 
                size="small" 
                onClick={() => setShowAllFlagged(v => !v)} 
                sx={{ 
                  mt: 1,
                  color: '#ef4444',
                  '&:hover': {
                    background: 'rgba(239, 68, 68, 0.1)',
                  },
                }} 
                endIcon={showAllFlagged ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {showAllFlagged ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ProductCard; 