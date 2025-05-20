import React from 'react';
import { Paper, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

interface SearchResultsListProps {
  results: any[];
  onSelect: (item: any) => void;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({ results, onSelect }) => (
  <Paper sx={{ p: 2, mt: 2 }}>
    <Typography variant="subtitle1">Search Results:</Typography>
    <List>
      {results.map((prod, idx) => (
        <ListItem key={prod.code || idx} disablePadding>
          <ListItemButton onClick={() => onSelect(prod)}>
            <ListItemText
              primary={prod.product_name || 'No name'}
              secondary={prod.brands}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Paper>
);

export default SearchResultsList; 