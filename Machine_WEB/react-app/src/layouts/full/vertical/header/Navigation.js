import { useState } from 'react';
import { Box, Menu, Typography, Button, Divider, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import { IconChevronDown, IconHelp } from '@tabler/icons';
import AppLinks from './AppLinks';
import QuickLinks from './QuickLinks';
import React from 'react';

const AppDD = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);

  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  return (
    <>
      <Box>
        {/* <Button
          aria-label="show 11 new notifications"
          color="inherit"
          variant="text"
          aria-controls="msgs-menu"
          aria-haspopup="true"
          sx={{
            bgcolor: anchorEl2 ? 'primary.light' : '',
            color: anchorEl2 ? 'primary.main' : (theme) => theme.palette.text.secondary,
          }}
          onClick={handleClick2}
          endIcon={<IconChevronDown size="15" style={{ marginLeft: '-5px', marginTop: '2px' }} />}
        >
          Apps
        </Button> */}
        {/* ------------------------------------------- */}
        {/* Message Dropdown */}
        {/* ------------------------------------------- */}
        <Menu
          id="msgs-menu"
          anchorEl={anchorEl2}
          keepMounted
          open={Boolean(anchorEl2)}
          onClose={handleClose2}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          sx={{
            '& .MuiMenu-paper': {
              width: '850px',
            },
            '& .MuiMenu-paper ul': {
              p: 2,
            },
          }}
        >
          <Grid container>
            <Grid item sm={4}>
              <Box p={4}>
                <QuickLinks />
              </Box>
            </Grid>
          </Grid>
        </Menu>
      </Box>
      {/* <Button color="inherit" sx={{color: (theme) => theme.palette.text.secondary}} variant="text" to="/apps/chats" component={Link}>
        YsiChat GPT
      </Button> */}
    </>
  );
};

export default AppDD;
