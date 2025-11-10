import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as faceapi from 'face-api.js';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const ssdJson = require('../assets/models/ssd_mobilenetv1_model-weights_manifest.json');
const ssdWeights = [require('../assets/models/ssd_mobilenetv1_model-shard1.bin'), require('../assets/models/ssd_mobilenetv1_model-shard2.bin')];
// console.log('ssdJson:', ssdJson);
// console.log('ssdWeights:', ssdWeights);

const landmarkJson = require('../assets/models/face_landmark_68_model-weights_manifest.json');
const landmarkWeights = [require('../assets/models/face_landmark_68_model-shard1.bin')];
// console.log('landmarkJson:', landmarkJson);
// console.log('landmarkWeights:', landmarkWeights);

const recognitionJson = require('../assets/models/face_recognition_model-weights_manifest.json');
const recognitionWeights = [require('../assets/models/face_recognition_model-shard1.bin'), require('../assets/models/face_recognition_model-shard2.bin')];
// console.log('recognitionJson:', ssdJson);
// console.log('recognitionWeights:', ssdWeights);

export async function loadModels() {
  try {
    console.log('⏳ Initializing TensorFlow...');
    await tf.ready();

    // ✅ Force CPU backend to avoid GPU/Expo issues
    await tf.setBackend('cpu');
    await tf.ready();

    console.log('🧠 Loading face-api models...');

    const ssdModel = await tf.loadGraphModel(bundleResourceIO(ssdJson, ssdWeights));
    (faceapi.nets.ssdMobilenetv1 as any).setModel(ssdModel);

    const landmarkModel = await tf.loadGraphModel(bundleResourceIO(landmarkJson, landmarkWeights));
    (faceapi.nets.faceLandmark68Net as any).setModel(landmarkModel);

    const recognitionModel = await tf.loadGraphModel(bundleResourceIO(recognitionJson, recognitionWeights));
    (faceapi.nets.faceRecognitionNet as any).setModel(recognitionModel);

    console.log('✅ Models loaded successfully using CPU backend.');
  } catch (error) {
    console.error('❌ Error loading face-api models:', error);
  }
}