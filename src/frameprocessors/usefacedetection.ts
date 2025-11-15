// src/frameprocessors/useFaceDetection.ts
import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import type { Frame } from 'react-native-vision-camera';

export function useFaceDetection(onTriggerPhoto: () => void) {
  return useFrameProcessor((frame: Frame) => {
    'worklet';

    // Simple trigger condition (replace with actual logic later)
    if (frame.width > 0) {
      runOnJS(onTriggerPhoto)();
    }
  }, []);
}