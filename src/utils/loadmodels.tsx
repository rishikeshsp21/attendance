import RNFS from "react-native-fs";
import * as ort from "onnxruntime-react-native";
import { Platform } from "react-native";

export async function loadArcFaceModel() {
  try {
    const modelName = "arcfaceresnet100-11-int8.onnx";

    if (Platform.OS === "android") {
      const assetPath = `models/${modelName}`;
      const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;

      console.log("⏳ Copying ArcFace model from assets:", assetPath);

      await RNFS.copyFileAssets(assetPath, destPath);

      console.log("⏳ Loading ArcFace model from:", destPath);

      const session = await ort.InferenceSession.create(destPath);

      console.log("✅ ArcFace Model Loaded!");
      return session;
    }

    // ----- iOS (later if needed) -----
    const session = await ort.InferenceSession.create(modelName);
    console.log("✅ ArcFace Model Loaded on iOS!");
    return session;

  } catch (err) {
    console.error("❌ Error loading ArcFace model:", err);
    throw err;
  }
}
