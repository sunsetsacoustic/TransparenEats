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
  <Box mb={2} sx={sx}>
    <TextField
      label="Search for a food item"
      value={value}
      onChange={onChange}
      fullWidth
      sx={{ mb: 1 }}
    />
    <Button variant="contained" onClick={onSearch} disabled={!value || loading} fullWidth>
      {loading ? 'Searching...' : 'Search'}
    </Button>
  </Box>
);

export default SearchBar; 