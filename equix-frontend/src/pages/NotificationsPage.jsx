import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiCheck, FiCheckCircle, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/useAuth';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import { api } from '../services/api';
import { translateText } from '../utils/vietnameseLocalization';
import './NotificationsPage.css';

function formatTimestamp(value) {
  if (!value) return 'Không có thời gian';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không có thời gian' : date.toLocaleString('vi-VN');
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
      setError('Không thể tải thông báo. Vui lòng thử lại.');
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
      setActionError(translateText(err.message || 'Không thể đánh dấu thông báo này là đã đọc.'));
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
      setActionError(translateText(err.message || 'Không thể đánh dấu tất cả thông báo là đã đọc.'));
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
            <span className="notifications-eyebrow"><FiBell /> Trung tâm thông báo</span>
            <h1>Thông báo của bạn</h1>
            <p>{unreadTotal ? `${unreadTotal} thông báo chưa đọc` : 'Bạn đã xem tất cả thông báo'}</p>
          </div>
          <div className="notifications-header-actions">
            <button type="button" className="notifications-refresh" onClick={() => loadNotifications()}
              disabled={loading || markingAll} aria-label="Làm mới thông báo" title="Làm mới thông báo">
              <FiRefreshCw className={loading ? 'is-spinning' : ''} />
            </button>
            <button type="button" className="notifications-mark-all" onClick={handleMarkAllAsRead}
              disabled={!unreadTotal || markingAll || Boolean(markingId)}>
              {markingAll ? <span className="spinner" /> : <FiCheckCircle />}
              {markingAll ? 'Đang đánh dấu...' : 'Đánh dấu tất cả đã đọc'}
            </button>
          </div>
        </header>

        {error && (
          <div className="notifications-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => loadNotifications()}>Thử lại</button>
          </div>
        )}
        <ToastNotification message={actionError} type="error" onDismiss={() => setActionError('')} />

        {loading ? (
          <div className="notifications-list" aria-label="Đang tải thông báo">
            {[0, 1, 2].map((item) => <div className="notification-skeleton" key={item} />)}
          </div>
        ) : !error && notifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="notifications-empty-icon"><FiBell /></span>
            <h2>Chưa có thông báo.</h2>
            <p>Các cập nhật quan trọng về tài khoản, lời mời, cuộc đua và phần thưởng sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => {
              const isMarking = markingId === notification.id;
              return (
                <article key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                  <span className="notification-status-dot" aria-label={notification.read ? 'Đã đọc' : 'Chưa đọc'} />
                  <div className="notification-content">
                    <div className="notification-heading-row">
                      <div>
                        <span className="notification-type">{translateText(notification.type || 'CẬP NHẬT')}</span>
                        <h2 className="notification-title">{translateText(notification.title || 'Cập nhật từ EquiX')}</h2>
                      </div>
                      <time className="notification-time" dateTime={notification.createdAt || undefined}>
                        {formatTimestamp(notification.createdAt)}
                      </time>
                    </div>
                    <p className="notification-message">{translateText(notification.message || 'Không có thông tin bổ sung.')}</p>
                    <div className="notification-meta">
                      {notification.priority && <span className="notification-priority">{notification.priority}</span>}
                      {notification.targetUrl && (
                        <Link to={notification.targetUrl} className="notification-link">
                          Xem chi tiết <FiExternalLink />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="notification-action-wrap">
                    {notification.read ? (
                      <span className="notification-read-label"><FiCheck /> Đã đọc</span>
                    ) : (
                      <button type="button" className="notification-action"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={isMarking || markingAll || Boolean(markingId)}
                        aria-label={`Đánh dấu ${translateText(notification.title || 'thông báo')} là đã đọc`}
                        title="Đánh dấu đã đọc">
                        {isMarking ? <span className="spinner" /> : <FiCheck />}
                        {isMarking ? 'Đang đánh dấu...' : 'Đánh dấu đã đọc'}
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
