import React, { useEffect, useRef } from 'react';
import './Toast.css';

function Toast({ message, actionLabel, onAction, onDismiss, duration = 2500 }) {
  const hasAction = Boolean(onAction && actionLabel);
  const ms = hasAction ? Math.max(duration, 5600) : duration;
  const dismissedRef = useRef(false);

  useEffect(() => {
    dismissedRef.current = false;
    if (!message) return undefined;
    const t = setTimeout(() => {
      if (!dismissedRef.current) onDismiss?.();
    }, ms);
    return () => clearTimeout(t);
  }, [message, ms, onDismiss]);

  if (!message) return null;

  const handleAction = () => {
    dismissedRef.current = true;
    onAction?.();
    onDismiss?.();
  };

  return (
    <div className={`toast-root${hasAction ? ' has-action' : ''}`} role="status" aria-live="polite">
      <div className="toast-bubble">
        <span className="toast-message">{message}</span>
        {hasAction && (
          <button type="button" className="toast-action" onClick={handleAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default Toast;
