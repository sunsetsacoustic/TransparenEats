import React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';

interface BottomNavProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ value, onChange }) => (
  <BottomNavigation
    value={value}
    onChange={onChange}
    showLabels
    sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1202,
      borderTop: '1px solid #e0e0e0',
      background: 'rgba(255,255,255,0.98)',
      boxShadow: '0 -2px 12px 0 rgba(25, 118, 210, 0.08)',
      height: 64,
      px: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <BottomNavigationAction label="Home" icon={<HomeIcon />} sx={{ color: value === 0 ? 'primary.main' : '#888' }} />
    <BottomNavigationAction label="Scan" icon={<CameraAltIcon />} sx={{ color: value === 1 ? 'primary.main' : '#888' }} />
    <BottomNavigationAction label="History" icon={<HistoryIcon />} sx={{ color: value === 2 ? 'primary.main' : '#888' }} />
    <BottomNavigationAction label="Search" icon={<SearchIcon />} sx={{ color: value === 3 ? 'primary.main' : '#888' }} />
  </BottomNavigation>
);

export default BottomNav; 