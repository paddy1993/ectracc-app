import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
  Public as GlobalIcon
} from '@mui/icons-material';
// import { useTranslation } from 'react-i18next';
import { supportedLanguages, getCurrentLanguageConfig } from '../i18n';

interface LanguageSelectorProps {
  variant?: 'button' | 'menu' | 'compact';
  showFlag?: boolean;
  showNativeName?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'button',
  showFlag = true,
  showNativeName = true
}) => {
  // const { i18n } = useTranslation();
  const i18n = { language: 'en-US', changeLanguage: (lng: string) => Promise.resolve() };
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const currentLanguage = i18n.language;
  const currentConfig = getCurrentLanguageConfig();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      handleClose();
      
      // Update document attributes
      const config = supportedLanguages[languageCode as keyof typeof supportedLanguages];
      if (config) {
        document.documentElement.dir = config.rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = languageCode;
        
        // Store preference
        localStorage.setItem('ectracc-language', languageCode);
        localStorage.setItem('ectracc-language-config', JSON.stringify(config));
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const renderLanguageButton = () => {
    if (variant === 'compact') {
      return (
        <Chip
          icon={<LanguageIcon />}
          label={showFlag ? `${currentConfig.flag} ${currentConfig.nativeName}` : currentConfig.nativeName}
          onClick={handleClick}
          variant="outlined"
          size="small"
          data-testid="language-selector-compact"
        />
      );
    }

    return (
      <Button
        onClick={handleClick}
        startIcon={showFlag ? undefined : <LanguageIcon />}
        variant="outlined"
        size="small"
        data-testid="language-selector-button"
        sx={{
          minWidth: 'auto',
          textTransform: 'none',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showFlag && (
            <Typography component="span" sx={{ fontSize: '1.2em' }}>
              {currentConfig.flag}
            </Typography>
          )}
          {showNativeName && (
            <Typography component="span" variant="body2">
              {currentConfig.nativeName}
            </Typography>
          )}
          {!showNativeName && !showFlag && (
            <Typography component="span" variant="body2">
              {currentLanguage.toUpperCase()}
            </Typography>
          )}
        </Box>
      </Button>
    );
  };

  return (
    <Box>
      {renderLanguageButton()}
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            minWidth: 280,
            mt: 1
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        data-testid="language-menu"
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GlobalIcon fontSize="small" />
            Select Language
          </Typography>
        </Box>
        <Divider />
        
        {Object.entries(supportedLanguages).map(([code, config]) => (
          <MenuItem
            key={code}
            onClick={() => handleLanguageChange(code)}
            selected={code === currentLanguage}
            data-testid={`language-option-${code}`}
            sx={{
              py: 1.5,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: 'action.selected'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {code === currentLanguage ? (
                <CheckIcon color="primary" fontSize="small" />
              ) : (
                <Typography component="span" sx={{ fontSize: '1.2em', width: 24, textAlign: 'center' }}>
                  {config.flag}
                </Typography>
              )}
            </ListItemIcon>
            
            <ListItemText>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: code === currentLanguage ? 600 : 400 }}>
                  {config.nativeName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {config.name}
                </Typography>
              </Box>
            </ListItemText>
            
            {config.rtl && (
              <Chip label="RTL" size="small" variant="outlined" sx={{ ml: 1, fontSize: '0.7rem' }} />
            )}
          </MenuItem>
        ))}
        
        <Divider />
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Language preferences are saved automatically
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
