// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/admin/DashboardScreen';
import RegisterScreen from '../screens/register/RegisterScreen';
import FaceCaptureScreen from '../screens/facecapturescreen';
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  EditEmployee: undefined;
  FaceCapture: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Register Employee' }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Admin Dashboard' }}
        />
        <Stack.Screen
          name="FaceCapture"
          component={FaceCaptureScreen}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;