import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  useTheme,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Download,
  Share,
  Fullscreen
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ChartData {
  period: string;
  carbon: number;
  entries: number;
}

interface CategoryData {
  category: string;
  value: number;
  count: number;
  percentage: number;
}

interface EnhancedChartProps {
  type: 'line' | 'pie';
  data: ChartData[] | CategoryData[];
  title: string;
  period: 'day' | 'week' | 'month';
  onExport?: () => void;
  onShare?: () => void;
  height?: number;
}

export default function EnhancedChart({
  type,
  data,
  title,
  period,
  onExport,
  onShare,
  height = 300
}: EnhancedChartProps) {
  const theme = useTheme();

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  const formatCarbonFootprint = (value: number) => {
    if (value === 0) return '0g CO₂e';
    if (value < 1000) return `${Math.round(value)}g CO₂e`;
    return `${(value / 1000).toFixed(1)}kg CO₂e`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <Card sx={{ minWidth: 200 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {type === 'line' ? (
            <>
              <Typography variant="body2" color="primary.main" sx={{ mb: 0.5 }}>
                Carbon: {formatCarbonFootprint(payload[0].value)}
              </Typography>
              {payload[0].payload.entries && (
                <Typography variant="body2" color="text.secondary">
                  Entries: {payload[0].payload.entries}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography variant="body2" color="primary.main" sx={{ mb: 0.5 }}>
                {formatCarbonFootprint(payload[0].value)} ({payload[0].payload.percentage}%)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {payload[0].payload.count} entries
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const formatXAxisLabel = (value: string) => {
    // Truncate long labels for mobile
    if (value.length > 10) {
      return value.substring(0, 8) + '...';
    }
    return value;
  };

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data as ChartData[]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="period" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={formatXAxisLabel}
        />
        <YAxis 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={(value) => {
            if (value < 1000) return `${value}g`;
            return `${(value / 1000).toFixed(1)}kg`;
          }}
        />
        <RechartsTooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="carbon"
          stroke={theme.palette.primary.main}
          strokeWidth={3}
          dot={{ 
            fill: theme.palette.primary.main, 
            strokeWidth: 2, 
            r: 5 
          }}
          activeDot={{ 
            r: 7, 
            stroke: theme.palette.primary.main, 
            strokeWidth: 2,
            fill: theme.palette.background.paper
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data as any}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ category, percentage }: any) => 
            percentage > 5 ? `${category} ${percentage}%` : ''
          }
          outerRadius={Math.min(height * 0.35, 120)}
          fill="#8884d8"
          dataKey="value"
        >
          {(data as any[]).map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <RechartsTooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onExport && (
              <Tooltip title="Export Chart">
                <IconButton 
                  size="small" 
                  onClick={onExport}
                  sx={{
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2
                    }
                  }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
            )}
            
            {onShare && (
              <Tooltip title="Share Chart">
                <IconButton 
                  size="small" 
                  onClick={onShare}
                  sx={{
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2
                    }
                  }}
                >
                  <Share />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {data.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: height,
            color: 'text.secondary'
          }}>
            <Typography variant="body2">
              No data available for the selected period
            </Typography>
          </Box>
        ) : (
          <>
            {type === 'line' ? renderLineChart() : renderPieChart()}
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
              Values shown are totals per {period === 'day' ? 'week' : period}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
