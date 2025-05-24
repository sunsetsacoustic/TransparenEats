import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { contributeProduct } from '../api';

interface UserContributionFormProps {
  open: boolean;
  barcode: string;
  onClose: () => void;
  onSuccess?: () => void;
  suggestions?: string[];
}

const UserContributionForm: React.FC<UserContributionFormProps> = ({ 
  open, 
  barcode, 
  onClose, 
  onSuccess,
  suggestions 
}) => {
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [image, setImage] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const resetForm = () => {
    setProductName('');
    setBrandName('');
    setImage(undefined);
    setError(null);
    setSuccess(false);
    setTouched(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    
    if (!productName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await contributeProduct(barcode, {
        name: productName,
        brand: brandName || undefined,
        image: image
      });
      
      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000); // Give user time to see the success message
        }
      } else {
        setError(result.message || 'An error occurred while submitting the product.');
      }
    } catch (err) {
      setError('Failed to submit product information. Please try again later.');
      console.error('Error submitting product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Help Us Improve Our Database</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            Thank you for your contribution! Your product information has been submitted successfully.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Barcode" value={barcode} disabled fullWidth />
            
            {suggestions && suggestions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  We couldn't find this product. Did you mean one of these?
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {suggestions.map((suggestion, index) => (
                    <Button 
                      key={index} 
                      size="small" 
                      variant="outlined"
                      onClick={() => setProductName(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
            
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
              label="Brand Name (Optional)"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              fullWidth
            />
            
            <Box>
              <Typography variant="subtitle2">Upload Product Image (Optional)</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Button variant="outlined" component="label">
                  Choose Image
                  <input type="file" accept="image/*" capture="environment" hidden onChange={e => setImage(e.target.files?.[0])} />
                </Button>
                {image && <Typography variant="caption">{image.name}</Typography>}
              </Box>
            </Box>
            
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && (
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !productName}>
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserContributionForm; 