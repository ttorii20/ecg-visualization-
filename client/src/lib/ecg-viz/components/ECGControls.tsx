import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ECGConfiguration } from "../types";

interface ECGControlsProps {
  config: ECGConfiguration;
  onConfigChange: (config: ECGConfiguration) => void;
}

export function ECGControls({ config, onConfigChange }: ECGControlsProps) {
  const handleTimeScaleChange = (value: string) => {
    onConfigChange({
      ...config,
      timeScale: parseInt(value, 10),
    });
  };

  const handleAmplitudeChange = (value: number[]) => {
    onConfigChange({
      ...config,
      amplitude: value[0],
    });
  };

  const handleLeadChange = (value: string) => {
    onConfigChange({
      ...config,
      leadConfiguration: value,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ECG Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Time Scale (mm/s)</label>
          <Select
            value={config.timeScale.toString()}
            onValueChange={handleTimeScaleChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 mm/s</SelectItem>
              <SelectItem value="50">50 mm/s</SelectItem>
              <SelectItem value="12.5">12.5 mm/s</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amplitude (mm/mV)</label>
          <Slider
            value={[config.amplitude]}
            min={5}
            max={20}
            step={1}
            onValueChange={handleAmplitudeChange}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Lead Configuration</label>
          <Select
            value={config.leadConfiguration}
            onValueChange={handleLeadChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">Lead I</SelectItem>
              <SelectItem value="II">Lead II</SelectItem>
              <SelectItem value="III">Lead III</SelectItem>
              <SelectItem value="aVR">aVR</SelectItem>
              <SelectItem value="aVL">aVL</SelectItem>
              <SelectItem value="aVF">aVF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
