import { useState, useEffect, useCallback, useRef } from 'react';
import { ECGDisplay } from '@/components/ui/ecg-display';
import { DetailedECGDisplay } from '@/components/ui/detailed-ecg-display';
import { RealtimeECGDisplay } from '@/components/ui/realtime-ecg-display';
import { ECGControls } from '@/components/ui/ecg-controls';
import { DEFAULT_CONFIG, generateMockECG, type ECGConfiguration, type ECGDataPoint } from '@/lib/ecg-utils';

export function Demo() {
  const [config, setConfig] = useState<ECGConfiguration>(DEFAULT_CONFIG);
  const [data, setData] = useState<ECGDataPoint[]>([]);
  const [realtimeData, setRealtimeData] = useState<ECGDataPoint[]>([]);
  const [selectedSegmentData, setSelectedSegmentData] = useState<ECGDataPoint[]>([]);
  
  // Refs for intervals to ensure proper cleanup
  const timelineIntervalRef = useRef<NodeJS.Timeout>();
  const realtimeIntervalRef = useRef<NodeJS.Timeout>();

  // Buffer size calculation based on sampling rate
  const bufferSeconds = 1800; // 30 minutes
  const batchSeconds = 20; // 20-second batches
  const realtimeBufferSeconds = 10; // Keep 10 seconds of data for realtime display

  // Setup data generation and update intervals
  useEffect(() => {
    console.log('[Demo] Initializing ECG data generation');
    
    // Generate initial timeline data
    const initialData = generateMockECG(bufferSeconds, config);
    console.log(`[Demo] Generated initial timeline data: ${initialData.length} points`);
    setData(initialData);

    // Generate initial realtime data
    const initialRealtimeData = generateMockECG(realtimeBufferSeconds, config);
    console.log(`[Demo] Generated initial realtime data: ${initialRealtimeData.length} points`);
    setRealtimeData(initialRealtimeData);

    return () => {
      console.log('[Demo] Cleaning up intervals');
      if (timelineIntervalRef.current) {
        clearInterval(timelineIntervalRef.current);
      }
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
      }
    };
  }, []); // Run only on mount

  // Handle timeline data updates
  useEffect(() => {
    console.log('[Demo] Setting up timeline update interval');
    
    const updateTimelineData = () => {
      const newBatchData = generateMockECG(batchSeconds, config);
      setData(prev => {
        const cutoffTime = Date.now() - (bufferSeconds * 1000);
        const filteredPrev = prev.filter(point => point.timestamp > cutoffTime);
        const updatedData = [...filteredPrev, ...newBatchData];
        console.log(`[Demo] Timeline update: ${updatedData.length} points`);
        return updatedData;
      });
    };

    timelineIntervalRef.current = setInterval(updateTimelineData, batchSeconds * 1000);

    return () => {
      if (timelineIntervalRef.current) {
        clearInterval(timelineIntervalRef.current);
      }
    };
  }, [config, bufferSeconds, batchSeconds]);

  // Handle realtime data updates
  useEffect(() => {
    console.log('[Demo] Setting up realtime update interval');
    
    const updateRealtimeData = () => {
      const newRealtimeData = generateMockECG(0.033, config);
      setRealtimeData(prev => {
        const cutoffTime = Date.now() - (realtimeBufferSeconds * 1000);
        const filteredPrev = prev.filter(point => point.timestamp > cutoffTime);
        const updatedData = [...filteredPrev, ...newRealtimeData];
        console.log(`[Demo] Realtime update: ${updatedData.length} points`);
        return updatedData;
      });
    };

    realtimeIntervalRef.current = setInterval(updateRealtimeData, 33); // ~30fps

    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
      }
    };
  }, [config, realtimeBufferSeconds]);

  const handleSegmentSelect = useCallback(({ data }: { data: ECGDataPoint[] }) => {
    console.log(`[Demo] Selected segment with ${data.length} points`);
    setSelectedSegmentData(data);
  }, []);

  return (
    <div className="w-full min-h-screen bg-black p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-[#00FF00]">
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
          <RealtimeECGDisplay
            data={realtimeData}
            config={config}
            className="w-full"
          />
          
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
