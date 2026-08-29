import { useEffect, useState } from "react";
import Button from "./Button";
import "./MockupPreviewModal.css";

function MockupPreviewModal({ imageUrl, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="mpm-overlay" onClick={onClose}>
      <div className="mpm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mpm-header">
          <h3>Mockup preview</h3>
          <button className="mpm-close" onClick={onClose}>✕</button>
        </div>

        <div className={`mpm-image-wrap ${zoomed ? "mpm-image-wrap--zoomed" : ""}`}>
          <img
            src={imageUrl}
            alt="Mockup preview"
            onClick={() => setZoomed((z) => !z)}
          />
        </div>

        <div className="mpm-footer">
          <Button variant="secondary" onClick={() => setZoomed((z) => !z)}>
            {zoomed ? "Zoom out" : "Zoom in"}
          </Button>
          <a href={imageUrl} download="printix-mockup.png">
            <Button variant="primary">Download image</Button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default MockupPreviewModal;