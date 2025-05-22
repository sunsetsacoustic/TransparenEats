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

// Add allergen and additive descriptions mapping
const ALLERGEN_DESCRIPTIONS: Record<string, { description: string; severity: 'critical' | 'caution' }> = {
  // Critical Allergens
  'milk': { 
    description: 'Critical allergen: Can trigger severe allergic reactions (e.g., hives, swelling, breathing issues) or digestive distress (e.g., bloating, diarrhea) for those with lactose intolerance.',
    severity: 'critical'
  },
  'eggs': { 
    description: 'Critical allergen: May cause allergic reactions from mild (e.g., hives, stomach upset) to severe (e.g., breathing difficulty, anaphylaxis).',
    severity: 'critical'
  },
  'peanuts': { 
    description: 'Critical allergen: High risk for severe, life-threatening allergic reactions, including anaphylaxis. Strict avoidance is crucial.',
    severity: 'critical'
  },
  'tree-nuts': { 
    description: 'Critical allergen group: Can cause severe allergic reactions (e.g., swelling, breathing issues, anaphylaxis). Avoid if allergic to any tree nut.',
    severity: 'critical'
  },
  'soy': { 
    description: 'Critical allergen: May cause allergic reactions, ranging from mild skin/digestive issues to more severe systemic reactions.',
    severity: 'critical'
  },
  'wheat': { 
    description: 'Critical allergen: Contains gluten; triggers severe autoimmune reaction in Celiac disease, or digestive/other symptoms in non-celiac gluten sensitivity.',
    severity: 'critical'
  },
  'fish': { 
    description: 'Critical allergen: Can cause allergic reactions, from hives and swelling to severe anaphylaxis.',
    severity: 'critical'
  },
  'shellfish': { 
    description: 'Critical allergen: Common cause of severe, sometimes life-threatening allergic reactions (e.g., rapid swelling, breathing issues).',
    severity: 'critical'
  },
  'sesame': { 
    description: 'Critical allergen: A growing common allergen that can cause mild to severe allergic reactions, including anaphylaxis.',
    severity: 'critical'
  },
  'mustard': { 
    description: 'Critical allergen: Can cause allergic reactions, usually mild skin or digestive symptoms, but severe reactions are possible in highly sensitive individuals.',
    severity: 'critical'
  },
  'celery': { 
    description: 'Critical allergen: May cause allergic reactions, sometimes including oral allergy syndrome, skin rashes, or digestive issues.',
    severity: 'critical'
  },
  'lupin': { 
    description: 'Critical allergen: As a legume, it can cause allergic reactions, especially in those with peanut or soy allergies.',
    severity: 'critical'
  },
};

