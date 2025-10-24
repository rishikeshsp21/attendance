import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/attendanceDB'; // 👈 import the init function

const App = () => {
  useEffect(() => {
    // Run once when the app starts
    initializeDatabase();
  }, []);

  return <AppNavigator />;
};

export default App;
