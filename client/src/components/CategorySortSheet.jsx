import React, { useEffect, useState } from 'react';
import './CategorySortSheet.css';

function CategorySortSheet({
  isOpen,
  categories = [],
  onClose,
  onReorderCategory,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    if (!draggingId) return undefined;

    const onMove = (e) => {
      const y = e.clientY;
      const rows = Array.from(document.querySelectorAll('.category-sort-sheet-row[data-id]'));
      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
          const id = row.getAttribute('data-id');
          if (id && id !== draggingId) {
            setDragOverId(id);
          }
          break;
        }
      }
    };

    const onEnd = () => {
      if (draggingId && dragOverId && draggingId !== dragOverId) {
        onReorderCategory?.(draggingId, dragOverId);
      }
      setDraggingId(null);
      setDragOverId(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [draggingId, dragOverId, onReorderCategory]);

  if (!isOpen) return null;

  return (
    <div className="category-sort-sheet-root" role="dialog" aria-modal="true" aria-label="카테고리 정렬">
      <button
        type="button"
        className="category-sort-sheet-backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="category-sort-sheet">
        <div className="category-sort-sheet-handle" aria-hidden="true" />
        <div className="category-sort-sheet-header">
          <h3 className="category-sort-sheet-title">카테고리 순서 정렬</h3>
          <button
            type="button"
            className="category-sort-sheet-close"
            aria-label="닫기"
            onClick={onClose}
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
        <div className="category-sort-sheet-list">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              data-id={cat.id}
              className={[
                'category-sort-sheet-row',
                draggingId === cat.id ? 'is-dragging' : '',
                dragOverId === cat.id ? 'is-drag-over' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="category-sort-sheet-label">
                <button
                  type="button"
                  className="category-sort-sheet-drag-handle"
                  aria-label={`${cat.label} 드래그 정렬`}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    setDraggingId(cat.id);
                    setDragOverId(null);
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                  }}
                >
                  ≡
                </button>
                <span className="category-sort-sheet-emoji" aria-hidden="true">{cat.emoji}</span>
                <span>{cat.label}</span>
              </span>
              <div className="category-sort-sheet-actions">
                <button
                  type="button"
                  className="category-sort-sheet-action"
                  aria-label={`${cat.label} 위로 이동`}
                  disabled={index === 0}
                  onClick={() => {
                    const prev = categories[index - 1];
                    if (prev) onReorderCategory?.(cat.id, prev.id);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="category-sort-sheet-action"
                  aria-label={`${cat.label} 아래로 이동`}
                  disabled={index === categories.length - 1}
                  onClick={() => {
                    const next = categories[index + 1];
                    if (next) onReorderCategory?.(cat.id, next.id);
                  }}
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategorySortSheet;
