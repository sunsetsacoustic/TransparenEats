export interface Product {
  code: string;
  product_name: string;
  brands?: string;
  ingredients_text?: string;
  image_front_url?: string;
  nutriments?: {
    fiber_100g?: number;
    proteins_100g?: number;
    [key: string]: any;
  };
  ingredients?: { id?: string; text: string }[];
}

export interface Dye {
  name: string;
  aliases: string[];
  eNumbers: string[];
}

export interface CriticalIngredient {
  name: string;
  aliases: string[];
  warning: string;
}

export interface IngredientInfo {
  name: string;
  info: string;
  isFlagged: boolean;
  isDye: boolean;
} 