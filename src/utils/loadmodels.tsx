import * as ort from 'onnxruntime-react-native';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

let arcfaceSession: ort.InferenceSession | null = null;

// Path where ONNX model will be copied on Android
const MODEL_FILE_NAME = 'arcfaceresnet100-11-int8.onnx';
const LOCAL_MODEL_PATH = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE_NAME}`;

async function copyModelToLocal() {
  const exists = await RNFS.exists(LOCAL_MODEL_PATH);
  if (exists) return LOCAL_MODEL_PATH;

  try {
    if (Platform.OS === 'android') {
      const data = await RNFS.readFileAssets(`models/${MODEL_FILE_NAME}`, 'base64');
      await RNFS.writeFile(LOCAL_MODEL_PATH, data, 'base64');
      console.log("✅ Model copied to local storage.");
    } else {
      console.warn("⚠ iOS path not implemented yet.");
    }
  } catch (err) {
    console.error("❌ Failed to copy model:", err);
  }

  return LOCAL_MODEL_PATH;
}

export async function loadArcFaceModel() {
  if (arcfaceSession) {
    console.log("ℹ️ ArcFace model already loaded.");
    return arcfaceSession;
  }

  try {
    console.log("📦 Preparing ArcFace model...");

    const modelPath = await copyModelToLocal();

    console.log("⏳ Loading ArcFace ONNX model...");
    arcfaceSession = await ort.InferenceSession.create(modelPath);

    console.log("✅ ArcFace model loaded successfully!");
    return arcfaceSession;

  } catch (error) {
    console.error("❌ Error loading ArcFace model:", error);
  }
}