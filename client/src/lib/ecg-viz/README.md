# ECG Visualization Package

A TypeScript-based ECG visualization package with real-time rendering capabilities. This package provides high-performance, customizable ECG visualization components for medical applications.

## Features

- Real-time ECG waveform display
- Timeline view with navigation
- Detailed segment view
- Configurable display parameters
- Grid overlay with time markers
- Smooth waveform rendering
- Lead configuration support
- High DPI canvas support

## Installation

```bash
npm install @yourusername/ecg-viz
```

## Usage

```typescript
import { 
  ECGDisplay, 
  RealtimeECGDisplay, 
  DetailedECGDisplay,
  ECGControls,
  DEFAULT_CONFIG,
  type ECGConfiguration,
  type ECGDataPoint
} from '@yourusername/ecg-viz';

// Basic usage
function App() {
  const [config, setConfig] = useState<ECGConfiguration>(DEFAULT_CONFIG);
  const [data, setData] = useState<ECGDataPoint[]>([]);

  return (
    <div>
      <ECGControls 
        config={config}
        onConfigChange={setConfig}
      />
      <RealtimeECGDisplay
        data={data}
        config={config}
      />
    </div>
  );
}
```

## Components

### ECGDisplay
Main timeline view component that shows multiple rows of ECG data with navigation capabilities.

```typescript
interface ECGDisplayProps {
  data: ECGDataPoint[];
  config: ECGConfiguration;
  className?: string;
  onSegmentSelect?: (segment: { index: number; data: ECGDataPoint[] }) => void;
}
```

### RealtimeECGDisplay
Real-time scrolling ECG display component.

```typescript
interface RealtimeECGDisplayProps {
  data: ECGDataPoint[];
  config: ECGConfiguration;
  className?: string;
}
```

### DetailedECGDisplay
Detailed view of a selected ECG segment.

```typescript
interface DetailedECGDisplayProps {
  data: ECGDataPoint[];
  config: ECGConfiguration;
  className?: string;
}
```

### ECGControls
Control panel for ECG display configuration.

```typescript
interface ECGControlsProps {
  config: ECGConfiguration;
  onConfigChange: (config: ECGConfiguration) => void;
}
```

## Data Types

### ECGDataPoint
```typescript
type ECGDataPoint = {
  value: number;    // mV
  timestamp: number; // ms since epoch
};
```

### ECGConfiguration
```typescript
type ECGConfiguration = {
  samplingRate: number;     // Hz
  timeScale: number;        // mm/s
  amplitude: number;        // mm/mV
  gridSize: number;        // mm
  leadConfiguration: string;
};
```

## Utilities

The package includes several utility functions:
- `generateMockECG`: Generate realistic ECG data
- `interpolatePoints`: Smooth interpolation between data points
- `drawGrid`: Render ECG grid overlay
- `decimateData`: Downsample data for efficient rendering
- `formatTimestamp`: Format timestamps for display

## Screenshots

![ECG Timeline View](../../../Screenshot%202024-11-12%20at%2012.21.56.png)
![Detailed ECG View](../../../Screenshot%202024-11-12%20at%2012.23.35.png)
![Realtime ECG View](../../../Screenshot%202024-11-19%20at%2013.04.27.png)

## License
MIT
