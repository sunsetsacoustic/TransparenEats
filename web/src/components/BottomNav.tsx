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
    sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, borderTop: '1px solid #eee', background: '#fff' }}
  >
    <BottomNavigationAction label="Home" icon={<HomeIcon />} />
    <BottomNavigationAction label="Scan" icon={<CameraAltIcon />} />
    <BottomNavigationAction label="History" icon={<HistoryIcon />} />
    <BottomNavigationAction label="Search" icon={<SearchIcon />} />
  </BottomNavigation>
);

export default BottomNav; 