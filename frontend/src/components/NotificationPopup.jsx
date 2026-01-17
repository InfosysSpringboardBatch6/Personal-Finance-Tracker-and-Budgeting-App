import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { useContext } from 'react';
const NotificationPopup = ({ isOpen, onClose }) => {
  const { usertoken, backend } = useContext(AppContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (isOpen && usertoken) {
      loadNotifications();
    }
  }, [isOpen, usertoken]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        // Check if the click was not on the bell icon
        if (!event.target.closest('.notification-bell-button')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backend}/api/user/notifications`, {
        headers: { usertoken },
      });
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };


  const markAsRead = async (id) => {
    try {
      const { data } = await axios.put(
        `${backend}/api/user/notifications/${id}/read`,
        {},
        { headers: { usertoken } }
      );
      if (data.success) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  // Marks a notification as read by updating backend and local state
  const markAllAsRead = async () => {
    try {
      const { data } = await axios.put(
        `${backend}/api/user/notifications/read-all`,
        {},
        { headers: { usertoken } }
      );
      if (data.success) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'success':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'tip':
        return 'bg-blue-100 border-blue-400 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'success':
        return '✓';
      case 'tip':
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-14 z-50">
      <div
        ref={popupRef}
        className="bg-white rounded-lg shadow-2xl w-96 max-h-[600px] flex flex-col border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#0a0f1d] to-[#111b2e] rounded-t-lg">
          <h3 className="text-white font-semibold text-lg">
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded transition"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={loadNotifications}
              className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded transition"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-400">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
              <div className="text-4xl mb-2">🔔</div>
              <div className="text-center">No notifications yet</div>
              <div className="text-xs mt-2 text-center text-gray-500">
                Notifications will appear when you add transactions
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border-l-4 ${getTypeColor(
                    notification.type
                  )} ${!notification.is_read ? 'font-medium' : 'opacity-75'} cursor-pointer hover:shadow-md transition`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(notification.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default NotificationPopup;

