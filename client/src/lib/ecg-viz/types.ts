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
