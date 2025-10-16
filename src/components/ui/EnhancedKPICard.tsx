import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedKPICardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  previousValue?: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendPercentage?: number;
  progress?: number; // 0-100 for progress ring
  tone?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  loading?: boolean;
  description?: string;
  target?: number; // Goal/target value
  animate?: boolean;
}

const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
  icon,
  label,
  value,
  previousValue,
  unit,
  trend,
  trendPercentage,
  progress,
  tone = 'default',
  size = 'medium',
  onClick,
  loading = false,
  description,
  target,
  animate = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animate number counting
  useEffect(() => {
    if (!animate || typeof value !== 'number') return;
    
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animate]);

  // Color system based on tone
  const getColors = () => {
    const colors = {
      default: {
        primary: theme.palette.text.primary,
        secondary: theme.palette.text.secondary,
        background: theme.palette.background.paper,
        border: theme.palette.divider,
        accent: theme.palette.primary.main
      },
      success: {
        primary: theme.palette.success.main,
        secondary: theme.palette.success.light,
        background: `${theme.palette.success.main}08`,
        border: `${theme.palette.success.main}20`,
        accent: theme.palette.success.main
      },
      warning: {
        primary: theme.palette.warning.main,
        secondary: theme.palette.warning.light,
        background: `${theme.palette.warning.main}08`,
        border: `${theme.palette.warning.main}20`,
        accent: theme.palette.warning.main
      },
      error: {
        primary: theme.palette.error.main,
        secondary: theme.palette.error.light,
        background: `${theme.palette.error.main}08`,
        border: `${theme.palette.error.main}20`,
        accent: theme.palette.error.main
      },
      info: {
        primary: theme.palette.info.main,
        secondary: theme.palette.info.light,
        background: `${theme.palette.info.main}08`,
        border: `${theme.palette.info.main}20`,
        accent: theme.palette.info.main
      }
    };
    return colors[tone];
  };

  const colors = getColors();

  // Size configurations
  const sizeConfig = {
    small: {
      padding: 12,
      iconSize: 20,
      valueSize: '1.5rem',
      labelSize: '0.75rem',
      progressSize: 40
    },
    medium: {
      padding: 16,
      iconSize: 24,
      valueSize: '2rem',
      labelSize: '0.875rem',
      progressSize: 60
    },
    large: {
      padding: 20,
      iconSize: 32,
      valueSize: '2.5rem',
      labelSize: '1rem',
      progressSize: 80
    }
  };

  const config = sizeConfig[size];

  // Trend icon and color
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
      case 'down':
        return <TrendingDown sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
      case 'flat':
        return <TrendingFlat sx={{ color: theme.palette.text.secondary, fontSize: 16 }} />;
      default:
        return null;
    }
  };

  // Progress percentage calculation
  const getProgressPercentage = () => {
    if (progress !== undefined) return progress;
    if (target && typeof value === 'number') {
      return Math.min((value / target) * 100, 100);
    }
    return 0;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: 3,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease-in-out',
          position: 'relative',
          overflow: 'visible',
          '&:hover': onClick ? {
            boxShadow: theme.shadows[4],
            borderColor: colors.accent,
          } : {},
          '&:focus-visible': {
            outline: `2px solid ${colors.accent}`,
            outlineOffset: 2
          },
          // Mobile touch optimization
          minHeight: isMobile ? 120 : 'auto',
          '@media (hover: none)': {
            '&:hover': {
              transform: 'none',
              boxShadow: theme.shadows[2]
            }
          }
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={onClick ? 0 : -1}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? `${label}: ${value}${unit || ''}` : undefined}
      >
        <CardContent sx={{ p: config.padding, '&:last-child': { pb: config.padding } }}>
          {/* Header with icon and info */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {icon && (
                <Box
                  sx={{
                    color: colors.accent,
                    display: 'flex',
                    alignItems: 'center',
                    '& svg': { fontSize: config.iconSize }
                  }}
                >
                  {icon}
                </Box>
              )}
              <Typography
                variant="body2"
                sx={{
                  color: colors.secondary,
                  fontSize: config.labelSize,
                  fontWeight: 500,
                  lineHeight: 1.2
                }}
              >
                {label}
              </Typography>
            </Box>
            
            {description && (
              <IconButton
                size="small"
                sx={{ 
                  color: colors.secondary,
                  opacity: isHovered ? 1 : 0.7,
                  transition: 'opacity 0.2s'
                }}
                aria-label={`More info about ${label}`}
              >
                <InfoIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>

          {/* Main value with progress ring */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mb: trend || trendPercentage ? 1 : 0
          }}>
            {/* Progress ring for goals */}
            {(progress !== undefined || target) && (
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={config.progressSize}
                  thickness={4}
                  sx={{
                    color: `${colors.accent}20`,
                    position: 'absolute'
                  }}
                />
                <CircularProgress
                  variant="determinate"
                  value={progressPercentage}
                  size={config.progressSize}
                  thickness={4}
                  sx={{
                    color: colors.accent,
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    }
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ 
                      color: colors.primary,
                      fontWeight: 600,
                      fontSize: '0.7rem'
                    }}
                  >
                    {Math.round(progressPercentage)}%
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Value display */}
            <Box sx={{ flex: 1 }}>
              {loading ? (
                <CircularProgress size={24} sx={{ color: colors.accent }} />
              ) : (
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    color: colors.primary,
                    fontSize: config.valueSize,
                    fontWeight: 700,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {animate && typeof value === 'number' ? displayValue : value}
                  {unit && (
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.6em',
                        color: colors.secondary,
                        fontWeight: 400,
                        ml: 0.5
                      }}
                    >
                      {unit}
                    </Typography>
                  )}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Trend and percentage change */}
          {(trend || trendPercentage !== undefined) && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mt: 1
            }}>
              {getTrendIcon()}
              {trendPercentage !== undefined && (
                <Chip
                  label={`${trendPercentage > 0 ? '+' : ''}${trendPercentage}%`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: trend === 'up' 
                      ? `${theme.palette.success.main}15`
                      : trend === 'down'
                      ? `${theme.palette.error.main}15`
                      : `${theme.palette.text.secondary}15`,
                    color: trend === 'up'
                      ? theme.palette.success.main
                      : trend === 'down'
                      ? theme.palette.error.main
                      : theme.palette.text.secondary,
                    border: 'none'
                  }}
                />
              )}
              {previousValue && (
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.secondary,
                    fontSize: '0.7rem'
                  }}
                >
                  vs {previousValue}{unit}
                </Typography>
              )}
            </Box>
          )}

          {/* Target information */}
          {target && (
            <Typography
              variant="caption"
              sx={{
                color: colors.secondary,
                fontSize: '0.7rem',
                mt: 0.5,
                display: 'block'
              }}
            >
              Target: {target}{unit}
            </Typography>
          )}
        </CardContent>

        {/* Hover overlay for additional info */}
        <AnimatePresence>
          {isHovered && description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                bottom: -40,
                left: 0,
                right: 0,
                zIndex: 1000
              }}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 1,
                  boxShadow: theme.shadows[4],
                  mx: 1
                }}
              >
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {description}
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default EnhancedKPICard;
