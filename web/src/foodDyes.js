// Data module for food dyes and critical ingredients used in the app.
// Provides FOOD_DYES and CRITICAL_INGREDIENTS arrays for ingredient analysis.
//
// List of common artificial food dyes, aliases, and E-numbers
export const FOOD_DYES = [
  { name: 'Red 40', aliases: ['Allura Red'], eNumbers: ['E129'] },
  { name: 'Yellow 5', aliases: ['Tartrazine'], eNumbers: ['E102'] },
  { name: 'Yellow 6', aliases: ['Sunset Yellow'], eNumbers: ['E110'] },
  { name: 'Blue 1', aliases: ['Brilliant Blue'], eNumbers: ['E133'] },
  { name: 'Blue 2', aliases: ['Indigo Carmine'], eNumbers: ['E132'] },
  { name: 'Green 3', aliases: ['Fast Green'], eNumbers: ['E143'] },
  { name: 'Red 3', aliases: ['Erythrosine'], eNumbers: ['E127'] },
  // Add more as needed
];

// List of critical ingredients with warning messages
export const CRITICAL_INGREDIENTS = [
  {
    name: 'Aspartame',
    aliases: ['E951'],
    warning: 'Aspartame: Artificial sweetener. Some studies suggest possible health risks for certain individuals.'
  },
  {
    name: 'High Fructose Corn Syrup',
    aliases: ['HFCS'],
    warning: 'High Fructose Corn Syrup: Linked to obesity and metabolic issues when consumed in excess.'
  },
  {
    name: 'Sodium Nitrite',
    aliases: ['E250'],
    warning: 'Sodium Nitrite: Used as a preservative in processed meats. Potential cancer risk with high consumption.'
  },
  {
    name: 'Monosodium Glutamate',
    aliases: ['MSG', 'E621'],
    warning: 'MSG: Flavor enhancer. Some people report sensitivity (headaches, etc.).'
  },
  {
    name: 'Potassium Bromate',
    aliases: [],
    warning: 'Potassium Bromate: Banned in many countries due to potential cancer risk.'
  },
  // Add more as needed
];

