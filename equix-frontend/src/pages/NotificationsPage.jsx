import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './NotificationsPage.css';

function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !user.id) {
        setError('Please log in to view notifications');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await api.getNotifications(user.id);
        setNotifications(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to load notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // Refresh notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.markNotificationRead(notificationId);
      // Refresh notifications
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-header">
          <h1>Your Notifications</h1>
          <p>Stay updated with the latest platform events</p>
        </div>

        {error && (
          <div className="notifications-error">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="empty-icon"></div>
            <h3>No notifications yet</h3>
            <p>You'll see notifications here when important events happen</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">
                      {notification.title}
                      {!notification.read && <span className="notification-badge">NEW</span>}
                    </h3>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-type">{notification.type}</span>
                    <span className="notification-channel">{notification.channel}</span>
                  </div>
                </div>
                {!notification.read && (
                  <button
                    className="notification-action"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
