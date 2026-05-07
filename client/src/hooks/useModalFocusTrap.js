import { useEffect } from 'react';

export default function useModalFocusTrap(containerRef, isActive) {
  useEffect(() => {
    if (!isActive) return;
    const root = containerRef.current;
    if (!root) return;

    const getFocusable = () =>
      Array.from(
        root.querySelectorAll(
          'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || root.contains(el));

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener('keydown', onKeyDown);

    return () => root.removeEventListener('keydown', onKeyDown);
  }, [containerRef, isActive]);
}
