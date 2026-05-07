import React from 'react';
import './SearchBar.css';

// 품목 이름 검색 전용.
function SearchBar({
  value = '',
  onChange,
  placeholder = '품목 이름으로 검색',
  inputRef = null,
}) {
  return (
    <div className="search-bar">
      <span className="search-bar-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <circle
            cx="11"
            cy="11"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-bar-clear"
          aria-label="검색어 지우기"
          onClick={() => onChange?.('')}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SearchBar;
