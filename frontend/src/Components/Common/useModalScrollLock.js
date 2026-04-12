// Hook flow summary:
// 1) Track lock count for modal open/close transitions.
// 2) Preserve original body overflow style.
// 3) Apply overflow hidden + scrollbar compensation while locked.
// 4) Restore original styles on unlock/cleanup.
import { useEffect, useRef } from 'react';

const useModalScrollLock = isOpen => {
  // Counter allows safe lock/unlock transitions across effect runs.
  const countRef = useRef(0);

  // Persist original overflow style so we can restore accurately.
  const originalStyleRef = useRef('');

  // Apply or release body scroll lock whenever open state changes.
  useEffect(() => {
    // Guard against non-browser environments.
    if (typeof document === 'undefined') return;

    const body = document.body;

    // Capture initial overflow style only once.
    if (countRef.current === 0) {
      originalStyleRef.current = body.style.overflow;
    }

    // Update lock count from current modal visibility.
    if (isOpen) {
      countRef.current += 1;
    } else {
      countRef.current = Math.max(0, countRef.current - 1);
    }

    // Any positive count means page scrolling should stay locked.
    const isLocked = countRef.current > 0;
    if (isLocked) {
      // Preserve layout width by compensating removed scrollbar width.
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = 'hidden';
      body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      body.style.overflow = originalStyleRef.current;
      body.style.paddingRight = '';
    }

    return () => {
      // Ensure cleanup restores original body styles.
      body.style.overflow = originalStyleRef.current;
      body.style.paddingRight = '';
    };
  }, [isOpen]);
};

export default useModalScrollLock;
