import { useState, useEffect, useCallback } from 'react';
import { ECGDisplay } from '@/components/ui/ecg-display';
import { DetailedECGDisplay } from '@/components/ui/detailed-ecg-display';
import { ECGControls } from '@/components/ui/ecg-controls';
import { DEFAULT_CONFIG, generateMockECG, type ECGConfiguration, type ECGDataPoint } from '@/lib/ecg-utils';

export function Demo() {
  const [config, setConfig] = useState<ECGConfiguration>(DEFAULT_CONFIG);
  const [data, setData] = useState<ECGDataPoint[]>([]);
  const [selectedSegmentData, setSelectedSegmentData] = useState<ECGDataPoint[]>([]);

  // Buffer size calculation based on sampling rate
  const bufferSeconds = 1800; // 30 minutes
  const batchSeconds = 20; // 20-second batches

  useEffect(() => {
    // Generate initial data for 30 minutes
    const initialData = generateMockECG(bufferSeconds, config);
    setData(initialData);

    // Update data in 20-second batches
    const interval = setInterval(() => {
      const newBatchData = generateMockECG(batchSeconds, config);
      setData(prev => {
        const cutoffTime = Date.now() - (bufferSeconds * 1000);
        const filteredPrev = prev.filter(point => point.timestamp > cutoffTime);
        return [...filteredPrev, ...newBatchData];
      });
    }, batchSeconds * 1000);

    return () => clearInterval(interval);
  }, [config, bufferSeconds, batchSeconds]);

  const handleSegmentSelect = useCallback(({ data }: { data: ECGDataPoint[] }) => {
    setSelectedSegmentData(data);
  }, []);

  return (
    <div className="w-full min-h-screen bg-black p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        ECG Timeline View
      </h1>
      
      <div className="space-y-6">
        <div className="w-full max-w-[1600px] mx-auto">
          <ECGControls
            config={config}
            onConfigChange={setConfig}
          />
        </div>
        
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
          <ECGDisplay
            data={data}
            config={config}
            className="w-full"
            onSegmentSelect={handleSegmentSelect}
          />
          {selectedSegmentData.length > 0 && (
            <DetailedECGDisplay
              data={selectedSegmentData}
              config={config}
              className="w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
