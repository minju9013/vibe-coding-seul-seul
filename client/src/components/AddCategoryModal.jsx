import React, { useEffect, useMemo, useRef, useState } from 'react';
import useModalFocusTrap from '../hooks/useModalFocusTrap';
import './AddCategoryModal.css';

// 내장/커스텀 카테고리에서 자주 쓰는 이모지 후보. 8 컬럼 그리드.
const EMOJI_OPTIONS = [
  '📦', '💄', '🧼', '🧻', '🧺', '🍽️', '🍞', '🥤',
  '🍪', '🐶', '🐱', '🪴', '🎀', '🛏️', '🪥', '🧴',
  '🧹', '💊', '📚', '🧸', '🥗', '🍳', '🛒', '🎁',
];

// 현재 이모지가 프리셋에 없으면 맨 앞에 끼워 넣는다.
function buildEmojiOptions(currentEmoji) {
  if (!currentEmoji || EMOJI_OPTIONS.includes(currentEmoji)) {
    return EMOJI_OPTIONS;
  }
  return [currentEmoji, ...EMOJI_OPTIONS];
}

function AddCategoryModal({
  isOpen,
  editingCategory = null,
  isLabelDuplicate,
  maxLength = 12,
  onClose,
  onAdd,
  onUpdate,
  onReset,
}) {
  const isEditMode = Boolean(editingCategory);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const labelInputRef = useRef(null);
  const sheetRef = useRef(null);

  useModalFocusTrap(sheetRef, isOpen);

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setLabel(editingCategory.label || '');
        setEmoji(editingCategory.emoji || EMOJI_OPTIONS[0]);
      } else {
        setLabel('');
        setEmoji(EMOJI_OPTIONS[0]);
      }
      setSubmitError(null);
      setSubmitting(false);
      const t = setTimeout(() => labelInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen, editingCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, submitting]);

  const trimmed = label.trim();
  const isDuplicate = useMemo(
    () =>
      Boolean(trimmed) &&
      Boolean(isLabelDuplicate?.(trimmed, editingCategory?.id)),
    [trimmed, isLabelDuplicate, editingCategory],
  );
  const canSubmit = trimmed.length > 0 && !isDuplicate && !submitting;

  // 수정 모드에서 라벨/이모지가 원본과 동일하면 제출 불필요로 표시(UX 가이드).
  const isUnchanged = useMemo(() => {
    if (!editingCategory) return false;
    return (
      trimmed === (editingCategory.label || '').trim() &&
      emoji === editingCategory.emoji
    );
  }, [editingCategory, trimmed, emoji]);

  const emojiOptions = useMemo(
    () => buildEmojiOptions(editingCategory?.emoji || emoji),
    [editingCategory, emoji],
  );

  // 내장 카테고리 + 사용자가 수정한 적 있을 때만 "기본값으로 되돌리기" 노출
  const canReset =
    isEditMode &&
    editingCategory?.isCustom === false &&
    Boolean(editingCategory?.hasOverride) &&
    typeof onReset === 'function';

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (isEditMode) {
        await onUpdate?.({ id: editingCategory.id, label: trimmed, emoji });
      } else {
        await onAdd?.({ label: trimmed, emoji });
      }
      onClose?.();
    } catch (err) {
      setSubmitError(err?.message || '저장에 실패했어요.');
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!canReset) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onReset?.(editingCategory.id);
      onClose?.();
    } catch (err) {
      setSubmitError(err?.message || '되돌리기에 실패했어요.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="add-category-modal-root"
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? '카테고리 수정' : '새 카테고리 추가'}
    >
      <button
        type="button"
        className="add-category-backdrop"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onClose}
        disabled={submitting}
      />
      <form ref={sheetRef} className="add-category-sheet" onSubmit={handleSubmit}>
        <div className="add-category-handle" aria-hidden="true" />
        <div className="add-category-header">
          <h2 className="add-category-title">
            {isEditMode ? '카테고리 수정' : '새 카테고리'}
          </h2>
          <button
            type="button"
            className="add-category-close"
            aria-label="닫기"
            onClick={onClose}
            disabled={submitting}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="add-category-body">
          <section className="add-category-field">
            <label className="add-category-label">이모지</label>
            <div className="add-category-emoji-grid">
              {emojiOptions.map((e) => {
                const isActive = e === emoji;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={
                      isActive
                        ? 'add-category-emoji-chip is-active'
                        : 'add-category-emoji-chip'
                    }
                    aria-label={`이모지 ${e} 선택`}
                    aria-pressed={isActive}
                  >
                    <span aria-hidden="true">{e}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="add-category-field">
            <label className="add-category-label" htmlFor="add-category-label-input">
              카테고리 이름
            </label>
            <input
              id="add-category-label-input"
              ref={labelInputRef}
              type="text"
              className={
                isDuplicate
                  ? 'add-category-input is-error'
                  : 'add-category-input'
              }
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 간식, 반려동물"
              maxLength={maxLength}
              aria-invalid={isDuplicate || undefined}
            />
            <div className="add-category-input-meta">
              {isDuplicate ? (
                <span className="add-category-error">
                  같은 이름의 카테고리가 이미 있어요.
                </span>
              ) : (
                <span className="add-category-hint">
                  최대 {maxLength}자까지 가능해요.
                </span>
              )}
              <span className="add-category-counter">
                {label.length}/{maxLength}
              </span>
            </div>
          </section>

          <section className="add-category-preview">
            <span className="add-category-preview-label">미리보기</span>
            <span className="add-category-preview-chip">
              <span className="add-category-preview-emoji" aria-hidden="true">
                {emoji}
              </span>
              <span>{trimmed || '카테고리 이름'}</span>
            </span>
          </section>
        </div>

        <div className="add-category-footer">
          {submitError && (
            <p className="add-category-error" role="alert">
              {submitError}
            </p>
          )}
          <button
            type="submit"
            className="add-category-submit"
            disabled={!canSubmit || (isEditMode && isUnchanged)}
          >
            {submitting
              ? '저장 중...'
              : isEditMode
                ? '저장하기'
                : '추가하기'}
          </button>
          {canReset && (
            <button
              type="button"
              className="add-category-reset"
              onClick={handleReset}
              disabled={submitting}
            >
              기본값으로 되돌리기
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddCategoryModal;
