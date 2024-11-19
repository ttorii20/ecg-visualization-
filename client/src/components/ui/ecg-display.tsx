import { useEffect, useRef, useState, useCallback } from 'react';
import type { ECGConfiguration, ECGDataPoint } from '@/lib/ecg-utils';
import { drawGrid, interpolatePoints } from '@/lib/ecg-utils';
import { cn } from '@/lib/utils';

interface ECGDisplayProps {
  data: ECGDataPoint[];
  config: ECGConfiguration;
  className?: string;
  width?: number;
  height?: number;
}

export function ECGDisplay({
  data,
  config,
  className,
  width = 800,
  height = 400,
}: ECGDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [pixelsPerMm, setPixelsPerMm] = useState(2);
  
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height, config, pixelsPerMm);
    
    // Draw ECG trace
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    
    const baseline = height * 0.5;
    const timeWindow = 10; // 10 seconds visible
    const currentTime = Date.now() / 1000;
    const startTime = currentTime - timeWindow;
    
    let isFirstPoint = true;
    let lastPoint: ECGDataPoint | null = null;
    
    // Filter visible points
    const visiblePoints = data.filter(point => {
      const pointTime = point.timestamp / 1000;
      return pointTime >= startTime && pointTime <= currentTime;
    });
    
    // Draw points with interpolation
    visiblePoints.forEach((point, index) => {
      const pointTime = point.timestamp / 1000;
      const x = (pointTime - startTime) * config.timeScale * pixelsPerMm;
      const y = baseline - point.value * config.amplitude * pixelsPerMm * 3;
      
      if (x >= 0 && x <= width) {
        if (isFirstPoint) {
          ctx.moveTo(x, y);
          isFirstPoint = false;
        } else if (lastPoint) {
          // Add interpolated points for smoother curves
          const steps = 5;
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const interpolated = interpolatePoints(lastPoint, point, t);
            const ix = ((interpolated.timestamp / 1000) - startTime) * config.timeScale * pixelsPerMm;
            const iy = baseline - interpolated.value * config.amplitude * pixelsPerMm * 3;
            ctx.lineTo(ix, iy);
          }
        }
        lastPoint = point;
      }
    });
    
    ctx.stroke();
    
    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(render);
  }, [data, config, width, height, pixelsPerMm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Calculate display parameters
    const pixelsPerMm = width / (config.timeScale * 10);
    setPixelsPerMm(pixelsPerMm);
    
    // Start render loop
    animationFrameRef.current = requestAnimationFrame(render);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config.timeScale, width, height, render]);

  return (
    <div className={cn("relative bg-white rounded-lg shadow-md", className)}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200"
      />
      <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-sm">
        {config.leadConfiguration} - {config.timeScale}mm/s
      </div>
    </div>
  );
}
