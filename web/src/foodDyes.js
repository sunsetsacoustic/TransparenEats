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