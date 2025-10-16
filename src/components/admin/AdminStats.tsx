import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  TrendingUp as TrendingIcon,
  Schedule as TimeIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../../constants';
import { supabase } from '../../services/supabase';

interface AdminStatsData {
  totalSubmissions: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  recentSubmissions: number;
  approvalRate: number;
  averageApprovalTime: {
    averageHours: number;
    reviewedCount: number;
  };
  submissionsByDay: Array<{
    date: string;
    count: number;
  }>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              color: `${color}.main`,
              opacity: 0.7
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch admin statistics');
      }

      setStats(result.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const formatApprovalTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`;
    } else {
      return `${Math.round(hours / 24 * 10) / 10}d`;
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Pending Review"
          value={stats.pendingCount}
          icon={<PendingIcon sx={{ fontSize: 40 }} />}
          color="warning"
          subtitle="Awaiting approval"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Approved"
          value={stats.approvedCount}
          icon={<ApprovedIcon sx={{ fontSize: 40 }} />}
          color="success"
          subtitle="Live in database"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Rejected"
          value={stats.rejectedCount}
          icon={<RejectedIcon sx={{ fontSize: 40 }} />}
          color="error"
          subtitle="Not approved"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Approval Rate"
          value={`${stats.approvalRate}%`}
          icon={<TrendingIcon sx={{ fontSize: 40 }} />}
          color="info"
          subtitle="Overall success rate"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={<StatsIcon sx={{ fontSize: 40 }} />}
          color="primary"
          subtitle="All time"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Recent Submissions"
          value={stats.recentSubmissions}
          icon={<TrendingIcon sx={{ fontSize: 40 }} />}
          color="info"
          subtitle="Last 7 days"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Avg Review Time"
          value={formatApprovalTime(stats.averageApprovalTime.averageHours)}
          icon={<TimeIcon sx={{ fontSize: 40 }} />}
          color="primary"
          subtitle={`${stats.averageApprovalTime.reviewedCount} reviews`}
        />
      </Grid>
    </Grid>
  );
}
