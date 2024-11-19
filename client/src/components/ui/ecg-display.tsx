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
    
    console.log('Canvas setup:', { width, height, dpr: window.devicePixelRatio });
    
    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Calculate display parameters
    const pixelsPerMm = width / (config.timeScale * 10); // 10 seconds visible
    setPixelsPerMm(pixelsPerMm);
    
    console.log('Display parameters:', {
      pixelsPerMm,
      timeScale: config.timeScale,
      amplitude: config.amplitude,
    });
    
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
      
      const baseline = height * 0.5; // Center vertically
      const timeWindow = 10; // 10 seconds visible
      const currentTime = Date.now() / 1000;
      const startTime = currentTime - timeWindow;
      
      console.log('Render frame:', {
        dataPoints: data.length,
        timeWindow,
        currentTime: new Date(currentTime * 1000).toISOString(),
        startTime: new Date(startTime * 1000).toISOString(),
      });
      
      let lastX = -1;
      let lastY = -1;
      let pointsDrawn = 0;
      
      data.forEach((point) => {
        const pointTime = point.timestamp / 1000;
        if (pointTime >= startTime && pointTime <= currentTime) {
          const x = (pointTime - startTime) * config.timeScale * pixelsPerMm;
          const y = baseline - point.value * config.amplitude * pixelsPerMm * 3; // Tripled amplitude for better visibility
          
          if (x >= 0 && x <= width) {
            if (lastX === -1) {
              ctx.moveTo(x, y);
            } else {
              // Only draw if points are not too far apart
              if (Math.abs(x - lastX) < 50) {
                ctx.lineTo(x, y);
              } else {
                ctx.moveTo(x, y);
              }
            }
            lastX = x;
            lastY = y;
            pointsDrawn++;
          }
        }
      });
      
      console.log('Points drawn:', pointsDrawn);
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
