import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import './NotificationSettings.css';

const NotificationSettings = ({ onClose }) => {
  const {
    notificationSettings,
    updateNotificationSettings,
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_PRIORITIES
  } = useNotification();

  const [settings, setSettings] = useState(notificationSettings);

  const handleSoundToggle = () => {
    setSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  const handleCategoryToggle = (category) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }));
  };

  const handlePriorityToggle = (priority) => {
    setSettings(prev => ({
      ...prev,
      priorities: {
        ...prev.priorities,
        [priority]: !prev.priorities[priority]
      }
    }));
  };

  const handleSave = () => {
    updateNotificationSettings(settings);
    if (onClose) onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      soundEnabled: true,
      categories: {
        [NOTIFICATION_CATEGORIES.ORDERS]: true,
        [NOTIFICATION_CATEGORIES.CART]: true,
        [NOTIFICATION_CATEGORIES.WISHLIST]: true,
        [NOTIFICATION_CATEGORIES.SYSTEM]: true,
        [NOTIFICATION_CATEGORIES.PROMOTIONS]: false,
        [NOTIFICATION_CATEGORIES.SECURITY]: true
      },
      priorities: {
        [NOTIFICATION_PRIORITIES.LOW]: true,
        [NOTIFICATION_PRIORITIES.MEDIUM]: true,
        [NOTIFICATION_PRIORITIES.HIGH]: true
      }
    };
    setSettings(defaultSettings);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case NOTIFICATION_CATEGORIES.ORDERS: return '📦';
      case NOTIFICATION_CATEGORIES.CART: return '🛒';
      case NOTIFICATION_CATEGORIES.WISHLIST: return '❤️';
      case NOTIFICATION_CATEGORIES.SYSTEM: return '⚙️';
      case NOTIFICATION_CATEGORIES.PROMOTIONS: return '🎉';
      case NOTIFICATION_CATEGORIES.SECURITY: return '🔒';
      default: return '🔔';
    }
  };

  const getCategoryDescription = (category) => {
    switch (category) {
      case NOTIFICATION_CATEGORIES.ORDERS: return 'Order updates, shipping status, delivery confirmations';
      case NOTIFICATION_CATEGORIES.CART: return 'Cart changes, item availability, price updates';
      case NOTIFICATION_CATEGORIES.WISHLIST: return 'Wishlist item availability, price drops';
      case NOTIFICATION_CATEGORIES.SYSTEM: return 'System maintenance, feature updates, account changes';
      case NOTIFICATION_CATEGORIES.PROMOTIONS: return 'Sales, discounts, special offers';
      case NOTIFICATION_CATEGORIES.SECURITY: return 'Login alerts, password changes, security updates';
      default: return '';
    }
  };

  return (
    <div className="notification-settings-overlay">
      <div className="notification-settings-modal">
        <div className="settings-header">
          <h3>Notification Settings</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* Sound Settings */}
          <div className="settings-section">
            <h4>Sound Preferences</h4>
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="sound-toggle">Enable notification sounds</label>
                <p className="setting-description">
                  Play audio alerts when notifications are received
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  id="sound-toggle"
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={handleSoundToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Category Settings */}
          <div className="settings-section">
            <h4>Notification Categories</h4>
            <p className="section-description">
              Choose which types of notifications you want to receive
            </p>
            {Object.values(NOTIFICATION_CATEGORIES).map(category => (
              <div key={category} className="setting-item">
                <div className="setting-info">
                  <label htmlFor={`category-${category}`}>
                    {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                  </label>
                  <p className="setting-description">
                    {getCategoryDescription(category)}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    id={`category-${category}`}
                    type="checkbox"
                    checked={settings.categories[category]}
                    onChange={() => handleCategoryToggle(category)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>

          {/* Priority Settings */}
          <div className="settings-section">
            <h4>Notification Priorities</h4>
            <p className="section-description">
              Choose which priority levels you want to receive
            </p>
            {Object.values(NOTIFICATION_PRIORITIES).map(priority => (
              <div key={priority} className="setting-item">
                <div className="setting-info">
                  <label htmlFor={`priority-${priority}`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                  </label>
                  <p className="setting-description">
                    {priority === 'high' && 'Critical alerts, security issues, urgent updates'}
                    {priority === 'medium' && 'Important updates, order status changes'}
                    {priority === 'low' && 'Promotional content, general information'}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    id={`priority-${priority}`}
                    type="checkbox"
                    checked={settings.priorities[priority]}
                    onChange={() => handlePriorityToggle(priority)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-footer">
          <button className="reset-btn" onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className="footer-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
