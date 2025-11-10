import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/attendanceDB'; // 👈 import the init function
import { loadModels } from './src/utils/faceapi'; // 👈 import the loadModels function
const App = () => {
  useEffect(() => {
    // Run once when the app starts
    initializeDatabase();
  }, []);
  useEffect(() => {
  (async () => {
    await loadModels();
  })();
}, []);
  return <AppNavigator />;
};

export default App;