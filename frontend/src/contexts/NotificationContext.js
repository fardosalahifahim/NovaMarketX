import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  ORDERS: 'orders',
  CART: 'cart',
  WISHLIST: 'wishlist',
  SYSTEM: 'system',
  PROMOTIONS: 'promotions',
  SECURITY: 'security'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
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
  });
  const [userId, setUserId] = useState(null);
  const [sseConnection, setSseConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [notificationShown, setNotificationShown] = useState(new Set());
  const [currentOrders, setCurrentOrders] = useState([]);

  // Load notifications from backend and localStorage on mount
  useEffect(() => {
    const loadNotifications = async () => {
      if (!userId) return; // Wait for userId to be set

      try {
        // Load user-specific notifications from backend
        const response = await fetch(`http://localhost:5000/api/notifications/${userId}`);
        if (response.ok) {
          const serverNotifications = await response.json();
          const notificationsWithDates = serverNotifications.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp),
            read: false, // Backend doesn't track read status, so default to false
            category: n.category || NOTIFICATION_CATEGORIES.SYSTEM,
            priority: n.priority || NOTIFICATION_PRIORITIES.MEDIUM,
            persistent: n.persistent || false,
            actions: n.actions || [],
            autoHide: n.autoHide !== false,
            fromServer: true
          }));
          setNotifications(notificationsWithDates);
          setNotificationHistory(notificationsWithDates.slice(0, 99)); // Keep last 100
        }
      } catch (error) {
        console.error('Error loading notifications from backend:', error);
        // Fallback to localStorage if backend is unavailable
        const savedNotifications = localStorage.getItem(`novaMarketX_notifications_${userId}`);
        if (savedNotifications) {
          try {
            const parsed = JSON.parse(savedNotifications);
            const notificationsWithDates = parsed.map(n => ({
              ...n,
              timestamp: new Date(n.timestamp)
            }));
            setNotifications(notificationsWithDates);
          } catch (localError) {
            console.error('Error loading notifications from localStorage:', localError);
          }
        }
      }
    };

    const savedHistory = localStorage.getItem(`novaMarketX_notification_history_${userId}`);
    const savedSettings = localStorage.getItem(`novaMarketX_notification_settings_${userId}`);

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const historyWithDates = parsed.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotificationHistory(historyWithDates);
      } catch (error) {
        console.error('Error loading notification history from localStorage:', error);
      }
    }

    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading notification settings from localStorage:', error);
      }
    }

    loadNotifications();
  }, [userId]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`novaMarketX_notifications_${userId}`, JSON.stringify(notifications));
    }
  }, [notifications, userId]);

  // Save notification history to localStorage whenever it changes
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`novaMarketX_notification_history_${userId}`, JSON.stringify(notificationHistory));
    }
  }, [notificationHistory, userId]);

  // Save notification settings to localStorage whenever they change
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`novaMarketX_notification_settings_${userId}`, JSON.stringify(notificationSettings));
    }
  }, [notificationSettings, userId]);

  // Initialize user ID for SSE connection
  useEffect(() => {
    const existingUserId = localStorage.getItem('novaMarketX_user_id');
    if (existingUserId) {
      setUserId(existingUserId);
    } else {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('novaMarketX_user_id', newUserId);
      setUserId(newUserId);
    }
  }, []);

  // SSE connection management
  useEffect(() => {
    if (!userId) return;

    const connectSSE = () => {
      try {
        const eventSource = new EventSource(`http://localhost:5000/api/notifications/stream?userId=${userId}`);

        eventSource.onopen = () => {
          console.log('SSE connection established');
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const serverNotification = JSON.parse(event.data);
            console.log('Received notification:', serverNotification);

            // Convert server notification to local format
            const localNotification = {
              id: serverNotification.id || Date.now(),
              message: serverNotification.message,
              type: serverNotification.type || NOTIFICATION_TYPES.INFO,
              category: serverNotification.category || NOTIFICATION_CATEGORIES.SYSTEM,
              priority: serverNotification.priority || NOTIFICATION_PRIORITIES.MEDIUM,
              timestamp: new Date(serverNotification.timestamp || Date.now()),
              read: false,
              persistent: serverNotification.persistent || false,
              actions: serverNotification.actions || [],
              autoHide: serverNotification.autoHide !== false,
              fromServer: true
            };

            // Check if category and priority are enabled
            if (!notificationSettings.categories[localNotification.category] ||
                !notificationSettings.priorities[localNotification.priority]) {
              return;
            }

            // Show current notification
            setNotification(localNotification);

            // Add to notifications list (sorted by most recent first)
            setNotifications(prev => [localNotification, ...prev].sort((a, b) => b.timestamp - a.timestamp));

            // Add to history (sorted by most recent first)
            setNotificationHistory(prev => [localNotification, ...prev.slice(0, 99)].sort((a, b) => b.timestamp - a.timestamp)); // Keep last 100

            // Play sound
            playNotificationSound(localNotification.priority);

            // Auto-hide if not persistent
            if (localNotification.autoHide && !localNotification.persistent) {
              setTimeout(() => {
                setNotification(null);
              }, 3000);
            }
          } catch (error) {
            console.error('Error processing SSE notification:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          setIsConnected(false);

          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (sseConnection) {
              sseConnection.close();
            }
            connectSSE();
          }, 5000);
        };

        setSseConnection(eventSource);
      } catch (error) {
        console.error('Failed to establish SSE connection:', error);
        setIsConnected(false);
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (sseConnection) {
        sseConnection.close();
        setIsConnected(false);
      }
    };
  }, [userId, notificationSettings.categories, notificationSettings.priorities]);

  // Effect to detect order status changes and show notifications
  useEffect(() => {
    if (currentOrders.length > 0) {
      // If this is the first time loading orders, set them as previous and don't show notifications
      if (previousOrders.length === 0) {
        console.log('Setting initial orders for notification tracking:', currentOrders.length);
        setPreviousOrders([...currentOrders]);
        return;
      }

      // Detect status changes
      currentOrders.forEach(currentOrder => {
        const previousOrder = previousOrders.find(order => order.id === currentOrder.id);
        if (previousOrder && previousOrder.status !== currentOrder.status) {
          const notificationKey = `${currentOrder.id}-${currentOrder.status}`;
          if (!notificationShown.has(notificationKey)) {
            console.log(`Order ${currentOrder.id} status changed from ${previousOrder.status} to ${currentOrder.status}`);
            // Show notification for status change
            showOrderStatusNotification(currentOrder.id, currentOrder.status);
            setNotificationShown(prev => new Set([...prev, notificationKey]));
          }
        }
      });

      // Update previous orders
      setPreviousOrders([...currentOrders]);
    }
  }, [currentOrders]);

  // Play notification sound
  const playNotificationSound = (priority = NOTIFICATION_PRIORITIES.MEDIUM) => {
    if (!notificationSettings.soundEnabled) return;

    try {
      const audio = new Audio();
      // Use Web Audio API for better control
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different priorities
      const frequencies = {
        [NOTIFICATION_PRIORITIES.LOW]: 440,
        [NOTIFICATION_PRIORITIES.MEDIUM]: 660,
        [NOTIFICATION_PRIORITIES.HIGH]: 880
      };

      oscillator.frequency.setValueAtTime(frequencies[priority] || 660, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const showNotification = async (
    message,
    type = NOTIFICATION_TYPES.SUCCESS,
    options = {}
  ) => {
    const {
      category = NOTIFICATION_CATEGORIES.SYSTEM,
      priority = NOTIFICATION_PRIORITIES.MEDIUM,
      persistent = false,
      actions = [],
      autoHide = true,
      duration = 3000,
      saveToBackend = true // New option to control backend saving
    } = options;

    // Check if category is enabled in settings
    if (!notificationSettings.categories[category]) {
      console.log(`Notification blocked: category ${category} is disabled`);
      return null;
    }

    // Check if priority is enabled in settings
    if (!notificationSettings.priorities[priority]) {
      console.log(`Notification blocked: priority ${priority} is disabled`);
      return null;
    }

    const newNotification = {
      id: Date.now(),
      message,
      type,
      category,
      priority,
      timestamp: new Date(),
      read: false,
      persistent,
      actions,
      autoHide
    };

    console.log('Showing notification:', newNotification.message);

    // Show current notification
    setNotification(newNotification);

    // Add to notifications list (sorted by most recent first)
    setNotifications(prev => [newNotification, ...prev].sort((a, b) => b.timestamp - a.timestamp));

    // Add to history (sorted by most recent first)
    setNotificationHistory(prev => [newNotification, ...prev.slice(0, 99)].sort((a, b) => b.timestamp - a.timestamp)); // Keep last 100

    // Save to backend if requested
    if (saveToBackend) {
      try {
        const response = await fetch('http://localhost:5000/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            type,
            userId: userId || 'all',
            category,
            priority,
            persistent,
            actions,
            autoHide
          }),
        });

        if (response.ok) {
          const savedNotification = await response.json();
          console.log('Notification saved to backend:', savedNotification);
        } else {
          console.error('Failed to save notification to backend');
        }
      } catch (error) {
        console.error('Error saving notification to backend:', error);
      }
    }

    // Play sound
    playNotificationSound(priority);

    // Auto-hide if not persistent
    if (autoHide && !persistent) {
      setTimeout(() => {
        setNotification(null);
      }, duration);
    }

    return newNotification.id;
  };

  const clearNotification = async (id) => {
    try {
      // Delete from backend first
      const response = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from frontend state only if backend deletion was successful
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && notification.id === id) {
          setNotification(null);
        }
        console.log('Notification deleted successfully');
      } else {
        console.error('Failed to delete notification from backend');
        // Still remove from frontend state as fallback
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && notification.id === id) {
          setNotification(null);
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Remove from frontend state even if backend call fails
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && notification.id === id) {
        setNotification(null);
      }
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Delete all notifications from backend
      const deletePromises = notifications.map(async (notification) => {
        try {
          const response = await fetch(`http://localhost:5000/api/notifications/${notification.id}`, {
            method: 'DELETE',
          });
          return response.ok;
        } catch (error) {
          console.error(`Error deleting notification ${notification.id}:`, error);
          return false;
        }
      });

      await Promise.all(deletePromises);

      // Clear frontend state regardless of backend results
      setNotifications([]);
      setNotification(null);
      console.log('All notifications cleared successfully');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      // Still clear frontend state as fallback
      setNotifications([]);
      setNotification(null);
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    setNotificationHistory(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotificationHistory(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const getNotificationsByCategory = (category) => {
    return notifications.filter(n => n.category === category);
  };

  const getNotificationsByPriority = (priority) => {
    return notifications.filter(n => n.priority === priority);
  };

  const updateNotificationSettings = (newSettings) => {
    setNotificationSettings(prev => ({ ...prev, ...newSettings }));
  };

  const clearNotificationHistory = () => {
    setNotificationHistory([]);
  };

  // E-commerce specific notification helpers
  const showOrderNotification = (message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    return showNotification(message, type, {
      category: NOTIFICATION_CATEGORIES.ORDERS,
      ...options
    });
  };

  const showCartNotification = (message, type = NOTIFICATION_TYPES.SUCCESS, options = {}) => {
    return showNotification(message, type, {
      category: NOTIFICATION_CATEGORIES.CART,
      ...options
    });
  };

  const showWishlistNotification = (message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    return showNotification(message, type, {
      category: NOTIFICATION_CATEGORIES.WISHLIST,
      ...options
    });
  };

  const showPromotionNotification = (message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    return showNotification(message, type, {
      category: NOTIFICATION_CATEGORIES.PROMOTIONS,
      priority: NOTIFICATION_PRIORITIES.LOW,
      ...options
    });
  };

  // Order status specific notifications
  const showOrderStatusNotification = (orderId, status, options = {}) => {
    const statusMessages = {
      processing: `Order #${orderId} is being processed`,
      confirmed: `Order #${orderId} has been confirmed`,
      shipping: `Order #${orderId} is on the way`,
      shipped: `Order #${orderId} has been shipped`,
      delivered: `Order #${orderId} has been delivered successfully`,
      canceled: `Order #${orderId} has been canceled`,
      returned: `Order #${orderId} return has been processed`
    };

    const statusTypes = {
      processing: NOTIFICATION_TYPES.INFO,
      confirmed: NOTIFICATION_TYPES.SUCCESS,
      shipping: NOTIFICATION_TYPES.INFO,
      shipped: NOTIFICATION_TYPES.SUCCESS,
      delivered: NOTIFICATION_TYPES.SUCCESS,
      canceled: NOTIFICATION_TYPES.ERROR,
      returned: NOTIFICATION_TYPES.WARNING
    };

    const message = statusMessages[status] || `Order #${orderId} status updated to ${status}`;
    const type = statusTypes[status] || NOTIFICATION_TYPES.INFO;

    console.log(`Showing order status notification: ${message}`);

    return showOrderNotification(message, type, {
      priority: status === 'delivered' || status === 'canceled' ? NOTIFICATION_PRIORITIES.HIGH : NOTIFICATION_PRIORITIES.MEDIUM,
      persistent: status === 'delivered' || status === 'canceled',
      ...options
    });
  };

  const showOrderConfirmationNotification = (orderId, totalAmount, itemCount) => {
    const message = `Order #${orderId} confirmed! Total: $${totalAmount.toFixed(2)} (${itemCount} items)`;
    return showOrderNotification(message, NOTIFICATION_TYPES.SUCCESS, {
      priority: NOTIFICATION_PRIORITIES.HIGH,
      persistent: true,
      actions: [
        { label: 'View Order', action: 'view_order', data: { orderId } },
        { label: 'Track Order', action: 'track_order', data: { orderId } }
      ]
    });
  };

  const showOrderCancellationNotification = (orderId, reason = '') => {
    const message = `Order #${orderId} has been canceled${reason ? `: ${reason}` : ''}`;
    return showOrderNotification(message, NOTIFICATION_TYPES.ERROR, {
      priority: NOTIFICATION_PRIORITIES.HIGH,
      persistent: true,
      actions: [
        { label: 'Contact Support', action: 'contact_support', data: { orderId } }
      ]
    });
  };

  const showOrderDeliveryNotification = (orderId) => {
    const message = `🎉 Order #${orderId} has been delivered! Thank you for shopping with us.`;
    return showOrderNotification(message, NOTIFICATION_TYPES.SUCCESS, {
      priority: NOTIFICATION_PRIORITIES.HIGH,
      persistent: true,
      actions: [
        { label: 'Write Review', action: 'write_review', data: { orderId } },
        { label: 'Buy Again', action: 'reorder', data: { orderId } }
      ]
    });
  };

  const showOrderShippingNotification = (orderId, trackingNumber = null) => {
    const message = `🚚 Order #${orderId} is on the way!${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`;
    return showOrderNotification(message, NOTIFICATION_TYPES.INFO, {
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      persistent: false,
      actions: trackingNumber ? [
        { label: 'Track Package', action: 'track_package', data: { orderId, trackingNumber } }
      ] : []
    });
  };

  // Function to update orders and detect status changes
  const updateOrders = (orders) => {
    console.log('Updating orders for notification tracking:', orders.length);
    setCurrentOrders(orders);
  };

  return (
    <NotificationContext.Provider value={{
      // State
      notification,
      notifications,
      notificationHistory,
      notificationSettings,
      userId,
      isConnected,

      // Basic functions
      showNotification,
      clearNotification,
      clearAllNotifications,

      // Read status functions
      markAsRead,
      markAllAsRead,
      getUnreadCount,

      // Filtering functions
      getNotificationsByCategory,
      getNotificationsByPriority,

      // Settings functions
      updateNotificationSettings,

      // History functions
      clearNotificationHistory,

      // E-commerce specific functions
      showOrderNotification,
      showCartNotification,
      showWishlistNotification,
      showPromotionNotification,

      // Order status specific functions
      showOrderStatusNotification,
      showOrderConfirmationNotification,
      showOrderCancellationNotification,
      showOrderDeliveryNotification,
      showOrderShippingNotification,

      // Order management functions
      updateOrders,

      // Constants
      NOTIFICATION_CATEGORIES,
      NOTIFICATION_PRIORITIES,
      NOTIFICATION_TYPES
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
