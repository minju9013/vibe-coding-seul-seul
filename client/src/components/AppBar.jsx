import React from 'react';
import './AppBar.css';

function AppBar({ onSearchClick, searchHighlighted = false }) {
  return (
    <header className="app-bar">
      <div className="app-bar-inner">
        <div className="brand">
          <div className="brand-text">슬슬살게</div>
        </div>
        <button
          type="button"
          className={
            searchHighlighted ? 'app-bar-search-btn is-active' : 'app-bar-search-btn'
          }
          aria-label="검색"
          aria-expanded={searchHighlighted}
          onClick={onSearchClick}
        >
          <svg
            className="app-bar-search-icon"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
            <path
              d="M20 20l-4.3-4.3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default AppBar;
