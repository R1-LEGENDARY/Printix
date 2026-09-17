import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import "./PerspectiveEditor.css";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = Infinity;

function PerspectiveEditor({ imageUrl, initialPoints, onSave, onCancel }) {
  const imgRef = useRef();
  const scrollRef = useRef();
  const panState = useRef(null);

  const [points, setPoints] = useState(initialPoints || []);
  const [finished, setFinished] = useState((initialPoints || []).length >= 3);
  const [zoom, setZoom] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [imageSize, setImageSize] = useState(null);

  function handleImageLoad() {
    const container = scrollRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const scaleX = container.clientWidth / img.naturalWidth;
    const scaleY = container.clientHeight / img.naturalHeight;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    setBaseScale(Math.min(scaleX, scaleY));
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    function onWheel(e) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)));
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function handleClick(e) {
    if (finished || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    setPoints([...points, { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }]);
  }

  function handleContextMenu(e) {
    e.preventDefault();
  }

  function handleMouseDown(e) {
    if (e.button !== 2) return; 
    panState.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
    };

    function onMove(ev) {
      if (!panState.current) return;
      const dx = ev.clientX - panState.current.startX;
      const dy = ev.clientY - panState.current.startY;
      scrollRef.current.scrollLeft = panState.current.scrollLeft - dx;
      scrollRef.current.scrollTop = panState.current.scrollTop - dy;
    }

    function onUp() {
      panState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleReset() {
    setPoints([]);
    setFinished(false);
  }

  function handleUndo() {
    setPoints(points.slice(0, -1));
    setFinished(false);
  }

  function toPercent(p) {
    const w = imageSize?.width || 1;
    const h = imageSize?.height || 1;
    return { x: (p.x / w) * 100, y: (p.y / h) * 100 };
  }

  return (
    <div className="pe-overlay">
      <div className="pe-panel">
        <p className="pe-instructions">
          {finished
            ? "Shape complete — Save, or Reset to redraw."
            : `Click points around the printable area (avoid collar, sleeves, seams). ${points.length} point${points.length === 1 ? "" : "s"} placed — need at least 3.`}
        </p>

        <div
          className="pe-scroll"
          ref={scrollRef}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
        >
          <div
            className="pe-image-wrap"
            style={imageSize ? { width: imageSize.width * baseScale * zoom } : undefined}
          >
            <img ref={imgRef} src={imageUrl} alt="Mockup" onClick={handleClick} onLoad={handleImageLoad} draggable={false} />
            <svg className="pe-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {points.length > 1 && (
                <polyline
                  points={(finished ? [...points, points[0]] : points)
                    .map((p) => { const pc = toPercent(p); return `${pc.x},${pc.y}`; })
                    .join(" ")}
                  fill={finished ? "rgba(61,63,224,0.15)" : "none"}
                  stroke="#3D3FE0"
                  strokeWidth="0.4"
                />
              )}
            </svg>
            {points.map((p, i) => {
              const pc = toPercent(p);
              return <div key={i} className="pe-dot" style={{ left: `${pc.x}%`, top: `${pc.y}%` }} />;
            })}
          </div>
        </div>

        <div className="pe-hint">Scroll to zoom · Right-click and drag to pan · Left-click to place points</div>

        <div className="pe-actions">
          <Button variant="secondary" onClick={handleUndo} disabled={points.length === 0}>Undo point</Button>
          <Button variant="secondary" onClick={handleReset}>Reset</Button>
          {!finished ? (
            <Button variant="secondary" disabled={points.length < 3} onClick={() => setFinished(true)}>
              Finish shape
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" disabled={!finished} onClick={() => onSave(points)}>
            Save area
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PerspectiveEditor;