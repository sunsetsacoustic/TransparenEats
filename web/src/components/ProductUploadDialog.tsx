import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, CircularProgress } from '@mui/material';

interface ProductUploadDialogProps {
  open: boolean;
  barcode: string;
  onClose: () => void;
  onSubmit: (data: {
    barcode: string;
    product_name: string;
    ingredients_text: string;
    image_front?: File;
    image_ingredients?: File;
    image_nutrition?: File;
  }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  statusMessage?: string | null;
}

const ProductUploadDialog: React.FC<ProductUploadDialogProps> = ({ open, barcode, onClose, onSubmit, loading, error, statusMessage }) => {
  const [productName, setProductName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [imageFront, setImageFront] = useState<File | undefined>();
  const [imageIngredients, setImageIngredients] = useState<File | undefined>();
  const [imageNutrition, setImageNutrition] = useState<File | undefined>();
  const [touched, setTouched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!productName || !ingredientsText) return;
    await onSubmit({
      barcode,
      product_name: productName,
      ingredients_text: ingredientsText,
      image_front: imageFront,
      image_ingredients: imageIngredients,
      image_nutrition: imageNutrition,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Product to Open Food Facts</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Barcode" value={barcode} disabled fullWidth />
          <TextField
            label="Product Name"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            required
            error={touched && !productName}
            helperText={touched && !productName ? 'Product name is required' : ''}
            fullWidth
          />
          <TextField
            label="Ingredients"
            value={ingredientsText}
            onChange={e => setIngredientsText(e.target.value)}
            required
            error={touched && !ingredientsText}
            helperText={touched && !ingredientsText ? 'Ingredients are required' : ''}
            fullWidth
            multiline
            minRows={2}
          />
          <Box>
            <Typography variant="subtitle2">Upload Images (optional)</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <Button variant="outlined" component="label">
                Front Image
                <input type="file" accept="image/*" hidden onChange={e => setImageFront(e.target.files?.[0])} />
              </Button>
              {imageFront && <Typography variant="caption">{imageFront.name}</Typography>}
              <Button variant="outlined" component="label">
                Ingredients Image
                <input type="file" accept="image/*" hidden onChange={e => setImageIngredients(e.target.files?.[0])} />
              </Button>
              {imageIngredients && <Typography variant="caption">{imageIngredients.name}</Typography>}
              <Button variant="outlined" component="label">
                Nutrition Image
                <input type="file" accept="image/*" hidden onChange={e => setImageNutrition(e.target.files?.[0])} />
              </Button>
              {imageNutrition && <Typography variant="caption">{imageNutrition.name}</Typography>}
            </Box>
          </Box>
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !productName || !ingredientsText}>
          {loading ? <><CircularProgress size={20} />{statusMessage && <span style={{ marginLeft: 12 }}>{statusMessage}</span>}</> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductUploadDialog; 