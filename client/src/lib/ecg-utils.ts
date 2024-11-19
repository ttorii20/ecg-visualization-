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
  samplingRate: 128,
  timeScale: 25,
  amplitude: 10,
  gridSize: 5,
  leadConfiguration: 'II',
};

// Time formatting helper functions
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Data decimation for overview
export const decimateData = (data: ECGDataPoint[], targetPoints: number): ECGDataPoint[] => {
  if (data.length <= targetPoints) return data;
  
  const stride = Math.floor(data.length / targetPoints);
  const decimated: ECGDataPoint[] = [];
  
  for (let i = 0; i < data.length; i += stride) {
    // Calculate min and max values in the current window
    const windowEnd = Math.min(i + stride, data.length);
    let minVal = Infinity;
    let maxVal = -Infinity;
    let minPoint = data[i];
    let maxPoint = data[i];
    
    for (let j = i; j < windowEnd; j++) {
      if (data[j].value < minVal) {
        minVal = data[j].value;
        minPoint = data[j];
      }
      if (data[j].value > maxVal) {
        maxVal = data[j].value;
        maxPoint = data[j];
      }
    }
    
    // Add both min and max points to preserve signal peaks
    if (minPoint.timestamp < maxPoint.timestamp) {
      decimated.push(minPoint, maxPoint);
    } else {
      decimated.push(maxPoint, minPoint);
    }
  }
  
  return decimated;
};

// Generate realistic ECG waveform optimized for batch processing
export const generateMockECG = (duration: number, config: ECGConfiguration): ECGDataPoint[] => {
  const points: ECGDataPoint[] = [];
  const samplesCount = Math.floor(duration * config.samplingRate);
  const baselineNoise = 0.05;
  const now = Date.now();
  
  // Align start time to 20-second boundary
  const batchSize = 20; // 20-second batch size
  const startTime = Math.floor(now / (batchSize * 1000)) * (batchSize * 1000);
  
  // ECG wave components timing (in seconds)
  const heartRate = 60; // 60 BPM
  const cycleLength = 60 / heartRate;
  const processingBatchSize = config.samplingRate * 5; // Process 5 seconds at a time for memory efficiency
  
  for (let batchStart = 0; batchStart < samplesCount; batchStart += processingBatchSize) {
    const batchEnd = Math.min(batchStart + processingBatchSize, samplesCount);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const t = i / config.samplingRate;
      const tInCycle = t % cycleLength;
      
      // Generate each component of the ECG wave
      let value = 0;
      
      // P wave (atrial depolarization)
      value += 0.5 * Math.exp(-Math.pow((tInCycle - 0.2) * 20, 2));
      
      // QRS complex
      const qrsCenter = 0.4;
      value -= 0.6 * Math.exp(-Math.pow((tInCycle - (qrsCenter - 0.02)) * 200, 2)); // Q wave
      value += 3.0 * Math.exp(-Math.pow((tInCycle - qrsCenter) * 180, 2)); // R wave
      value -= 0.6 * Math.exp(-Math.pow((tInCycle - (qrsCenter + 0.02)) * 200, 2)); // S wave
      
      // T wave (ventricular repolarization)
      value += 0.7 * Math.exp(-Math.pow((tInCycle - 0.6) * 20, 2));
      
      // Add some baseline noise
      value += (Math.random() - 0.5) * baselineNoise;
      
      const timestamp = startTime - (duration * 1000) + (t * 1000);
      points.push({
        value,
        timestamp,
      });
    }
  }
  
  return points;
};

// Linear interpolation function for smoother rendering
export const interpolatePoints = (p1: ECGDataPoint, p2: ECGDataPoint, t: number): ECGDataPoint => {
  return {
    value: p1.value + (p2.value - p1.value) * t,
    timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * t
  };
};

// Draw grid lines for ECG paper
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ECGConfiguration,
  pixelsPerMm: number,
  startTime: number,
  rowHeight: number,
) => {
  ctx.save();
  
  // Draw horizontal amplitude reference lines
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 1;
  const horizontalSpacing = config.gridSize * 5 * pixelsPerMm; // Major grid lines only
  
  for (let y = 0; y < height; y += horizontalSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw vertical time markers at 20-second intervals
  const secondsPerMm = 1 / config.timeScale;
  const pixelsPerSecond = pixelsPerMm / secondsPerMm;
  const intervalSeconds = 20; // 20-second intervals
  const intervalWidth = intervalSeconds * pixelsPerSecond;
  
  for (let x = 0; x < width; x += intervalWidth) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  ctx.restore();
};

// Draw detailed grid for ECG paper
export const drawDetailedGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ECGConfiguration,
  pixelsPerMm: number,
) => {
  ctx.save();

  // Draw minor grid lines
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
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
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
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