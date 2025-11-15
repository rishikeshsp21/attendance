import ImageEditor from "@react-native-community/image-editor";
import RNFS from "react-native-fs";
import { Buffer } from "buffer";
import { Tensor } from "onnxruntime-react-native";
import { arcfaceSession } from "./loadmodels";
import jpeg from "jpeg-js";

/**
 * Resize → Decode → Normalize → ONNX Tensor
 */
export async function preprocess(imagePath: string): Promise<Tensor> {
  // 1. Resize to 112x112
  const result = await ImageEditor.cropImage(imagePath, {
    offset: { x: 0, y: 0 },
    size: { width: 112, height: 112 },
    displaySize: { width: 112, height: 112 },
    resizeMode: "contain",
  });

  const resizedPath = result.uri.replace("file://", "");

  // 2. Read file → base64 decode
  const base64 = await RNFS.readFile(resizedPath, "base64");
  const jpegBuffer = Buffer.from(base64, "base64");

  // 3. Decode JPEG → RGB bytes
  const raw = jpeg.decode(jpegBuffer, { useTArray: true });

  if (!raw || !raw.data) {
    throw new Error("JPEG decode failed");
  }

  if (raw.width !== 112 || raw.height !== 112) {
    throw new Error(`Expected 112x112, got ${raw.width}x${raw.height}`);
  }

  // 4. ArcFace normalization (-1 to 1), CHW order
  const floatArray = new Float32Array(3 * 112 * 112);

  let idx = 0;
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < 112 * 112; i++) {
      const pixel = raw.data[i * 3 + c];
      floatArray[idx++] = pixel / 127.5 - 1.0;
    }
  }

  return new Tensor("float32", floatArray, [1, 3, 112, 112]);
}

/**
 * Run ArcFace model → return 512-dim embedding
 */
export async function runArcFaceEmbedding(imagePath: string): Promise<number[]> {
  if (!arcfaceSession) {
    throw new Error("ArcFace session not loaded");
  }

  const inputTensor = await preprocess(imagePath);
  const output = await arcfaceSession.run({ input: inputTensor });

  const tensor = output["output"] ?? Object.values(output)[0];

  return Array.from(tensor.data as Float32Array);
}
