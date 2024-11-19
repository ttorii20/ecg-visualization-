import { useEffect, useRef, useState } from 'react';
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
  const [pixelsPerMm, setPixelsPerMm] = useState(2);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const rowHeight = 120; // Height of each ECG row
  const timeWindow = 60; // 60 seconds per row
  const totalDuration = 1800; // 30 minutes total
  const rows = Math.ceil(totalDuration / timeWindow);
  const totalHeight = rows * rowHeight;
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top + container.scrollTop;
    
    const row = Math.floor(y / rowHeight);
    const timePerPixel = timeWindow / width;
    const clickTime = x * timePerPixel;
    const segment = Math.floor(clickTime / 20);
    
    setSelectedSegment(row * 3 + segment); // 3 segments per row (60/20)
  };
  
  // Render function now triggered by data or config changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
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
    
    // Clear canvas with black background
    ctx.fillStyle = 'black';
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
      drawGrid(ctx, width, rowHeight, config, pixelsPerMm, rowStartTime * 1000, rowHeight);
      ctx.restore();
      
      // Draw timestamp label
      ctx.save();
      ctx.fillStyle = '#00FF00';
      ctx.font = '12px monospace';
      ctx.fillText(formatTimestamp(rowStartTime * 1000), 5, rowY + 15);
      ctx.restore();
      
      // Draw selected segment highlight
      const rowSegments = 3; // 60 seconds / 20 seconds = 3 segments per row
      for (let segment = 0; segment < rowSegments; segment++) {
        if (selectedSegment === row * rowSegments + segment) {
          ctx.save();
          ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
          const segmentWidth = width / rowSegments;
          ctx.fillRect(segment * segmentWidth, rowY, segmentWidth, rowHeight);
          ctx.restore();
        }
      }
      
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
        ctx.strokeStyle = '#00FF00';
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
  }, [data, config, width, height, totalHeight, rowHeight, pixelsPerMm, selectedSegment]);

  return (
    <div className={cn("relative bg-black rounded-lg shadow-md overflow-hidden", className)}>
      <div className="absolute top-2 right-2 bg-black/80 text-[#00FF00] px-2 py-1 rounded text-sm z-10">
        {config.leadConfiguration} - {config.timeScale}mm/s
      </div>
      <ScrollArea className="h-[600px]" ref={containerRef}>
        <div className="relative" style={{ height: `${totalHeight}px` }}>
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            onClick={handleCanvasClick}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
