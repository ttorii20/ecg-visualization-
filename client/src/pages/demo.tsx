import { useState, useEffect } from 'react';
import { ECGDisplay } from '@/components/ui/ecg-display';
import { ECGControls } from '@/components/ui/ecg-controls';
import { DEFAULT_CONFIG, generateMockECG, type ECGConfiguration, type ECGDataPoint } from '@/lib/ecg-utils';

export function Demo() {
  const [config, setConfig] = useState<ECGConfiguration>(DEFAULT_CONFIG);
  const [data, setData] = useState<ECGDataPoint[]>([]);

  useEffect(() => {
    // Generate initial data for 12 seconds (2 extra seconds as buffer)
    const initialData = generateMockECG(12, config);
    console.log('Initial data generated:', {
      length: initialData.length,
      firstPoint: initialData[0],
      lastPoint: initialData[initialData.length - 1],
    });
    setData(initialData);

    // Update data more frequently for smoother animation
    const interval = setInterval(() => {
      const newData = generateMockECG(0.2, config); // Generate 200ms of data
      setData(prev => {
        const cutoffTime = Date.now() - 12000;
        const filteredPrev = prev.filter(point => point.timestamp > cutoffTime);
        const updatedData = [...filteredPrev, ...newData];
        
        console.log('Data update:', {
          prevLength: prev.length,
          filteredLength: filteredPrev.length,
          newDataLength: newData.length,
          totalLength: updatedData.length,
          timeRange: {
            start: new Date(updatedData[0]?.timestamp).toISOString(),
            end: new Date(updatedData[updatedData.length - 1]?.timestamp).toISOString(),
          },
        });
        
        return updatedData;
      });
    }, 100); // Update every 100ms for smoother animation

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
