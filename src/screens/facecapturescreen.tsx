import React, { useRef, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import type { PhotoFile } from "react-native-vision-camera";
import { useNavigation, useRoute } from "@react-navigation/native";
import { runArcFaceEmbedding } from "../utils/arcface"; 
import { useFaceDetection } from "../frameprocessors/usefacedetection";

export default function FaceCaptureScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();

  // callback coming from RegisterScreen
  const { onCaptured } = route.params;

  const device = useCameraDevice("front");
  const camera = useRef<Camera>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // frame processor: called whenever a frame has a detectable face
  const frameProcessor = useFaceDetection(() => {
    setFaceDetected(true);
  });

  const captureAndProcess = useCallback(async () => {
    if (!camera.current || isProcessing) return;

    try {
      setIsProcessing(true);

      // 1. TAKE PHOTO
      const photo = await camera.current.takePhoto({
      flash: "off",
      });


      // 2. RUN ARC FACE
      const embedding = await runArcFaceEmbedding(photo.path);

      // 3. RETURN TO REGISTER SCREEN
      onCaptured(JSON.stringify(embedding)); // convert array → string
      navigation.goBack();
    } catch (err) {
      console.log("Face capture error:", err);
      setIsProcessing(false);
    }
  }, [isProcessing, camera]);

  // when a face is detected, automatically capture
  if (faceDetected && !isProcessing) {
    captureAndProcess();
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text>No front camera found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CAMERA VIEW */}
      <Camera
  ref={camera}
  style={StyleSheet.absoluteFill}
  device={device}
  isActive={true}
  photo={true}
  frameProcessor={frameProcessor}
  />


      {/* STATUS OVERLAY */}
      <View style={styles.overlay}>
        {isProcessing ? (
          <>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.text}>Processing face...</Text>
          </>
        ) : faceDetected ? (
          <Text style={styles.text}>Face detected — capturing...</Text>
        ) : (
          <Text style={styles.text}>Align your face within the frame...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: {
    position: "absolute",
    bottom: 70,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 10,
  },
  text: { color: "white", fontSize: 16 },
});
