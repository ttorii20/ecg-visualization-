import { useEffect, useRef } from 'react';
import type { ECGConfiguration, ECGDataPoint } from '@/lib/ecg-utils';
import { drawDetailedGrid, interpolatePoints } from '@/lib/ecg-utils';
import { cn } from '@/lib/utils';

interface DetailedECGDisplayProps {
  data: ECGDataPoint[];
  config: ECGConfiguration;
  className?: string;
  width?: number;
  height?: number;
}

export function DetailedECGDisplay({
  data,
  config,
  className,
  width = 900,
  height = 250,
}: DetailedECGDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const pixelsPerMm = width / (config.timeScale * 20); // 20 seconds view

    // Clear canvas with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw detailed grid
    drawDetailedGrid(ctx, width, height, config, pixelsPerMm);

    // Draw ECG trace
    if (data.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;

      const baseline = height * 0.5;
      let isFirstPoint = true;
      let lastPoint: ECGDataPoint | null = null;

      data.forEach(point => {
        const x = ((point.timestamp - data[0].timestamp) / 1000) * config.timeScale * pixelsPerMm;
        const y = baseline - point.value * config.amplitude * pixelsPerMm * 4; // Increased amplitude for better detail

        if (x >= 0 && x <= width) {
          if (isFirstPoint) {
            ctx.moveTo(x, y);
            isFirstPoint = false;
          } else if (lastPoint) {
            const steps = 5; // More interpolation steps for smoother rendering
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              const interpolated = interpolatePoints(lastPoint, point, t);
              const ix = ((interpolated.timestamp - data[0].timestamp) / 1000) * config.timeScale * pixelsPerMm;
              const iy = baseline - interpolated.value * config.amplitude * pixelsPerMm * 4;
              ctx.lineTo(ix, iy);
            }
          }
          lastPoint = point;
        }
      });

      ctx.stroke();
      ctx.restore();
    }
  }, [data, config, width, height]);

  return (
    <div className={cn("relative bg-black rounded-lg shadow-md overflow-hidden", className)}>
      <div className="absolute top-2 right-2 bg-black/80 text-[#00FF00] px-2 py-1 rounded text-sm z-10">
        Detailed View - {config.leadConfiguration}
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
