'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analytics } from '../utils/analytics';

// Types for notification system
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

export interface NotificationSystemProps {
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoDismiss?: boolean;
  defaultDuration?: number;
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction: (action: () => void) => void;
}

// Notification item component
function NotificationItem({ notification, onDismiss, onAction }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss if not persistent
    if (!notification.persistent && notification.duration !== 0) {
      const duration = notification.duration || 5000;
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification.duration, notification.persistent]);

  // Progress bar animation
  useEffect(() => {
    if (progressRef.current && !notification.persistent && notification.duration !== 0) {
      const duration = notification.duration || 5000;
      progressRef.current.style.transition = `width ${duration}ms linear`;
      progressRef.current.style.width = '0%';
    }
  }, [notification.duration, notification.persistent]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  }, [notification.id, onDismiss]);

  const handleAction = useCallback(() => {
    if (notification.action) {
      onAction(notification.action.onClick);
      handleDismiss();
    }
  }, [notification.action, onAction, handleDismiss]);

  // Get notification icon
  const getIcon = () => {
    const icons = {
      success: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      error: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      warning: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      info: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    return icons[notification.type];
  };

  // Get notification colors
  const getColors = () => {
    const colors = {
      success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        icon: 'text-green-500'
      },
      error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: 'text-red-500'
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: 'text-yellow-500'
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        icon: 'text-blue-500'
      }
    };
    return colors[notification.type];
  };

  const colors = getColors();

  return (
    <div
      className={`notification notification-${notification.type} ${colors.bg} ${colors.border} ${colors.text} ${
        isVisible ? 'notification-visible' : 'notification-hidden'
      } ${isExiting ? 'notification-exiting' : ''}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Progress bar */}
      {!notification.persistent && notification.duration !== 0 && (
        <div className="notification-progress">
          <div
            ref={progressRef}
            className={`notification-progress-bar bg-${notification.type === 'success' ? 'green' : notification.type === 'error' ? 'red' : notification.type === 'warning' ? 'yellow' : 'blue'}-500`}
          />
        </div>
      )}

      {/* Notification content */}
      <div className="notification-content">
        <div className="notification-icon">
          <span className={colors.icon} aria-hidden="true">
            {getIcon()}
          </span>
        </div>

        <div className="notification-body">
          <h4 className="notification-title">{notification.title}</h4>
          <p className="notification-message">{notification.message}</p>
        </div>

        <div className="notification-actions">
          {notification.action && (
            <button
              className="notification-action-btn"
              onClick={handleAction}
              aria-label={notification.action.label}
            >
              {notification.action.label}
            </button>
          )}

          <button
            className="notification-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Main notification system component
export default function NotificationSystem({
  maxNotifications = 5,
  position = 'top-right',
  autoDismiss = true,
  defaultDuration = 5000
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: Date.now(),
      duration: notification.duration ?? defaultDuration
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    setIsVisible(true);
  }, [generateId, defaultDuration, maxNotifications]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Handle action
  const handleAction = useCallback((action: () => void) => {
    try {
      action();
    } catch (error) {
      console.error('Notification action failed:', error);
    }
  }, []);

  // Success notification
  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    analytics.trackFeatureUsage('notification_shown', { title, type: 'success' });
    addNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  // Error notification
  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    analytics.trackFeatureUsage('notification_shown', { title, type: 'error' });
    analytics.trackError('notification_error', { title, message });
    addNotification({
      type: 'error',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  // Warning notification
  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    analytics.trackFeatureUsage('notification_shown', { title, type: 'warning' });
    addNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  // Info notification
  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    analytics.trackFeatureUsage('notification_shown', { title, type: 'info' });
    addNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose methods via window object for global access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).samanthaNotifications = {
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearAll
      };
    }
  }, [showSuccess, showError, showWarning, showInfo, clearAll]);

  // Get position classes
  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    return positions[position];
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-container ${getPositionClasses()} ${isVisible ? 'notification-container-visible' : ''}`}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={removeNotification}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}
