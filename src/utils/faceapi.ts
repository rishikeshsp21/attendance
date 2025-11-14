import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

const MODEL_DIR = `${RNFS.DocumentDirectoryPath}/models`;

async function copyAssetToFile(assetName: string) {
  const destPath = `${MODEL_DIR}/${assetName}`;
  const exists = await RNFS.exists(destPath);
  if (exists) return destPath;

  try {
    if (Platform.OS === 'android') {
      const data = await RNFS.readFileAssets(`models/${assetName}`, 'base64');
      await RNFS.writeFile(destPath, data, 'base64');
    } else {
      const src = `${RNFS.MainBundlePath}/models/${assetName}`;
      await RNFS.copyFile(src, destPath);
    }
    console.log(`✅ Copied: ${assetName}`);
  } catch (err) {
    console.error(`❌ Failed to copy ${assetName}:`, err);
  }

  return destPath;
}

export async function loadModels() {
  try {
    await tf.setBackend('cpu');
    await tf.ready();

    if (!(await RNFS.exists(MODEL_DIR))) {
      await RNFS.mkdir(MODEL_DIR);
    }

    const files = [
      'ssd_mobilenetv1_model-weights_manifest.json',
      'ssd_mobilenetv1_model-shard1.bin',
      'ssd_mobilenetv1_model-shard2.bin',
      'face_landmark_68_model-weights_manifest.json',
      'face_landmark_68_model-shard1.bin',
      'face_recognition_model-weights_manifest.json',
      'face_recognition_model-shard1.bin',
      'face_recognition_model-shard2.bin',
    ];

    for (const file of files) await copyAssetToFile(file);

    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_DIR);

    console.log('✅ All models loaded!');
  } catch (error) {
    console.error('❌ Error loading face-api models:', error);
  }
}