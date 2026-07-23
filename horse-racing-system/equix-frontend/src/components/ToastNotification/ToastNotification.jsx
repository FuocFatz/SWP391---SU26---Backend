import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX, FiXCircle } from 'react-icons/fi';
import './ToastNotification.css';

const TOAST_META = {
  success: { title: 'Thành công', icon: <FiCheckCircle /> },
  error: { title: 'Thao tác thất bại', icon: <FiXCircle /> },
  warning: { title: 'Chú ý', icon: <FiAlertTriangle /> },
  info: { title: 'Cập nhật', icon: <FiInfo /> },
};

function ToastNotification({ message, type = 'success', onDismiss, duration }) {
  const dismissRef = useRef(onDismiss);
  const tone = TOAST_META[type] ? type : 'info';
  const meta = TOAST_META[tone];
  const timeout = duration ?? (tone === 'success' ? 4500 : 7000);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message || timeout <= 0) return undefined;
    const timer = window.setTimeout(() => dismissRef.current?.(), timeout);
    return () => window.clearTimeout(timer);
  }, [message, timeout]);

  if (!message) return null;

  return createPortal(
    <div className="toast-notification-layer">
      <div
        key={`${tone}:${message}`}
        className={`toast-notification toast-notification-${tone}`}
        role={tone === 'error' ? 'alert' : 'status'}
        aria-live={tone === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        <span className="toast-notification-icon" aria-hidden="true">{meta.icon}</span>
        <div className="toast-notification-content">
          <strong>{meta.title}</strong>
          <p>{message}</p>
        </div>
        <button type="button" className="toast-notification-close" onClick={() => onDismiss?.()} aria-label="Đóng thông báo">
          <FiX />
        </button>
        {timeout > 0 && <span className="toast-notification-progress" style={{ animationDuration: `${timeout}ms` }} />}
      </div>
    </div>,
    document.body,
  );
}

export default ToastNotification;
