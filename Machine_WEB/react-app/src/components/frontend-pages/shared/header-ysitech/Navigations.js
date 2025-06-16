import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { Chip, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'; // Chevron pour indication

export const NavLinks = [
  {
    title: 'YsiWeb',
    to: 'http://192.168.1.176:8080/CloudManager/WebObjects/CloudManager.woa/wa/default',
    target: '_blank',
  },
  {
    title: 'Management',
    to: 'http://192.168.1.96:8000/',
    target: '_blank',
    category: 'robotics',
  },
  {
    title: 'Data Base',
    to: 'http://192.168.1.97:8086',
    target: '_blank',
    category: 'robotics',
  },
  {
    title: 'Control Mission',
    to: 'http://192.168.1.96:4200',
    target: '_blank',
    category: 'robotics',
  },
  {
    title: 'IA-Monitor',
    to: '/oid/doc',
  },
  {
    title: 'Nagios',
    to: 'http://192.168.1.37/',
    target: '_blank',
  },
  {
    title: 'Contact',
    to: '/frontend-pages/contact',
  },
];

const Navigations = () => {
  const StyledButton = styled(Button)(({ theme }) => ({
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 500,
    '&.active': {
      backgroundColor: 'rgba(93, 135, 255, 0.15)',
      color: theme.palette.primary.main,
    },
  }));

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const roboticsLinks = NavLinks.filter((navlink) => navlink.category === 'robotics');
  const otherLinks = NavLinks.filter((navlink) => !navlink.category);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Menu dropdown pour robotique */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative' }}
      >
        <StyledButton
          color="inherit"
          variant="text"
          endIcon={<ArrowDropDownIcon />} // Chevron pour indication
        >
          YsiRobot
        </StyledButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMouseLeave}
          MenuListProps={{
            'aria-labelledby': 'robotics-menu',
            onMouseLeave: handleMouseLeave,
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              minWidth: '200px',
              padding: '8px 0',
              backgroundColor: '#fff',
            },
          }}
        >
          {roboticsLinks.map((navlink, i) => (
            <MenuItem
              key={i}
              component="a"
              href={navlink.to}
              target={navlink.target}
              rel="noopener noreferrer"
              sx={{
                fontSize: '14px',
                padding: '10px 16px',
                color: '#000', // Texte noir
                '&:hover': {
                  backgroundColor: '#5D87FF',
                },
              }}
            >
              {navlink.title}
            </MenuItem>
          ))}
        </Menu>
      </div>

      {/* Autres liens */}
      {otherLinks.map((navlink, i) => {
        const isExternal = navlink.target === '_blank';

        return isExternal ? (
          <StyledButton
            color="inherit"
            href={navlink.to}
            target={navlink.target}
            rel="noopener noreferrer"
            variant="text"
            key={i}
          >
            {navlink.title}
          </StyledButton>
        ) : (
          <StyledButton
            color="inherit"
            component="a"
            href={navlink.to}
            variant="text"
            key={i}
          >
            {navlink.title}
            {navlink.new && (
              <Chip
                label="New"
                size="small"
                sx={{
                  ml: '6px',
                  borderRadius: '8px',
                  color: 'primary.main',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }}
              />
            )}
          </StyledButton>
        );
      })}
    </div>
  );
};

export default Navigations;