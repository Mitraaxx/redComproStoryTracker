// Component flow summary:
// 1) Render cards for available stories.
// 2) Forward card click events to parent with selected story id.
// 3) Support optional extra content renderer per card.
// 4) Show fallback empty-state message when no stories exist.
import { formatDate } from "../Common/dateUtils";

const StoryGrid = ({
  stories = [],
  onCardClick,
  gridClassName = "story-grid",
  cardClassName = "story-card",
  emptyMessage = "No stories available.",
  renderExtra
}) => <div className={gridClassName}>
    {/* Render list when stories exist, otherwise show empty-state text. */}
    {stories.length > 0 ? stories.map(story => <a key={story._id} className={cardClassName} href="#" onClick={e => {
    // Keep card semantic as link-style UI while preventing page jump.
    e.preventDefault();

    // Notify parent which story was selected.
    onCardClick?.(story._id);
  }} style={{
    textDecoration: "none",
    color: "inherit"
  }}>
          <div className="story-card-main">
            <p>
              <strong>Story Name: </strong>
              {story?.storyName}
            </p>
            <p>
              <strong>Story ID: </strong> {story?.storyId}
            </p>
            <p>
              <strong>Assigned: </strong> {story?.responsibility}
            </p>
            <p>
              <strong>First Review: </strong> {story?.firstReview}
            </p>
            <p>
              <strong>Qa Release Date: </strong>
              {formatDate(story?.qaEnvRelDate) || "N/A"}
            </p>
            <p>
              <strong>Story Points: </strong> {story?.storyPoints}
            </p>
            <div className="story-comments">
              <strong>Comments: </strong>
              <span>{story?.comments || "No comments."}</span>
            </div>
          </div>

          {/* Optional extension area controlled by parent component. */}
          {renderExtra ? <div className="story-card-extra">
              {renderExtra(story)}
            </div> : null}
        </a>) : <p className="story-card-empty">
        {emptyMessage}
      </p>}
  </div>;
export default StoryGrid;
