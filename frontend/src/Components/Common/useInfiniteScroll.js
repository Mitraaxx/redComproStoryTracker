// Hook flow summary:
// 1) Track whether viewport is at (or near) page bottom.
// 2) Recompute on scroll/resize events.
// 3) Recheck after dependency changes to support dynamic content heights.
import { useState, useEffect } from 'react';

const useInfiniteScroll = (dependencies = []) => {
  // True when user can load more based on current scroll position.
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Shared bottom-detection routine used by events and effects.
  const checkBottom = () => {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    // Treat short pages and near-bottom positions as "at bottom".
    if (documentHeight <= windowHeight + 10 || windowHeight + scrollY >= documentHeight - 50) {
      setIsAtBottom(true);
    } else {
      setIsAtBottom(false);
    }
  };

  // Attach scroll/resize listeners once and keep state in sync.
  useEffect(() => {
    window.addEventListener("scroll", checkBottom);
    window.addEventListener("resize", checkBottom);

    // Initial computation on mount.
    checkBottom();

    return () => {
      // Cleanup listeners to avoid leaks when component unmounts.
      window.removeEventListener("scroll", checkBottom);
      window.removeEventListener("resize", checkBottom);
    };
  }, []);

  // Re-run bottom check shortly after dependent data/layout changes.
  useEffect(() => {
    const timeout = setTimeout(() => {
      checkBottom();
    }, 100);

    return () => clearTimeout(timeout);
  }, dependencies);

  return isAtBottom;
};

export default useInfiniteScroll;
