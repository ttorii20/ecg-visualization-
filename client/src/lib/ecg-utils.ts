export type ECGDataPoint = {
  value: number;
  timestamp: number;
};

export type ECGConfiguration = {
  samplingRate: number;
  timeScale: number;
  amplitude: number;
  gridSize: number;
  leadConfiguration: string;
};

export const DEFAULT_CONFIG: ECGConfiguration = {
  samplingRate: 250, // Hz
  timeScale: 25, // mm/s
  amplitude: 10, // mm/mV
  gridSize: 5, // mm
  leadConfiguration: 'II',
};

// Generate mock ECG data for testing
export const generateMockECG = (duration: number, config: ECGConfiguration): ECGDataPoint[] => {
  const points: ECGDataPoint[] = [];
  const samplesCount = duration * config.samplingRate;
  
  for (let i = 0; i < samplesCount; i++) {
    const t = i / config.samplingRate;
    // Simplified ECG waveform generation
    const value = Math.sin(2 * Math.PI * t) * 0.5 + 
                  Math.exp(-((t % 1 - 0.2) ** 2) / 0.01) * 1.5;
    
    points.push({
      value,
      timestamp: t * 1000, // Convert to milliseconds
    });
  }
  
  return points;
};

// Draw grid lines for ECG paper
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ECGConfiguration,
  pixelsPerMm: number,
) => {
  ctx.save();
  
  // Draw minor grid lines
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
  ctx.lineWidth = 0.5;
  
  for (let x = 0; x < width; x += config.gridSize * pixelsPerMm) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y < height; y += config.gridSize * pixelsPerMm) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw major grid lines
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  
  for (let x = 0; x < width; x += config.gridSize * 5 * pixelsPerMm) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y < height; y += config.gridSize * 5 * pixelsPerMm) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  ctx.restore();
};
