import React from 'react';
import { Box, TextField, Button } from '@mui/material';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch, loading }) => (
  <Box mb={2}>
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