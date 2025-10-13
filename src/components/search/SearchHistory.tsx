import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon,
  Typography,
  IconButton,
  useTheme
} from '@mui/material';
import { History, Clear } from '@mui/icons-material';

interface SearchHistoryProps {
  history: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
  maxItems?: number;
}

export default function SearchHistory({ 
  history, 
  onSelect, 
  onRemove, 
  onClear, 
  maxItems = 5 
}: SearchHistoryProps) {
  const theme = useTheme();

  if (history.length === 0) {
    return null;
  }

  const displayHistory = history.slice(0, maxItems);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1300,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: theme.shadows[4],
        maxHeight: 300,
        overflow: 'auto'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          Recent Searches
        </Typography>
        <IconButton 
          size="small" 
          onClick={onClear}
          sx={{
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2
            }
          }}
        >
          <Clear fontSize="small" />
        </IconButton>
      </Box>

      <List sx={{ py: 0 }}>
        {displayHistory.map((term, index) => (
          <ListItem 
            key={`${term}-${index}`} 
            disablePadding
            secondaryAction={
              <IconButton 
                edge="end" 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(term);
                }}
                sx={{
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2
                  }
                }}
              >
                <Clear fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton 
              onClick={() => onSelect(term)}
              sx={{
                py: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <History fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText 
                primary={term}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
