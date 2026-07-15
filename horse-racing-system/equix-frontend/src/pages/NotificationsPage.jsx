import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiCheck, FiCheckCircle, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/useAuth';
import { api } from '../services/api';
import './NotificationsPage.css';

function formatTimestamp(value) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString();
}

function NotificationsPage() {
  const { setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getNotifications();
      const next = Array.isArray(data) ? data : [];
      setNotifications(next);
      setUnreadCount(next.filter((item) => !item.read).length);
      setError('');
    } catch {
      setError('Unable to load notifications. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadNotifications(), 0);
    const interval = window.setInterval(() => loadNotifications({ silent: true }), 30000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    if (markingId || markingAll) return;
    setActionError('');
    setMarkingId(notificationId);
    try {
      const updated = await api.markNotificationRead(notificationId);
      const wasUnread = notifications.some((item) => item.id === notificationId && !item.read);
      setNotifications((current) => current.map((item) => item.id === notificationId ? updated : item));
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setActionError(err.message || 'Unable to mark this notification as read.');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingId || markingAll) return;
    setActionError('');
    setMarkingAll(true);
    try {
      await api.markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, read: true, readAt: item.readAt || readAt })));
      setUnreadCount(0);
    } catch (err) {
      setActionError(err.message || 'Unable to mark all notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadTotal = notifications.filter((item) => !item.read).length;

  return (
    <div className="notifications-page" id="notifications-page">
      <div className="notifications-container">
        <header className="notifications-header">
          <div>
            <span className="notifications-eyebrow"><FiBell /> Notification Center</span>
            <h1>Your Notifications</h1>
            <p>{unreadTotal ? `${unreadTotal} unread update${unreadTotal === 1 ? '' : 's'}` : 'You are all caught up'}</p>
          </div>
          <div className="notifications-header-actions">
            <button type="button" className="notifications-refresh" onClick={() => loadNotifications()}
              disabled={loading || markingAll} aria-label="Refresh notifications" title="Refresh notifications">
              <FiRefreshCw className={loading ? 'is-spinning' : ''} />
            </button>
            <button type="button" className="notifications-mark-all" onClick={handleMarkAllAsRead}
              disabled={!unreadTotal || markingAll || Boolean(markingId)}>
              {markingAll ? <span className="spinner" /> : <FiCheckCircle />}
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </button>
          </div>
        </header>

        {(error || actionError) && (
          <div className="notifications-error" role="alert">
            <span>{error || actionError}</span>
            {error && <button type="button" onClick={() => loadNotifications()}>Try again</button>}
          </div>
        )}

        {loading ? (
          <div className="notifications-list" aria-label="Loading notifications">
            {[0, 1, 2].map((item) => <div className="notification-skeleton" key={item} />)}
          </div>
        ) : !error && notifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="notifications-empty-icon"><FiBell /></span>
            <h2>No notifications yet.</h2>
            <p>Important account, invitation, race, and reward updates will appear here.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => {
              const isMarking = markingId === notification.id;
              return (
                <article key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                  <span className="notification-status-dot" aria-label={notification.read ? 'Read' : 'Unread'} />
                  <div className="notification-content">
                    <div className="notification-heading-row">
                      <div>
                        <span className="notification-type">{notification.type || 'UPDATE'}</span>
                        <h2 className="notification-title">{notification.title || 'EquiX update'}</h2>
                      </div>
                      <time className="notification-time" dateTime={notification.createdAt || undefined}>
                        {formatTimestamp(notification.createdAt)}
                      </time>
                    </div>
                    <p className="notification-message">{notification.message || 'No additional details were provided.'}</p>
                    <div className="notification-meta">
                      <span className="notification-channel">{notification.channel || 'IN_APP'}</span>
                      {notification.priority && <span className="notification-priority">{notification.priority}</span>}
                      {notification.targetUrl && (
                        <Link to={notification.targetUrl} className="notification-link">
                          View details <FiExternalLink />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="notification-action-wrap">
                    {notification.read ? (
                      <span className="notification-read-label"><FiCheck /> Read</span>
                    ) : (
                      <button type="button" className="notification-action"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={isMarking || markingAll || Boolean(markingId)}
                        aria-label={`Mark ${notification.title || 'notification'} as read`}
                        title="Mark as read">
                        {isMarking ? <span className="spinner" /> : <FiCheck />}
                        {isMarking ? 'Marking...' : 'Mark as read'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
