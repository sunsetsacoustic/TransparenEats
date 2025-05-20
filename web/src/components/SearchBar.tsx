import React from 'react';
import { Box, TextField, Button } from '@mui/material';

/**
 * Props for the SearchBar component.
 * @property value - The current value of the search input.
 * @property onChange - Handler for input value change.
 * @property onSearch - Handler for search button click.
 * @property loading - Whether a search is in progress.
 * @property sx - Optional custom styling for the outer Box.
 */
interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  loading: boolean;
  sx?: object;
}

/**
 * Renders a search input and button for food item search.
 */
const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch, loading, sx }) => (
  <Box mb={2} sx={{ ...sx, width: '100%', maxWidth: 400, mx: 'auto', p: 0 }}>
    <TextField
      label="Search for a food item"
      value={value}
      onChange={onChange}
      fullWidth
      sx={{ mb: 1, borderRadius: 3, background: '#fff', boxShadow: '0 1px 4px 0 rgba(25, 118, 210, 0.06)' }}
      InputProps={{ sx: { borderRadius: 3 } }}
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