const ADDITIVE_DESCRIPTIONS: Record<string, { description: string; severity: 'critical' | 'caution' }> = {
  // Preservatives
  'E202': { 
    description: 'Caution: Generally safe, but rarely reported to cause mild skin irritation, digestive upset, or allergic-like reactions in sensitive individuals.',
    severity: 'caution'
  },
  'E211': { 
    description: 'Caution: In rare cases, may trigger hyperactive behavior, especially when combined with artificial colors. Can form harmful benzene in presence of Vitamin C.',
    severity: 'caution'
  },
  'E282': { 
    description: 'Caution: Considered safe for most, but some anecdotal reports link it to mild digestive discomfort, headaches, or behavioral changes in children.',
    severity: 'caution'
  },
  'E320': { 
    description: 'Caution: Antioxidant preservative. Some debate exists regarding its long-term health effects; often avoided by those seeking \'clean label\' products.',
    severity: 'caution'
  },
  'E321': { 
    description: 'Caution: Antioxidant preservative with similar debated health concerns to BHA; often avoided by consumers prioritizing natural ingredients.',
    severity: 'caution'
  },
  
  // Colorings
  'E150': { 
    description: 'Caution: While mostly safe, types E150c and E150d may contain 4-MeI, a compound with some debated health concerns in large amounts based on animal studies.',
    severity: 'caution'
  },
  'E160B': { 
    description: 'Caution: Natural coloring; while safe for most, some individuals have reported allergic-like sensitivities such as hives or swelling.',
    severity: 'caution'
  },
  'E100': { 
    description: 'Caution: Natural yellow spice extract and coloring. Generally safe, but excessive intake could lead to digestive upset or, rarely, allergic reactions.',
    severity: 'caution'
  },
  'E171': { 
    description: 'Caution: Used for whiteness. Safety is debated, particularly for nanoparticles; has been categorized as \'possibly carcinogenic to humans\' if inhaled. Many consumers avoid it as a precaution.',
    severity: 'caution'
  },
  'E129': { 
    description: 'Caution: Artificial red color strongly linked to hyperactivity and behavioral issues in sensitive children. Widely avoided by concerned parents and those avoiding artificial additives.',
    severity: 'caution'
  },
  'E102': { 
    description: 'Caution: Artificial yellow color often linked to hyperactivity and behavioral issues in sensitive children. Some individuals may experience mild allergic reactions like itching.',
    severity: 'caution'
  },
  'E110': { 
    description: 'Caution: Artificial orange-yellow color commonly linked to hyperactivity and behavioral issues in sensitive children.',
    severity: 'caution'
  },
  'E133': { 
    description: 'Caution: Artificial blue food coloring. While less frequently linked to hyperactivity, some minor concerns about sensitivities have been reported.',
    severity: 'caution'
  },
  
  // Emulsifiers/Stabilizers/Thickeners
  'E322': { 
    description: 'Caution: An emulsifier, commonly sourced from soy (be aware if you have a soy allergy) or sunflower. Generally safe, but very rarely reported to cause mild digestive issues.',
    severity: 'caution'
  },
  'E322I': { 
    description: 'Caution: An emulsifier, commonly sourced from soy (be aware if you have a soy allergy) or sunflower. Generally safe, but very rarely reported to cause mild digestive issues.',
    severity: 'caution'
  },
  'E471': { 
    description: 'Caution: Emulsifiers that can be derived from animal fats (a concern for vegans/vegetarians). Some recent studies debate their potential impact on gut microbiome and inflammation.',
    severity: 'caution'
  },
  'E415': { 
    description: 'Caution: Thickener and stabilizer. Generally safe, but can cause bloating, gas, or mild digestive upset in sensitive individuals, especially in large amounts.',
    severity: 'caution'
  },
  'E412': { 
    description: 'Caution: Thickener and stabilizer. A natural fiber, it can cause digestive upset like gas or bloating, particularly at high consumption levels.',
    severity: 'caution'
  },
  'E407': { 
    description: 'Caution: Derived from seaweed; controversial additive. Some animal studies suggest it may contribute to inflammation and digestive issues; avoided by many for these concerns.',
    severity: 'caution'
  },
  'E440': { 
    description: 'Caution: A natural gelling agent from fruits. Generally very safe, but can cause mild digestive discomfort (e.g., bloating, gas) if consumed in very high amounts due to its fiber content.',
    severity: 'caution'
  },
  'E433': { 
    description: 'Caution: Emulsifier. Some animal and in-vitro studies suggest a potential link to gut microbiome disruption and inflammation, though human effects are still being debated.',
    severity: 'caution'
  },
  
  // Sweeteners
  'E951': { 
    description: 'Caution: Artificial sweetener. Controversial for some consumers; individuals with Phenylketonuria (PKU) must strictly avoid due to its phenylalanine content. Some sensitive individuals report headaches or other symptoms.',
    severity: 'caution'
  },
  'E955': { 
    description: 'Caution: Artificial sweetener. While generally regarded as safe, some studies suggest potential negative effects on gut bacteria and blood sugar regulation in certain individuals.',
    severity: 'caution'
  },
  'E954': { 
    description: 'Caution: Artificial sweetener. One of the oldest synthetic sweeteners. Historically had cancer concerns (since debunked for humans), but still viewed with caution by some consumers.',
    severity: 'caution'
  },
  'E950': { 
    description: 'Caution: Artificial sweetener. Some animal studies raise questions about its metabolic effects, but it is generally regarded as safe for human consumption at approved levels.',
    severity: 'caution'
  },
  
  // Flavor Enhancers
  'E621': { 
    description: 'Caution: Flavor enhancer; can trigger a set of symptoms (e.g., headache, flushing, sweating, chest pain) in sensitive individuals, often referred to as \'MSG symptom complex\'.',
    severity: 'caution'
  },
  
  // Sulfites
  'E220': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  'E221': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  'E222': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  'E223': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  'E224': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  'E225': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  'E226': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  'E227': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  'E228': { 
    description: 'Critical sensitivity: Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.',
    severity: 'critical'
  },
  
  // Other common additives
  'E450': { 
    description: 'Caution: Phosphate additive used as an emulsifier, stabilizer and acidity regulator. May contribute to imbalance in calcium-phosphorus metabolism with long-term consumption.',
    severity: 'caution'
  },
  'E450I': { 
    description: 'Caution: Phosphate additive used as an emulsifier, stabilizer and acidity regulator. May contribute to imbalance in calcium-phosphorus metabolism with long-term consumption.',
    severity: 'caution'
  },
  'E472E': { 
    description: 'Caution: Emulsifier made from glycerol and natural fatty acids. Generally recognized as safe but may cause digestive discomfort in sensitive individuals.',
    severity: 'caution'
  },
  'E500': { 
    description: 'Caution: Sodium carbonates used as acidity regulators and raising agents. Generally safe, but high consumption may contribute to sodium intake concerns.',
    severity: 'caution'
  },
  'E500II': { 
    description: 'Caution: Sodium carbonates used as acidity regulators and raising agents. Generally safe, but high consumption may contribute to sodium intake concerns.',
    severity: 'caution'
  },
  'E930': { 
    description: 'Caution: Calcium peroxide, used as a flour treatment agent. Generally recognized as safe in food production.',
    severity: 'caution'
  },
};

