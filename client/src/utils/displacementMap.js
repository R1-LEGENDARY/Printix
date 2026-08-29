export function generateDisplacementFromPhoto(photoImage) {
  const canvas = document.createElement("canvas");
  canvas.width = photoImage.naturalWidth;
  canvas.height = photoImage.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.filter = "grayscale(1) blur(10px) contrast(0.6)";
  ctx.drawImage(photoImage, 0, 0);
  return canvas;
}

export function applyDisplacement(sourceCanvas, displacementImage, strength = 12) {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const mapCanvas = document.createElement("canvas");
  mapCanvas.width = w;
  mapCanvas.height = h;
  const mapCtx = mapCanvas.getContext("2d");
  mapCtx.drawImage(displacementImage, 0, 0, w, h);
  const mapData = mapCtx.getImageData(0, 0, w, h).data;

  const srcCtx = sourceCanvas.getContext("2d");
  const srcData = srcCtx.getImageData(0, 0, w, h);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d");
  const outData = outCtx.createImageData(w, h);

  function gray(x, y) {
    const cx = Math.min(w - 1, Math.max(0, x));
    const cy = Math.min(h - 1, Math.max(0, y));
    const i = (cy * w + cx) * 4;
    return (mapData[i] + mapData[i + 1] + mapData[i + 2]) / 3 / 255;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = (gray(x + 1, y) - gray(x - 1, y)) * strength;
      const gy = (gray(x, y + 1) - gray(x, y - 1)) * strength;

      const srcX = Math.round(x - gx);
      const srcY = Math.round(y - gy);
      const destI = (y * w + x) * 4;

      if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
        const srcI = (srcY * w + srcX) * 4;
        outData.data[destI] = srcData.data[srcI];
        outData.data[destI + 1] = srcData.data[srcI + 1];
        outData.data[destI + 2] = srcData.data[srcI + 2];
        outData.data[destI + 3] = srcData.data[srcI + 3];
      }

    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}

export function applyFabricLighting(sourceCanvas, photoImage, opacity = 0.55) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = sourceCanvas.width;
  textureCanvas.height = sourceCanvas.height;
  const textureCtx = textureCanvas.getContext("2d");
  textureCtx.filter = "grayscale(1) contrast(1.35)";
  textureCtx.drawImage(photoImage, 0, 0, sourceCanvas.width, sourceCanvas.height);

  textureCtx.globalCompositeOperation = "destination-in";
  textureCtx.drawImage(sourceCanvas, 0, 0);
  textureCtx.globalCompositeOperation = "source-over";

  const outCanvas = document.createElement("canvas");
  outCanvas.width = sourceCanvas.width;
  outCanvas.height = sourceCanvas.height;
  const outCtx = outCanvas.getContext("2d");
  outCtx.drawImage(sourceCanvas, 0, 0);
  outCtx.globalCompositeOperation = "multiply";
  outCtx.globalAlpha = opacity;
  outCtx.drawImage(textureCanvas, 0, 0);
  outCtx.globalAlpha = 1;
  outCtx.globalCompositeOperation = "source-over";
  return outCanvas;
}