import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./PreviewBanner.css";

function PreviewBanner() {
  const { user, previewingAsCustomer, exitPreview } = useAuth();
  const navigate = useNavigate();

  if (!(user?.role === "admin" && previewingAsCustomer)) return null;

  return (
    <div className="preview-banner">
      <span className="preview-banner__dot" />
      Previewing as customer — actions like checkout are view-only for you.
      <button
        onClick={() => {
          exitPreview();
          navigate("/admin");
        }}
      >
        Exit preview
      </button>
    </div>
  );
}

export default PreviewBanner;