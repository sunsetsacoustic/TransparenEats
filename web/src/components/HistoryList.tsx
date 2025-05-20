import React from 'react';
import { Paper, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

interface HistoryListProps {
  history: any[];
  onSelect: (item: any) => void;
}

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