export const FLAGGED_INGREDIENTS = [
  // Critical Alerts (Red Warning)
  {
    name: 'Milk',
    aliases: ['Lactose', 'Casein', 'Whey'],
    severity: 'critical',
    warning: 'Can trigger severe allergic reactions (e.g., hives, swelling, breathing issues) or digestive distress (e.g., bloating, diarrhea) for those with lactose intolerance.'
  },
  {
    name: 'Eggs',
    aliases: [],
    severity: 'critical',
    warning: 'May cause allergic reactions from mild (e.g., hives, stomach upset) to severe (e.g., breathing difficulty, anaphylaxis).'
  },
  {
    name: 'Peanuts',
    aliases: [],
    severity: 'critical',
    warning: 'High risk for severe, life-threatening allergic reactions, including anaphylaxis. Strict avoidance is crucial.'
  },
  {
    name: 'Tree Nuts',
    aliases: ['Almonds', 'Walnuts', 'Cashews', 'Pecans', 'Hazelnuts', 'Pistachios'],
    severity: 'critical',
    warning: 'Can cause severe allergic reactions (e.g., swelling, breathing issues, anaphylaxis). Avoid if allergic to any tree nut.'
  },
  {
    name: 'Soy',
    aliases: ['Soybean', 'Soy Lecithin'],
    severity: 'critical',
    warning: 'May cause allergic reactions, ranging from mild skin/digestive issues to more severe systemic reactions.'
  },
  {
    name: 'Wheat',
    aliases: ['Gluten'],
    severity: 'critical',
    warning: 'Contains gluten; triggers severe autoimmune reaction in Celiac disease, or digestive/other symptoms in non-celiac gluten sensitivity.'
  },
  {
    name: 'Fish',
    aliases: [],
    severity: 'critical',
    warning: 'Can cause allergic reactions, from hives and swelling to severe anaphylaxis.'
  },
  {
    name: 'Shellfish',
    aliases: ['Crab', 'Shrimp', 'Lobster', 'Mussels', 'Oysters', 'Clams'],
    severity: 'critical',
    warning: 'Common cause of severe, sometimes life-threatening allergic reactions (e.g., rapid swelling, breathing issues).'
  },
  {
    name: 'Sesame',
    aliases: [],
    severity: 'critical',
    warning: 'A growing common allergen that can cause mild to severe allergic reactions, including anaphylaxis.'
  },
  {
    name: 'Mustard',
    aliases: [],
    severity: 'critical',
    warning: 'Can cause allergic reactions, usually mild skin or digestive symptoms, but severe reactions are possible in highly sensitive individuals.'
  },
  {
    name: 'Celery',
    aliases: [],
    severity: 'critical',
    warning: 'May cause allergic reactions, sometimes including oral allergy syndrome, skin rashes, or digestive issues.'
  },
  {
    name: 'Sulfite',
    aliases: ['Sulfites', 'E220', 'E221', 'E222', 'E223', 'E224', 'E225', 'E226', 'E227', 'E228'],
    severity: 'critical',
    warning: 'Can trigger asthma symptoms (e.g., wheezing, shortness of breath) in sensitive individuals, or other allergic-like reactions.'
  },
  {
    name: 'Lupin',
    aliases: [],
    severity: 'critical',
    warning: 'As a legume, it can cause allergic reactions, especially in those with peanut or soy allergies.'
  },
  // Caution Alerts (Yellow/Orange Warning)
  { name: 'Potassium Sorbate', aliases: ['E202'], severity: 'caution', warning: 'Generally safe, but rarely reported to cause mild skin irritation, digestive upset, or allergic-like reactions in sensitive individuals.' },
  { name: 'Sodium Benzoate', aliases: ['E211'], severity: 'caution', warning: 'In rare cases, may trigger hyperactive behavior, especially when combined with artificial colors. Can form harmful benzene in presence of Vitamin C.' },
  { name: 'Calcium Propionate', aliases: ['E282'], severity: 'caution', warning: 'Considered safe for most, but some anecdotal reports link it to mild digestive discomfort, headaches, or behavioral changes in children.' },
  { name: 'BHA', aliases: ['E320'], severity: 'caution', warning: 'Antioxidant preservative. Some debate exists regarding its long-term health effects; often avoided by those seeking "clean label" products.' },
  { name: 'BHT', aliases: ['E321'], severity: 'caution', warning: 'Antioxidant preservative with similar debated health concerns to BHA; often avoided by consumers prioritizing natural ingredients.' },
  { name: 'Nitrates', aliases: ['Nitrites', 'E249', 'E250', 'E251', 'E252'], severity: 'caution', warning: 'Used in cured meats. Can form nitrosamines when cooked at high temperatures, which are classified as possible carcinogens, a concern at high intake.' },
  { name: 'Caramel Color', aliases: ['E150a', 'E150b', 'E150c', 'E150d'], severity: 'caution', warning: 'While mostly safe, types E150c and E150d may contain 4-MeI, a compound with some debated health concerns in large amounts based on animal studies.' },
  { name: 'Annatto', aliases: ['E160b'], severity: 'caution', warning: 'Natural coloring; while safe for most, some individuals have reported allergic-like sensitivities such as hives or swelling.' },
  { name: 'Turmeric', aliases: ['E100'], severity: 'caution', warning: 'Natural yellow spice extract and coloring. Generally safe, but excessive intake could lead to digestive upset or, rarely, allergic reactions.' },
  { name: 'Titanium Dioxide', aliases: ['E171'], severity: 'caution', warning: 'Used for whiteness. Safety is debated, particularly for nanoparticles; has been categorized as "possibly carcinogenic to humans" if inhaled. Many consumers avoid it as a precaution.' },
  { name: 'Red 40', aliases: ['E129'], severity: 'caution', warning: 'Artificial red color strongly linked to hyperactivity and behavioral issues in sensitive children. Widely avoided by concerned parents and those avoiding artificial additives.' },
  { name: 'Yellow 5', aliases: ['E102'], severity: 'caution', warning: 'Artificial yellow color often linked to hyperactivity and behavioral issues in sensitive children. Some individuals may experience mild allergic reactions like itching.' },
  { name: 'Yellow 6', aliases: ['E110'], severity: 'caution', warning: 'Artificial orange-yellow color commonly linked to hyperactivity and behavioral issues in sensitive children.' },
  { name: 'Blue 1', aliases: ['E133'], severity: 'caution', warning: 'Artificial blue food coloring. While less frequently linked to hyperactivity, some minor concerns about sensitivities have been reported.' },
  { name: 'Lecithin', aliases: ['E322'], severity: 'caution', warning: 'An emulsifier, commonly sourced from soy (be aware if you have a soy allergy) or sunflower. Generally safe, but very rarely reported to cause mild digestive issues.' },
  { name: 'Mono- and Diglycerides', aliases: ['E471'], severity: 'caution', warning: 'Emulsifiers that can be derived from animal fats (a concern for vegans/vegetarians). Some recent studies debate their potential impact on gut microbiome and inflammation.' },
  { name: 'Xanthan Gum', aliases: ['E415'], severity: 'caution', warning: 'Thickener and stabilizer. Generally safe, but can cause bloating, gas, or mild digestive upset in sensitive individuals, especially in large amounts.' },
  { name: 'Guar Gum', aliases: ['E412'], severity: 'caution', warning: 'Thickener and stabilizer. A natural fiber, it can cause digestive upset like gas or bloating, particularly at high consumption levels.' },
  { name: 'Carrageenan', aliases: ['E407'], severity: 'caution', warning: 'Derived from seaweed; controversial additive. Some animal studies suggest it may contribute to inflammation and digestive issues; avoided by many for these concerns.' },
  { name: 'Pectin', aliases: ['E440'], severity: 'caution', warning: 'A natural gelling agent from fruits. Generally very safe, but can cause mild digestive discomfort (e.g., bloating, gas) if consumed in very high amounts due to its fiber content.' },
  { name: 'Polysorbate 80', aliases: ['E433'], severity: 'caution', warning: 'Emulsifier. Some animal and in-vitro studies suggest a potential link to gut microbiome disruption and inflammation, though human effects are still being debated.' },
  { name: 'Aspartame', aliases: ['E951'], severity: 'caution', warning: 'Artificial sweetener. Controversial for some consumers; individuals with Phenylketonuria (PKU) must strictly avoid due to its phenylalanine content. Some sensitive individuals report headaches or other symptoms.' },
  { name: 'Sucralose', aliases: ['E955'], severity: 'caution', warning: 'Artificial sweetener. While generally regarded as safe, some studies suggest potential negative effects on gut bacteria and blood sugar regulation in certain individuals.' },
  { name: 'Saccharin', aliases: ['E954'], severity: 'caution', warning: 'Artificial sweetener. One of the oldest synthetic sweeteners. Historically had cancer concerns (since debunked for humans), but still viewed with caution by some consumers.' },
  { name: 'Acesulfame Potassium', aliases: ['E950'], severity: 'caution', warning: 'Artificial sweetener. Some animal studies raise questions about its metabolic effects, but it is generally regarded as safe for human consumption at approved levels.' },
  { name: 'Monosodium Glutamate', aliases: ['MSG', 'E621'], severity: 'caution', warning: 'Flavor enhancer; can trigger a set of symptoms (e.g., headache, flushing, sweating, chest pain) in sensitive individuals, often referred to as "MSG symptom complex".' },
  { name: 'Disodium Guanylate', aliases: ['E626', 'E627', 'E628', 'E629'], severity: 'caution', warning: 'Flavor enhancer, often used with MSG. Those sensitive to MSG may react to these as well, especially if derived from yeast extract.' },
  { name: 'Disodium Inosinate', aliases: ['E630', 'E631', 'E632', 'E633'], severity: 'caution', warning: 'Flavor enhancer, often used with MSG and Disodium Guanylate. Those sensitive to MSG may also react to this, especially if derived from animal products (for vegans) or yeast extract.' },
  { name: 'Silicon Dioxide', aliases: ['E551'], severity: 'caution', warning: 'Anti-caking agent. Concerns about potential effects mainly apply to nanoparticle forms; generally considered inert in the digestive system, but some choose to avoid for caution.' },
  { name: 'Calcium Carbonate', aliases: ['E170'], severity: 'caution', warning: 'A common mineral used as an anti-caking agent or whitener. Generally safe, but very high doses can cause mild digestive upset like constipation.' },
]; 