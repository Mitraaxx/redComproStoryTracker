// Hook flow summary:
// 1) Initialize visible item count from session storage.
// 2) Fallback to default page size when nothing is saved.
// 3) Persist updates so pagination state survives route round-trips.
import { useState, useEffect } from 'react';
import { ITEMS_PER_PAGE } from '../../utils/AppConfig';

const usePaginationState = storageKey => {
  // Lazy initializer reads once from session storage.
  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(storageKey);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  // Keep storage in sync whenever count or key changes.
  useEffect(() => {
    sessionStorage.setItem(storageKey, visibleCount);
  }, [visibleCount, storageKey]);

  return [visibleCount, setVisibleCount];
};

export default usePaginationState;
