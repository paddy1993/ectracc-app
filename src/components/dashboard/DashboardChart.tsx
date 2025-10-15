import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  [key: string]: any;
}

interface DashboardChartProps {
  title: string;
  data: ChartDataPoint[];
  loading?: boolean;
  height?: number;
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  dataKey?: string;
  xAxisKey?: string;
  formatTooltip?: (value: any, name: string) => [string, string];
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
}

export default function DashboardChart({
  title,
  data,
  loading = false,
  height = 300,
  color = '#8884d8',
  showLegend = true,
  showGrid = true,
  dataKey = 'value',
  xAxisKey = 'name',
  formatTooltip,
  formatXAxis,
  formatYAxis
}: DashboardChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const defaultTooltipFormatter = (value: any, name: string) => {
    return [`${value} kg CO₂e`, name];
  };

  const defaultXAxisFormatter = (value: any) => {
    return value;
  };

  const defaultYAxisFormatter = (value: any) => {
    return `${value}kg`;
  };

  if (loading) {
    return (
      <Card sx={{ height: height + 80 }}>
        <CardHeader
          title={
            <Skeleton 
              variant="text" 
              width="40%" 
              height={24}
              animation="wave"
            />
          }
        />
        <CardContent>
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={height}
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card sx={{ height: height + 80 }}>
        <CardHeader title={title} />
        <CardContent>
          <Box
            sx={{
              height: height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No data available
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Start tracking your carbon footprint to see your progress here
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: height + 80 }}>
      <CardHeader 
        title={
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: isMobile ? 5 : 30,
              left: isMobile ? 5 : 20,
              bottom: 5,
            }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider}
                opacity={0.3}
              />
            )}
            <XAxis
              dataKey={xAxisKey}
              tick={{ 
                fontSize: isMobile ? 10 : 12,
                fill: theme.palette.text.secondary
              }}
              tickFormatter={formatXAxis || defaultXAxisFormatter}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
            />
            <YAxis
              tick={{ 
                fontSize: isMobile ? 10 : 12,
                fill: theme.palette.text.secondary
              }}
              tickFormatter={formatYAxis || defaultYAxisFormatter}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
            />
            <Tooltip
              formatter={formatTooltip || defaultTooltipFormatter}
              labelStyle={{ color: theme.palette.text.primary }}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[4]
              }}
            />
            {showLegend && (
              <Legend
                wrapperStyle={{
                  fontSize: isMobile ? '12px' : '14px',
                  color: theme.palette.text.secondary
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ 
                fill: color, 
                strokeWidth: 2, 
                r: isMobile ? 3 : 4 
              }}
              activeDot={{ 
                r: isMobile ? 5 : 6, 
                stroke: color,
                strokeWidth: 2,
                fill: theme.palette.background.paper
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
