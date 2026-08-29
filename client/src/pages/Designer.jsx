import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Image as KonvaImage,
  Text as KonvaText,
  Transformer,
} from "react-konva";
import api from "../api/axios";
import { createDesign, saveDesign, uploadImage } from "../api/design";
import { applyDisplacement, applyFabricLighting, generateDisplacementFromPhoto } from "../utils/displacementMap";
import { useHistory } from "../hooks/useHistory";
import Button from "../components/Button";
import { useCart } from "../context/CartContext";
import MockupPreviewModal from "../components/MockupPreviewModal";
import "./Designer.css";

let tempIdCounter = -1;

const MAX_EDIT_DIMENSION = 640;

function MockupBackground({ area, onSize }) {
  const mockupUrl = area.mockupTemplate?.baseImageUrl;
  const [img, setImg] = useState(null);
  const [displaySize, setDisplaySize] = useState(null);

  useEffect(() => {
    if (!mockupUrl) {
      setImg(null);
      onSize(null);
      return undefined;
    }

    let cancelled = false;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (cancelled) return;
      const ratio = Math.min(1, MAX_EDIT_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      const size = { width: Math.round(image.naturalWidth * ratio), height: Math.round(image.naturalHeight * ratio) };
      setImg(image);
      setDisplaySize(size);
      onSize({ ...size, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, scale: ratio });
    };
    image.onerror = () => {
      setImg(null);
      onSize(null);
    };
    image.src = `http://localhost:5000${mockupUrl}`;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockupUrl]);

  if (!img || !displaySize) {
    return <Rect x={0} y={0} width={area.width} height={area.height} fill="#ffffff" stroke="#E4E2DC" />;
  }

  return <KonvaImage image={img} x={0} y={0} width={displaySize.width} height={displaySize.height} listening={false} />;
}

// Dashed outline showing the customer where the print will actually
// land — purely visual, never clips or moves their artwork while editing.
function PrintAreaOutline({ points }) {
  if (!points || points.length < 3) return null;
  const flat = points.flatMap((p) => [p.x, p.y]);
  return (
    <Line
      points={[...flat, points[0].x, points[0].y]}
      stroke="#3D3FE0"
      strokeWidth={2}
      dash={[8, 6]}
      closed={false}
      listening={false}
    />
  );
}

function DesignImage({ el, isSelected, onSelect, onChange }) {
  const imageUrl = el.image?.fileUrl
    ? `http://localhost:5000${el.image.fileUrl}`
    : "";
  const [img, setImg] = useState(null);
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (!imageUrl) {
      return undefined;
    }

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setImg(image);
    image.onerror = () => setImg(null);
    image.src = imageUrl;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  useEffect(() => {
    if (!img || !shapeRef.current) return;

    const imageNode = shapeRef.current;
    imageNode.image(img);
    imageNode.getLayer()?.batchDraw();
  }, [img]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        x={el.posX}
        y={el.posY}
        width={el.width}
        height={el.height}
        rotation={el.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) =>
          onChange({ ...el, posX: event.target.x(), posY: event.target.y() })
        }
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...el,
            posX: node.x(),
            posY: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled />}
    </>
  );
}

function DesignText({ el, isSelected, onSelect, onChange }) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaText
        ref={shapeRef}
        text={el.text?.content || ""}
        x={el.posX}
        y={el.posY}
        width={el.width}
        fontSize={el.text?.fontSize || 24}
        fontFamily={el.text?.fontFamily || "Inter"}
        fill={el.text?.color || "#16181D"}
        fontStyle={`${el.text?.bold ? "bold" : ""} ${el.text?.italic ? "italic" : ""}`.trim() || "normal"}
        align={el.text?.align || "left"}
        rotation={el.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) =>
          onChange({ ...el, posX: event.target.x(), posY: event.target.y() })
        }
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();

          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...el,
            posX: node.x(),
            posY: node.y(),
            width: Math.max(40, node.width() * scaleX),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={["middle-left", "middle-right"]}
        />
      )}
    </>
  );
}

