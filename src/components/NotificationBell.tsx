import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Notifications as BellIcon,
  NotificationsNone as BellOutlineIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import notificationApi, { Notification } from '../services/notificationApi';

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = Boolean(anchorEl);

  // Fetch unread count on component mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await notificationApi.getNotifications({
        page: 1,
        limit: 10
      });
      
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBellClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (notifications.length === 0) {
      fetchNotifications();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await notificationApi.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await notificationApi.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'product_approved':
        return <ApprovedIcon sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'product_rejected':
        return <RejectedIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      default:
        return <InfoIcon sx={{ color: 'info.main', fontSize: 20 }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'product_approved':
        return 'success';
      case 'product_rejected':
        return 'error';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleBellClick}
          sx={{ 
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {unreadCount > 0 ? <BellIcon /> : <BellOutlineIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            overflow: 'visible'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                startIcon={<MarkReadIcon />}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Loading state */}
        {isLoading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Error state */}
        {error && (
          <MenuItem disabled>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </MenuItem>
        )}

        {/* Empty state */}
        {!isLoading && !error && notifications.length === 0 && (
          <MenuItem disabled>
            <Box textAlign="center" py={2}>
              <BellOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          </MenuItem>
        )}

        {/* Notifications list */}
        {!isLoading && !error && notifications.map((notification) => (
          <MenuItem
            key={notification.id}
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              py: 1.5,
              px: 2,
              backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
              '&:hover': {
                backgroundColor: 'action.selected'
              }
            }}
          >
            <Box display="flex" width="100%" alignItems="flex-start" gap={1}>
              <ListItemIcon sx={{ minWidth: 'auto', mt: 0.5 }}>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              
              <Box flex={1} minWidth={0}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: notification.is_read ? 'normal' : 'bold',
                      lineHeight: 1.2
                    }}
                  >
                    {notification.title}
                  </Typography>
                  
                  <Box display="flex" gap={0.5}>
                    {!notification.is_read && (
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                        >
                          <MarkReadIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {notification.message}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={notification.type.replace('_', ' ')}
                    size="small"
                    color={getNotificationColor(notification.type) as any}
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                  
                  <Typography variant="caption" color="text.disabled">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </MenuItem>
        ))}

        {/* View all notifications link */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <MenuItem onClick={handleClose}>
              <Box textAlign="center" width="100%">
                <Typography variant="body2" color="primary">
                  View All Notifications
                </Typography>
              </Box>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
