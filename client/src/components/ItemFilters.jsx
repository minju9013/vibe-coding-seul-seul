import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ItemFilters.css';

// 상태 필터 옵션. value 는 useItems 가 정규화하는 한국어 status 와 매칭되도록 한다.
export const STATUS_FILTER_OPTIONS = [
  { id: 'all', label: '전체' },
  { id: 'shopping', label: '살 것' }, // 부족해요 + 소진
  { id: 'empty', label: '소진' },
];

export const ITEM_SORT_OPTIONS = [
  { id: 'recent', label: '최근 수정', dropdownLabel: '최근 수정' },
  { id: 'name', label: '이름순', dropdownLabel: '이름순' },
  { id: 'qtyAsc', label: '수량 적은 순', dropdownLabel: '수량 적은 순' },
  { id: 'qtyDesc', label: '수량 많은 순', dropdownLabel: '수량 많은 순' },
];

function ItemFilters({
  searchQuery,
  statusFilter,
  sortKey = 'recent',
  totalCount,
  filteredCount,
  onStatusFilterChange,
  onSortChange,
}) {
  const isFiltering =
    Boolean(searchQuery) || (statusFilter && statusFilter !== 'all');
  const [isSortSheetOpen, setSortSheetOpen] = useState(false);
  const [sortSheetDragY, setSortSheetDragY] = useState(0);
  const [isSortSheetDragging, setIsSortSheetDragging] = useState(false);
  const sortDragStartYRef = useRef(0);
  const sortDragOffsetYRef = useRef(0);
  const activeSortOption = useMemo(
    () => ITEM_SORT_OPTIONS.find((opt) => opt.id === sortKey) || ITEM_SORT_OPTIONS[0],
    [sortKey],
  );

  useEffect(() => {
    if (!isSortSheetOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSortSheetOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSortSheetOpen]);

  useEffect(() => {
    if (!isSortSheetOpen) {
      setSortSheetDragY(0);
      setIsSortSheetDragging(false);
      sortDragOffsetYRef.current = 0;
    }
  }, [isSortSheetOpen]);

  const handleSortSheetDragStart = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    sortDragStartYRef.current = e.clientY;
    sortDragOffsetYRef.current = 0;
    setIsSortSheetDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleSortSheetDragMove = (e) => {
    if (!isSortSheetDragging) return;
    const nextY = Math.max(0, e.clientY - sortDragStartYRef.current);
    sortDragOffsetYRef.current = nextY;
    setSortSheetDragY(nextY);
  };

  const handleSortSheetDragEnd = () => {
    if (!isSortSheetDragging) return;
    const shouldClose = sortDragOffsetYRef.current >= 90;
    setIsSortSheetDragging(false);
    sortDragOffsetYRef.current = 0;
    if (shouldClose) {
      setSortSheetDragY(0);
      setSortSheetOpen(false);
      return;
    }
    setSortSheetDragY(0);
  };

  return (
    <div className="item-filters">
      <div className="item-filters-status-chips" role="radiogroup" aria-label="상태 필터">
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onStatusFilterChange?.(opt.id)}
              className={
                isActive
                  ? 'item-filters-status-chip is-active'
                  : 'item-filters-status-chip'
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="item-filters-list-header">
        <p className={isFiltering ? 'item-filters-count is-filtering' : 'item-filters-count'}>
          {isFiltering
            ? `${totalCount}개 중 ${filteredCount}개`
            : `전체 ${totalCount}개`}
        </p>
        <div className="item-filters-sort">
          <button
            type="button"
            className="item-filters-sort-label"
            onClick={() => setSortSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isSortSheetOpen}
          >
            <span className="item-filters-sort-sr">정렬 기준</span>
            <span className="item-filters-sort-select" aria-hidden="true">
              {activeSortOption.dropdownLabel || activeSortOption.label}
            </span>
            <span className="item-filters-sort-chevron" aria-hidden="true">
              <svg
                className="item-filters-sort-chevron-svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
      {isSortSheetOpen && (
        <div className="item-filters-sort-sheet-root" role="dialog" aria-modal="true" aria-label="정렬">
          <button
            type="button"
            className="item-filters-sort-sheet-backdrop"
            aria-label="닫기"
            onClick={() => setSortSheetOpen(false)}
          />
          <div
            className="item-filters-sort-sheet"
            style={{
              transform: `translateY(${sortSheetDragY}px)`,
              transition: isSortSheetDragging ? 'none' : 'transform 180ms ease-out',
            }}
          >
            <div
              className="item-filters-sort-sheet-handle"
              aria-hidden="true"
              onPointerDown={handleSortSheetDragStart}
              onPointerMove={handleSortSheetDragMove}
              onPointerUp={handleSortSheetDragEnd}
              onPointerCancel={handleSortSheetDragEnd}
            />
            <div className="item-filters-sort-sheet-header">
              <h3 className="item-filters-sort-sheet-title">정렬</h3>
              <button
                type="button"
                className="item-filters-sort-sheet-header-close"
                aria-label="닫기"
                onClick={() => setSortSheetOpen(false)}
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
            <div className="item-filters-sort-sheet-list" role="radiogroup" aria-label="정렬 옵션">
              {ITEM_SORT_OPTIONS.map((opt) => {
                const isActive = sortKey === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className="item-filters-sort-sheet-option"
                    onClick={() => {
                      onSortChange?.(opt.id);
                      setSortSheetOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    <span className={isActive ? 'item-filters-sort-sheet-check is-active' : 'item-filters-sort-sheet-check'}>
                      {isActive ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemFilters;
