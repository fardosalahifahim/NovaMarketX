import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import NotificationSettings from './NotificationSettings';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    clearNotification,
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    userId,
    isConnected
  } = useNotification();

  const toggleDropdown = () => {
    setOpen(!open);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClearNotification = (id) => {
    clearNotification(id);
  };

  const handleClearAll = () => {
    setConfirmMessage(`Are you sure you want to clear all ${notifications.length} notifications? This action cannot be undone.`);
    setConfirmAction(() => () => {
      clearAllNotifications();
      setOpen(false);
    });
    setShowConfirmDialog(true);
  };

  const handleMarkAllRead = () => {
    const unreadCount = getUnreadCount();
    if (unreadCount > 5) {
      setConfirmMessage(`Mark ${unreadCount} notifications as read?`);
      setConfirmAction(() => () => {
        setMarkingAllRead(true);
        markAllAsRead();
        setTimeout(() => {
          setMarkingAllRead(false);
          setOpen(false);
        }, 500);
      });
      setShowConfirmDialog(true);
    } else {
      setMarkingAllRead(true);
      markAllAsRead();
      setTimeout(() => {
        setMarkingAllRead(false);
        setOpen(false);
      }, 500);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '🔔';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'orders': return '📦';
      case 'cart': return '🛒';
      case 'wishlist': return '❤️';
      case 'favorites': return '⭐';
      case 'promotions': return '🎉';
      case 'security': return '🔒';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'low': return '#2ed573';
      default: return '#3742fa';
    }
  };

  const handleActionClick = (action, notificationId) => {
    if (action.onClick) {
      action.onClick();
    }
    // Mark as read when action is clicked
    markAsRead(notificationId);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // Get unique categories from notifications
  const getAvailableCategories = useCallback(() => {
    const categories = new Set(['all']);

    notifications.forEach(notification => {
      if (notification.category) {
        categories.add(notification.category);
      }
    });

    return Array.from(categories).sort();
  }, [notifications]);

  // Filter notifications by selected category
  const getFilteredNotifications = useCallback(() => {
    if (selectedCategory === 'all') {
      return notifications;
    }

    return notifications.filter(
      notification => notification.category === selectedCategory
    );
  }, [notifications, selectedCategory]);

  // Get notification count by category
  const getCategoryCount = useCallback((category) => {
    if (category === 'all') {
      return notifications.length;
    }

    return notifications.filter(
      notification => notification.category === category
    ).length;
  }, [notifications]);

  // Get unread count for selected category
  const getUnreadCountForCategory = useCallback((category) => {
    if (category === 'all') {
      return getUnreadCount();
    }

    return notifications.filter(
      notification => notification.category === category && !notification.read
    ).length;
  }, [notifications, getUnreadCount]);

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const filteredNotifications = getFilteredNotifications();
  const availableCategories = getAvailableCategories();

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={toggleDropdown}
        title="Notifications"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
            fill="currentColor"
          />
        </svg>
        {getUnreadCount() > 0 && (
          <span className="notification-count">{getUnreadCount()}</span>
        )}
        {isConnected && (
          <span className="connection-indicator" title="Real-time connected">●</span>
        )}
      </button>
      {open && (
        <div className="notification-dropdown-menu">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div className="header-actions">
              <button
                className="settings-btn"
                onClick={() => {
                  setShowSettings(true);
                  setOpen(false);
                }}
                title="Notification Settings"
              >
                ⚙️
              </button>
              {getUnreadCount() > 0 && (
                <button
                  className={`mark-all-read-btn ${markingAllRead ? 'loading' : ''}`}
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead}
                  title="Mark all as read"
                >
                  {markingAllRead ? 'Marking...' : 'Mark All Read'}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="clear-all-btn"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
          {/* Category Filter */}
          {availableCategories.length > 1 && (
            <div className="category-filter">
              {availableCategories.map(category => (
                <button
                  key={category}
                  className={`category-filter-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(category)}
                  title={`${category} notifications`}
                >
                  {getCategoryIcon(category)} {category}
                  {getUnreadCountForCategory(category) > 0 && (
                    <span className="category-count">{getUnreadCountForCategory(category)}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="notification-list">
            {filteredNotifications.length === 0 ? (
              <div className="no-notifications">
                {selectedCategory === 'all' ? 'No notifications' : `No ${selectedCategory} notifications`}
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item notification-${notif.type} ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    borderLeft: `4px solid ${getPriorityColor(notif.priority)}`
                  }}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-category-time">
                    <span className="notification-category">
                      {getCategoryIcon(notif.category)} {notif.category}
                    </span>
                    <div className="notification-date-time">
                      <small className="notification-date">{notif.timestamp.toLocaleDateString()}</small>
                      <small className="notification-time">{notif.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</small>
                      <small className="notification-ampm">{notif.timestamp.toLocaleTimeString([], {hour12: true}).slice(-2)}</small>
                    </div>
                    {!notif.read && <span className="unread-indicator">●</span>}
                  </div>
                  <p className="notification-message">{notif.message}</p>

                  <div className="notification-content">
                    
                    {notif.actions && notif.actions.length > 0 && (
                      <div className="notification-actions">
                        {notif.actions.map((action, index) => (
                          <button
                            key={index}
                            className={`action-btn action-${action.type}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(action, notif.id);
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    className="notification-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearNotification(notif.id);
                    }}
                    title="Dismiss notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {showSettings && (
        <NotificationSettings
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>Confirm Action</h3>
            <p>{confirmMessage}</p>
            <div className="confirm-dialog-actions">
              <button
                className="confirm-btn"
                onClick={handleConfirmAction}
              >
                Confirm
              </button>
              <button
                className="cancel-btn"
                onClick={handleCancelAction}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
