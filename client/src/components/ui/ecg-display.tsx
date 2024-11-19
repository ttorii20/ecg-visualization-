import { useEffect, useRef, useState } from 'react';
import type { ECGConfiguration, ECGDataPoint } from '@/lib/ecg-utils';
import { drawGrid } from '@/lib/ecg-utils';
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
  const [pixelsPerMm, setPixelsPerMm] = useState(2);
  
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
    
    const render = () => {
      // Clear canvas
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid
      drawGrid(ctx, width, height, config, pixelsPerMm);
      
      // Draw ECG trace
      ctx.beginPath();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1.5;
      
      const baseline = height / 2;
      const timeWindow = width / (config.timeScale * pixelsPerMm); // seconds
      const currentTime = Date.now() / 1000;
      
      data.forEach((point, index) => {
        const x = (point.timestamp / 1000 - (currentTime - timeWindow)) * 
                 config.timeScale * pixelsPerMm;
        const y = baseline - point.value * config.amplitude * pixelsPerMm;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      requestAnimationFrame(render);
    };
    
    const animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [data, config, width, height]);

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
