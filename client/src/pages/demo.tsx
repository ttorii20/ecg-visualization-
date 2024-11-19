import { useState, useEffect } from 'react';
import { ECGDisplay } from '@/components/ui/ecg-display';
import { ECGControls } from '@/components/ui/ecg-controls';
import { DEFAULT_CONFIG, generateMockECG, type ECGConfiguration, type ECGDataPoint } from '@/lib/ecg-utils';

export function Demo() {
  const [config, setConfig] = useState<ECGConfiguration>(DEFAULT_CONFIG);
  const [data, setData] = useState<ECGDataPoint[]>([]);

  useEffect(() => {
    // Generate initial data
    const initialData = generateMockECG(10, config);
    setData(initialData);

    // Update data periodically
    const interval = setInterval(() => {
      const newData = generateMockECG(1, config);
      setData(prev => [...prev.slice(-config.samplingRate * 10), ...newData]);
    }, 1000);

    return () => clearInterval(interval);
  }, [config]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        ECG Visualization Demo
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ECGDisplay
            data={data}
            config={config}
            width={800}
            height={400}
            className="w-full"
          />
        </div>
        <div className="lg:col-span-1">
          <ECGControls
            config={config}
            onConfigChange={setConfig}
          />
        </div>
      </div>
    </div>
  );
}
