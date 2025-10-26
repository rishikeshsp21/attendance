import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { executeQuery } from '../../database/attendanceDB';

const LoginScreen = ({ navigation }: any) => {
  const [employeeId, setEmployeeId] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSignInOut = async () => {
    if (!employeeId.trim()) {
      Alert.alert('Employee ID required', 'Please enter your Employee ID.');
      return;
    }

    try {
      // 1️⃣ Check if employee exists
      const employeeResult = await executeQuery(
        'SELECT * FROM employees WHERE employee_id = ?',
        [employeeId]
      );

      if (employeeResult.rows.length === 0) {
        Alert.alert('Employee not registered', 'Please register before signing in.');
        return;
      }

      const employee = employeeResult.rows.item(0);
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString();

      // 2️⃣ Check if an entry for this date already exists
      const existingReport = await executeQuery(
        'SELECT * FROM daily_reports WHERE employee_id = ? AND date = ?',
        [employeeId, currentDate]
      );

      if (!signedIn && existingReport.rows.length === 0) {
        // 3️⃣ Sign-in logic: create a new row
        await executeQuery(
          `INSERT INTO daily_reports 
           (employee_id, name, default_sign_in_time, actual_sign_in_time, 
            default_sign_out_time, actual_sign_out_time, daily_hours_worked, 
            overtime_hours, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employee.employee_id,
            employee.name,
            employee.default_sign_in_time,
            currentTime,
            employee.default_sign_out_time,
            null,
            0,
            0,
            currentDate,
          ]
        );

        setSignedIn(true);
        Alert.alert('Signed In', `Welcome, ${employee.name}!`);
      } else if (signedIn && existingReport.rows.length > 0) {
        // 4️⃣ Sign-out logic: update existing row
        const report = existingReport.rows.item(0);
        const signInTime = new Date(`${currentDate}T${report.actual_sign_in_time}`);
        const signOutTime = new Date(`${currentDate}T${currentTime}`);

        const hoursWorked =
          (signOutTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
        const overtime = Math.max(0, hoursWorked - 8);

        await executeQuery(
          `UPDATE daily_reports
           SET actual_sign_out_time = ?, daily_hours_worked = ?, overtime_hours = ?
           WHERE employee_id = ? AND date = ?`,
          [currentTime, hoursWorked.toFixed(2), overtime.toFixed(2), employeeId, currentDate]
        );

        setSignedIn(false);
        Alert.alert('Signed Out', 'You have been signed out successfully.');
      } else {
        Alert.alert(
          'Already Signed In',
          'You have already signed in today. Please sign out before signing in again.'
        );
      }

      setEmployeeId('');
    } catch (error) {
      console.error('Sign In/Out Error:', error);
      Alert.alert('Error', 'An error occurred during sign-in/out.');
    }
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