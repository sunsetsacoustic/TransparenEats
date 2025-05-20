import React from 'react';
import { Paper, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

/**
 * Props for the HistoryList component.
 * @property history - Array of previously scanned/searched products.
 * @property onSelect - Handler for selecting a product from history.
 */
interface HistoryListProps {
  history: any[];
  onSelect: (item: any) => void;
}

/**
 * Renders a list of recent scans/searches for quick access.
 */
const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect }) => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Typography variant="subtitle1">Recent Scans/Searches:</Typography>
    <List>
      {history.map((item, idx) => (
        <ListItem key={item.code || idx} disablePadding>
          <ListItemButton onClick={() => onSelect(item)}>
            <ListItemText
              primary={item.product_name || 'No name'}
              secondary={item.brands}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Paper>
);

export default HistoryList; 