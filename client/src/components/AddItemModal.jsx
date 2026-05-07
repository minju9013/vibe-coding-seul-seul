import React, { useEffect, useMemo, useRef, useState } from 'react';
import { uploadImage } from '../api/itemsApi';
import useModalFocusTrap from '../hooks/useModalFocusTrap';
import './AddItemModal.css';

function clampQuantity(value) {
  const n = Number.isNaN(Number(value)) ? 0 : Number(value);
  if (n < 0) return 0;
  if (n > 99) return 99;
  return n;
}

function clampLowStockThreshold(value) {
  const n = Number.isNaN(Number(value)) ? 1 : Number(value);
  if (n < 1) return 1;
  if (n > 99) return 99;
  return Math.round(n);
}

function AddItemModal({
  isOpen,
  categories = [],
  defaultCategoryId,
  items = [],
  editingItem = null,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const isEditMode = Boolean(editingItem);
  const fallbackCategoryId = categories[0]?.id;
  const [categoryId, setCategoryId] = useState(defaultCategoryId || fallbackCategoryId);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lowStockThreshold, setLowStockThreshold] = useState(1);
  const [notes, setNotes] = useState('');
  // 화면 미리보기에 쓸 URL. 새로 고른 파일이면 blob: URL, 기존 이미지면 서버 URL.
  const [imageUrl, setImageUrl] = useState(null);
  // 사용자가 새로 고른 파일 (있을 때만 submit 시 Cloudinary 로 업로드)
  const [imageFile, setImageFile] = useState(null);
  // 기존 Cloudinary public_id (수정 모드에서 이미지가 그대로면 그대로 보존)
  const [imagePublicId, setImagePublicId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const nameInputRef = useRef(null);
  const sheetRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const dragStartYRef = useRef(0);
  const dragOffsetYRef = useRef(0);
  const dragLastYRef = useRef(0);
  const dragLastTsRef = useRef(0);
  const dragVelocityRef = useRef(0);

  useModalFocusTrap(sheetRef, isOpen);

  // blob URL 정리 헬퍼 (메모리 누수 방지)
  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setCategoryId(editingItem.categoryId);
        setName(editingItem.name ?? '');
        setQuantity(clampQuantity(editingItem.quantity ?? 0));
        setLowStockThreshold(clampLowStockThreshold(editingItem.lowStockThreshold ?? 1));
        setNotes(editingItem.notes ?? '');
        setImageUrl(editingItem.image ?? null);
        setImagePublicId(editingItem.imagePublicId ?? null);
      } else {
        setCategoryId(defaultCategoryId || fallbackCategoryId);
        setName('');
        setQuantity(1);
        setLowStockThreshold(1);
        setNotes('');
        setImageUrl(null);
        setImagePublicId(null);
      }
      revokeObjectUrl();
      setImageFile(null);
      setSubmitError(null);
      setSubmitting(false);
      setConfirmDelete(false);
      setDeleting(false);
      setSheetDragY(0);
      setIsSheetDragging(false);
      const t = setTimeout(() => nameInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    // 닫힐 때 임시 URL 정리
    revokeObjectUrl();
  }, [isOpen, defaultCategoryId, editingItem, fallbackCategoryId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (submitting || deleting) return;
      // 삭제 확인 중이면 ESC 는 확인 다이얼로그만 닫는다.
      if (confirmDelete) {
        setConfirmDelete(false);
        return;
      }
      onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, submitting, deleting, confirmDelete]);

  useEffect(() => {
    if (!isSheetDragging) return undefined;

    const getClientY = (event) => {
      if (typeof event.clientY === 'number') return event.clientY;
      const touch = event.touches?.[0] || event.changedTouches?.[0];
      return touch?.clientY ?? null;
    };

    const onMove = (event) => {
      const clientY = getClientY(event);
      if (clientY == null) return;
      if (event.cancelable) event.preventDefault();
      const nextY = Math.max(0, clientY - dragStartYRef.current);
      dragOffsetYRef.current = nextY;
      const now = performance.now();
      const dt = Math.max(1, now - dragLastTsRef.current);
      dragVelocityRef.current = (clientY - dragLastYRef.current) / dt;
      dragLastYRef.current = clientY;
      dragLastTsRef.current = now;
      setSheetDragY(nextY);
    };

    const onEnd = () => {
      const shouldClose =
        dragOffsetYRef.current >= 90 ||
        (dragOffsetYRef.current >= 24 && dragVelocityRef.current > 0.65);
      setIsSheetDragging(false);
      dragOffsetYRef.current = 0;
      dragVelocityRef.current = 0;
      if (shouldClose) {
        setSheetDragY(0);
        onClose?.();
        return;
      }
      setSheetDragY(0);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [isSheetDragging, onClose]);

  // 컴포넌트 unmount 시 마지막 정리
  useEffect(() => () => revokeObjectUrl(), []);

  const trimmedName = name.trim();

  const isDuplicate = useMemo(() => {
    if (!trimmedName) return false;
    return items.some(
      (it) =>
        it.categoryId === categoryId &&
        it.name.trim() === trimmedName &&
        (!editingItem || it.id !== editingItem.id),
    );
  }, [items, categoryId, trimmedName, editingItem]);

  const canSubmit = trimmedName.length > 0 && !isDuplicate && !submitting;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      // 새로 고른 파일이 있으면 먼저 서버에 업로드 → secure_url, public_id 획득
      let nextImage = imageUrl || null;
      let nextImagePublicId = imagePublicId || null;

      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        nextImage = uploaded.url;
        nextImagePublicId = uploaded.publicId;
      } else if (!imageUrl) {
        // 사용자가 이미지를 제거한 경우
        nextImage = null;
        nextImagePublicId = null;
      }

      const payload = {
        name: trimmedName,
        categoryId,
        unit: '개',
        quantity: clampQuantity(quantity),
        lowStockThreshold: clampLowStockThreshold(lowStockThreshold),
        notes: notes.trim(),
        image: nextImage,
        imagePublicId: nextImagePublicId,
      };

      if (isEditMode) {
        await onUpdate?.({ id: editingItem.id, ...payload });
      } else {
        await onAdd?.(payload);
      }
      onClose?.();
    } catch (err) {
      setSubmitError(err?.message || '저장 중 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep = (delta) => {
    setQuantity((prev) => clampQuantity(prev + delta));
  };

  const handlePickImage = () => {
    if (submitting) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    revokeObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setImageFile(file);
    setImageUrl(objectUrl);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    revokeObjectUrl();
    setImageFile(null);
    setImageUrl(null);
  };

  const handleConfirmDelete = async () => {
    if (!editingItem || deleting) return;
    setSubmitError(null);
    setDeleting(true);
    try {
      await onDelete?.({ id: editingItem.id, name: editingItem.name });
      onClose?.();
    } catch (err) {
      setSubmitError(err?.message || '삭제 중 오류가 발생했어요.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleSheetDragStart = (e) => {
    if (submitting || deleting) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.cancelable) e.preventDefault();
    dragStartYRef.current = e.clientY;
    dragLastYRef.current = e.clientY;
    dragLastTsRef.current = performance.now();
    dragVelocityRef.current = 0;
    dragOffsetYRef.current = 0;
    setIsSheetDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  return (
    <div
      className="add-item-modal-root"
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? '품목 수정' : '새 품목 추가'}
    >
      <button
        type="button"
        className="add-item-backdrop"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onClose}
        disabled={submitting || deleting}
      />
      <form
        ref={sheetRef}
        className="add-item-sheet"
        onSubmit={handleSubmit}
        style={{
          transform: `translateY(${sheetDragY}px)`,
          transition: isSheetDragging ? 'none' : 'transform 180ms ease-out',
        }}
      >
        <div
          className="add-item-handle"
          aria-hidden="true"
          onPointerDown={handleSheetDragStart}
        />
        <div className="add-item-header">
          <h2 className="add-item-title">
            {isEditMode ? '품목 수정' : '새 품목 추가'}
          </h2>
          <button
            type="button"
            className="add-item-close"
            aria-label="닫기"
            onClick={onClose}
            disabled={submitting || deleting}
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

        <div className="add-item-body">
          <section className="add-item-field">
            <label className="add-item-label">이미지</label>
            <button
              type="button"
              className={
                imageUrl
                  ? 'add-item-image-picker has-image'
                  : 'add-item-image-picker'
              }
              onClick={handlePickImage}
              aria-label={imageUrl ? '이미지 변경' : '이미지 추가'}
              disabled={submitting}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="선택한 이미지"
                    className="add-item-image-preview"
                  />
                  <span
                    className="add-item-image-remove"
                    role="button"
                    tabIndex={0}
                    aria-label="이미지 제거"
                    onClick={handleRemoveImage}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRemoveImage(e);
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </>
              ) : (
                <div className="add-item-image-placeholder">
                  <span className="add-item-image-hint">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      aria-hidden="true"
                      className="add-item-image-hint-icon"
                    >
                      <path
                        d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="13"
                        r="3.4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                    이미지 추가
                  </span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="add-item-image-input"
              onChange={handleImageChange}
            />
          </section>

          <section className="add-item-field">
            <label className="add-item-label">카테고리</label>
            <div className="add-item-category-row">
              {categories.map((cat) => {
                const isActive = cat.id === categoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={
                      isActive
                        ? 'add-item-category-chip is-active'
                        : 'add-item-category-chip'
                    }
                  >
                    <span className="add-item-category-emoji" aria-hidden="true">
                      {cat.emoji}
                    </span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="add-item-field">
            <label className="add-item-label" htmlFor="add-item-name">
              품목 이름
            </label>
            <input
              id="add-item-name"
              ref={nameInputRef}
              type="text"
              className={
                isDuplicate ? 'add-item-input is-error' : 'add-item-input'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 시드물 스킨"
              maxLength={30}
              aria-invalid={isDuplicate || undefined}
              aria-describedby={isDuplicate ? 'add-item-name-error' : undefined}
            />
            {isDuplicate && (
              <p id="add-item-name-error" className="add-item-error">
                같은 카테고리에 이미 등록된 이름이에요.
              </p>
            )}
          </section>

          <section className="add-item-field">
            <label className="add-item-label">
              {isEditMode ? '수량' : '초기 수량'}
            </label>
            <div className="add-item-quantity-row">
              <button
                type="button"
                className="add-item-step"
                onClick={() => handleStep(-1)}
                aria-label="수량 줄이기"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(clampQuantity(e.target.value))}
                className="add-item-quantity-input"
              />
              <button
                type="button"
                className="add-item-step"
                onClick={() => handleStep(1)}
                aria-label="수량 늘리기"
              >
                +
              </button>
            </div>
          </section>

          <section className="add-item-field">
            <label className="add-item-label" htmlFor="add-item-notes">
              메모 (선택)
            </label>
            <textarea
              id="add-item-notes"
              className="add-item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="예: 다음 장보기 때 살 것"
              rows={2}
              maxLength={500}
            />
          </section>

          <div className="add-item-footer">
            {submitError && (
              <p className="add-item-error" role="alert">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              className="add-item-submit"
              disabled={!canSubmit}
            >
              {submitting ? '저장 중...' : isEditMode ? '저장하기' : '추가하기'}
            </button>
            {isEditMode && (
              <button
                type="button"
                className="add-item-delete"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting || deleting}
              >
                삭제하기
              </button>
            )}
          </div>
        </div>

        {confirmDelete && (
          <div className="add-item-confirm" role="dialog" aria-modal="true">
            <div className="add-item-confirm-card">
              <h3 className="add-item-confirm-title">이 품목을 삭제할까요?</h3>
              <p className="add-item-confirm-desc">
                <strong>{editingItem?.name}</strong> 품목과 관련 기록이 모두 삭제돼요.
                <br />이 작업은 되돌릴 수 없어요.
              </p>
              <div className="add-item-confirm-actions">
                <button
                  type="button"
                  className="add-item-confirm-cancel"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="add-item-confirm-delete"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default AddItemModal;
