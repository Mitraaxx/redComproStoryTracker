// Component flow summary:
// 1) Provide a reusable full-screen loading indicator.
// 2) Allow size/color overrides while keeping sensible defaults.
import { HashLoader } from 'react-spinners';

const LoadingSpinner = ({
  size = 80,
  color = "#007bff"
}) => {
  // Center the spinner both vertically and horizontally in viewport.
  return <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh"
  }}>
      <HashLoader color={color} size={size} />
    </div>;
};

export default LoadingSpinner;
