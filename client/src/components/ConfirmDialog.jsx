import React, { useEffect, useRef } from 'react';
import useModalFocusTrap from '../hooks/useModalFocusTrap';
import './ConfirmDialog.css';

// 간단한 모달 형태의 확인 다이얼로그.
// `danger=true` 면 확인 버튼을 빨간색으로 강조 (삭제 등 위험한 액션용).
function ConfirmDialog({
  isOpen,
  title,
  description,
  cancelText = '취소',
  confirmText = '확인',
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const cardRef = useRef(null);
  useModalFocusTrap(cardRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, busy, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-root" role="dialog" aria-modal="true">
      <button
        type="button"
        className="confirm-dialog-backdrop"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onCancel}
        disabled={busy}
      />
      <div ref={cardRef} className="confirm-dialog-card">
        <h3 className="confirm-dialog-title">{title}</h3>
        {description && (
          <p className="confirm-dialog-desc">{description}</p>
        )}
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={
              danger
                ? 'confirm-dialog-confirm is-danger'
                : 'confirm-dialog-confirm'
            }
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
