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
  samplingRate: 128, // Fixed at 128Hz as per requirements
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

// Generate realistic ECG waveform with physiological variability
export const generateMockECG = (duration: number, config: ECGConfiguration): ECGDataPoint[] => {
  console.log(`[ECGUtils] Generating ${duration}s of ECG data at ${config.samplingRate}Hz`);
  const points: ECGDataPoint[] = [];
  const samplesCount = Math.floor(duration * config.samplingRate);
  const now = Date.now();
  
  // For realtime view, use exact current time
  const startTime = duration <= 0.1 ? now : Math.floor(now / 1000) * 1000;
  
  // Timing constants (in seconds)
  const QRS_DURATION = 0.09; // 90ms QRS duration
  const P_DURATION = 0.09; // 90ms P wave duration
  const PR_INTERVAL = 0.16; // 160ms PR interval
  const QT_INTERVAL = 0.38; // 380ms QT interval
  
  // Initialize physiological parameters
  let baseHeartRate = 75; // Base heart rate in BPM
  let baselineWander = 0;
  let lastBaselineUpdate = 0;
  
  // Respiratory modulation (approximately 12 breaths per minute)
  const respirationRate = 0.2; // Hz
  const respirationAmplitude = 0.2; // mV
  
  const processingBatchSize = Math.min(config.samplingRate * 5, samplesCount);
  
  for (let batchStart = 0; batchStart < samplesCount; batchStart += processingBatchSize) {
    const batchEnd = Math.min(batchStart + processingBatchSize, samplesCount);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const t = i / config.samplingRate;
      
      // Heart rate variability with respiratory sinus arrhythmia
      const respiratoryPhase = 2 * Math.PI * respirationRate * t;
      const heartRateVariability = 20 * Math.sin(respiratoryPhase); // ±20 BPM variation
      const instantaneousHeartRate = baseHeartRate + heartRateVariability;
      const cycleLength = 60 / instantaneousHeartRate;
      const tInCycle = (t % cycleLength) / cycleLength; // Normalized time in cardiac cycle
      
      // Generate baseline wander (0.05-0.5 Hz)
      if (t - lastBaselineUpdate >= 0.1) {
        const baselineFreq = 0.05 + Math.random() * 0.45;
        baselineWander = 0.2 * Math.sin(2 * Math.PI * baselineFreq * t);
        lastBaselineUpdate = t;
      }
      
      // Add respiratory modulation
      const respiratoryComponent = respirationAmplitude * Math.sin(respiratoryPhase);
      
      // Beat-to-beat amplitude variation (±10%)
      const amplitudeVariation = 1 + (Math.random() * 0.2 - 0.1);
      
      // Generate each component of the ECG wave
      let value = 0;
      
      // P wave (rounded, symmetric, 80-100ms duration)
      const pCenter = 0.16; // PR interval - half P duration
      const pAmplitude = 0.15 * amplitudeVariation;
      value += pAmplitude * Math.exp(-Math.pow((tInCycle - pCenter) * 25, 2));
      
      // QRS complex
      const qrsCenter = 0.4;
      const qrsTiming = (tInCycle - qrsCenter) * 200; // Compress timing for sharp QRS
      
      // Q wave (-0.1 to -0.2 mV)
      const qAmplitude = -(0.15 + Math.random() * 0.05) * amplitudeVariation;
      value += qAmplitude * Math.exp(-Math.pow(qrsTiming + 1.5, 2));
      
      // R wave (1.0 to 1.5 mV)
      const rAmplitude = (1.25 + Math.random() * 0.25) * amplitudeVariation;
      value += rAmplitude * Math.exp(-Math.pow(qrsTiming, 2));
      
      // S wave (-0.2 to -0.3 mV)
      const sAmplitude = -(0.25 + Math.random() * 0.05) * amplitudeVariation;
      value += sAmplitude * Math.exp(-Math.pow(qrsTiming - 1.5, 2));
      
      // T wave (asymmetric, gradual upslope, faster downslope)
      const tCenter = qrsCenter + QT_INTERVAL / cycleLength;
      const tAmplitude = 0.3 * amplitudeVariation;
      const tPhase = (tInCycle - tCenter) * 15;
      if (tPhase < 0) {
        // Gradual upslope
        value += tAmplitude * Math.exp(-Math.pow(tPhase * 1.2, 2));
      } else {
        // Faster downslope
        value += tAmplitude * Math.exp(-Math.pow(tPhase * 1.5, 2));
      }
      
      // Add baseline wander and respiratory modulation
      value += baselineWander + respiratoryComponent;
      
      // Add realistic high-frequency noise (EMG-like)
      const emgNoise = (Math.random() - 0.5) * 0.03;
      value += emgNoise;
      
      // Calculate precise timestamp
      const timestamp = startTime - (duration * 1000) + Math.floor(t * 1000);
      points.push({
        value,
        timestamp,
      });
    }
  }
  
  console.log(`[ECGUtils] Generated ${points.length} points`);
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
  const horizontalSpacing = config.gridSize * 5 * pixelsPerMm;
  
  for (let y = 0; y < height; y += horizontalSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw vertical time markers at 20-second intervals
  const secondsPerMm = 1 / config.timeScale;
  const pixelsPerSecond = pixelsPerMm / secondsPerMm;
  const intervalSeconds = 20;
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
