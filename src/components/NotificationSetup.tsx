import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as GoalIcon,
  Sync as SyncIcon,
  Close as CloseIcon,
  EmojiEvents
} from '@mui/icons-material';
import notificationService from '../services/notificationService';

interface NotificationSetupProps {
  open: boolean;
  onClose: () => void;
}

interface NotificationSettings {
  dailyReminders: boolean;
  goalUpdates: boolean;
  weeklyReports: boolean;
  syncNotifications: boolean;
  achievementAlerts: boolean;
}

const NotificationSetup: React.FC<NotificationSetupProps> = ({ open, onClose }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminders: true,
    goalUpdates: true,
    weeklyReports: true,
    syncNotifications: false,
    achievementAlerts: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      checkNotificationStatus();
    }
  }, [open]);

  const checkNotificationStatus = async () => {
    setPermission(Notification.permission);
    const subscribed = await notificationService.isSubscribed();
    setIsSubscribed(subscribed);
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        const subscription = await notificationService.subscribe();
        setIsSubscribed(!!subscription);

        // Send test notification
        await notificationService.sendTestNotification();

        // Schedule goal reminders if enabled
        if (settings.dailyReminders || settings.goalUpdates) {
          await notificationService.scheduleGoalReminders();
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      const success = await notificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { color: 'success' as const, text: 'Enabled' };
      case 'denied':
        return { color: 'error' as const, text: 'Blocked' };
      default:
        return { color: 'warning' as const, text: 'Not Set' };
    }
  };

  const notificationTypes = [
    {
      key: 'dailyReminders' as keyof NotificationSettings,
      icon: <ScheduleIcon />,
      title: 'Daily Reminders',
      description: 'Get reminded to log your daily carbon footprint',
      example: '🌱 Daily Carbon Check-in'
    },
    {
      key: 'goalUpdates' as keyof NotificationSettings,
      icon: <TrendingIcon />,
      title: 'Goal Progress',
      description: 'Updates on your carbon reduction goals',
      example: '🎯 You\'re 80% towards your weekly goal!'
    },
    {
      key: 'weeklyReports' as keyof NotificationSettings,
      icon: <GoalIcon />,
      title: 'Weekly Reports',
      description: 'Summary of your weekly carbon footprint',
      example: '📊 Your weekly carbon report is ready'
    },
    {
      key: 'achievementAlerts' as keyof NotificationSettings,
      icon: <EmojiEvents />,
      title: 'Achievements',
      description: 'Celebrate when you reach milestones',
      example: '🎉 Goal Achieved! You reduced 20% this month'
    },
    {
      key: 'syncNotifications' as keyof NotificationSettings,
      icon: <SyncIcon />,
      title: 'Sync Updates',
      description: 'Know when offline data is synced',
      example: '🔄 Your offline data has been synced'
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <NotificationIcon sx={{ mr: 1 }} />
            Push Notifications
          </Box>
          <Chip 
            label={getPermissionStatus().text}
            color={getPermissionStatus().color}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Permission Status */}
        {permission === 'denied' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Notifications are blocked. Please enable them in your browser settings to receive updates.
          </Alert>
        )}

        {permission === 'default' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Enable notifications to get reminders about your carbon goals and achievements.
          </Alert>
        )}

        {permission === 'granted' && !isSubscribed && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Notifications are allowed but not set up. Click "Enable Notifications" to start receiving updates.
          </Alert>
        )}

        {permission === 'granted' && isSubscribed && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Notifications are active! You'll receive updates based on your preferences below.
          </Alert>
        )}

        {/* Notification Types */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Notification Preferences
        </Typography>

        <List>
          {notificationTypes.map((type, index) => (
            <React.Fragment key={type.key}>
              <ListItem>
                <ListItemIcon>
                  {type.icon}
                </ListItemIcon>
                <ListItemText
                  primary={type.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {type.description}
                      </Typography>
                      <Typography variant="caption" sx={{ fontStyle: 'italic', mt: 0.5, display: 'block' }}>
                        Example: {type.example}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings[type.key]}
                    onChange={() => handleSettingChange(type.key)}
                    disabled={permission !== 'granted' || !isSubscribed}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {index < notificationTypes.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {/* Benefits */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            Why enable notifications?
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <li>
              <Typography variant="body2">
                Stay motivated with daily reminders
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Track progress towards your carbon goals
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Celebrate achievements and milestones
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Get notified when offline data syncs
              </Typography>
            </li>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        
        {permission === 'granted' && isSubscribed && (
          <Button 
            onClick={handleDisableNotifications}
            disabled={loading}
          >
            Disable
          </Button>
        )}
        
        {(permission === 'default' || (permission === 'granted' && !isSubscribed)) && (
          <Button 
            onClick={handleEnableNotifications}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Enable Notifications'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSetup;
