import React, { useRef, useState } from 'react';
import { ALL_CATEGORY, ALL_CATEGORY_ID } from '../data/categories';
import './CategoryTabs.css';

const LONG_PRESS_MS = 220;
const VERTICAL_CANCEL_PX = 14;

function CategoryTabs({
  categories = [],
  activeCategoryId,
  isEditing = false,
  onChange,
  onAddCategory,
  onToggleEdit,
  onRequestEdit,
  onRequestDelete,
  onReorderCategory,
}) {
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [pressId, setPressId] = useState(null); // 롱프레스 진행 중 시각 표시
  const rowRef = useRef(null);
  const longPressTimer = useRef(null);
  const pointerStart = useRef({ x: 0, y: 0 });
  const pendingDragId = useRef(null);

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    pendingDragId.current = null;
    setPressId(null);
  };

  const handleCellPointerDown = (e, catId) => {
    if (!onReorderCategory) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    pendingDragId.current = catId;
    setPressId(catId);
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      setPressId(null);
      setDragId(catId);
      setDragOverId(null);
      navigator.vibrate?.(15);
    }, LONG_PRESS_MS);
  };

  const handleRowPointerMove = (e) => {
    // 이동이 감지되면 롱프레스 취소 (스크롤 제스처 허용)
    if (longPressTimer.current) {
      const dy = Math.abs(e.clientY - pointerStart.current.y);
      if (dy > VERTICAL_CANCEL_PX) {
        cancelLongPress();
      }
    }

    // 드래그 중일 때 hover 대상 찾기
    if (!dragId || !rowRef.current) return;
    e.preventDefault();
    const cells = rowRef.current.querySelectorAll('[data-drag-id]');
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top - 24 &&
        e.clientY <= rect.bottom + 24
      ) {
        const id = cell.dataset.dragId;
        if (id && id !== dragId) {
          if (id !== dragOverId) setDragOverId(id);
          return;
        }
      }
    }
  };

  const handleRowPointerUp = () => {
    cancelLongPress();
    if (dragId && dragOverId && dragId !== dragOverId) {
      onReorderCategory?.(dragId, dragOverId);
    }
    setDragId(null);
    setDragOverId(null);
  };

  const tabs = [ALL_CATEGORY, ...categories];

  return (
    <div className="category-tabs-wrap">
      <div className="category-tabs-scroll">
        <div
          ref={rowRef}
          className={`category-tabs-row${dragId ? ' is-reordering' : ''}`}
          onPointerMove={handleRowPointerMove}
          onPointerUp={handleRowPointerUp}
          onPointerLeave={handleRowPointerUp}
        >
          {tabs.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const isAll = cat.id === ALL_CATEGORY_ID;
            const showRemove = isEditing && !isAll;
            const interactsAsEdit = isEditing && !isAll;
            const isDraggable = Boolean(isEditing && !isAll && onReorderCategory);
            const isDragging = dragId === cat.id;
            const isDragOver = dragOverId === cat.id;
            const isPressing = pressId === cat.id;

            const handleClick = () => {
              if (dragId) return;
              if (interactsAsEdit) {
                onRequestEdit?.(cat);
              } else {
                onChange?.(cat.id);
              }
            };

            return (
              <div
                key={cat.id}
                data-drag-id={isDraggable ? cat.id : undefined}
                className={[
                  'category-tab-cell',
                  isDraggable ? 'is-draggable' : '',
                  isDragging ? 'is-dragging' : '',
                  isDragOver ? 'is-drag-over' : '',
                  isPressing ? 'is-pressing' : '',
                ].filter(Boolean).join(' ')}
                onPointerDown={isDraggable ? (e) => handleCellPointerDown(e, cat.id) : undefined}
              >
                <button
                  type="button"
                  onClick={handleClick}
                  className={[
                    isActive ? 'category-tab is-active' : 'category-tab',
                    showRemove ? 'has-remove' : '',
                    interactsAsEdit ? 'is-editable' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={
                    interactsAsEdit ? `${cat.label} 카테고리 수정` : undefined
                  }
                >
                  <span>{cat.label}</span>
                  {showRemove && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`${cat.label} 카테고리 삭제`}
                      className="category-tab-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete?.(cat);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onRequestDelete?.(cat);
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          {isEditing && onAddCategory && (
            <button
              type="button"
              className="category-tab is-add"
              onClick={onAddCategory}
              aria-label="새 카테고리 추가"
            >
              <span className="category-tab-add-icon" aria-hidden="true">+</span>
              <span>추가</span>
            </button>
          )}
          {onToggleEdit && (
            <button
              type="button"
              className={
                isEditing
                  ? 'category-tab is-manage-toggle is-editing'
                  : 'category-tab is-manage-toggle'
              }
              onClick={onToggleEdit}
              aria-pressed={isEditing}
              aria-label={isEditing ? '카테고리 편집 완료' : '카테고리 관리'}
            >
              {isEditing ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    aria-hidden="true"
                    className="category-manage-icon"
                  >
                    <path
                      d="M5 12.5l4.5 4.5L19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>완료</span>
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    aria-hidden="true"
                    className="category-manage-icon"
                    fill="currentColor"
                  >
                    <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98L2.46 14.63c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
                  </svg>
                  <span>설정</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryTabs;
