import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Call this once, ideally on app start
export async function loadModels() {
  await tf.ready();
  await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models/');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models/');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models/');
  console.log('✅ Face-API models loaded');
}
