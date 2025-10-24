import React from 'react';
import { View, Text, Button } from 'react-native';

const LoginScreen = ({ navigation }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, marginBottom: 20 }}>Login Screen</Text>

    <Button
      title="Go to Dashboard"
      onPress={() => navigation.navigate('Dashboard')}
    />

    <View style={{ marginTop: 20 }}>
      <Button
        title="Register New Employee"
        color="#4CAF50"
        onPress={() => navigation.navigate('Register')}
      />
    </View>
  </View>
);

export default LoginScreen;