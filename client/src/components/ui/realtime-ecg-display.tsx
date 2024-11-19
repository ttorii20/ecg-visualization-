import { useEffect, useRef } from 'react';
import type { ECGConfiguration, ECGDataPoint } from '@/lib/ecg-utils';
import { drawDetailedGrid, interpolatePoints } from '@/lib/ecg-utils';
import { cn } from '@/lib/utils';

interface RealtimeECGDisplayProps {
  data: ECGDataPoint[];
  config: ECGConfiguration;
  className?: string;
}

export function RealtimeECGDisplay({
  data,
  config,
  className,
}: RealtimeECGDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastRenderTimeRef = useRef<number>(0);
  const dataRef = useRef(data);

  // Update data reference when it changes
  useEffect(() => {
    console.log(`[RealtimeDisplay] Data updated: ${data.length} points`);
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    console.log('[RealtimeDisplay] Initializing canvas');
    const width = container.clientWidth;
    const height = 200; // Fixed height for realtime view
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const renderFrame = (timestamp: number) => {
      // Target 60fps (approximately 16.67ms between frames)
      if (timestamp - lastRenderTimeRef.current < 16.67) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      // Clear canvas with black background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      // Calculate display parameters
      const timeWindow = 5; // 5 seconds view
      const pixelsPerMm = width / (config.timeScale * timeWindow);

      // Draw detailed grid
      drawDetailedGrid(ctx, width, height, config, pixelsPerMm);

      // Draw ECG trace
      const currentData = dataRef.current;
      if (currentData.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;

        const baseline = height * 0.5;
        const currentTime = Date.now();
        const timeWindow = 5000; // 5 seconds in milliseconds
        const cutoffTime = currentTime - timeWindow;

        // Filter to show only last 5 seconds of data
        const recentData = currentData.filter(point => point.timestamp > cutoffTime);
        
        if (recentData.length > 0) {
          console.log(`[RealtimeDisplay] Rendering ${recentData.length} points`);
          let isFirstPoint = true;
          let lastPoint: ECGDataPoint | null = null;

          recentData.forEach(point => {
            const x = ((point.timestamp - cutoffTime) / 1000) * config.timeScale * pixelsPerMm;
            const y = baseline - point.value * config.amplitude * pixelsPerMm * 3;

            if (x >= 0 && x <= width) {
              if (isFirstPoint) {
                ctx.moveTo(x, y);
                isFirstPoint = false;
              } else if (lastPoint) {
                // Add smooth interpolation between points
                const steps = 5;
                for (let i = 1; i <= steps; i++) {
                  const t = i / steps;
                  const interpolated = interpolatePoints(lastPoint, point, t);
                  const ix = ((interpolated.timestamp - cutoffTime) / 1000) * config.timeScale * pixelsPerMm;
                  const iy = baseline - interpolated.value * config.amplitude * pixelsPerMm * 3;
                  ctx.lineTo(ix, iy);
                }
              }
              lastPoint = point;
            }
          });

          ctx.stroke();
        }
        ctx.restore();
      }

      lastRenderTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    console.log('[RealtimeDisplay] Starting animation frame loop');
    animationFrameRef.current = requestAnimationFrame(renderFrame);

    const resizeObserver = new ResizeObserver(() => {
      console.log('[RealtimeDisplay] Container resized');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    });

    resizeObserver.observe(container);

    return () => {
      console.log('[RealtimeDisplay] Cleaning up');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [config]);

  return (
    <div className={cn("relative bg-black rounded-lg shadow-md overflow-hidden", className)} ref={containerRef}>
      <div className="absolute top-2 right-2 bg-black/80 text-[#00FF00] px-2 py-1 rounded text-sm z-10">
        {config.leadConfiguration} - Real-time View
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
