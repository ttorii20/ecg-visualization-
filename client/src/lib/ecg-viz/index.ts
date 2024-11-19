// Core components exports
export { ECGDisplay } from './components/ECGDisplay';
export { DetailedECGDisplay } from './components/DetailedECGDisplay';
export { RealtimeECGDisplay } from './components/RealtimeECGDisplay';
export { ECGControls } from './components/ECGControls';

// Types exports
export type { ECGDataPoint, ECGConfiguration } from './types';

// Utilities exports
export { 
  DEFAULT_CONFIG,
  generateMockECG,
  interpolatePoints,
  drawGrid,
  drawDetailedGrid,
  decimateData,
  formatTimestamp
} from './utils';
