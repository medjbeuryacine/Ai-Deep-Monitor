import React from 'react';
import { Box, Grid, Typography, Container, Divider, Stack } from '@mui/material';
import { Link, NavLink } from 'react-router-dom';

import LogoIcon from 'src/assets/images/logos/logo.svg';

const footerLinks = [
  {
    id: 1,
    title: 'YsiRobot',
    children: [
      
      { titleText: 'Management', link: 'http://192.168.1.96:8000/' },
      { titleText: 'Data Base', link: 'http://192.168.1.97:8086' },
      { titleText: 'Control Mission', link: 'http://192.168.1.96:4200' },

      
    ],
  },
  {
    id: 2,
    title: 'Monitoring',
    children: [
      { titleText: 'YsiWeb', link: 'http://192.168.1.176:8080/CloudManager/WebObjects/CloudManager.woa/wa/default' },
      { titleText: 'IA-Monitor', link: '/oid/doc' },
      { titleText: 'Nagios', link: 'http://192.168.1.37/' },
    ],
  },
  {
    id: 3,
    title: 'Contact',
    children: [
      { titleText: 'Nous Contacter', link: '/frontend-pages/contact' },
      { /*
        customContent: (
          <Box>
            <Typography
              variant="body2"
              sx={{ fontSize: '15px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.5 }}
            >
              YsiTech<br></br>Éditeurs de logiciels | Sociétés de services
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: '15px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.5 }}
            >
              04 72 18 02 83
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: '15px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.5 }}
            >
              160 rue Pierre Fallion
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: '15px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.5 }}
            >
              69140 Rillieux la Pape
            </Typography>
          </Box>
        ),
      */},
      
    ],
  },
];

const Footer = () => {
  return (
    <>
      <Container
        maxWidth="lg"
        sx={{
          pt: {
            xs: '30px',
            lg: '60px',
          },
        }}
      >
        <Grid container spacing={4} justifyContent="space-between" mb={2}>
          {footerLinks.map((section) => (
            <Grid item xs={12} sm={6} lg={4} key={section.id}>
              <Typography fontSize="17px" fontWeight="600" mb="22px">
                {section.title}
              </Typography>
              {section.children.map((child, i) =>
                child.customContent ? (
                  <React.Fragment key={i}>{child.customContent}</React.Fragment>
                ) : (
                  <NavLink to={child.link} key={i}>
                    <Typography
                      sx={{
                        display: 'block',
                        padding: '10px 0',
                        fontSize: '15px',
                        color: (theme) => theme.palette.text.primary,
                        '&:hover': {
                          color: (theme) => theme.palette.primary.main,
                        },
                      }}
                      component="span"
                    >
                      {child.titleText}
                    </Typography>
                  </NavLink>
                )
              )}
            </Grid>
          ))}
        </Grid>

        <Divider />

        <Box
          py="40px"
          display="flex"
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" gap={1} alignItems="center">
            <img src={LogoIcon} width={20} height={20} alt="logo" />
            <Typography variant="body1" fontSize="15px">
              All rights reserved by YsiTech.
            </Typography>
          </Stack>
          <Typography variant="body1" fontSize="15px">
            Produced by{' '}
            <Typography component={Link} color="primary.main" to="">
              YsiTech
            </Typography>
            .
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default Footer;
