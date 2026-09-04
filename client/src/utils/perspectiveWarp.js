const GRID = 24;

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function bilinear(corners, u, v) {
  const top = lerp(corners.tl, corners.tr, u);
  const bottom = lerp(corners.bl, corners.br, u);
  return lerp(top, bottom, v);
}

function drawTriangle(ctx, srcImg, sx0, sy0, sx1, sy1, sx2, sy2, dx0, dy0, dx1, dy1, dx2, dy2) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dx0, dy0);
  ctx.lineTo(dx1, dy1);
  ctx.lineTo(dx2, dy2);
  ctx.closePath();
  ctx.clip();

  const denom = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);
  if (denom === 0) {
    ctx.restore();
    return;
  }

  const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom;
  const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom;
  const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom;
  const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom;
  const e = (dx0 * (sx1 * sy2 - sx2 * sy1) + dx1 * (sx2 * sy0 - sx0 * sy2) + dx2 * (sx0 * sy1 - sx1 * sy0)) / denom;
  const f = (dy0 * (sx1 * sy2 - sx2 * sy1) + dy1 * (sx2 * sy0 - sx0 * sy2) + dy2 * (sx0 * sy1 - sx1 * sy0)) / denom;

  ctx.setTransform(a, b, c, d, e, f);
  ctx.drawImage(srcImg, 0, 0);
  ctx.restore();
}

function normalizeCorners(corners) {
  const points = [corners.tl, corners.tr, corners.br, corners.bl];
  const avgY = points.reduce((s, p) => s + p.y, 0) / 4;

  const top = points.filter((p) => p.y < avgY);
  const bottom = points.filter((p) => p.y >= avgY);

  const tl = top.reduce((a, b) => (a.x < b.x ? a : b));
  const tr = top.reduce((a, b) => (a.x > b.x ? a : b));
  const bl = bottom.reduce((a, b) => (a.x < b.x ? a : b));
  const br = bottom.reduce((a, b) => (a.x > b.x ? a : b));

  return { tl, tr, br, bl };
}

export function unwarpQuadFromImage(sourceImage, rawCorners, outW, outH) {
  const corners = normalizeCorners(rawCorners);
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext("2d");

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const u0 = col / GRID, u1 = (col + 1) / GRID;
      const v0 = row / GRID, v1 = (row + 1) / GRID;

      const s0 = bilinear(corners, u0, v0);
      const s1 = bilinear(corners, u1, v0);
      const s2 = bilinear(corners, u1, v1);
      const s3 = bilinear(corners, u0, v1);

      const d0x = u0 * outW, d0y = v0 * outH;
      const d1x = u1 * outW, d1y = v0 * outH;
      const d2x = u1 * outW, d2y = v1 * outH;
      const d3x = u0 * outW, d3y = v1 * outH;

      drawTriangle(ctx, sourceImage, s0.x, s0.y, s1.x, s1.y, s2.x, s2.y, d0x, d0y, d1x, d1y, d2x, d2y);
      drawTriangle(ctx, sourceImage, s0.x, s0.y, s2.x, s2.y, s3.x, s3.y, d0x, d0y, d2x, d2y, d3x, d3y);
    }
  }

  return out;
}

export function warpCanvasToQuad(sourceCanvas, rawCorners) {
  const corners = normalizeCorners(rawCorners);
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const xs = [corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x];
  const ys = [corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y];
  const outW = Math.ceil(Math.max(...xs) - Math.min(...xs));
  const outH = Math.ceil(Math.max(...ys) - Math.min(...ys));
  const offsetX = Math.min(...xs);
  const offsetY = Math.min(...ys);

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext("2d");

  const shifted = {
    tl: { x: corners.tl.x - offsetX, y: corners.tl.y - offsetY },
    tr: { x: corners.tr.x - offsetX, y: corners.tr.y - offsetY },
    br: { x: corners.br.x - offsetX, y: corners.br.y - offsetY },
    bl: { x: corners.bl.x - offsetX, y: corners.bl.y - offsetY },
  };

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const u0 = col / GRID, u1 = (col + 1) / GRID;
      const v0 = row / GRID, v1 = (row + 1) / GRID;

      const sx0 = u0 * w, sy0 = v0 * h;
      const sx1 = u1 * w, sy1 = v0 * h;
      const sx2 = u1 * w, sy2 = v1 * h;
      const sx3 = u0 * w, sy3 = v1 * h;

      const d0 = bilinear(shifted, u0, v0);
      const d1 = bilinear(shifted, u1, v0);
      const d2 = bilinear(shifted, u1, v1);
      const d3 = bilinear(shifted, u0, v1);

      drawTriangle(ctx, sourceCanvas, sx0, sy0, sx1, sy1, sx2, sy2, d0.x, d0.y, d1.x, d1.y, d2.x, d2.y);
      drawTriangle(ctx, sourceCanvas, sx0, sy0, sx2, sy2, sx3, sy3, d0.x, d0.y, d2.x, d2.y, d3.x, d3.y);
    }
  }

  return { canvas: out, offsetX, offsetY };
}