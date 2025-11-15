import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/attendanceDB'; // 👈 import the init function
import { loadArcFaceModel } from './src/utils/arcface';
const App = () => {
  useEffect(() => {
    // Run once when the app starts
    initializeDatabase();
  }, []);
  useEffect(() => {
  (async () => {
    await loadArcFaceModel();
  })();
}, []);
  return <AppNavigator />;
};

export default App;