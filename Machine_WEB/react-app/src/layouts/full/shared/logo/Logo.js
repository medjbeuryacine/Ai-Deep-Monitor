import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ReactComponent as LogoDark } from 'src/assets/images/logos_test/dark-logo.svg';
import { ReactComponent as LogoDarkRTL } from 'src/assets/images/logos_test/dark-rtl-logo.svg';
import { ReactComponent as LogoLight } from 'src/assets/images/logos_test/light-logo.svg';
import { ReactComponent as LogoLightRTL } from 'src/assets/images/logos_test/light-logo-rtl.svg';
import { styled } from '@mui/material';

const Logo = () => {
  const customizer = useSelector((state) => state.customizer);
  const LinkStyled = styled(Link)(() => ({
    height: customizer.TopbarHeight,
    width: customizer.isCollapse ? '30px' : '250px',
    overflow: 'hidden',
    display: 'block',
  }));

  if (customizer.activeDir === 'ltr') {
    return (
      <LinkStyled to="/" style={{
        display: 'flex',
        alignItems: 'center',
      }}>
        {customizer.activeMode === 'dark' ? (
          <LogoLight />
        ) : (
          <LogoDark />
        )}
      </LinkStyled>
    );
  }
  return (
    <LinkStyled to="/" style={{
      display: 'flex',
      alignItems: 'center',
    }}>
      {customizer.activeMode === 'dark' ? (
        <LogoDarkRTL />
      ) : (
        <LogoLightRTL />
      )}
    </LinkStyled>
  );
};

export default Logo;
