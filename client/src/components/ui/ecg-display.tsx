import { useEffect, useRef, useState, useCallback } from 'react';
import type { ECGConfiguration, ECGDataPoint } from '@/lib/ecg-utils';
import { drawGrid, interpolatePoints, formatTimestamp, decimateData } from '@/lib/ecg-utils';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  height = 600,
}: ECGDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const [pixelsPerMm, setPixelsPerMm] = useState(2);
  const rowHeight = 120; // Height of each ECG row
  const timeWindow = 60; // 60 seconds per row
  const totalDuration = 1800; // 30 minutes total
  const rows = Math.ceil(totalDuration / timeWindow);
  const totalHeight = rows * rowHeight;
  
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, totalHeight);
    
    const currentTime = Date.now() / 1000;
    const scrollTop = container.scrollTop;
    const visibleRows = Math.ceil(height / rowHeight) + 1;
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(rows, startRow + visibleRows);
    
    // Draw visible rows
    for (let row = startRow; row < endRow; row++) {
      const rowStartTime = currentTime - totalDuration + (row * timeWindow);
      const rowEndTime = rowStartTime + timeWindow;
      const rowY = row * rowHeight;
      
      // Draw grid with time markers for this row
      ctx.save();
      ctx.translate(0, rowY);
      drawGrid(ctx, width, rowHeight, config, pixelsPerMm, rowStartTime * 1000, rowHeight, true);
      ctx.restore();
      
      // Draw timestamp label
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(formatTimestamp(rowStartTime * 1000), 5, rowY + 15);
      ctx.restore();
      
      // Filter and decimate data for this row
      const rowData = data.filter(point => {
        const pointTime = point.timestamp / 1000;
        return pointTime >= rowStartTime && pointTime < rowEndTime;
      });
      
      const decimatedData = decimateData(rowData, Math.floor(width / 2));
      
      // Draw ECG trace
      if (decimatedData.length > 0) {
        ctx.save();
        ctx.translate(0, rowY);
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        
        const baseline = rowHeight * 0.5;
        let isFirstPoint = true;
        let lastPoint: ECGDataPoint | null = null;
        
        decimatedData.forEach(point => {
          const x = ((point.timestamp / 1000) - rowStartTime) * config.timeScale * pixelsPerMm;
          const y = baseline - point.value * config.amplitude * pixelsPerMm * 3;
          
          if (x >= 0 && x <= width) {
            if (isFirstPoint) {
              ctx.moveTo(x, y);
              isFirstPoint = false;
            } else if (lastPoint) {
              const steps = 3;
              for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const interpolated = interpolatePoints(lastPoint, point, t);
                const ix = ((interpolated.timestamp / 1000) - rowStartTime) * config.timeScale * pixelsPerMm;
                const iy = baseline - interpolated.value * config.amplitude * pixelsPerMm * 3;
                ctx.lineTo(ix, iy);
              }
            }
            lastPoint = point;
          }
        });
        
        ctx.stroke();
        ctx.restore();
      }
    }
    
    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(render);
  }, [data, config, width, height, totalHeight, rowHeight, pixelsPerMm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${totalHeight}px`;
    ctx.scale(dpr, dpr);
    
    // Calculate display parameters
    const pixelsPerMm = width / (config.timeScale * timeWindow);
    setPixelsPerMm(pixelsPerMm);
    
    // Start render loop
    animationFrameRef.current = requestAnimationFrame(render);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config.timeScale, width, totalHeight, render]);

  return (
    <div className={cn("relative bg-white rounded-lg shadow-md overflow-hidden", className)}>
      <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-sm z-10">
        {config.leadConfiguration} - {config.timeScale}mm/s
      </div>
      <ScrollArea className="h-[600px]" ref={containerRef}>
        <div className="relative" style={{ height: `${totalHeight}px` }}>
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
          />
        </div>
      </ScrollArea>
    </div>
  );
}
