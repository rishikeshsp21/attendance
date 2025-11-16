// import { useFrameProcessor } from "react-native-vision-camera";
// import { useRunOnJS } from "react-native-worklets-core";
// import CallbackStore from "../navigation/Jcallbacks";

// export function useFaceDetection() {
//   const runOnJS = useRunOnJS();

//   return useFrameProcessor((frame) => {
//     "worklet";

//     if (frame.width > 0) {
//       runOnJS(() => {
//         CallbackStore.onFaceCaptured?.();
//       })();
//     }
//   }, []);
// }
