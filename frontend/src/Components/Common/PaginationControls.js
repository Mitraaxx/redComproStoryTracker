// Component flow summary:
// 1) Hide controls when the list fits on a single page.
// 2) Show load-more action only when more items remain.
// 3) Keep shared scroll-to-top action visible with pagination controls.
import { AiOutlineArrowUp } from "react-icons/ai";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";

const PaginationControls = ({
  filteredItems = [],
  visibleCount,
  setVisibleCount,
  isAtBottom,
  loadMoreText = "Load More",
  showLoadMore = true,
}) => {
  // Smooth scroll keeps transition less abrupt for long lists/pages.
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Skip rendering when pagination is unnecessary.
  if (filteredItems.length <= ITEMS_PER_PAGE) {
    return null;
  }

  return (
    <div className="pagination-container">
      {/* Load-more appears only when enabled and hidden items remain. */}
      {showLoadMore && visibleCount < filteredItems.length && (
        <button
          className="load-more-btn"
          onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
          style={{
            opacity: isAtBottom ? 1 : 0,
            pointerEvents: isAtBottom ? "auto" : "none",
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          {loadMoreText}
        </button>
      )}

      {/* Utility button for jumping back to top of long pages. */}
      <button className="back-top-btn" onClick={scrollToTop}>
        <AiOutlineArrowUp />
      </button>
    </div>
  );
};

export default PaginationControls;
