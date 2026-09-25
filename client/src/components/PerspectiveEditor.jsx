import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import "./PerspectiveEditor.css";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = Infinity;

function PerspectiveEditor({
  imageUrl,
  initialPoints,
  initialHoles,
  onSave,
  onCancel,
}) {
  const imgRef = useRef();
  const scrollRef = useRef();
  const panState = useRef(null);

  const [points, setPoints] = useState(initialPoints || []);
  const [holes, setHoles] = useState(initialHoles || []);
  const [drawingHole, setDrawingHole] = useState(false);
  const [holePoints, setHolePoints] = useState([]);
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
    if ((!drawingHole && finished) || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    const point = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    if (drawingHole) {
      setHolePoints([...holePoints, point]);
    } else {
      setPoints([...points, point]);
    }
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
    setHoles([]);
    setHolePoints([]);
    setDrawingHole(false);
    setFinished(false);
  }

  function handleUndo() {
    if (drawingHole) {
      setHolePoints(holePoints.slice(0, -1));
      return;
    }
    setPoints(points.slice(0, -1));
    setFinished(false);
  }

  function finishHole() {
    if (holePoints.length < 3) return;
    setHoles([...holes, holePoints]);
    setHolePoints([]);
    setDrawingHole(false);
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
          {drawingHole
            ? `Click around the non-printable area. ${holePoints.length} point${holePoints.length === 1 ? "" : "s"} placed — need at least 3.`
            : finished
              ? "Shape complete — add exclusions, save, or reset."
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
            style={
              imageSize
                ? { width: imageSize.width * baseScale * zoom }
                : undefined
            }
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Mockup"
              onClick={handleClick}
              onLoad={handleImageLoad}
              draggable={false}
            />
            <svg
              className="pe-svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {points.length > 1 && (
                <polyline
                  points={(finished ? [...points, points[0]] : points)
                    .map((p) => {
                      const pc = toPercent(p);
                      return `${pc.x},${pc.y}`;
                    })
                    .join(" ")}
                  fill={finished ? "rgba(61,63,224,0.15)" : "none"}
                  stroke="#3D3FE0"
                  strokeWidth="0.4"
                />
              )}
              {holes.map((hole, index) => (
                <polyline
                  key={`hole-${index}`}
                  points={[...hole, hole[0]]
                    .map((p) => {
                      const pc = toPercent(p);
                      return `${pc.x},${pc.y}`;
                    })
                    .join(" ")}
                  fill="rgba(220,60,60,0.2)"
                  stroke="#c0392b"
                  strokeWidth="0.4"
                />
              ))}
              {holePoints.length > 1 && (
                <polyline
                  points={holePoints
                    .map((p) => {
                      const pc = toPercent(p);
                      return `${pc.x},${pc.y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#c0392b"
                  strokeWidth="0.4"
                />
              )}
            </svg>
            {[...points, ...holes.flat(), ...holePoints].map((p, i) => {
              const pc = toPercent(p);
              return (
                <div
                  key={i}
                  className="pe-dot"
                  style={{ left: `${pc.x}%`, top: `${pc.y}%` }}
                />
              );
            })}
          </div>
        </div>

        <div className="pe-hint">
          Scroll to zoom · Right-click and drag to pan · Left-click to place
          points
        </div>

        <div className="pe-actions">
          <Button
            variant="secondary"
            onClick={handleUndo}
            disabled={
              drawingHole ? holePoints.length === 0 : points.length === 0
            }
          >
            Undo point
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
          {!finished ? (
            <Button
              variant="secondary"
              disabled={points.length < 3}
              onClick={() => setFinished(true)}
            >
              Finish shape
            </Button>
          ) : drawingHole ? (
            <Button
              variant="secondary"
              disabled={holePoints.length < 3}
              onClick={finishHole}
            >
              Finish cutout
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setDrawingHole(true)}>
              Add exclusion
            </Button>
          )}
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!finished || drawingHole}
            onClick={() => onSave(points, holes)}
          >
            Save area
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PerspectiveEditor;
