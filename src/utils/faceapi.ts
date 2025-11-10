import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as faceapi from 'face-api.js';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const ssdJson = require('../assets/models/ssd_mobilenetv1_model-weights_manifest.json');
const ssdWeights = [require('../assets/models/ssd_mobilenetv1_model-shard1')];

const landmarkJson = require('../assets/models/face_landmark_68_model-weights_manifest.json');
const landmarkWeights = [require('../assets/models/face_landmark_68_model-shard1')];

const recognitionJson = require('../assets/models/face_recognition_model-weights_manifest.json');
const recognitionWeights = [require('../assets/models/face_recognition_model-shard1')];

export async function loadModels() {
  await tf.ready();

  try {
    console.log('⏳ Loading face-api models...');

    // Load each model manually using TensorFlow.js and assign it to face-api
    const ssdModel = await tf.loadGraphModel(bundleResourceIO(ssdJson, ssdWeights));
    (faceapi.nets.ssdMobilenetv1 as any).setModel(ssdModel);

    const landmarkModel = await tf.loadGraphModel(bundleResourceIO(landmarkJson, landmarkWeights));
    (faceapi.nets.faceLandmark68Net as any).setModel(landmarkModel);

    const recognitionModel = await tf.loadGraphModel(bundleResourceIO(recognitionJson, recognitionWeights));
    (faceapi.nets.faceRecognitionNet as any).setModel(recognitionModel);

    console.log('✅ Models loaded successfully');
  } catch (error) {
    console.error('❌ Error loading face-api models:', error);
  }
}