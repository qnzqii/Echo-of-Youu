import React, { useEffect, useRef } from 'react';

export default function WaterRippleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Physics buffer references
  const colsRef = useRef<number>(0);
  const rowsRef = useRef<number>(0);
  const buffer1Ref = useRef<Float32Array | null>(null);
  const buffer2Ref = useRef<Float32Array | null>(null);
  
  // Mouse position references for smooth path interpolation
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const currentMouseRef = useRef<{ x: number; y: number } | null>(null);
  const isMovingRef = useRef<boolean>(false);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create an offline buffer canvas for performance
    const offlineCanvas = document.createElement('canvas');
    const offlineCtx = offlineCanvas.getContext('2d');
    if (!offlineCtx) return;

    const CELL_SIZE = 8; // Size of each fluid cell (pixels per cell for exquisite high fidelity)
    const damping = 0.94; // Higher viscosity so waves quickly fade out and remain localized to mouse

    let animationFrameId: number;

    const initGrid = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width;
      canvas.height = height;

      // Buffer dimensions with outer safety boundaries
      const cols = Math.ceil(width / CELL_SIZE) + 2;
      const rows = Math.ceil(height / CELL_SIZE) + 2;
      
      colsRef.current = cols;
      rowsRef.current = rows;

      offlineCanvas.width = cols;
      offlineCanvas.height = rows;

      buffer1Ref.current = new Float32Array(cols * rows);
      buffer2Ref.current = new Float32Array(cols * rows);
    };

    initGrid();

    // Bresenham's line algorithm to render a completely solid, continuous trail
    const injectRippleLine = (
      x0: number, y0: number, 
      x1: number, y1: number, 
      radius: number, strength: number
    ) => {
      const cols = colsRef.current;
      const rows = rowsRef.current;
      const buffer = buffer1Ref.current;
      if (!buffer) return;

      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = (x0 < x1) ? 1 : -1;
      const sy = (y0 < y1) ? 1 : -1;
      let err = dx - dy;

      let cx = x0;
      let cy = y0;

      while (true) {
        injectRipplePoint(cx, cy, radius, strength);

        if (cx === x1 && cy === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          cx += sx;
        }
        if (e2 < dx) {
          err += dx;
          cy += sy;
        }
      }
    };

    // Soft cosine falloff to inject energy into the wave field with organic smoothness
    const injectRipplePoint = (cx: number, cy: number, radius: number, strength: number) => {
      const cols = colsRef.current;
      const rows = rowsRef.current;
      const buffer = buffer1Ref.current;
      if (!buffer) return;

      const r2 = radius * radius;
      const xStart = Math.max(1, cx - radius);
      const xEnd = Math.min(cols - 2, cx + radius);
      const yStart = Math.max(1, cy - radius);
      const yEnd = Math.min(rows - 2, cy + radius);

      for (let y = yStart; y <= yEnd; y++) {
        const rowOffset = y * cols;
        for (let x = xStart; x <= xEnd; x++) {
          const dist2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          if (dist2 < r2) {
            const factor = Math.cos((Math.sqrt(dist2) / radius) * Math.PI * 0.5);
            const idx = rowOffset + x;
            buffer[idx] += strength * factor;
          }
        }
      }
    };

    // Main animation loop
    const tick = () => {
      const cols = colsRef.current;
      const rows = rowsRef.current;
      let b1 = buffer1Ref.current;
      let b2 = buffer2Ref.current;

      if (!b1 || !b2) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // 1. Soothing ambient breath: removed to avoid wobbling the entire screen.
      // Ripples are now strictly localized and driven by direct interaction with the water surface.

      // 2. continuous mouse/finger wave trail interpolation
      if (isMovingRef.current && lastMouseRef.current && currentMouseRef.current) {
        const gx0 = Math.floor((lastMouseRef.current.x / window.innerWidth) * cols);
        const gy0 = Math.floor((lastMouseRef.current.y / window.innerHeight) * rows);
        const gx1 = Math.floor((currentMouseRef.current.x / window.innerWidth) * cols);
        const gy1 = Math.floor((currentMouseRef.current.y / window.innerHeight) * rows);

        // Interpolate along the continuous path with soft, localized radius and gentle energy
        injectRippleLine(gx0, gy0, gx1, gy1, 5, 0.28);
        
        lastMouseRef.current = { ...currentMouseRef.current };
      }

      // 3. Step 2D Wave propagation equation
      for (let y = 1; y < rows - 1; y++) {
        const rowOffset = y * cols;
        for (let x = 1; x < cols - 1; x++) {
          const idx = rowOffset + x;
          b2[idx] = (
            b1[idx - 1] +
            b1[idx + 1] +
            b1[idx - cols] +
            b1[idx + cols]
          ) * 0.5 - b2[idx];
          b2[idx] *= damping;
        }
      }

      // Swap wave status buffers
      buffer1Ref.current = b2;
      buffer2Ref.current = b1;
      b1 = b2; // align pointer for drawing rendering

      // 4. Shade the wave topography onto an ImageData object
      const imgData = offlineCtx.createImageData(cols, rows);
      const data = imgData.data;

      for (let y = 1; y < rows - 1; y++) {
        const rowOffset = y * cols;
        for (let x = 1; x < cols - 1; x++) {
          const idx = rowOffset + x;
          
          // Compute finite difference slope vectors
          const dx = b1[idx + 1] - b1[idx - 1];
          const dy = b1[idx + cols] - b1[idx - cols];
          
          // Lowered multiplier from 880 to 260 for a remarkably subtle, soft, and realistic texture
          const val = (dx - dy) * 260;
          const pixelIdx = idx * 4;

          if (val > 0) {
            // Shiny highlight peaks
            data[pixelIdx] = 255;
            data[pixelIdx + 1] = 255;
            data[pixelIdx + 2] = 255;
            // Translucent gentle specular glow (reduced max opacity from 68 to 36 for pure elegance)
            data[pixelIdx + 3] = Math.min(36, Math.floor(val * 0.5));
          } else {
            // Soft warm clay shadow valleys that look elegant on warm background
            data[pixelIdx] = 88;
            data[pixelIdx + 1] = 83;
            data[pixelIdx + 2] = 78;
            // Delicate translucent refraction values (reduced max opacity from 52 to 26)
            data[pixelIdx + 3] = Math.min(26, Math.floor(-val * 0.35));
          }
        }
      }

      offlineCtx.putImageData(imgData, 0, 0);

      // Render the interpolated small grid scaled up smoothly
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offlineCanvas, 0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Global listener coordinates tracking
    const handleMouseMove = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;

      if (!lastMouseRef.current) {
        lastMouseRef.current = { x: mx, y: my };
      }
      currentMouseRef.current = { x: mx, y: my };
      isMovingRef.current = true;

      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        isMovingRef.current = false;
        lastMouseRef.current = null;
      }, 100);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const mx = e.touches[0].clientX;
      const my = e.touches[0].clientY;

      if (!lastMouseRef.current) {
        lastMouseRef.current = { x: mx, y: my };
      }
      currentMouseRef.current = { x: mx, y: my };
      isMovingRef.current = true;

      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        isMovingRef.current = false;
        lastMouseRef.current = null;
      }, 100);
    };

    const handleResize = () => {
      initGrid();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-1"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