function Designer() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const variantId = searchParams.get("variant");
  const navigate = useNavigate();
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [design, setDesign] = useState(null);
  const [activeArea, setActiveArea] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [canvasSize, setCanvasSize] = useState(null);

  const fileInputRef = useRef();
  const layerRef = useRef();
  const stageRef = useRef();
  const elementsLayerRef = useRef();

  const { state: elements, set: setElements, undo, redo, canUndo, canRedo } = useHistory([]);

  useEffect(() => {
    async function init() {
      try {
        const { data: productData } = await api.get(`/products/${slug}`);
        setProduct(productData);
        setActiveArea(productData.printableAreas[0]);
        const designData = await createDesign(productData.id);
        setDesign(designData);
        setElements(designData.elements || []);
      } catch (error) {
        setLoadError(error.response?.data?.message || "Failed to load the designer.");
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    layerRef.current?.batchDraw();
  });

  const updateElement = (updated) => {
    setElements((elements || []).map((element) => (element.id === updated.id ? updated : element)));
  };

  const handleSave = useCallback(async () => {
    if (!design) return;
    setSaving(true);
    try {
      const payload = (elements || []).map((element) => ({
        id: element.id.toString().startsWith("temp-") ? null : element.id,
        printableAreaId: element.printableAreaId,
        type: element.type,
        layerOrder: element.layerOrder,
        posX: element.posX,
        posY: element.posY,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        image: element.image || null,
        text: element.text || null,
      }));
      const saved = await saveDesign(design.id, design.name, payload);
      setDesign(saved);
      setElements(saved.elements || []);
    } finally {
      setSaving(false);
    }
  }, [design, elements, setElements]);

  if (loadError) {
    return <p className="designer-status">{loadError}</p>;
  }

  if (!product || !activeArea) {
    return <p className="designer-status">Loading designer...</p>;
  }

  const activeVariant = product.variants.find((v) => v.id === variantId);

  async function handleGeneratePreview() {
    const mockup = activeArea.mockupTemplate;
    if (!mockup?.baseImageUrl) {
      alert("This product has no mockup photo yet — ask an admin to upload one.");
      return;
    }

    setGeneratingPreview(true);
    try {
      setSelectedId(null);
      await new Promise((r) => setTimeout(r, 50));

      const designDataUrl = elementsLayerRef.current.toDataURL({ pixelRatio: 1 });
      const designImg = new window.Image();
      await new Promise((resolve, reject) => {
        designImg.onload = resolve;
        designImg.onerror = reject;
        designImg.src = designDataUrl;
      });

      const mockupImg = new window.Image();
      mockupImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        mockupImg.onload = resolve;
        mockupImg.onerror = reject;
        mockupImg.src = `http://localhost:5000${mockup.baseImageUrl}`;
      });

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = mockupImg.naturalWidth;
      finalCanvas.height = mockupImg.naturalHeight;
      const finalCtx = finalCanvas.getContext("2d");
      finalCtx.drawImage(mockupImg, 0, 0);

      const flatCanvas = document.createElement("canvas");
      flatCanvas.width = mockupImg.naturalWidth;
      flatCanvas.height = mockupImg.naturalHeight;
      flatCanvas.getContext("2d").drawImage(designImg, 0, 0, mockupImg.naturalWidth, mockupImg.naturalHeight);

      const dispCanvas = generateDisplacementFromPhoto(mockupImg);
      const displacedDesign = applyDisplacement(flatCanvas, dispCanvas, 10);
      const designSource = applyFabricLighting(displacedDesign, mockupImg);

      const points = mockup.perspectiveConfig?.points;
      if (points && points.length >= 3) {
        finalCtx.save();
        finalCtx.beginPath();
        finalCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) finalCtx.lineTo(points[i].x, points[i].y);
        finalCtx.closePath();
        finalCtx.clip();
        finalCtx.drawImage(designSource, 0, 0);
        finalCtx.restore();
      } else {
        finalCtx.drawImage(designSource, 0, 0);
      }

      setPreviewUrl(finalCanvas.toDataURL("image/png"));
    } catch (err) {
      alert(`Failed to generate preview: ${err.message}`);
    } finally {
      setGeneratingPreview(false);
    }
  }

  const visibleElements = (elements || []).filter(
    (element) => String(element.printableAreaId) === String(activeArea.id)
  );

  function addTextElement() {
    const newElement = {
      id: `temp-${tempIdCounter--}`,
      printableAreaId: activeArea.id,
      type: "text",
      layerOrder: (elements || []).length,
      posX: 50,
      posY: 50,
      width: 200,
      height: 40,
      rotation: 0,
      text: {
        content: "Your text here",
        fontFamily: "Inter",
        fontSize: 24,
        color: "#16181D",
        bold: false,
        italic: false,
        align: "left",
      },
    };
    setElements([...(elements || []), newElement]);
    setSelectedId(newElement.id);
  }

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const uploaded = await uploadImage(file);
      const newElement = {
        id: `temp-${tempIdCounter--}`,
        printableAreaId: activeArea.id,
        type: "image",
        layerOrder: (elements || []).length,
        posX: 80,
        posY: 80,
        width: 150,
        height: 150,
        rotation: 0,
        image: {
          fileUrl: uploaded.fileUrl,
          originalFilename: uploaded.originalFilename,
          mimeType: uploaded.mimeType,
        },
      };
      setElements([...(elements || []), newElement]);
      setSelectedId(newElement.id);
    } catch (error) {
      alert(error.response?.data?.message || "Image upload failed. Please try again.");
    } finally {
      event.target.value = "";
    }
  }

  function removeSelected() {
    setElements((elements || []).filter((element) => element.id !== selectedId));
    setSelectedId(null);
  }

  function updateSelectedText(field, value) {
    const selectedElement = (elements || []).find((element) => element.id === selectedId);
    if (!selectedElement) return;
    updateElement({
      ...selectedElement,
      text: { ...selectedElement.text, [field]: value },
    });
  }

  const selectedElement = (elements || []).find((element) => element.id === selectedId);

  return (
    <div className="designer">
      <div className="designer__toolbar">
        {activeVariant && (
          <p className="designer__variant-label">
            {product.name} — {activeVariant.color} / {activeVariant.size}
          </p>
        )}

        <div className="designer__areas">
          {product.printableAreas.map((area) => (
            <button
              key={area.id}
              className={`designer__area-tab ${activeArea.id === area.id ? "designer__area-tab--active" : ""}`}
              onClick={() => {
                setCanvasSize(null);
                setActiveArea(area);
              }}
            >
              {area.name}
            </button>
          ))}
        </div>
        <div className="designer__tools">
          <button onClick={() => fileInputRef.current?.click()}>Upload image</button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleImageUpload} />
          <button onClick={addTextElement}>Add text</button>
          <button onClick={undo} disabled={!canUndo}>Undo</button>
          <button onClick={redo} disabled={!canRedo}>Redo</button>
          {selectedId && <button onClick={removeSelected}>Delete</button>}
        </div>
      </div>
      <div className="designer__body">
        <div className="designer__canvas-wrap">
          <Stage
            ref={stageRef}
            width={canvasSize?.width || activeArea.width}
            height={canvasSize?.height || activeArea.height}
            className="designer__canvas"
            onMouseDown={(event) => {
              if (event.target === event.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer ref={layerRef}>
              <MockupBackground area={activeArea} onSize={setCanvasSize} />
            </Layer>
            <Layer ref={elementsLayerRef}>
              {[...visibleElements].sort((a, b) => a.layerOrder - b.layerOrder).map((element) =>
                element.type === "image" ? (
                  <DesignImage key={element.id} el={element} isSelected={selectedId === element.id} onSelect={() => setSelectedId(element.id)} onChange={updateElement} />
                ) : (
                  <DesignText key={element.id} el={element} isSelected={selectedId === element.id} onSelect={() => setSelectedId(element.id)} onChange={updateElement} />
                )
              )}
            </Layer>
          </Stage>
        </div>
        <div className="designer__sidebar">
          <h3>Layers</h3>
          <ul className="designer__layers">
            {visibleElements.map((element) => (
              <li key={element.id} className={selectedId === element.id ? "designer__layer--active" : ""} onClick={() => setSelectedId(element.id)}>
                {element.type === "text" ? `Text: ${element.text?.content?.slice(0, 20)}` : "Image"}
              </li>
            ))}
          </ul>
          {selectedElement?.type === "text" && (
            <div className="designer__text-props">
              <h3>Text properties</h3>
              <textarea value={selectedElement.text?.content || ""} onChange={(event) => updateSelectedText("content", event.target.value)} />
              <label>Size<input type="number" value={selectedElement.text?.fontSize || 24} onChange={(event) => updateSelectedText("fontSize", Number(event.target.value))} /></label>
              <label>Color<input type="color" value={selectedElement.text?.color || "#16181D"} onChange={(event) => updateSelectedText("color", event.target.value)} /></label>
              <div className="designer__text-toggles">
                <button className={selectedElement.text?.bold ? "active" : ""} onClick={() => updateSelectedText("bold", !selectedElement.text?.bold)}>B</button>
                <button className={selectedElement.text?.italic ? "active" : ""} onClick={() => updateSelectedText("italic", !selectedElement.text?.italic)}>I</button>
              </div>
            </div>
          )}

          <Button variant="secondary" className="btn--block" onClick={handleGeneratePreview} disabled={generatingPreview}>
            {generatingPreview ? "Generating..." : "Preview mockup"}
          </Button>

          {previewUrl && (
            <MockupPreviewModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
          )}

          <Button variant="secondary" className="btn--block" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save design"}
          </Button>

          {activeVariant ? (
            <Button
              variant="primary"
              className="btn--block"
              disabled={saving || addingToCart}
              onClick={async () => {
                setAddingToCart(true);
                try {
                  await handleSave();
                  await add(activeVariant.id, 1, design.id);
                  navigate("/cart");
                } finally {
                  setAddingToCart(false);
                }
              }}
            >
              {addingToCart ? "Adding..." : "Save & add to cart"}
            </Button>
          ) : (
            <p className="designer-status designer-status--inline">
              No product variant selected — go back and pick a color/size first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Designer;