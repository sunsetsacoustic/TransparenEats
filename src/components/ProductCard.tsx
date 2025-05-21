interface ProductCardProps {
  product: Product;
  flaggedIngredients: FlaggedIngredient[];
  dyes: Dye[];
}

const ProductCard: React.FC<ProductCardProps> = ({ product, flaggedIngredients, dyes }) => {
  // ... existing code ...
} 