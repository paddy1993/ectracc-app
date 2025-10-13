import React from 'react';
import { Box, Link, useTheme } from '@mui/material';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface SkipLink {
  href: string;
  label: string;
}

const skipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' },
  { href: '#footer', label: 'Skip to footer' }
];

export default function SkipLinks() {
  const theme = useTheme();
  const { settings, announceToScreenReader } = useAccessibility();

  if (!settings.skipLinks) {
    return null;
  }

  const handleSkipLinkClick = (label: string, href: string) => {
    // Announce the skip action
    announceToScreenReader(`Skipped to ${label.toLowerCase().replace('skip to ', '')}`, 'assertive');
    
    // Focus the target element
    setTimeout(() => {
      const target = document.querySelector(href);
      if (target) {
        (target as HTMLElement).focus();
        // If the target doesn't have tabindex, add it temporarily
        if (!(target as HTMLElement).hasAttribute('tabindex')) {
          (target as HTMLElement).setAttribute('tabindex', '-1');
          (target as HTMLElement).addEventListener('blur', () => {
            (target as HTMLElement).removeAttribute('tabindex');
          }, { once: true });
        }
      }
    }, 100);
  };

  return (
    <Box
      component="nav"
      aria-label="Skip links"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
        '& a': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          padding: '8px 16px',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: 600,
          fontSize: '0.875rem',
          transition: 'top 0.3s ease',
          border: `2px solid ${theme.palette.primary.main}`,
          '&:focus': {
            top: '6px',
            outline: `2px solid ${theme.palette.primary.contrastText}`,
            outlineOffset: '2px'
          },
          '&:hover': {
            backgroundColor: theme.palette.primary.dark
          }
        }
      }}
    >
      {skipLinks.map((link, index) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={(e) => {
            e.preventDefault();
            handleSkipLinkClick(link.label, link.href);
          }}
          sx={{
            left: `${6 + (index * 150)}px` // Offset each link horizontally
          }}
        >
          {link.label}
        </Link>
      ))}
    </Box>
  );
}
