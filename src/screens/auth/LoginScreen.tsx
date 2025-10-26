import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

const LoginScreen = ({ navigation }: any) => {
  const [employeeId, setEmployeeId] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSignInOut = () => {
    if (!employeeId.trim()) {
      Alert.alert('Employee ID required', 'Please enter your Employee ID.');
      return;
    }

    // Placeholder for verification logic
    // (For now just toggle sign-in/out)
    const next = !signedIn;
    setSignedIn(next);
    Alert.alert(next ? 'Signed In' : 'Signed Out', next
      ? `Welcome, ${employeeId}.`
      : 'You have been signed out.'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Employee Access</Text>

        <Text style={styles.label}>Employee ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your employee ID"
          value={employeeId}
          onChangeText={setEmployeeId}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignInOut}>
            <Text style={styles.primaryButtonText}>Sign In / Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Register</Text>
          </TouchableOpacity>
        </View>

        {verifying && (
          <Text style={styles.note}>Face verification required (coming soon)</Text>
        )}

        {signedIn && (
          <Text style={styles.note}>
            Currently signed in as <Text style={{ fontWeight: 'bold' }}>{employeeId}</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#007bff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  note: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#444',
  },
});
