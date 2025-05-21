import React from 'react';
import { Box, TextField, Button, Autocomplete, Avatar } from '@mui/material';
import type { Product } from '../types';

/**
 * Props for the SearchBar component.
 * @property value - The current value of the search input.
 * @property onChange - Handler for input value change.
 * @property onSearch - Handler for search button click.
 * @property loading - Whether a search is in progress.
 * @property options - Array of products to be displayed in the autocomplete.
 * @property onSelect - Handler for selecting a product from the autocomplete.
 * @property sx - Optional custom styling for the outer Box.
 */
interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
  onSearch: () => void;
  loading: boolean;
  options: Product[];
  onSelect: (item: Product) => void;
  sx?: object;
}

/**
 * Renders a search input and button for food item search.
 */
const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch, loading, options, onSelect, sx }) => (
  <Box mb={2} sx={{ ...sx, width: '100%', maxWidth: 400, mx: 'auto', p: 0 }}>
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(option) => typeof option === 'string' ? option : option.product_name || ''}
      filterOptions={(x) => x} // Don't filter client-side, let backend handle
      loading={loading}
      inputValue={value}
      onInputChange={(_, newValue, reason) => {
        if (reason === 'input') onChange(newValue);
      }}
      onChange={(_, newValue) => {
        if (typeof newValue === 'object' && newValue) onSelect(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search for a food item"
          fullWidth
          sx={{ mb: 1, borderRadius: 3, background: '#fff', boxShadow: '0 1px 4px 0 rgba(25, 118, 210, 0.06)' }}
          InputProps={{ ...params.InputProps, sx: { borderRadius: 3 } }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.code} style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={option.image_front_url || option.image_url || ''} sx={{ mr: 1, width: 32, height: 32 }} />
          <span>{option.product_name}</span>
        </li>
      )}
    />
    <Button
      variant="contained"
      onClick={onSearch}
      disabled={!value || loading}
      fullWidth
      sx={{
        borderRadius: 3,
        fontWeight: 700,
        fontSize: 18,
        py: 1.7,
        px: 2,
        boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.08)',
        mb: 1,
        mt: 0,
        background: 'linear-gradient(90deg, #fff 0%, #e3f2fd 100%)',
        color: '#1976d2',
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      {loading ? 'Searching...' : 'Search'}
    </Button>
  </Box>
);

export default SearchBar; 