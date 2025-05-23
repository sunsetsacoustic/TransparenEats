import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Chip, Collapse, Button, CircularProgress, Grid, Avatar } from '@mui/material';
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

// Add allergen and additive descriptions mapping
const ADDITIVE_DESCRIPTIONS: Record<string, { description: string; severity: 'critical' | 'caution' }> = {
  // Preservatives
  'E200': { 
    description: 'Caution: Common preservative; generally recognized as safe, but may rarely cause mild skin irritation or allergic reactions in very sensitive individuals.',
    severity: 'caution'
  },
  'E202': { 
    description: 'Caution: Generally safe, but rarely reported to cause mild skin irritation, digestive upset, or allergic-like reactions in sensitive individuals.',
    severity: 'caution'
  },
  'E210': { 
    description: 'Caution: Found naturally in some fruits, also used as a preservative. Similar concerns to sodium benzoate regarding potential for hyperactivity in sensitive individuals, especially with certain colorings.',
    severity: 'caution'
  },
  'E211': { 
    description: 'Caution: In rare cases, may trigger hyperactive behavior, especially when combined with artificial colors. Can form harmful benzene in presence of Vitamin C.',
    severity: 'caution'
  },
  'E212': { 
    description: 'Caution: Preservative, closely related to sodium benzoate. Can cause similar concerns, such as triggering hyperactivity in sensitive individuals or forming harmful benzene in presence of Vitamin C.',
    severity: 'caution'
  },
  'E249': { 
    description: 'Caution: Used in cured meats. Can form nitrosamines when cooked at high temperatures, which are classified as possible carcinogens, a concern at high intake.',
    severity: 'caution'
  },
  'E250': { 
    description: 'Caution: Used in cured meats. Can form nitrosamines when cooked at high temperatures, which are classified as possible carcinogens, a concern at high intake.',
    severity: 'caution'
  },
  'E251': { 
    description: 'Caution: Used in cured meats. Can form nitrosamines when cooked at high temperatures, which are classified as possible carcinogens, a concern at high intake.',
    severity: 'caution'
  },
  'E252': { 
    description: 'Caution: Used in cured meats. Can form nitrosamines when cooked at high temperatures, which are classified as possible carcinogens, a concern at high intake.',
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
  'E104': { 
    description: 'Caution: Artificial yellow food coloring. Concerns regarding hyperactivity in children, particularly when combined with benzoates.',
    severity: 'caution'
  },
  'E124': { 
    description: 'Caution: Artificial red food coloring. Like other azo dyes, it has been linked to hyperactivity in children.',
    severity: 'caution'
  },
  'E132': { 
    description: 'Caution: Artificial blue food coloring. While generally considered safe, some reports of mild sensitivities or skin reactions exist.',
    severity: 'caution'
  },
  'E143': { 
    description: 'Caution: Artificial green food coloring. While generally considered safe, some reports of mild sensitivities or skin reactions exist.',
    severity: 'caution'
  },
  'E150': { 
    description: 'Caution: While mostly safe, types E150c and E150d may contain 4-MeI, a compound with some debated health concerns in large amounts based on animal studies.',
    severity: 'caution'
  },
  'E150A': { 
    description: 'Caution: While mostly safe, types E150c and E150d may contain 4-MeI, a compound with some debated health concerns in large amounts based on animal studies.',
    severity: 'caution'
  },
  'E150B': { 
    description: 'Caution: While mostly safe, types E150c and E150d may contain 4-MeI, a compound with some debated health concerns in large amounts based on animal studies.',
    severity: 'caution'
  },
  'E150C': { 
    description: 'Caution: While mostly safe, types E150c and E150d may contain 4-MeI, a compound with some debated health concerns in large amounts based on animal studies.',
    severity: 'caution'
  },
  'E150D': { 
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
  'E127': { 
    description: 'Caution: Artificial red coloring (Erythrosine). May cause sensitivities in some individuals.',
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
  
  // Acidity Regulators / Antioxidants
  'E330': { 
    description: 'Caution: A common acidifier, flavor enhancer, and preservative naturally found in citrus fruits. While generally safe, very rarely, sensitive individuals may experience mild digestive upset or mouth irritation.',
    severity: 'caution'
  },
  'E338': { 
    description: 'Caution: Primarily used as an acidifier in soft drinks. High intake may be linked to concerns about bone health (interfering with calcium absorption) and dental enamel erosion.',
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
  'E420': { 
    description: 'Caution: Sugar alcohol (Sorbitol). Can cause digestive discomfort (e.g., bloating, gas, diarrhea) in some individuals, especially when consumed in large quantities, due to its laxative effect.',
    severity: 'caution'
  },
  'E421': { 
    description: 'Caution: Sugar alcohol (Mannitol). Can cause digestive discomfort (e.g., bloating, gas, diarrhea) in some individuals, especially when consumed in large quantities, due to its laxative effect.',
    severity: 'caution'
  },
  'E965': { 
    description: 'Caution: Sugar alcohol (Maltitol). Can cause digestive discomfort (e.g., bloating, gas, diarrhea) in some individuals, especially when consumed in large quantities, due to its laxative effect.',
    severity: 'caution'
  },
  'E967': { 
    description: 'Caution: Sugar alcohol (Xylitol). Can cause digestive discomfort (e.g., bloating, gas, diarrhea) in some individuals, especially when consumed in large quantities, due to its laxative effect.',
    severity: 'caution'
  },
  'E968': { 
    description: 'Caution: Sugar alcohol (Erythritol). Can cause digestive discomfort (e.g., bloating, gas, diarrhea) in some individuals, especially when consumed in large quantities, due to its laxative effect.',
    severity: 'caution'
  },
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
  'E626': { 
    description: 'Caution: Flavor enhancer, often used with MSG. Those sensitive to MSG may react to these as well, especially if derived from yeast extract.',
    severity: 'caution'
  },
  'E627': { 
    description: 'Caution: Flavor enhancer, often used with MSG. Those sensitive to MSG may react to these as well, especially if derived from yeast extract.',
    severity: 'caution'
  },
  'E628': { 
    description: 'Caution: Flavor enhancer, often used with MSG. Those sensitive to MSG may react to these as well, especially if derived from yeast extract.',
    severity: 'caution'
  },
  'E629': { 
    description: 'Caution: Flavor enhancer, often used with MSG. Those sensitive to MSG may react to these as well, especially if derived from yeast extract.',
    severity: 'caution'
  },
  'E630': { 
    description: 'Caution: Flavor enhancer, often used with MSG and Disodium Guanylate. Those sensitive to MSG may also react to this, especially if derived from animal products (for vegans) or yeast extract.',
    severity: 'caution'
  },
  'E631': { 
    description: 'Caution: Flavor enhancer, often used with MSG and Disodium Guanylate. Those sensitive to MSG may also react to this, especially if derived from animal products (for vegans) or yeast extract.',
    severity: 'caution'
  },
  'E632': { 
    description: 'Caution: Flavor enhancer, often used with MSG and Disodium Guanylate. Those sensitive to MSG may also react to this, especially if derived from animal products (for vegans) or yeast extract.',
    severity: 'caution'
  },
  'E633': { 
    description: 'Caution: Flavor enhancer, often used with MSG and Disodium Guanylate. Those sensitive to MSG may also react to this, especially if derived from animal products (for vegans) or yeast extract.',
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
  
  // Anti-caking Agents
  'E170': { 
    description: 'Caution: A common mineral used as an anti-caking agent or whitener. Generally safe, but very high doses can cause mild digestive upset like constipation.',
    severity: 'caution'
  },
  'E551': { 
    description: 'Caution: Anti-caking agent. Concerns about potential effects mainly apply to nanoparticle forms; generally considered inert in the digestive system, but some choose to avoid for caution.',
    severity: 'caution'
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
  'E100': 'Curcumin',
  'E102': 'Tartrazine',
  'E104': 'Quinoline Yellow',
  'E110': 'Sunset Yellow',
  'E124': 'Ponceau 4R',
  'E127': 'Erythrosine',
  'E129': 'Allura Red AC',
  'E132': 'Indigo Carmine',
  'E133': 'Brilliant Blue FCF',
  'E143': 'Fast Green FCF',
  'E150': 'Caramel',
  'E150A': 'Plain Caramel',
  'E150B': 'Caustic Sulphite Caramel',
  'E150C': 'Ammonia Caramel',
  'E150D': 'Sulphite Ammonia Caramel',
  'E160B': 'Annatto',
  'E170': 'Calcium Carbonate',
  'E171': 'Titanium Dioxide',
  'E200': 'Sorbic Acid',
  'E202': 'Potassium Sorbate',
  'E210': 'Benzoic Acid',
  'E211': 'Sodium Benzoate',
  'E212': 'Potassium Benzoate',
  'E220': 'Sulfur Dioxide',
  'E221': 'Sodium Sulfite',
  'E222': 'Sodium Bisulfite',
  'E223': 'Sodium Metabisulfite',
  'E224': 'Potassium Metabisulfite',
  'E225': 'Potassium Sulfite',
  'E226': 'Calcium Sulfite',
  'E227': 'Calcium Hydrogen Sulfite',
  'E228': 'Potassium Hydrogen Sulfite',
  'E249': 'Potassium Nitrite',
  'E250': 'Sodium Nitrite',
  'E251': 'Sodium Nitrate',
  'E252': 'Potassium Nitrate',
  'E282': 'Calcium Propionate',
  'E320': 'BHA',
  'E321': 'BHT',
  'E322': 'Lecithin',
  'E322I': 'Lecithin',
  'E330': 'Citric Acid',
  'E338': 'Phosphoric Acid',
  'E407': 'Carrageenan',
  'E412': 'Guar Gum',
  'E415': 'Xanthan Gum',
  'E420': 'Sorbitol',
  'E421': 'Mannitol',
  'E433': 'Polysorbate 80',
  'E440': 'Pectin',
  'E450': 'Diphosphates',
  'E450I': 'Disodium Diphosphate',
  'E471': 'Mono/Diglycerides',
  'E472E': 'Mono/Diglyceride Esters',
  'E500': 'Sodium Carbonates',
  'E500II': 'Sodium Bicarbonate',
  'E551': 'Silicon Dioxide',
  'E621': 'Monosodium Glutamate',
  'E626': 'Guanylic Acid',
  'E627': 'Disodium Guanylate',
  'E628': 'Dipotassium Guanylate',
  'E629': 'Calcium Guanylate',
  'E630': 'Inosinic Acid',
  'E631': 'Disodium Inosinate',
  'E632': 'Dipotassium Inosinate',
  'E633': 'Calcium Inosinate',
  'E930': 'Calcium Peroxide',
  'E950': 'Acesulfame K',
  'E951': 'Aspartame',
  'E954': 'Saccharin',
  'E955': 'Sucralose',
  'E965': 'Maltitol',
  'E967': 'Xylitol',
  'E968': 'Erythritol'
};

// Define nutrient fields outside components for reuse
const NUTRIENT_FIELDS = [
  { key: 'energy-kcal_100g', label: 'Calories', unit: 'kcal' },
  { key: 'proteins_100g', label: 'Protein', unit: 'g' },
  { key: 'fat_100g', label: 'Fat', unit: 'g' },
  { key: 'carbohydrates_100g', label: 'Carbs', unit: 'g' },
  { key: 'fiber_100g', label: 'Fiber', unit: 'g' },
  { key: 'sugars_100g', label: 'Sugars', unit: 'g' },
  { key: 'sodium_100g', label: 'Sodium', unit: 'mg' },
];

// Extract ProductHeader component
interface ProductHeaderProps {
  product: Product;
  score: number;
  scoreLabel: string;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ product, score, scoreLabel }) => {
  const barcode = product.code || product.gtinUpc || product.fdcId;
  const image = product.image_front_url || product.image_url || product.photo || '';

  return (
    <>
      {/* Modern gradient banner */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
        color: 'white',
        p: 3,
        borderRadius: '24px 24px 0 0',
        position: 'relative',
      }}>
        {/* Product name & brand */}
        <Box sx={{ mb: 2 }}>
          {barcode && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block', mb: 1 }}>
            Barcode: {barcode}
          </Typography>}
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            {product.product_name || 'No name'}
          </Typography>
          {product.brands && 
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              {product.brands}
            </Typography>
          }
        </Box>
        
        {/* Score in circle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ 
            background: 'rgba(255,255,255,1)', 
            color: score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#4ade80', 
            borderRadius: '50%', 
            width: 64, 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 800, 
            fontSize: 28,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>{score}</Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{scoreLabel}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {score < 40 ? 'High in Sugar & Saturated Fat' : score < 70 ? 'Moderate nutritional value' : 'Good nutritional profile'}
            </Typography>
            <Button 
              size="small" 
              variant="text" 
              sx={{ color: 'white', textDecoration: 'underline', p: 0, mt: 0.5, fontWeight: 400 }}
            >
              Why this score?
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Centered product image */}
      {image && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          mt: -5,
          mb: 2,
          position: 'relative',
          zIndex: 10
        }}>
          <Avatar 
            src={image} 
            alt={product.product_name} 
            variant="rounded" 
            sx={{ 
              width: 200, 
              height: 200, 
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: '6px solid white',
              borderRadius: 4
            }} 
          />
        </Box>
      )}
    </>
  );
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
  const [additiveLoading, setAdditiveLoading] = useState(false);
  const [activeNutritionTab, setActiveNutritionTab] = useState<'quick' | 'serving' | 'full'>('quick');

  // Helper: get value or fallback
  const get = (obj: any, ...fields: string[]) => fields.reduce((v, f) => v && v[f], obj);

  // Collect extra fields
  const servingSize = product.serving_size || product.quantity || get(product, 'servingSize') || get(product, 'servingSizeUnit') || '';
  const categories = product.categories || product.categories_tags || product.category || '';
  const labels = product.labels || product.labels_tags || '';
  const nutriScore = product.nutriscore_grade || product.nutriscore_score;
  const novaGroup = product.nova_group;

  // Collapsible logic for ingredients
  const ingredientLines = (product.ingredients_text || '').split(/,|\n/).map(s => s.trim()).filter(Boolean);

  // Parse additive codes from product
  const additiveCodes = (() => {
    const additiveData = product.additives_tags || product.additives || '';
    if (Array.isArray(additiveData)) {
      return additiveData.join(',').split(',').map(tag => tag.trim().replace(/^en:/, '')).filter(Boolean);
    } else {
      return String(additiveData).split(',').map(tag => tag.trim().replace(/^en:/, '')).filter(Boolean);
    }
  })();

  useEffect(() => {
    // Use local database instead of API
    setAdditiveLoading(false);
  }, [product.additives_tags, product.additives]);

  // Update the additive chip click handler to use our description database
  const handleAdditiveClick = (code: string) => {
    const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const description = ADDITIVE_DESCRIPTIONS[upperCode] 
      ? ADDITIVE_DESCRIPTIONS[upperCode].description 
      : 'Food additive that may affect taste, appearance, or shelf life of the product.';
    
    const severity = ADDITIVE_DESCRIPTIONS[upperCode] ? ADDITIVE_DESCRIPTIONS[upperCode].severity : 'caution';
    
    window.dispatchEvent(new CustomEvent('show-ingredient-info', {
      detail: {
        name: ADDITIVE_NAMES[upperCode] || code.toUpperCase(),
        info: description,
        isFlagged: true,
        isDye: false,
        type: 'additive',
        code: code.toUpperCase(),
        severity
      }
    }));
  };

  // Event handlers
  const handleScoreChipClick = (event: React.MouseEvent<HTMLElement>, type: string) => {
    if (scorePopover.anchorEl && scorePopover.type === type) {
      setScorePopover({ anchorEl: null, type: null });
    } else {
      setScorePopover({ anchorEl: event.currentTarget, type });
    }
  };
  
  // Update popovers in the UI
  React.useEffect(() => {
    const popovers = document.querySelectorAll('.MuiPopover-root');
    popovers.forEach(popover => {
      const element = popover as HTMLElement;
      if (element && element.style) {
        if (!scorePopover.anchorEl) {
          element.style.display = 'none';
        }
      }
    });
  }, [scorePopover]);
  
  const toggleIngredients = () => setShowAllIngredients(prev => !prev);
  const toggleFlagged = () => setShowAllFlagged(prev => !prev);

  return (
    <Paper sx={{ 
      p: 0, 
      borderRadius: '24px', 
      maxWidth: 480, 
      mx: 'auto', 
      boxShadow: '0 12px 24px rgba(0,0,0,0.08)', 
      background: '#fff', 
      color: '#222', 
      maxHeight: '90vh', 
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Product Header Component */}
      <ProductHeader 
        product={product} 
        score={score} 
        scoreLabel={scoreLabel} 
      />
      
      {/* Barcode section */}
      {product.code && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: 1,
          mb: 3
        }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm2 0h3v16H8V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm2 0h1v16h-1V4z" fill="currentColor"/>
            </svg>
            {product.code}
          </Typography>
        </Box>
      )}
      
      {/* Content section */}
      <Box sx={{ p: 3 }}>
        {/* Find alternatives button */}
        {score < 50 && (
          <Button 
            variant="outlined" 
            fullWidth 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              color: '#4ade80',
              borderColor: '#4ade80',
              '&:hover': {
                borderColor: '#22c55e',
                background: 'rgba(74, 222, 128, 0.04)'
              }
            }}
          >
            Find Healthier Alternatives
          </Button>
        )}
      
        {/* Ingredients section */}
        {ingredientLines.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: '1.2rem',
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
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
                background: 'rgba(249, 250, 251, 0.8)',
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
                onClick={toggleIngredients} 
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
        
        {/* Details Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2,
            fontSize: '1.2rem',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 40,
              height: 3,
              borderRadius: 2,
              background: '#60a5fa',
            }
          }}>Details</Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1.5
          }}>
            {categories && (
              <Typography variant="body2" sx={{ 
                color: '#4b5563', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 1.5,
                '&:before': {
                  content: '""',
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#60a5fa',
                  marginTop: '8px'
                }
              }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Category:</Box> {categories}
              </Typography>
            )}
            
            {servingSize && (
              <Typography variant="body2" sx={{ 
                color: '#4b5563', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 1.5,
                '&:before': {
                  content: '""',
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#60a5fa',
                  marginTop: '8px'
                }
              }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Serving Size:</Box> {servingSize}
              </Typography>
            )}
            
            {labels && (
              <Typography variant="body2" sx={{ 
                color: '#4b5563', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 1.5,
                '&:before': {
                  content: '""',
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#60a5fa',
                  marginTop: '8px'
                }
              }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Labels:</Box> {labels}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Food Additives Section */}
        {additiveCodes.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: '1.2rem',
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 3,
                borderRadius: 2,
                background: '#f43f5e',
              }
            }}>
              Detected Food Additives ({additiveCodes.length})
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {additiveLoading && <CircularProgress size={20} />}
              {additiveCodes.map(code => {
                const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
                const name = ADDITIVE_NAMES[upperCode] || upperCode;
                
                return (
                  <Chip
                    key={code}
                    label={`${upperCode} (${name})`}
                    size="medium"
                    onClick={() => handleAdditiveClick(code)}
                    sx={{ 
                      borderRadius: '16px', 
                      backgroundColor: 'rgba(252, 165, 165, 0.2)', 
                      color: '#ef4444',
                      border: '1px solid rgba(252, 165, 165, 0.5)',
                      '&:hover': {
                        backgroundColor: 'rgba(252, 165, 165, 0.3)',
                      }
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}
        
        {/* Food Scores Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2,
            fontSize: '1.2rem',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 40,
              height: 3,
              borderRadius: 2,
              background: '#f59e0b',
            }
          }}>Food Scores</Typography>
          
          {/* Nutri-Score */}
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            borderRadius: 2, 
            border: '1px solid rgba(243, 244, 246, 0.8)', 
            backgroundColor: 'rgba(249, 250, 251, 0.8)' 
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Nutri-Score</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {['A', 'B', 'C', 'D', 'E'].map(grade => {
                const isActive = nutriScore === grade;
                const color = grade === 'A' ? '#22c55e' : 
                              grade === 'B' ? '#84cc16' : 
                              grade === 'C' ? '#eab308' : 
                              grade === 'D' ? '#f97316' : '#ef4444';
                
                return (
                  <Box 
                    key={grade} 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: `2px solid ${color}`,
                      backgroundColor: isActive ? color : 'transparent',
                      color: isActive ? 'white' : color,
                      fontWeight: 700,
                      fontSize: '1rem'
                    }}
                  >
                    {grade}
                  </Box>
                );
              })}
              <Button 
                size="small" 
                sx={{ ml: 'auto', color: '#9ca3af' }}
                onClick={(e) => handleScoreChipClick(e, 'Nutri-Score')}
              >
                What's this?
              </Button>
            </Box>
          </Box>
          
          {/* Eco-Score */}
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            borderRadius: 2, 
            border: '1px solid rgba(243, 244, 246, 0.8)', 
            backgroundColor: 'rgba(249, 250, 251, 0.8)' 
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Eco-Score</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 36, 
                height: 36, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid #9ca3af',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                fontWeight: 700,
                fontSize: '1rem'
              }}>?</Box>
              <Typography variant="body2" sx={{ ml: 2, color: '#6b7280' }}>
                Data currently unavailable
              </Typography>
            </Box>
          </Box>
          
          {/* NOVA Group */}
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            borderRadius: 2, 
            border: '1px solid rgba(243, 244, 246, 0.8)', 
            backgroundColor: 'rgba(249, 250, 251, 0.8)' 
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>NOVA Group</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {[1, 2, 3, 4].map(group => {
                const isActive = Number(novaGroup) === group;
                const color = group === 1 ? '#22c55e' : 
                            group === 2 ? '#84cc16' : 
                            group === 3 ? '#f97316' : '#ef4444';
                
                return (
                  <Box 
                    key={group} 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: `2px solid ${color}`,
                      backgroundColor: isActive ? color : 'transparent',
                      color: isActive ? 'white' : color,
                      fontWeight: 700,
                      fontSize: '1rem'
                    }}
                  >
                    {group}
                  </Box>
                );
              })}
              <Button 
                size="small" 
                sx={{ ml: 'auto', color: '#9ca3af' }}
                onClick={(e) => handleScoreChipClick(e, 'NOVA Group')}
              >
                Learn More ›
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* Nutritional Info Section with Tabs */}
        <Box sx={{ 
          mb: 3, 
          p: 0, 
          borderRadius: '16px', 
          border: '1px solid rgba(186, 230, 253, 0.4)',
          overflow: 'hidden'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            p: 3,
            pb: 2,
            fontSize: '1.2rem',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: 8,
              left: 0,
              width: 40,
              height: 3,
              borderRadius: 2,
              background: '#0ea5e9',
            }
          }}>Nutritional Info (per 100 g)</Typography>
          
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                size="small"
                variant={activeNutritionTab === 'quick' ? 'contained' : 'text'}
                onClick={() => setActiveNutritionTab('quick')}
                sx={{ 
                  minWidth: 0, 
                  backgroundColor: activeNutritionTab === 'quick' ? '#0ea5e9' : 'transparent',
                  color: activeNutritionTab === 'quick' ? 'white' : '#0ea5e9',
                  '&:hover': {
                    backgroundColor: activeNutritionTab === 'quick' ? '#0284c7' : 'rgba(14, 165, 233, 0.04)',
                  }
                }}
              >
                Quick Glance
              </Button>
              <Button 
                size="small"
                variant={activeNutritionTab === 'serving' ? 'contained' : 'text'}
                onClick={() => setActiveNutritionTab('serving')}
                sx={{ 
                  minWidth: 0, 
                  backgroundColor: activeNutritionTab === 'serving' ? '#0ea5e9' : 'transparent',
                  color: activeNutritionTab === 'serving' ? 'white' : '#0ea5e9',
                  '&:hover': {
                    backgroundColor: activeNutritionTab === 'serving' ? '#0284c7' : 'rgba(14, 165, 233, 0.04)',
                  }
                }}
              >
                Per Serving
              </Button>
              <Button 
                size="small"
                variant={activeNutritionTab === 'full' ? 'contained' : 'text'}
                onClick={() => setActiveNutritionTab('full')}
                sx={{ 
                  minWidth: 0, 
                  backgroundColor: activeNutritionTab === 'full' ? '#0ea5e9' : 'transparent',
                  color: activeNutritionTab === 'full' ? 'white' : '#0ea5e9',
                  '&:hover': {
                    backgroundColor: activeNutritionTab === 'full' ? '#0284c7' : 'rgba(14, 165, 233, 0.04)',
                  }
                }}
              >
                Full Table
              </Button>
            </Box>
          </Box>
          
          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {activeNutritionTab === 'quick' && (
              <Grid container spacing={2}>
                {NUTRIENT_FIELDS.slice(0, 6).map(field => (
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
            )}
            
            {activeNutritionTab === 'serving' && (
              <Grid container spacing={2}>
                {NUTRIENT_FIELDS.slice(0, 6).map(field => {
                  // Convert per 100g to per serving if serving size is available
                  let servingValue = nutriments[field.key];
                  if (servingValue !== undefined && servingSize) {
                    const match = servingSize.match(/(\d+).*?[gG]/);
                    if (match && match[1]) {
                      const grams = parseInt(match[1]);
                      servingValue = (servingValue * grams / 100).toFixed(1);
                    }
                  }
                  
                  return servingValue !== undefined && (
                    <Grid item xs={6} key={field.key}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {servingValue} {field.unit}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
            
            {activeNutritionTab === 'full' && (
              <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(243, 244, 246, 0.7)' }}>
                      <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Nutrient</th>
                      <th style={{ padding: 8, textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(nutriments).map(([key, value]) => {
                      if (key.endsWith('_unit') || key.includes('score')) return null;
                      
                      const unit = nutriments[`${key}_unit`] || 
                                  (key.includes('energy') ? 'kcal' : 
                                   key.includes('sodium') ? 'mg' : 'g');
                      
                      const label = key
                        .replace(/_100g$/, '')
                        .replace(/_value$/, '')
                        .replace(/_/, ' ')
                        .replace(/^\w/, c => c.toUpperCase());
                      
                      return (
                        <tr key={key} style={{ borderBottom: '1px solid rgba(243, 244, 246, 0.7)' }}>
                          <td style={{ padding: 8, fontSize: '0.875rem' }}>{label}</td>
                          <td style={{ padding: 8, textAlign: 'right', fontWeight: 500, fontSize: '0.875rem' }}>
                            {value} {unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Flagged Ingredients Section */}
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
              fontSize: '1.2rem',
              position: 'relative',
              display: 'inline-block',
              color: '#b91c1c',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 3,
                borderRadius: 2,
                background: '#ef4444',
              }
            }}>Flagged Ingredients</Typography>
            <Collapse in={showAllFlagged || flaggedIngredients.length <= 3} collapsedSize={120}>
              {flaggedIngredients.slice(0, showAllFlagged ? undefined : 3).map((flag, idx) => (
                <Box key={flag.name + idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 1.5 }}>
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
            {flaggedIngredients.length > 3 && (
              <Button 
                size="small" 
                onClick={toggleFlagged} 
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