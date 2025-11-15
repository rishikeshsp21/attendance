import ImageEditor from "@react-native-community/image-editor";
import RNFS from "react-native-fs";
import { Buffer } from "buffer";
import { Tensor } from "onnxruntime-react-native";
import * as ort from "onnxruntime-react-native";
import { Platform } from "react-native";

export let arcfaceSession: ort.InferenceSession | null = null;

/**
 * Load ArcFace model into ONNX Runtime
 */
export async function loadArcFaceModel() {
  try {
    const modelName = "arcfaceresnet100-11-int8.onnx";

    if (Platform.OS === "android") {
      const assetPath = `models/${modelName}`;
      const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;

      console.log("⏳ Copying ArcFace model from assets:", assetPath);
      await RNFS.copyFileAssets(assetPath, destPath);

      console.log("⏳ Loading ArcFace model from:", destPath);
      arcfaceSession = await ort.InferenceSession.create(destPath);

      console.log("✅ ArcFace Model Loaded!");
      return arcfaceSession;
    }

    // iOS
    arcfaceSession = await ort.InferenceSession.create(modelName);
    console.log("✅ ArcFace Model Loaded (iOS)");
    return arcfaceSession;

  } catch (err) {
    console.error("❌ Error loading ArcFace model:", err);
    throw err;
  }
}

/**
 * Preprocess → Resize to 112×112 → Convert to ArcFace tensor
 */
export async function preprocess(imagePath: string): Promise<Tensor> {
  // 1. Resize to 112x112
const resized = await ImageEditor.cropImage(imagePath, {
  offset: { x: 0, y: 0 },
  size: { width: 112, height: 112 },
  displaySize: { width: 112, height: 112 },
  resizeMode: "contain",
});

// resized = { uri: "file://...", width: 112, height: 112 }
const cleanedPath = resized.uri.replace("file://", "");

// 2. Read file
const base64Data = await RNFS.readFile(cleanedPath, "base64");
  const jpegBuffer = Buffer.from(base64Data, "base64");

  const raw = decodeJPEG(jpegBuffer);

  const floatArray = new Float32Array(3 * 112 * 112);
  let idx = 0;

  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < raw.width * raw.height; i++) {
      const px = raw.data[i * 3 + c];
      floatArray[idx++] = px / 127.5 - 1.0;
    }
  }

  return new Tensor("float32", floatArray, [1, 3, 112, 112]);
}

/**
 * Run ArcFace → Generate 512-d embedding
 */
export async function runArcFaceEmbedding(imagePath: string): Promise<number[]> {
  if (!arcfaceSession) {
    throw new Error("ArcFace session not loaded");
  }

  const inputTensor = await preprocess(imagePath);
  const output = await arcfaceSession.run({ input: inputTensor });

  const embeddingTensor = output["output"] ?? Object.values(output)[0];

  return Array.from(embeddingTensor.data as Float32Array);
}

/**
 * JPEG decoder
 */
function decodeJPEG(buffer: Buffer): { width: number; height: number; data: Uint8Array } {
  const jpeg = require("jpeg-js");
  return jpeg.decode(buffer, { useTArray: true });
}
