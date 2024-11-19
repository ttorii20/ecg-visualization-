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

// Generate realistic ECG waveform
export const generateMockECG = (duration: number, config: ECGConfiguration): ECGDataPoint[] => {
  const points: ECGDataPoint[] = [];
  const samplesCount = duration * config.samplingRate;
  const baselineNoise = 0.05;
  
  // ECG wave components timing (in seconds)
  const heartRate = 60; // 60 BPM
  const cycleLength = 60 / heartRate;
  
  for (let i = 0; i < samplesCount; i++) {
    const t = i / config.samplingRate;
    const tInCycle = t % cycleLength;
    
    // Generate each component of the ECG wave
    let value = 0;
    
    // P wave (atrial depolarization)
    value += 0.25 * Math.exp(-Math.pow((tInCycle - 0.2) * 20, 2));
    
    // QRS complex
    const qrsCenter = 0.4;
    value -= 0.3 * Math.exp(-Math.pow((tInCycle - (qrsCenter - 0.02)) * 200, 2)); // Q wave
    value += 1.5 * Math.exp(-Math.pow((tInCycle - qrsCenter) * 180, 2)); // R wave
    value -= 0.3 * Math.exp(-Math.pow((tInCycle - (qrsCenter + 0.02)) * 200, 2)); // S wave
    
    // T wave (ventricular repolarization)
    value += 0.35 * Math.exp(-Math.pow((tInCycle - 0.6) * 20, 2));
    
    // Add some baseline noise
    value += (Math.random() - 0.5) * baselineNoise;
    
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
