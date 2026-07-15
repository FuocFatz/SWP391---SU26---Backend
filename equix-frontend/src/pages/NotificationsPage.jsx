import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { FiBellOff } from 'react-icons/fi';
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
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="notifications-page flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Your Notifications</h1>
            <p>Stay updated with the latest platform events</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={handleMarkAllAsRead}
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', border: '1px solid #4f46e5', color: '#4f46e5', backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              Mark All As Read
            </button>
          )}
        </div>

        {error && (
          <div className="notifications-error">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="notifications-empty flex flex-col items-center justify-center py-12 text-gray-500">
            <FiBellOff className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No notifications yet</h3>
            <p className="mt-2 text-gray-500">You'll see notifications here when important events happen</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item p-4 border-b border-gray-100 transition-colors hover:bg-gray-50 flex items-start gap-4 ${!notification.isRead ? 'bg-indigo-50/30' : ''}`}
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">
                      {notification.title}
                      {!notification.isRead && <span className="notification-badge">NEW</span>}
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
                {!notification.isRead && (
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