const ADDITIVE_NAMES: Record<string, string> = {
  'E171': 'Titanium Dioxide',
  'E202': 'Potassium Sorbate',
  'E282': 'Calcium Propionate',
  'E322': 'Lecithin',
  'E322I': 'Lecithin',
  'E450': 'Diphosphates',
  'E450I': 'Disodium Diphosphate',
  'E471': 'Mono/Diglycerides',
  'E472E': 'Mono/Diglyceride Esters',
  'E500': 'Sodium Carbonates',
  'E500II': 'Sodium Bicarbonate',
  'E930': 'Calcium Peroxide',
  'E220': 'Sulfur Dioxide',
  'E221': 'Sodium Sulfite',
  'E222': 'Sodium Bisulfite',
  'E223': 'Sodium Metabisulfite',
  'E224': 'Potassium Metabisulfite',
  'E225': 'Potassium Sulfite',
  'E226': 'Calcium Sulfite',
  'E227': 'Calcium Hydrogen Sulfite',
  'E228': 'Potassium Hydrogen Sulfite',
  'E621': 'Monosodium Glutamate',
  'E100': 'Curcumin',
  'E129': 'Allura Red AC',
  'E102': 'Tartrazine',
  'E110': 'Sunset Yellow',
  'E133': 'Brilliant Blue FCF',
  'E150': 'Caramel',
  'E160B': 'Annatto',
  'E320': 'BHA',
  'E321': 'BHT',
  'E407': 'Carrageenan',
  'E412': 'Guar Gum',
  'E415': 'Xanthan Gum',
  'E433': 'Polysorbate 80',
  'E440': 'Pectin',
  'E950': 'Acesulfame K',
  'E951': 'Aspartame',
  'E954': 'Saccharin',
  'E955': 'Sucralose',
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
    const normalizedName = name.toLowerCase();
    
    // Check if this allergen is in our database
    const allergenInfo = Object.entries(ALLERGEN_DESCRIPTIONS).find(([key]) => 
      normalizedName.includes(key) || key.includes(normalizedName)
    );
    
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      code: allergenCode,
      info: allergenInfo 
        ? allergenInfo[1].description 
        : 'Common allergen that can cause serious, life-threatening allergic reactions, or medically recognized severe intolerances in some individuals.',
      type: 'allergen',
      isFlagged: true,
      severity: allergenInfo ? allergenInfo[1].severity : 'critical'
    };
  };

  // Update the additive chip click handler to use our description database
  const handleAdditiveClick = (code: string) => {
    const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const description = ADDITIVE_DESCRIPTIONS[upperCode] 
      ? ADDITIVE_DESCRIPTIONS[upperCode].description 
      : additiveInfo[code]?.description || 'Food additive that may affect taste, appearance, or shelf life of the product.';
    
    const severity = ADDITIVE_DESCRIPTIONS[upperCode] ? ADDITIVE_DESCRIPTIONS[upperCode].severity : 'caution';
    
    window.dispatchEvent(new CustomEvent('show-ingredient-info', {
      detail: {
        name: additiveInfo[code]?.name || ADDITIVE_NAMES[upperCode] || code.toUpperCase(),
        info: description,
        isFlagged: true,
        isDye: false,
        type: 'additive',
        code: code.toUpperCase(),
        severity
      }
    }));
  };

  // Get additive name for display
  const getAdditiveName = (code: string): string => {
    const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (additiveInfo[code]?.name) {
      return additiveInfo[code].name;
    } else if (ADDITIVE_NAMES[upperCode]) {
      return `${ADDITIVE_NAMES[upperCode]} (${upperCode})`;
    } else {
      return code.toUpperCase();
    }
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
        display: 'flex',
        flexDirection: 'column',
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

        {/* Score in circle and Image side by side */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative', 
          zIndex: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              background: 'rgba(255,255,255,1)', 
              color: score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#4ade80', 
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
          
          {/* Image on the right */}
          {image && (
            <Box sx={{ position: 'relative' }}>
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
        </Box>
      </Box>
      
      {/* Content section */}
      <Box sx={{ p: 3 }}>
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
                {showAllIngredients ? 'SHOW LESS' : 'SHOW MORE'}
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
                label={getAdditiveName(code)}
                size="small"
                color="error"
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: '#FF5252',
                  color: 'white',
                  borderRadius: '20px',
                }}
                onClick={() => handleAdditiveClick(code)}
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
        
        {/* Food Scores with popovers */}
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
          }}>Nutritional Info (per 100 g)</Typography>
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
                {showAllFlagged ? 'SHOW LESS' : 'SHOW MORE'}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ProductCard; 