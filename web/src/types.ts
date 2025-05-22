export interface Product {
  code: string;
  product_name: string;
  brands?: string;
  ingredients_text?: string;
  image_front_url?: string;
  nutriments?: {
    fiber_100g?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
    [key: string]: any;
  };
  ingredients?: { id?: string; text: string }[];
  serving_size?: string;
  quantity?: string;
  servingSize?: string;
  servingSizeUnit?: string;
  categories?: string;
  categories_tags?: string;
  category?: string;
  labels?: string;
  labels_tags?: string;
  allergens?: string;
  allergens_tags?: string;
  additives_tags?: string;
  additives?: string;
  nutriscore_grade?: string;
  nutriscore_score?: string | number;
  ecoscore_grade?: string;
  ecoscore_score?: string | number;
  nova_group?: string | number;
  publicationDate?: string;
  modifiedDate?: string;
  dataType?: string;
  gtinUpc?: string;
  fdcId?: string;
  image_url?: string;
  photo?: string;
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
  type?: 'allergen' | 'additive' | 'dye' | 'ingredient';
  code?: string;
} 